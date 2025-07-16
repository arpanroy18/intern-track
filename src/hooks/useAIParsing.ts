/**
 * AI Parsing Hook
 * 
 * This hook provides AI-powered job description parsing functionality with clean state management,
 * proper error handling, and resource cleanup. It integrates with the AI parsing service and
 * data transformation utilities to provide a seamless parsing experience.
 */

import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import { Folder as FolderType } from '../types';
import { aiParsingService } from '../services/aiParsingService';
import { 
    ParsingState, 
    ParsingAction,
    OptimizedFormData
} from '../types/aiParsing';
import { mapResponseToFormData } from '../utils/jobDataParser';









/**
 * Initial state for the AI parsing functionality.
 * Defines the default values for all parsing-related state.
 */
const initialState: ParsingState = {
    jobDescription: '',
    isParsingAI: false,
    errorMessage: '',
    showErrorModal: false,
    parsingPhase: 'idle',
};

/**
 * Optimized reducer for efficient state management with minimal object creation.
 * Handles all state transitions for the AI parsing workflow with focus on performance.
 * 
 * @param state - Current parsing state
 * @param action - Action to dispatch with optional payload
 * @returns Updated parsing state
 */
function parsingReducer(state: ParsingState, action: ParsingAction): ParsingState {
    switch (action.type) {
        case 'START_PARSING':
            // Batch all startup state changes for optimal performance
            return {
                ...state,
                isParsingAI: true,
                errorMessage: '',
                showErrorModal: false,
                parsingPhase: 'starting',
            };
        case 'SET_PARSING_PHASE':
            // Optimize single property update
            if (state.parsingPhase === action.payload.phase) return state;
            return {
                ...state,
                parsingPhase: action.payload.phase,
            };
        case 'PARSING_SUCCESS':
            // Batch completion state changes
            return {
                ...state,
                isParsingAI: false,
                jobDescription: '',
                parsingPhase: 'idle',
                errorMessage: '',
                showErrorModal: false,
            };
        case 'PARSING_ERROR':
            // Batch error state changes
            return {
                ...state,
                isParsingAI: false,
                errorMessage: action.payload.error,
                showErrorModal: true,
                parsingPhase: 'idle',
            };
        case 'UPDATE_DESCRIPTION':
            // Optimize description update with early return
            if (state.jobDescription === action.payload.description) return state;
            return {
                ...state,
                jobDescription: action.payload.description,
            };
        case 'CLOSE_ERROR_MODAL':
            // Batch modal closure with error cleanup
            return {
                ...state,
                showErrorModal: false,
                errorMessage: '',
            };
        case 'RESET_STATE':
            // Return reference to initial state for memory efficiency
            return initialState;
        default:
            return state;
    }
}

/**
 * Custom hook for AI-powered job description parsing.
 * 
 * Provides a clean interface for parsing job descriptions using AI, managing parsing state,
 * handling errors, and integrating with form data. The hook manages its own state using
 * useReducer and provides proper cleanup for resource management.
 * 
 * @param setFormData - Function to update form data with parsed results
 * @param setShowAIParseModal - Function to control AI parse modal visibility
 * @param setShowAddModal - Function to control add job modal visibility
 * @param setIsFromAIParse - Function to indicate if data comes from AI parsing
 * @param selectedFolder - Currently selected folder for job organization
 * @returns Object containing parsing state and control functions
 */
export function useAIParsing(
    setFormData: React.Dispatch<React.SetStateAction<OptimizedFormData>>,
    setShowAIParseModal: (show: boolean) => void,
    setShowAddModal: (show: boolean) => void,
    setIsFromAIParse: (isFromAI: boolean) => void,
    selectedFolder: FolderType | null
) {
    // Consolidated state management with useReducer
    const [state, dispatch] = useReducer(parsingReducer, initialState);
    
    // Ref for abort controller to handle request cancellation
    const abortControllerRef = useRef<AbortController | null>(null);

    // Optimized cleanup function focusing on essential resource management only
    const cleanupParsingState = useCallback(() => {
        // Abort any ongoing API requests for immediate resource cleanup
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        // Reset state efficiently using reducer
        dispatch({ type: 'RESET_STATE' });
    }, []);

    // Essential cleanup on unmount - prevent memory leaks and abort in-flight requests
    useEffect(() => {
        return cleanupParsingState;
    }, [cleanupParsingState]);

    const handleAIParseJob = useCallback(async () => {
        if (!state.jobDescription.trim()) return;

        // Cleanup any existing controller and create new one for optimal memory usage
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        // Start parsing operation
        dispatch({ type: 'START_PARSING' });

        // Set processing phase for UI feedback
        dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'processing' } });

        try {
            // Use the AI parsing service with optimized signal handling
            const parsedData = await aiParsingService.parseJobDescription(
                state.jobDescription,
                signal
            );

            // Check if request was aborted before continuing
            if (signal.aborted) return;

            // Transition to completing phase
            dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'completing' } });
            
            // Map parsed data to form data structure
            const optimizedFormData = mapResponseToFormData(parsedData, selectedFolder?.id || '');

            // Update form data and complete parsing operation
            setFormData(optimizedFormData);
            dispatch({ type: 'PARSING_SUCCESS' });
            
            // Handle modal transitions
            setShowAIParseModal(false);
            setIsFromAIParse(true);
            setShowAddModal(true);
            
        } catch (error) {
            // Don't handle errors if request was aborted
            if (signal.aborted) return;
            
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Handle parsing error
            dispatch({ 
                type: 'PARSING_ERROR', 
                payload: { error: `Failed to parse job description: ${errorMsg}` }
            });
        } finally {
            // Only nullify if it's the current controller
            if (abortControllerRef.current && abortControllerRef.current.signal === signal) {
                abortControllerRef.current = null;
            }
        }
    }, [state.jobDescription, selectedFolder, setFormData, setIsFromAIParse, setShowAIParseModal, setShowAddModal]);

    /**
     * Optimized job description setter with memory-efficient updates.
     * 
     * @param description - The new job description text
     */
    const setJobDescription = useCallback((description: string) => {
        dispatch({ type: 'UPDATE_DESCRIPTION', payload: { description } });
    }, []);

    /**
     * Optimized error modal controller with conditional dispatch.
     * 
     * @param show - Whether to show the error modal (only false is handled)
     */
    const setShowErrorModal = useCallback((show: boolean) => {
        if (!show) {
            dispatch({ type: 'CLOSE_ERROR_MODAL' });
        }
    }, []);

    // Return memoized object for stable reference and optimized re-renders
    return React.useMemo(() => ({
        jobDescription: state.jobDescription,
        setJobDescription,
        isParsingAI: state.isParsingAI,
        parsingPhase: state.parsingPhase,
        handleAIParseJob,
        errorMessage: state.errorMessage,
        showErrorModal: state.showErrorModal,
        setShowErrorModal,
    }), [
        state.jobDescription,
        state.isParsingAI,
        state.parsingPhase,
        state.errorMessage,
        state.showErrorModal,
        setJobDescription,
        handleAIParseJob,
        setShowErrorModal
    ]);
}