/**
 * Comprehensive type definitions for AI-powered job description parsing.
 * 
 * This module centralizes all types, interfaces, and constants related to the AI parsing
 * workflow, providing a single source of truth for type safety across the application.
 * The types are designed to support the complete data flow from raw job descriptions
 * through AI processing to structured form data ready for database storage.
 * 
 */

/**
 * Core data structure representing AI-extracted job information.
 * 
 * This interface defines the canonical structure for job data extracted from
 * unstructured text by AI services. It serves as the bridge between AI output
 * and application data models, ensuring consistency and type safety.
 *
 * @example
 * ```typescript
 * const jobData: ParsedJobData = {
 *   role: "Software Engineer",
 *   company: "Tech Corp", 
 *   location: "San Francisco, California",
 *   experienceRequired: "3-5 years",
 *   skills: ["JavaScript", "React", "Node.js"],
 *   remote: true,
 *   notes: "Exciting opportunity to work on cutting-edge technology..."
 * };
 * ```
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
 * Form-optimized data structure for seamless UI integration.
 * 
 * This interface transforms ParsedJobData into a format specifically designed
 * for form components and database operations. It handles the impedance mismatch
 * between AI-generated structured data and UI form requirements.
 *
 * @example
 * ```typescript
 * const formData: OptimizedFormData = {
 *   role: "Software Engineer",
 *   company: "Tech Corp",
 *   location: "San Francisco, California", 
 *   experienceRequired: "3-5 years",
 *   skills: "JavaScript, React, Node.js", // Note: comma-separated string
 *   remote: true,
 *   notes: "Exciting opportunity...",
 *   folderId: "fall-2024-internships",
 *   jobPostingUrl: "" // User will complete this
 * };
 * ```
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
 * Enumeration of AI parsing operation phases for granular UI feedback.
 * 
 * This type enables sophisticated progress indication during potentially long-running
 * AI operations, providing users with clear feedback about operation status and
 * estimated completion time.
 * 
 * **Phase Definitions:**
 * - **idle:** No active parsing operation, ready for new requests
 * - **starting:** Initial setup and validation, typically <100ms
 * - **processing:** Active AI service communication, typically 2-5 seconds
 * - **completing:** Data transformation and form population, typically <500ms
 *
 * @example
 * ```typescript
 * function ParsingProgress({ phase }: { phase: ParsingPhase }) {
 *   const messages = {
 *     idle: "Ready to parse",
 *     starting: "Preparing request...", 
 *     processing: "AI is analyzing the job description...",
 *     completing: "Finalizing job details..."
 *   };
 *   return <div>{messages[phase]}</div>;
 * }
 * ```
 */
export type ParsingPhase = 'idle' | 'starting' | 'processing' | 'completing';

/**
 * Comprehensive state interface for AI parsing workflow management.
 * 
 * This interface consolidates all parsing-related state into a cohesive structure
 * optimized for useReducer state management. The design prioritizes performance,
 * type safety, and maintainability.
 * 
 * @example
 * ```typescript
 * // Typical state progression during successful parsing:
 * const states = [
 *   { jobDescription: "...", isParsingAI: false, parsingPhase: "idle" },
 *   { jobDescription: "...", isParsingAI: true, parsingPhase: "starting" },
 *   { jobDescription: "...", isParsingAI: true, parsingPhase: "processing" },
 *   { jobDescription: "...", isParsingAI: true, parsingPhase: "completing" },
 *   { jobDescription: "", isParsingAI: false, parsingPhase: "idle" }
 * ];
 * ```
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
  /** Current phase of the parsing operation */
  parsingPhase: ParsingPhase;
}

/**
 * Union type representing all possible actions that can be dispatched
 * to the parsing state reducer. Each action type corresponds to a
 * specific state transition in the parsing workflow.
 */
export type ParsingAction = 
  | { type: 'START_PARSING' }
  | { type: 'SET_PARSING_PHASE'; payload: { phase: ParsingPhase } }
  | { type: 'PARSING_SUCCESS' }
  | { type: 'PARSING_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_DESCRIPTION'; payload: { description: string } }
  | { type: 'CLOSE_ERROR_MODAL' }
  | { type: 'RESET_STATE' };


/**
 * Default fallback values ensuring graceful degradation during parsing failures.
 * 
 * This constant provides a complete, valid ParsedJobData structure that serves as
 * a fallback when AI parsing fails or returns incomplete data. The values are
 * carefully chosen to:
 * 
 * @example
 * ```typescript
 * // When parsing fails, this ensures forms remain functional:
 * try {
 *   return await parseAIResponse(content);
 * } catch (error) {
 *   return DEFAULT_PARSED_DATA; // User can manually edit
 * }
 * ```
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