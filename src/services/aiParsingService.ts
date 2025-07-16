/**
 * AI Parsing Service
 * 
 * This service handles all communication with the Cerebras AI API for job description parsing.
 * It provides a clean interface for parsing job descriptions while managing API client lifecycle,
 * request configuration, and error handling.
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { ParsedJobData, STATIC_REQUEST_CONFIG, SYSTEM_PROMPT_TEMPLATE } from '../types/aiParsing';
import { parseResponse } from '../utils/jobDataParser';

/**
 * Enumeration of error types for production-grade error handling and classification.
 * Used to categorize different failure modes in AI parsing operations for appropriate
 * handling strategies, user messaging, and monitoring/alerting systems.
 * 
 * @public
 * @example
 * ```typescript
 * if (error.type === ParseError.NETWORK_ERROR) {
 *   // Implement retry strategy
 * } else if (error.type === ParseError.VALIDATION_ERROR) {
 *   // Fall back to defaults
 * }
 * ```
 */
export enum ParseError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ABORT_ERROR = 'ABORT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Enhanced error class that provides structured error handling with rich context information.
 * Extends the native Error class to include error classification, original error chaining,
 * and contextual metadata for debugging and monitoring purposes.
 * 
 * This design enables:
 * - Systematic error classification for appropriate handling strategies
 * - Error context preservation for debugging without performance impact
 * - Structured logging compatible with monitoring and alerting systems
 * - Error recovery patterns based on error type
 * 
 * @public
 * @example
 * ```typescript
 * try {
 *   await parseJobDescription(description);
 * } catch (error) {
 *   if (error instanceof AIParsingError) {
 *     console.error('Parsing failed:', error.type, error.context);
 *   }
 * }
 * ```
 */
export class AIParsingError extends Error {
  constructor(
    public readonly type: ParseError,
    message: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIParsingError';
  }
}

/**
 * Production-appropriate error logger designed for minimal performance impact.
 * Provides structured logging that integrates with monitoring systems while
 * avoiding debug overhead in production environments.
 * 
 * Design principles:
 * - Structured JSON output for monitoring system consumption
 * - Minimal runtime overhead through static methods
 * - Context-rich logging without exposing sensitive information
 * - Compatible with standard logging aggregation tools
 * 
 * @internal
 */
class ErrorLogger {
  /**
   * Logs structured error information for production monitoring and debugging.
   * Combines error classification with contextual metadata to provide actionable
   * insights for system monitoring and troubleshooting.
   * 
   * @param error - The AIParsingError instance containing classified error information
   * @param additionalContext - Optional additional context specific to the error occurrence
   * 
   * @example
   * ```typescript
   * ErrorLogger.logError(aiParsingError, { 
   *   userId: 'user123', 
   *   jobDescriptionLength: 1500 
   * });
   * ```
   */
  static logError(error: AIParsingError, additionalContext?: Record<string, unknown>): void {
    // In production, we log structured error data for monitoring systems
    const errorData = {
      type: error.type,
      message: error.message,
      timestamp: new Date().toISOString(),
      context: { ...error.context, ...additionalContext }
    };
    
    // Use console.error for production error logging (picked up by monitoring)
    console.error('[AI Parsing Error]', errorData);
  }
}

/**
 * Determines whether an error represents a transient failure that should be retried.
 * Uses error classification to distinguish between permanent failures (validation, configuration)
 * and temporary issues (network, API availability) that may resolve on retry.
 * 
 * This function is crucial for implementing intelligent retry strategies that avoid
 * wasting resources on non-recoverable errors while providing resilience for transient issues.
 * 
 * @param error - The classified AI parsing error to evaluate
 * @returns True if the error represents a transient failure suitable for retry
 * 
 * @example
 * ```typescript
 * if (isRetryableError(error) && attemptCount < maxRetries) {
 *   // Implement exponential backoff and retry
 * } else {
 *   // Handle as permanent failure
 * }
 * ```
 */
function isRetryableError(error: AIParsingError): boolean {
  return error.type === ParseError.NETWORK_ERROR || 
         error.type === ParseError.API_ERROR;
}

