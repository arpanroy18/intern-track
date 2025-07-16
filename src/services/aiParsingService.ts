/**
 * AI Parsing Service
 * 
 * This service handles all communication with the Cerebras AI API for job description parsing.
 * It provides a clean interface for parsing job descriptions while managing API client lifecycle,
 * request configuration, and error handling.
 */

import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { ParsedJobData, STATIC_REQUEST_CONFIG, SYSTEM_PROMPT_TEMPLATE, DEFAULT_PARSED_DATA } from '../types/aiParsing';

/**
 * Singleton Cerebras client instance to avoid recreation and optimize performance.
 * The client is lazily initialized on first use and reused for all subsequent requests.
 */
let cerebrasClient: Cerebras | null = null;

/**
 * Gets or creates the Cerebras client instance.
 * Uses singleton pattern to ensure efficient resource usage and avoid
 * unnecessary client recreations during the application lifecycle.
 * 
 * @returns The Cerebras client instance
 * @throws Error if the API key is not configured
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
 * Processes and validates the AI response content into structured job data.
 * Implements robust JSON parsing with fallback to default values to ensure
 * the application remains functional even when AI responses are malformed.
 * 
 * @param content - Raw response content from the AI service
 * @returns Parsed and validated job data
 */
function processResponse(content: string): ParsedJobData {
  try {
    // Direct JSON parsing without intermediate string operations for performance
    const rawData = JSON.parse(content);
    
    // Fast validation of API response structure - check essential fields exist
    if (typeof rawData !== 'object' || rawData === null) {
      throw new Error('Invalid response format: not an object');
    }
    
    // Create parsed data with direct property assignment and type validation
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
 * AI Parsing Service class that handles job description parsing using Cerebras AI.
 * Provides a clean, testable interface for AI-powered job data extraction with
 * proper error handling, abort signal support, and performance optimization.
 */
export class AIParsingService {
  /**
   * Parses a job description using AI and returns structured job data.
   * 
   * This method handles the complete parsing workflow:
   * - Validates input parameters
   * - Prepares the AI prompt with job description
   * - Makes the API request with optimized configuration
   * - Processes and validates the response
   * - Handles errors gracefully with fallback data
   * 
   * @param description - The job description text to parse
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise that resolves to parsed job data
   * @throws Error if the description is empty or API request fails critically
   */
  async parseJobDescription(description: string, signal?: AbortSignal): Promise<ParsedJobData> {
    // Input validation
    if (!description?.trim()) {
      throw new Error('Job description cannot be empty');
    }

    // Check if the request was already aborted
    if (signal?.aborted) {
      throw new Error('Request was aborted before starting');
    }

    try {
      // Get the optimized Cerebras client instance
      const cerebras = getCerebrasClient();

      // Pre-compute system prompt with efficient placeholder replacement
      const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace('{JOB_DESCRIPTION}', description);

      // Check for abort signal before making the API call
      if (signal?.aborted) {
        throw new Error('Request was aborted during preparation');
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
        throw new Error('Request was aborted during processing');
      }

      // Fast validation of API response structure before processing
      const content = (completionCreateResponse.choices as { message?: { content?: string } }[])?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from AI service');
      }

      // Process and validate the response content
      return processResponse(content);

    } catch (error) {
      // Handle abort errors specifically
      if (signal?.aborted || (error instanceof Error && error.message.includes('aborted'))) {
        throw new Error('Parsing request was cancelled');
      }

      // Handle API errors with context
      if (error instanceof Error) {
        throw new Error(`AI parsing failed: ${error.message}`);
      }

      // Handle unknown errors
      throw new Error('Unknown error occurred during AI parsing');
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