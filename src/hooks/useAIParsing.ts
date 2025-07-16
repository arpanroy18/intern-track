import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import { Folder as FolderType } from '../types';
import { aiParsingService } from '../services/aiParsingService';
import { 
    ParsedJobData, 
    OptimizedFormData, 
    ParsingState, 
    ParsingAction 
} from '../types/aiParsing';

// Performance monitoring interfaces for development-time tracking
interface ParsingPerformanceMetrics {
    requestPreparationTime: number;
    apiCallTime: number;
    responseProcessingTime: number;
    stateUpdateTime: number;
    totalTime: number;
    memoryUsage?: {
        before: number;
        after: number;
        delta: number;
    };
}

interface PerformanceTimings {
    startTime: number;
    requestPreparedTime?: number;
    apiCallStartTime?: number;
    apiCallEndTime?: number;
    responseProcessedTime?: number;
    stateUpdatedTime?: number;
    endTime?: number;
}

// Development-time performance logger
class PerformanceLogger {
    private static instance: PerformanceLogger;
    private metrics: ParsingPerformanceMetrics[] = [];
    private maxMetricsHistory = 10; // Keep last 10 parsing operations for memory efficiency

    static getInstance(): PerformanceLogger {
        if (!PerformanceLogger.instance) {
            PerformanceLogger.instance = new PerformanceLogger();
        }
        return PerformanceLogger.instance;
    }

    logMetrics(metrics: ParsingPerformanceMetrics): void {
        if (!import.meta.env.DEV) return;

        // Add to metrics history with memory-efficient circular buffer
        this.metrics.push(metrics);
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics.shift(); // Remove oldest entry to prevent memory growth
        }

        // Development-time performance logging for optimization validation
        console.group('🔍 AI Parsing Performance Metrics');
        console.log(`📊 Total Time: ${metrics.totalTime.toFixed(2)}ms`);
        console.log(`⚙️  Request Preparation: ${metrics.requestPreparationTime.toFixed(2)}ms`);
        console.log(`🌐 API Call: ${metrics.apiCallTime.toFixed(2)}ms`);
        console.log(`🔄 Response Processing: ${metrics.responseProcessingTime.toFixed(2)}ms`);
        console.log(`📝 State Update: ${metrics.stateUpdateTime.toFixed(2)}ms`);
        
        if (metrics.memoryUsage) {
            console.log(`💾 Memory Delta: ${(metrics.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`);
        }

        // Performance optimization validation warnings
        if (metrics.requestPreparationTime > 10) {
            console.warn('⚠️  Request preparation took longer than expected (>10ms)');
        }
        if (metrics.responseProcessingTime > 50) {
            console.warn('⚠️  Response processing took longer than expected (>50ms)');
        }
        if (metrics.stateUpdateTime > 20) {
            console.warn('⚠️  State update took longer than expected (>20ms)');
        }

        console.groupEnd();
    }

    getAverageMetrics(): Partial<ParsingPerformanceMetrics> | null {
        if (!import.meta.env.DEV || this.metrics.length === 0) return null;

        const avg = this.metrics.reduce((acc, metric) => ({
            requestPreparationTime: acc.requestPreparationTime + metric.requestPreparationTime,
            apiCallTime: acc.apiCallTime + metric.apiCallTime,
            responseProcessingTime: acc.responseProcessingTime + metric.responseProcessingTime,
            stateUpdateTime: acc.stateUpdateTime + metric.stateUpdateTime,
            totalTime: acc.totalTime + metric.totalTime,
        }), {
            requestPreparationTime: 0,
            apiCallTime: 0,
            responseProcessingTime: 0,
            stateUpdateTime: 0,
            totalTime: 0,
        });

        const count = this.metrics.length;
        return {
            requestPreparationTime: avg.requestPreparationTime / count,
            apiCallTime: avg.apiCallTime / count,
            responseProcessingTime: avg.responseProcessingTime / count,
            stateUpdateTime: avg.stateUpdateTime / count,
            totalTime: avg.totalTime / count,
        };
    }

    // Memory-efficient cleanup method
    clearMetrics(): void {
        this.metrics.length = 0; // Clear array efficiently
    }
}



/**
 * Create optimized data mapping function with direct property assignment
 * Optimize skills array processing to avoid unnecessary array operations
 * Optimized for job creation workflow integration
 */