/**
 * Creates a promise-based delay for implementing exponential backoff in retry logic.
 * Used to space out retry attempts to avoid overwhelming services and to allow
 * transient issues time to resolve.
 * 
 * @param ms - The delay duration in milliseconds
 * @returns Promise that resolves after the specified delay
 * 
 * @example
 * ```typescript
 * // Exponential backoff: 1s, 2s, 4s
 * const delayMs = Math.pow(2, attemptNumber) * 1000;
 * await delay(delayMs);
 * ```
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Singleton Cerebras client instance to avoid recreation and optimize performance.
 * The client is lazily initialized on first use and reused for all subsequent requests.
 */
let cerebrasClient: Cerebras | null = null;

/**
 * Gets or creates the singleton Cerebras client instance with lazy initialization.
 * 
 * Implements the singleton pattern to optimize resource usage by reusing a single
 * client instance across all parsing operations. This approach provides several benefits:
 * - Reduces memory footprint by avoiding duplicate client instances
 * - Maintains connection pooling and client-side optimizations
 * - Ensures consistent configuration across all API calls
 * - Lazy initialization delays client creation until first use
 * 
 * @returns The configured Cerebras client instance ready for API calls
 * @throws {AIParsingError} If the API key environment variable is not configured
 * 
 * @example
 * ```typescript
 * const client = getCerebrasClient();
 * const response = await client.chat.completions.create(params);
 * ```
 */
function getCerebrasClient(): Cerebras {
  if (!cerebrasClient) {
    const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY;
    if (!apiKey) {
      throw new Error('Cerebras API key is not configured. Please set VITE_CEREBRAS_API_KEY environment variable.');
    }
    
    cerebrasClient = new Cerebras({
      apiKey
    });
  }
  return cerebrasClient;
}



/**
 * Production-grade AI parsing service for extracting structured job data from unstructured descriptions.
 * 
 * This service encapsulates all AI-related functionality and provides a clean, testable interface
 * for job description parsing. It implements enterprise patterns including:
 * 
 * 
 * @public
 * @example
 * ```typescript
 * const service = new AIParsingService();
 * 
 * try {
 *   const jobData = await service.parseJobDescription(
 *     'Software Engineer at Tech Corp...', 
 *     abortSignal
 *   );
 *   console.log('Parsed job:', jobData);
 * } catch (error) {
 *   if (error instanceof AIParsingError) {
 *     handleClassifiedError(error);
 *   }
 * }
 * ```
 */
export class AIParsingService {
  /**
   * Parses a job description using AI with retry logic and comprehensive error handling.
   * 
   * This method handles the complete parsing workflow:
   * - Validates input parameters
   * - Implements retry logic for transient failures
   * - Prepares the AI prompt with job description
   * - Makes the API request with optimized configuration
   * - Processes and validates the response
   * - Handles errors gracefully with structured error reporting
   * 
   * @param description - The job description text to parse
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise that resolves to parsed job data
   * @throws AIParsingError with detailed error classification and context
   */
  async parseJobDescription(
    description: string, 
    signal?: AbortSignal
  ): Promise<ParsedJobData> {
    return this.parseWithRetry(description, signal, 2);
  }

