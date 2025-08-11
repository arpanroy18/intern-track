/**
 * Production-grade AI parsing hook for job description processing.
 * 
 * This hook encapsulates the complete AI parsing workflow with enterprise-level
 * patterns including intelligent error handling, resource management, and user experience
 * optimizations. It serves as the primary interface between UI components and the
 * AI parsing infrastructure.
 */

import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import { Folder as FolderType } from '../types';
import { aiParsingService, AIParsingError, ParseError } from '../services/aiParsingService';
import { 
    ParsingState, 
    ParsingAction,
    OptimizedFormData
} from '../types/aiParsing';
import { mapResponseToFormData } from '../utils/jobDataParser';









/**
 * Initial state configuration for AI parsing functionality.
 * 
 * This state structure is designed to support the complete parsing workflow
 * from user input through AI processing to final form population. Each field
 * serves a specific purpose in the user experience:
 * 
 * - `jobDescription`: Holds raw user input for parsing
 * - `isParsingAI`: Controls loading states and prevents duplicate requests
 * - `errorMessage`: Stores user-friendly error descriptions for display
 * - `showErrorModal`: Controls error modal visibility independently of error state
 * - `parsingPhase`: Provides granular progress feedback during long operations
 */
const initialState: ParsingState = {
    jobDescription: '',
    isParsingAI: false,
    errorMessage: '',
    showErrorModal: false,
    parsingPhase: 'idle',
};

/**
 * Optimized state reducer implementing efficient parsing workflow state management.
 * 
 * This reducer follows Redux-style patterns optimized for React's concurrent features
 * and performance. It implements several optimizations:
 * Error states include comprehensive cleanup to ensure the UI returns to
 * a usable state regardless of where in the process the error occurred.
 * 
 * @param state - Current parsing state snapshot
 * @param action - Dispatched action with type and optional payload
 * @returns New state object (referentially different only if state actually changed)
 */
function parsingReducer(state: ParsingState, action: ParsingAction): ParsingState {
    switch (action.type) {
        case 'START_PARSING':
            // Batch all startup state changes for optimal performance
            // Clear any previous error state to ensure clean parsing attempt
            return {
                ...state,
                isParsingAI: true,
                errorMessage: '', // Clear previous errors for clean start
                showErrorModal: false, // Hide any visible error modals
                parsingPhase: 'starting', // Set initial phase for UI feedback
            };
        case 'SET_PARSING_PHASE':
            // Performance optimization: prevent unnecessary re-renders for identical phases
            // This is particularly important during rapid phase transitions
            if (state.parsingPhase === action.payload.phase) return state;
            return {
                ...state,
                parsingPhase: action.payload.phase,
            };
        case 'PARSING_SUCCESS':
            // Comprehensive success cleanup with all state reset
            // Clear job description to prepare for next parsing operation
            return {
                ...state,
                isParsingAI: false, // Allow new parsing operations
                jobDescription: '', // Clear input for next use
                parsingPhase: 'idle', // Return to ready state
                errorMessage: '', // Clear any lingering error messages
                showErrorModal: false, // Ensure error UI is hidden
            };
        case 'PARSING_ERROR':
            // Comprehensive error state with user-facing error display
            // Keep job description so user can retry without re-entering
            return {
                ...state,
                isParsingAI: false, // Stop loading indicators
                errorMessage: action.payload.error, // User-friendly error message
                showErrorModal: true, // Display error to user
                parsingPhase: 'idle', // Return to ready state for retry
            };
        case 'UPDATE_DESCRIPTION':
            // Optimize description update with early return
            if (state.jobDescription === action.payload.description) return state;
            return {
                ...state,
                jobDescription: action.payload.description,
            };
        case 'CLOSE_ERROR_MODAL':
            // Clean error modal closure with message cleanup
            // This ensures no stale error messages remain in state
            return {
                ...state,
                showErrorModal: false, // Hide error modal
                errorMessage: '', // Clear error message for clean state
            };
        case 'RESET_STATE':
            // Memory-efficient reset using initial state reference
            // This avoids object creation and leverages React's reference equality optimization
            return initialState;
        default:
            return state;
    }
}

/**
 * Custom hook for AI-powered job description parsing with comprehensive state management.
 * 
 * This hook provides a production-ready interface for parsing job descriptions using AI,
 * with sophisticated error handling, user experience optimizations, and integration
 * with the broader job tracking application workflow.
 * 
 * @param setFormData - Callback to populate form with parsed job data
 * @param setShowAIParseModal - Controls visibility of the AI parsing input modal
 * @param setShowAddModal - Controls visibility of the job creation form modal
 * @param setIsFromAIParse - Flags that job data originated from AI parsing (affects form behavior)
 * @param selectedFolder - Current folder context for organizing the parsed job application
 * 
 * @returns Stable object containing parsing state, control functions, and error information
 * @example
 * ```typescript
 * // Error handling patterns
 * const { errorMessage, showErrorModal } = useAIParsing(...);
 * 
 * // Network error: "Network connection failed. Please check your internet connection and try again."
 * // API error: "AI service is temporarily unavailable. Please try again in a moment."
 * // Validation error: "The job description could not be processed. Please try with a different description."
 * ```
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
            
            // Enhanced error handling with proper classification
            let errorMsg = 'Unknown error occurred';
            
            if (error instanceof AIParsingError) {
                // Use structured error message based on error type
                switch (error.type) {
                    case ParseError.NETWORK_ERROR:
                        errorMsg = 'Network connection failed. Please check your internet connection and try again.';
                        break;
                    case ParseError.API_ERROR:
                        errorMsg = 'AI service is temporarily unavailable. Please try again in a moment.';
                        break;
                    case ParseError.VALIDATION_ERROR:
                        errorMsg = 'The job description could not be processed. Please try with a different description.';
                        break;
                    case ParseError.CONFIGURATION_ERROR:
                        errorMsg = 'AI service configuration error. Please contact support.';
                        break;
                    default:
                        errorMsg = 'An unexpected error occurred. Please try again.';
                }
            } else if (error instanceof Error) {
                errorMsg = error.message;
            }
            
            // Handle parsing error with enhanced messaging
            dispatch({ 
                type: 'PARSING_ERROR', 
                payload: { error: errorMsg }
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