import React, { useReducer, useCallback, useEffect, useRef } from 'react';
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

// Interface for parsed job data with optimized structure
interface ParsedJobData {
    role: string;
    company: string;
    location: string;
    experienceRequired: string;
    skills: string[];
    remote: boolean;
    notes: string;
}

// Interface for form data with optimized structure
interface OptimizedFormData {
    role: string;
    company: string;
    location: string;
    experienceRequired: string;
    skills: string;
    remote: boolean;
    notes: string;
    folderId: string;
}

// Optimized default values to avoid object creation during parsing
const DEFAULT_PARSED_DATA: ParsedJobData = {
    role: 'Unknown Role',
    company: 'Unknown Company',
    location: 'Not specified',
    experienceRequired: 'Not specified',
    skills: [],
    remote: false,
    notes: 'No additional notes'
};

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
 * Implement efficient JSON parsing without intermediate string operations
 * Fast validation of API response structure
 */
function processOptimizedResponse(content: string): ParsedJobData {
    try {
        // Direct JSON parsing without intermediate string operations
        const rawData = JSON.parse(content);
        
        // Fast validation of API response structure - check essential fields exist
        if (typeof rawData !== 'object' || rawData === null) {
            throw new Error('Invalid response format: not an object');
        }
        
        // Create optimized parsed data with direct property assignment
        const parsedData: ParsedJobData = {
            role: typeof rawData.role === 'string' ? rawData.role : DEFAULT_PARSED_DATA.role,
            company: typeof rawData.company === 'string' ? rawData.company : DEFAULT_PARSED_DATA.company,
            location: typeof rawData.location === 'string' ? rawData.location : DEFAULT_PARSED_DATA.location,
            experienceRequired: typeof rawData.experienceRequired === 'string' ? rawData.experienceRequired : DEFAULT_PARSED_DATA.experienceRequired,
            skills: Array.isArray(rawData.skills) ? rawData.skills : DEFAULT_PARSED_DATA.skills,
            remote: typeof rawData.remote === 'boolean' ? rawData.remote : DEFAULT_PARSED_DATA.remote,
            notes: typeof rawData.notes === 'string' ? rawData.notes : DEFAULT_PARSED_DATA.notes
        };
        
        return parsedData;
    } catch (error) {
        // If JSON parsing fails, return default data to maintain functionality
        console.warn('JSON parsing failed, using default data:', error);
        return DEFAULT_PARSED_DATA;
    }
}

/**
 * Create optimized data mapping function with direct property assignment
 * Optimize skills array processing to avoid unnecessary array operations
 */
function mapResponseToFormData(parsedData: ParsedJobData, folderId: string): OptimizedFormData {
    // Optimize skills array processing - direct join without intermediate operations
    const skillsString = parsedData.skills.length > 0 ? parsedData.skills.join(', ') : '';
    
    // Direct property assignment for optimal performance
    return {
        role: parsedData.role,
        company: parsedData.company,
        location: parsedData.location,
        experienceRequired: parsedData.experienceRequired,
        skills: skillsString,
        remote: parsedData.remote,
        notes: parsedData.notes,
        folderId: folderId
    };
}

// Consolidated state interface for optimized state management
interface ParsingState {
    jobDescription: string;
    isParsingAI: boolean;
    errorMessage: string;
    showErrorModal: boolean;
    parseStartTime: number | null;
    parsingPhase: 'idle' | 'starting' | 'processing' | 'completing';
}

// Action types for the reducer
type ParsingAction = 
    | { type: 'START_PARSING'; payload: { startTime: number } }
    | { type: 'SET_PARSING_PHASE'; payload: { phase: 'idle' | 'starting' | 'processing' | 'completing' } }
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
            // Use optimized Cerebras client instance to reuse existing instance
            const cerebras = getCerebrasClient();

            // Pre-compute system prompt with efficient placeholder replacement
            const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{JOB_DESCRIPTION}', state.jobDescription);

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

            // Mark API call complete
            const apiCallEndTime = performance.now();
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.apiCallEndTime = apiCallEndTime;
            }
            
            // Fast validation of API response structure before processing
            const content = (completionCreateResponse.choices as { message?: { content?: string } }[])?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('No response from AI service');
            }

            // Transition to completing phase for smooth state transitions
            dispatch({ type: 'SET_PARSING_PHASE', payload: { phase: 'completing' } });

            // Implement efficient JSON parsing without intermediate string operations
            const parsedData = processOptimizedResponse(content);
            
            // Create optimized data mapping function with direct property assignment
            const optimizedFormData = mapResponseToFormData(parsedData, selectedFolder?.id || '');

            // Mark response processing complete
            if (performanceTimingsRef.current) {
                performanceTimingsRef.current.responseProcessedTime = performance.now();
            }

            // Batched state update - set form data and complete parsing in single operation
            setFormData(optimizedFormData);
            
            // Complete parsing operation with batched state updates
            dispatch({ type: 'PARSING_SUCCESS' });
            
            // Handle modal transitions
            setShowAIParseModal(false);
            setIsFromAIParse(true);
            setShowAddModal(true);

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
        }),
    };
}