function mapResponseToFormData(parsedData: ParsedJobData, folderId: string): OptimizedFormData {
    // Optimize skills array processing - direct join without intermediate operations
    // Use cached empty string to avoid repeated empty string creation
    const skillsString = parsedData.skills.length > 0 ? parsedData.skills.join(', ') : '';
    
    // Direct property assignment for optimal performance
    // Pre-populate folderId to ensure smooth integration with job creation flow
    return {
        role: parsedData.role,
        company: parsedData.company,
        location: parsedData.location,
        experienceRequired: parsedData.experienceRequired,
        skills: skillsString,
        remote: parsedData.remote,
        notes: parsedData.notes,
        folderId: folderId || '', // Ensure folderId is always a string for form compatibility
        jobPostingUrl: '' // Initialize jobPostingUrl for complete form data structure
    };
}



// Initial state
const initialState: ParsingState = {
    jobDescription: '',
    isParsingAI: false,
    errorMessage: '',
    showErrorModal: false,
    parseStartTime: null,
    parsingPhase: 'idle',
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
                parsingPhase: 'starting',
            };
        case 'SET_PARSING_PHASE':
            return {
                ...state,
                parsingPhase: action.payload.phase,
            };
        case 'PARSING_SUCCESS':
            return {
                ...state,
                isParsingAI: false,
                jobDescription: '',
                parseStartTime: null,
                parsingPhase: 'idle',
            };
        case 'PARSING_ERROR':
            return {
                ...state,
                isParsingAI: false,
                errorMessage: action.payload.error,
                showErrorModal: true,
                parseStartTime: null,
                parsingPhase: 'idle',
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
    
    // Memory-efficient refs for performance monitoring and cleanup
    const performanceTimingsRef = useRef<PerformanceTimings | null>(null);
    const performanceLoggerRef = useRef<PerformanceLogger>(PerformanceLogger.getInstance());
    const cleanupFunctionsRef = useRef<Array<() => void>>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Proper state cleanup between parsing operations
    // Optimized for sequential parsing operations to maintain performance
    const cleanupParsingState = useCallback(() => {
        // Reset performance timings
        performanceTimingsRef.current = null;
        
        // Abort any ongoing API requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        // Execute any registered cleanup functions
        cleanupFunctionsRef.current.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.warn('Cleanup function failed:', error);
            }
        });
        cleanupFunctionsRef.current.length = 0; // Clear cleanup functions array
        
        // Reset parsing state
        dispatch({ type: 'RESET_STATE' });
    }, []);

    // Optimized method for sequential parsing operations
    // Ensures maintained performance for rapid parsing sequences
    const prepareForNextParsing = useCallback(() => {
        // Quick cleanup without full state reset for better performance
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        // Clear only essential state for next parsing operation
        performanceTimingsRef.current = null;
        cleanupFunctionsRef.current.length = 0;
        
        // Reset only parsing-specific state, keep job description for potential reuse
        dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'idle' } });
    }, []);

    // Memory-efficient event handling and cleanup on component unmount
    useEffect(() => {
        return () => {
            // Cleanup on unmount to prevent memory leaks
            cleanupParsingState();
            
            // Clear performance metrics to free memory
            performanceLoggerRef.current.clearMetrics();
        };
    }, [cleanupParsingState]);

    // Memory usage tracking helper
    const getMemoryUsage = useCallback((): number => {
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            return (performance as any).memory?.usedJSHeapSize || 0;
        }
        return 0;
    }, []);

    const handleAIParseJob = useCallback(async () => {
        if (!state.jobDescription.trim()) return;

        // Proper state cleanup between parsing operations
        cleanupParsingState();

        // Initialize performance monitoring and memory tracking
        const memoryBefore = getMemoryUsage();
        const startTime = performance.now();
        
        // Initialize performance timings for detailed tracking
        performanceTimingsRef.current = {
            startTime,
        };

        // Create abort controller for memory-efficient request cancellation
        abortControllerRef.current = new AbortController();
        
        // Add cleanup function for this parsing operation
        const cleanupCurrentParsing = () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
        cleanupFunctionsRef.current.push(cleanupCurrentParsing);

        // Immediate loading state activation (sub-50ms) - start parsing with performance timing
        dispatch({ type: 'START_PARSING', payload: { startTime } });

        // Use requestAnimationFrame to ensure immediate UI feedback within sub-50ms
        requestAnimationFrame(() => {
            dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'processing' } });
        });

        try {
            // Mark request preparation complete
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.requestPreparedTime = performance.now();
            }

            // Transition to processing phase for smooth state transitions
            dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'processing' } });

            // API call phase - performance timing
            const apiCallStartTime = performance.now();
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.apiCallStartTime = apiCallStartTime;
            }

            // Use the AI parsing service with abort signal support
            const parsedData = await aiParsingService.parseJobDescription(
                state.jobDescription,
                abortControllerRef.current?.signal
            );

            // Mark API call complete
            const apiCallEndTime = performance.now();
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.apiCallEndTime = apiCallEndTime;
            }

            // Transition to completing phase for smooth state transitions
            dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'completing' } });
            
            // Create optimized data mapping function with direct property assignment
            const optimizedFormData = mapResponseToFormData(parsedData, selectedFolder?.id || '');

            // Mark response processing complete
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.responseProcessedTime = performance.now();
            }

            // Optimize form data population to minimize processing time
            // Use requestAnimationFrame to ensure smooth modal transitions without blocking
            requestAnimationFrame(() => {
                // Batched state update - set form data and complete parsing in single operation
                setFormData(optimizedFormData);
                
                // Complete parsing operation with batched state updates
                dispatch({ type: 'PARSING_SUCCESS' });
                
                // Optimize modal transitions to happen without unnecessary delays
                // Use setTimeout with 0ms to ensure modal transitions are non-blocking
                setTimeout(() => {
                    setShowAIParseModal(false);
                    setIsFromAIParse(true);
                    setShowAddModal(true);
                }, 0);
            });

            // Mark state update complete
            const endTime = performance.now();
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.stateUpdatedTime = performance.now();
                performanceTimingsRef.current.endTime = endTime;
            }

            // Calculate and log comprehensive performance metrics for development
            if (import.meta.env.DEV && performanceTimingsRef.current) {
                const timings = performanceTimingsRef.current;
                const memoryAfter = getMemoryUsage();
                
                const metrics: ParsingPerformanceMetrics = {
                    requestPreparationTime: (timings.requestPreparedTime || timings.startTime) - timings.startTime,
                    apiCallTime: (timings.apiCallEndTime || endTime) - (timings.apiCallStartTime || timings.startTime),
                    responseProcessingTime: (timings.responseProcessedTime || endTime) - (timings.apiCallEndTime || timings.startTime),
                    stateUpdateTime: (timings.stateUpdatedTime || endTime) - (timings.responseProcessedTime || timings.startTime),
                    totalTime: endTime - timings.startTime,
                    memoryUsage: {
                        before: memoryBefore,
                        after: memoryAfter,
                        delta: memoryAfter - memoryBefore
                    }
                };

                // Log performance metrics using the performance logger
                performanceLoggerRef.current.logMetrics(metrics);
            }

            // Clean up this parsing operation
            cleanupCurrentParsing();
            
        } catch (error) {
            console.error('❌ Error parsing job with AI:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            
            // Log error timing for development
            if (import.meta.env.DEV && performanceTimingsRef.current) {
                const errorTime = performance.now() - performanceTimingsRef.current.startTime;
                console.warn(`⚠️  Parsing failed after ${errorTime.toFixed(2)}ms:`, errorMsg);
            }
            
            // Batched error state update
            dispatch({ 
                type: 'PARSING_ERROR', 
                payload: { error: `Failed to parse job description: ${errorMsg}` }
            });

            // Clean up on error
            cleanupCurrentParsing();
        }
    }, [state.jobDescription, selectedFolder, setFormData, setIsFromAIParse, setShowAIParseModal, setShowAddModal, cleanupParsingState, getMemoryUsage]);

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

    // Development-time performance metrics access
    const getPerformanceMetrics = useCallback(() => {
        if (!import.meta.env.DEV) return null;
        return performanceLoggerRef.current.getAverageMetrics();
    }, []);

    // Manual cleanup function for development/testing purposes
    const clearPerformanceMetrics = useCallback(() => {
        if (import.meta.env.DEV) {
            performanceLoggerRef.current.clearMetrics();
        }
    }, []);

    return {
        jobDescription: state.jobDescription,
        setJobDescription,
        isParsingAI: state.isParsingAI,
        parsingPhase: state.parsingPhase,
        handleAIParseJob,
        errorMessage: state.errorMessage,
        showErrorModal: state.showErrorModal,
        setShowErrorModal,
        // Development-only performance monitoring methods
        ...(import.meta.env.DEV && {
            getPerformanceMetrics,
            clearPerformanceMetrics,
            prepareForNextParsing, // Expose for testing sequential parsing operations
        }),
    };
}