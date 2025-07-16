/**
 * AI Parsing Type Definitions
 * 
 * This module contains all type definitions and interfaces related to AI-powered
 * job description parsing functionality. These types support the parsing workflow
 * from raw job descriptions to structured form data.
 */

/**
 * Represents the structured data extracted from a job description by AI parsing.
 * This interface defines the core job information that can be automatically
 * extracted and validated from unstructured job posting text.
 */
export interface ParsedJobData {
  /** The standardized job title/role (e.g., "Software Engineer") */
  role: string;
  /** The hiring company name */
  company: string;
  /** Job location in "city, province/state" format with no abbreviations */
  location: string;
  /** Years of experience required or "Not specified" */
  experienceRequired: string;
  /** Array of key skills mentioned in the job description (max 6) */
  skills: string[];
  /** Whether remote work is mentioned in the job description */
  remote: boolean;
  /** Comprehensive summary of job details, requirements, and benefits */
  notes: string;
}

/**
 * Represents form-ready data structure optimized for job application forms.
 * This interface extends ParsedJobData with additional fields required for
 * form submission and includes string formatting for UI components.
 */
export interface OptimizedFormData {
  /** The standardized job title/role */
  role: string;
  /** The hiring company name */
  company: string;
  /** Job location in standardized format */
  location: string;
  /** Years of experience required */
  experienceRequired: string;
  /** Comma-separated string of skills for form input */
  skills: string;
  /** Whether remote work is available */
  remote: boolean;
  /** Comprehensive job notes and details */
  notes: string;
  /** The folder ID where this job application should be stored */
  folderId: string;
  /** URL of the original job posting (initially empty) */
  jobPostingUrl: string;
}

/**
 * Represents the different phases of the AI parsing process.
 * Used to provide appropriate UI feedback during parsing operations.
 */
export type ParsingPhase = 'idle' | 'starting' | 'processing' | 'completing';

/**
 * Represents the complete state of the AI parsing functionality.
 * This interface consolidates all parsing-related state into a single
 * structure for efficient state management with useReducer.
 */
export interface ParsingState {
  /** The raw job description text to be parsed */
  jobDescription: string;
  /** Whether an AI parsing operation is currently in progress */
  isParsingAI: boolean;
  /** Error message from failed parsing operations */
  errorMessage: string;
  /** Whether the error modal should be displayed */
  showErrorModal: boolean;
  /** Timestamp when parsing started (for performance tracking) */
  parseStartTime: number | null;
  /** Current phase of the parsing operation */
  parsingPhase: ParsingPhase;
}

/**
 * Union type representing all possible actions that can be dispatched
 * to the parsing state reducer. Each action type corresponds to a
 * specific state transition in the parsing workflow.
 */
export type ParsingAction = 
  | { type: 'START_PARSING'; payload: { startTime: number } }
  | { type: 'SET_PARSING_PHASE'; payload: { phase: ParsingPhase } }
  | { type: 'PARSING_SUCCESS' }
  | { type: 'PARSING_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_DESCRIPTION'; payload: { description: string } }
  | { type: 'CLOSE_ERROR_MODAL' }
  | { type: 'RESET_STATE' };

/**
 * Performance metrics interface for tracking parsing operation performance.
 * Used in development builds to monitor and optimize parsing performance.
 * 
 * @deprecated This interface will be removed in production builds as part
 * of the development code cleanup process.
 */
export interface ParsingPerformanceMetrics {
  /** Time spent preparing the API request (ms) */
  requestPreparationTime: number;
  /** Time spent on the actual API call (ms) */
  apiCallTime: number;
  /** Time spent processing the API response (ms) */
  responseProcessingTime: number;
  /** Time spent updating application state (ms) */
  stateUpdateTime: number;
  /** Total time for the entire parsing operation (ms) */
  totalTime: number;
  /** Memory usage statistics (optional, browser-dependent) */
  memoryUsage?: {
    /** Memory usage before parsing (bytes) */
    before: number;
    /** Memory usage after parsing (bytes) */
    after: number;
    /** Memory usage delta (bytes) */
    delta: number;
  };
}

/**
 * Performance timing markers for detailed performance analysis.
 * Used to track specific timing points throughout the parsing workflow.
 * 
 * @deprecated This interface will be removed in production builds as part
 * of the development code cleanup process.
 */
export interface PerformanceTimings {
  /** When the parsing operation started */
  startTime: number;
  /** When request preparation was completed */
  requestPreparedTime?: number;
  /** When the API call was initiated */
  apiCallStartTime?: number;
  /** When the API call completed */
  apiCallEndTime?: number;
  /** When response processing was completed */
  responseProcessedTime?: number;
  /** When state updates were completed */
  stateUpdatedTime?: number;
  /** When the entire operation finished */
  endTime?: number;
}

/**
 * Default values for parsed job data to ensure consistent fallback behavior
 * when parsing fails or returns incomplete data.
 */
export const DEFAULT_PARSED_DATA: ParsedJobData = {
  role: 'Unknown Role',
  company: 'Unknown Company',
  location: 'Not specified',
  experienceRequired: 'Not specified',
  skills: [],
  remote: false,
  notes: 'No additional notes'
} as const;

/**
 * Static configuration object for Cerebras API requests.
 * Optimized to avoid object recreation on each parsing operation.
 */
export const STATIC_REQUEST_CONFIG = {
  model: 'llama-4-scout-17b-16e-instruct',
  stream: false,
  max_completion_tokens: 2048,
  temperature: 0.2,
  top_p: 1,
  response_format: { type: "json_object" as const }
} as const;

/**
 * Pre-computed system prompt template for AI parsing requests.
 * Uses placeholder replacement for efficient prompt generation.
 */
export const SYSTEM_PROMPT_TEMPLATE = `Extract the following information from this job description and respond ONLY with a valid JSON object:

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
IMPORTANT: For the location field, strictly use the format "city, province/state" with no abbreviations (e.g., "Toronto, Ontario", not "Toronto, ON" or "Toronto, Canada").` as const;