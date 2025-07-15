import React, { useReducer, useCallback } from 'react';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { Folder as FolderType } from '../types';

// Static request configuration object to avoid recreation on each parsing call
const STATIC_REQUEST_CONFIG = {
    model: 'llama-4-scout-17b-16e-instruct',
    stream: false,
    max_completion_tokens: 2048,
    temperature: 0.2,
    top_p: 1,
    response_format: { type: "json_object" as const }
} as const;

// Pre-computed system prompt template with efficient placeholder replacement
const SYSTEM_PROMPT_TEMPLATE = `Extract the following information from this job description and respond ONLY with a valid JSON object:

Job Description:
{JOB_DESCRIPTION}

Extract these fields:
– role (only the core, standardized job title as it would appear in an HR system, stripping away levels, seniority, numbering, seasons, dates, or extra details; e.g., return "Software Engineer" instead of "Software Engineer I" or "Principal Associate, Software Engineer", and "Software Developer" instead of "Software Developer (Fall 2025)")
- company (company name)
- location (job location in the format "city, province/state" with no abbreviations, e.g., "Toronto, Ontario")
- experienceRequired (years of experience required, otherwise "Not specified")
- skills (array of key skills mentioned, maximum 6)
- remote (boolean - true if remote work is mentioned)
- notes (comprehensive summary that captures ALL important information including responsibilities, requirements, nice-to-haves, benefits, and any other relevant details. Be thorough but concise)

IMPORTANT: Your response MUST be ONLY a valid JSON object. DO NOT include any other text, backticks, or markdown formatting.
IMPORTANT: For the location field, strictly use the format "city, province/state" with no abbreviations (e.g., "Toronto, Ontario", not "Toronto, ON" or "Toronto, Canada").`;

// Optimized Cerebras client instance - reuse existing instance to avoid recreation
let cerebrasClient: Cerebras | null = null;

function getCerebrasClient(): Cerebras {
    if (!cerebrasClient) {
        cerebrasClient = new Cerebras({
            apiKey: import.meta.env.VITE_CEREBRAS_API_KEY
        });
    }
    return cerebrasClient;
}

// Consolidated state interface for optimized state management
interface ParsingState {
    jobDescription: string;
    isParsingAI: boolean;
    errorMessage: string;
    showErrorModal: boolean;
    parseStartTime: number | null;
}

// Action types for the reducer
type ParsingAction = 
    | { type: 'START_PARSING'; payload: { startTime: number } }
    | { type: 'PARSING_SUCCESS' }
    | { type: 'PARSING_ERROR'; payload: { error: string } }
    | { type: 'UPDATE_DESCRIPTION'; payload: { description: string } }
    | { type: 'CLOSE_ERROR_MODAL' }
    | { type: 'RESET_STATE' };

// Initial state
const initialState: ParsingState = {
    jobDescription: '',
    isParsingAI: false,
    errorMessage: '',
    showErrorModal: false,
    parseStartTime: null,
};

// Reducer for consolidated state management with batched updates
function parsingReducer(state: ParsingState, action: ParsingAction): ParsingState {
    switch (action.type) {
        case 'START_PARSING':
            return {
                ...state,
                isParsingAI: true,
                errorMessage: '',
                showErrorModal: false,
                parseStartTime: action.payload.startTime,
            };
        case 'PARSING_SUCCESS':
            return {
                ...state,
                isParsingAI: false,
                jobDescription: '',
                parseStartTime: null,
            };
        case 'PARSING_ERROR':
            return {
                ...state,
                isParsingAI: false,
                errorMessage: action.payload.error,
                showErrorModal: true,
                parseStartTime: null,
            };
        case 'UPDATE_DESCRIPTION':
            return {
                ...state,
                jobDescription: action.payload.description,
            };
        case 'CLOSE_ERROR_MODAL':
            return {
                ...state,
                showErrorModal: false,
                errorMessage: '',
            };
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
}

export function useAIParsing(
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setShowAIParseModal: (show: boolean) => void,
    setShowAddModal: (show: boolean) => void,
    setIsFromAIParse: (isFromAI: boolean) => void,
    selectedFolder: FolderType | null
) {
    // Replace multiple useState hooks with single useReducer for consolidated state management
    const [state, dispatch] = useReducer(parsingReducer, initialState);

    const handleAIParseJob = useCallback(async () => {
        if (!state.jobDescription.trim()) return;

        // Start parsing with performance timing for optional monitoring during development
        const startTime = performance.now();
        dispatch({ type: 'START_PARSING', payload: { startTime } });

        try {
            // Use optimized Cerebras client instance to reuse existing instance
            const cerebras = getCerebrasClient();

            // Pre-compute system prompt with efficient placeholder replacement
            const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{JOB_DESCRIPTION}', state.jobDescription);

            const completionCreateResponse = await cerebras.chat.completions.create({
                messages: [
                    {
                        "role": "system",
                        "content": systemPrompt
                    },
                    {
                        "role": "user",
                        "content": state.jobDescription
                    }
                ],
                // Use static request configuration object to avoid recreation on each parsing call
                ...STATIC_REQUEST_CONFIG
            });
            
            const content = (completionCreateResponse.choices as { message?: { content?: string } }[])?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('No response from AI service');
            }

            const parsedData = JSON.parse(content);
            
            // Batched state update - set form data and complete parsing in single operation
            setFormData({
                role: parsedData.role || 'Unknown Role',
                company: parsedData.company || 'Unknown Company',
                location: parsedData.location || 'Not specified',
                experienceRequired: parsedData.experienceRequired || 'Not specified',
                skills: Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : '',
                remote: parsedData.remote || false,
                notes: parsedData.notes || 'No additional notes',
                folderId: selectedFolder?.id || ''
            });
            
            // Complete parsing operation with batched state updates
            dispatch({ type: 'PARSING_SUCCESS' });
            
            // Handle modal transitions
            setShowAIParseModal(false);
            setIsFromAIParse(true);
            setShowAddModal(true);

            // Optional performance logging for development
            if (import.meta.env.DEV && state.parseStartTime) {
                const totalTime = performance.now() - state.parseStartTime;
                console.log(`🚀 AI Parsing completed in ${totalTime.toFixed(2)}ms`);
            }
            
        } catch (error) {
            console.error('❌ Error parsing job with AI:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Batched error state update
            dispatch({ 
                type: 'PARSING_ERROR', 
                payload: { error: `Failed to parse job description: ${errorMsg}` }
            });
        }
    }, [state.jobDescription, state.parseStartTime, selectedFolder, setFormData, setIsFromAIParse, setShowAIParseModal, setShowAddModal]);

    // Helper function to update job description
    const setJobDescription = useCallback((description: string) => {
        dispatch({ type: 'UPDATE_DESCRIPTION', payload: { description } });
    }, []);

    // Helper function to close error modal
    const setShowErrorModal = useCallback((show: boolean) => {
        if (!show) {
            dispatch({ type: 'CLOSE_ERROR_MODAL' });
        }
    }, []);

    return {
        jobDescription: state.jobDescription,
        setJobDescription,
        isParsingAI: state.isParsingAI,
        handleAIParseJob,
        errorMessage: state.errorMessage,
        showErrorModal: state.showErrorModal,
        setShowErrorModal
    };
}