  /**
   * Internal implementation of parsing logic with intelligent retry mechanism.
   * 
   * **Error Classification:**
   * Each error is analyzed and classified to determine the appropriate response:
   * - NETWORK_ERROR, API_ERROR: Retryable with backoff
   * - VALIDATION_ERROR, CONFIGURATION_ERROR: Immediate failure
   * - ABORT_ERROR: Immediate termination
   * 
   * @param description - The job description text to parse
   * @param signal - Optional AbortSignal for request cancellation
   * @param maxRetries - Maximum number of retry attempts for transient failures
   * @returns Promise resolving to structured job data
   * @throws {AIParsingError} Classified error with context for appropriate handling
   * 
   * @internal
   */
  private async parseWithRetry(
    description: string,
    signal: AbortSignal | undefined,
    maxRetries: number
  ): Promise<ParsedJobData> {
    // Input validation with structured error handling
    if (!description?.trim()) {
      const validationError = new AIParsingError(
        ParseError.VALIDATION_ERROR,
        'Job description cannot be empty',
        undefined,
        { descriptionLength: description?.length || 0 }
      );
      ErrorLogger.logError(validationError);
      throw validationError;
    }

    // Check if the request was already aborted
    if (signal?.aborted) {
      const abortError = new AIParsingError(
        ParseError.ABORT_ERROR,
        'Request was aborted before starting'
      );
      throw abortError;
    }

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeParsing(description, signal, attempt);
      } catch (error) {
        // Don't retry if request was aborted or if it's the last attempt
        if (error instanceof AIParsingError && 
           (error.type === ParseError.ABORT_ERROR || 
            attempt === maxRetries || 
            !isRetryableError(error))) {
          throw error;
        }

        // Add delay before retry with exponential backoff
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          await delay(delayMs);
        }
      }
    }

    // This should never be reached, but included for type safety
    throw new AIParsingError(
      ParseError.UNKNOWN_ERROR,
      'Parsing failed after all retry attempts'
    );
  }

  /**
   * Executes a single parsing attempt with comprehensive error handling and monitoring.
   * 
   * This method handles the core parsing workflow:
   * Each error includes contextual information for debugging:
   * - Attempt number for retry analysis
   * - Content length for payload analysis
   * - Response structure for API issue diagnosis
   * 
   * @param description - The job description text to parse
   * @param signal - Optional AbortSignal for request cancellation
   * @param attempt - Current attempt number (0-based) for context and logging
   * @returns Promise resolving to validated and structured job data
   * @throws {AIParsingError} Classified error with rich context for debugging
   * 
   * @internal
   */
  private async executeParsing(
    description: string,
    signal?: AbortSignal,
    attempt: number = 0
  ): Promise<ParsedJobData> {

    try {
      // Get the optimized Cerebras client instance
      const cerebras = getCerebrasClient();

      // Pre-compute system prompt with efficient placeholder replacement
      const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{JOB_DESCRIPTION}', description);

      // Check for abort signal before making the API call
      if (signal?.aborted) {
        throw new AIParsingError(
          ParseError.ABORT_ERROR,
          'Request was aborted during preparation'
        );
      }

      // Make the API request with static configuration for optimal performance
      const completionCreateResponse = await cerebras.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: description
          }
        ],
        // Use static request configuration object to avoid recreation on each parsing call
        ...STATIC_REQUEST_CONFIG
      });

      // Check for abort signal after API call
      if (signal?.aborted) {
        throw new AIParsingError(
          ParseError.ABORT_ERROR,
          'Request was aborted during processing'
        );
      }

      // Fast validation of API response structure before processing
      const content = (completionCreateResponse.choices as { message?: { content?: string } }[])?.[0]?.message?.content;
      
      if (!content) {
        throw new AIParsingError(
          ParseError.API_ERROR,
          'No response content from AI service',
          undefined,
          { attempt, responseStructure: 'missing_content' }
        );
      }

      // Process and validate the response content with enhanced error context
      try {
        return parseResponse(content);
      } catch (parseError) {
        throw new AIParsingError(
          ParseError.VALIDATION_ERROR,
          'Failed to parse AI response content',
          parseError instanceof Error ? parseError : undefined,
          { attempt, contentLength: content.length }
        );
      }

    } catch (error) {
      // Enhanced error handling with proper classification and context
      const context = {
        descriptionLength: description.length,
        hasAbortSignal: !!signal,
        wasAborted: signal?.aborted
      };

      // Handle abort errors specifically
      if (signal?.aborted || (error instanceof Error && error.message.includes('aborted'))) {
        const abortError = new AIParsingError(
          ParseError.ABORT_ERROR,
          'Parsing request was cancelled',
          error instanceof Error ? error : undefined,
          context
        );
        ErrorLogger.logError(abortError);
        throw abortError;
      }

      // Handle network/API errors
      if (error instanceof Error) {
        // Classify error type based on error characteristics
        let errorType = ParseError.API_ERROR;
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorType = ParseError.NETWORK_ERROR;
        } else if (error.message.includes('API key') || error.message.includes('configuration')) {
          errorType = ParseError.CONFIGURATION_ERROR;
        }

        const apiError = new AIParsingError(
          errorType,
          `AI parsing failed: ${error.message}`,
          error,
          context
        );
        ErrorLogger.logError(apiError);
        throw apiError;
      }

      // Handle unknown errors
      const unknownError = new AIParsingError(
        ParseError.UNKNOWN_ERROR,
        'Unknown error occurred during AI parsing',
        undefined,
        context
      );
      ErrorLogger.logError(unknownError);
      throw unknownError;
    }
  }
}

/**
 * Default singleton instance of the AI parsing service.
 * Export a single instance to maintain consistency and avoid unnecessary instantiation.
 */
export const aiParsingService = new AIParsingService();

/**
 * Export the getCerebrasClient function for testing purposes.
 * This allows tests to verify client initialization and configuration.
 */
export { getCerebrasClient };