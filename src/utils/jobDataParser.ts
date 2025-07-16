/**
 * Job Data Parser Utilities
 * 
 * This module provides utilities for parsing, validating, and transforming
 * AI-generated job data responses. It handles JSON parsing, data validation,
 * and conversion between different data formats used throughout the application.
 */

import { ParsedJobData, OptimizedFormData, DEFAULT_PARSED_DATA } from '../types/aiParsing';

/**
 * Production-focused logging utility for data parsing operations and fallback scenarios.
 * 
 * Designed to provide monitoring insights without impacting runtime performance.
 * The logger captures critical parsing events that inform system health and
 * help identify patterns in AI response quality and recovery effectiveness.
 * 
 * **Logging Strategy:**
 * - Uses structured JSON output for monitoring system integration
 * - Includes contextual metadata for debugging without sensitive data exposure
 * - Timestamps all events for temporal analysis and alerting
 * - Categorizes events for appropriate log level routing
 * @internal
 */
class DataParsingLogger {
  /**
   * Logs parsing fallback events for system monitoring and quality analysis.
   * 
   * These events indicate when the primary parsing strategy failed and the system
   * fell back to default values. 
   * 
   * @param reason - Specific reason for the fallback (e.g., 'json_parse_error', 'empty_content')
   * @param context - Additional contextual information for debugging and analysis
   * 
   * @example
   * ```typescript
   * DataParsingLogger.logParsingFallback('malformed_json', {
   *   contentLength: response.length,
   *   hasExpectedFields: false
   * });
   * ```
   */
  static logParsingFallback(reason: string, context?: Record<string, unknown>): void {
    const logData = {
      event: 'parsing_fallback',
      reason,
      timestamp: new Date().toISOString(),
      context
    };
    
    // Use console.warn for production fallback logging
    console.warn('[Data Parsing Fallback]', logData);
  }

  /**
   * Logs successful parsing recovery events for system resilience monitoring.
   * @param method - The recovery method that succeeded (e.g., 'json_extraction', 'content_cleaning')
   * @param context - Additional context about the recovery operation
   * 
   * @example
   * ```typescript
   * DataParsingLogger.logParsingRecovery('json_object_extraction', {
   *   originalLength: malformedContent.length,
   *   extractedLength: cleanContent.length
   * });
   * ```
   */
  static logParsingRecovery(method: string, context?: Record<string, unknown>): void {
    const logData = {
      event: 'parsing_recovery',
      method,
      timestamp: new Date().toISOString(),
      context
    };
    
    console.info('[Data Parsing Recovery]', logData);
  }
}

/**
 * Type guard to validate if an unknown object conforms to the ParsedJobData interface.
 * Performs comprehensive validation of all required fields and their types.
 * 
 * @param data - The unknown data to validate
 * @returns True if the data is a valid ParsedJobData object, false otherwise
 */
export function isValidParsedJobData(data: unknown): data is ParsedJobData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Validate required string fields
  if (typeof obj.role !== 'string' || obj.role.trim().length === 0) {
    return false;
  }
  if (typeof obj.company !== 'string' || obj.company.trim().length === 0) {
    return false;
  }
  if (typeof obj.location !== 'string' || obj.location.trim().length === 0) {
    return false;
  }
  if (typeof obj.experienceRequired !== 'string') {
    return false;
  }
  if (typeof obj.notes !== 'string') {
    return false;
  }

  // Validate boolean field
  if (typeof obj.remote !== 'boolean') {
    return false;
  }

  // Validate skills array
  if (!Array.isArray(obj.skills)) {
    return false;
  }
  
  // Ensure all skills are strings
  if (!obj.skills.every(skill => typeof skill === 'string')) {
    return false;
  }

  return true;
}

/**
 * Sanitizes and normalizes a ParsedJobData object to ensure data consistency.
 * Trims whitespace, handles empty values, and applies business rules.
 * 
 * @param data - The parsed job data to sanitize
 * @returns A sanitized ParsedJobData object
 */
export function sanitizeParsedJobData(data: ParsedJobData): ParsedJobData {
  return {
    role: data.role.trim() || DEFAULT_PARSED_DATA.role,
    company: data.company.trim() || DEFAULT_PARSED_DATA.company,
    location: data.location.trim() || DEFAULT_PARSED_DATA.location,
    experienceRequired: data.experienceRequired.trim() || DEFAULT_PARSED_DATA.experienceRequired,
    skills: data.skills
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .slice(0, 6), // Limit to maximum 6 skills as per business rules
    remote: data.remote,
    notes: data.notes.trim() || DEFAULT_PARSED_DATA.notes
  };
}

/**
 * Parses and validates AI service responses with multi-layer fallback strategies.
 * 
 * This function implements a sophisticated parsing pipeline designed to handle the inherent
 * unpredictability of AI-generated content. The approach prioritizes data extraction over
 * strict validation, ensuring the application remains functional even with imperfect AI responses.
 * 
 * @param content - Raw string response from AI service (may be malformed JSON)
 * @returns Validated ParsedJobData object with fallback values for any invalid/missing fields
 * 
 * @example
 * ```typescript
 * // Handles various response formats:
 * parseResponse('{"role":"Engineer",...}'); // Clean JSON
 * parseResponse('Here is the data: {"role":"Engineer",...}'); // Embedded JSON
 * parseResponse('[{"role":"Engineer",...}]'); // Array format
 * parseResponse('corrupted{"role":"Engineer'); // Malformed/truncated
 * ```
 */
export function parseResponse(content: string): ParsedJobData {
  if (!content || typeof content !== 'string') {
    DataParsingLogger.logParsingFallback('empty_or_invalid_content', { 
      contentType: typeof content,
      contentLength: content?.length || 0
    });
    return DEFAULT_PARSED_DATA;
  }

  try {
    // Primary parsing strategy: Direct JSON parsing for optimal performance
    // We trim whitespace as AI responses often have leading/trailing spaces
    const rawData = JSON.parse(content.trim());
    
    // Fail-fast validation: Ensure we received an object structure
    // This prevents downstream errors when accessing properties
    if (typeof rawData !== 'object' || rawData === null) {
      return DEFAULT_PARSED_DATA;
    }
    
    // Defensive data extraction with fallback values for each field
    // This approach ensures we can extract partial data even from incomplete AI responses
    const parsedData: ParsedJobData = {
      // Role: Core identifier for the job position, must be non-empty string
      role: typeof rawData.role === 'string' && rawData.role.trim() ? 
        rawData.role.trim() : DEFAULT_PARSED_DATA.role,
      
      // Company: Critical for job identification, fallback to unknown if missing
      company: typeof rawData.company === 'string' && rawData.company.trim() ? 
        rawData.company.trim() : DEFAULT_PARSED_DATA.company,
      
      // Location: Important for filtering, standardized format expected
      location: typeof rawData.location === 'string' && rawData.location.trim() ? 
        rawData.location.trim() : DEFAULT_PARSED_DATA.location,
      
      // Experience: Can be empty string, so we only check type and provide fallback
      experienceRequired: typeof rawData.experienceRequired === 'string' ? 
        rawData.experienceRequired.trim() || DEFAULT_PARSED_DATA.experienceRequired : 
        DEFAULT_PARSED_DATA.experienceRequired,
      
      // Skills: Complex array processing with business rule enforcement
      skills: Array.isArray(rawData.skills) ? 
        rawData.skills
          .filter((skill: unknown): skill is string => 
            typeof skill === 'string' && skill.trim().length > 0) // Remove invalid entries
          .map((skill: string) => skill.trim()) // Normalize whitespace
          .slice(0, 6) // Business rule: Maximum 6 skills to prevent UI overflow
        : DEFAULT_PARSED_DATA.skills,
      
      // Remote: Boolean flag with strict type checking for reliability
      remote: typeof rawData.remote === 'boolean' ? rawData.remote : DEFAULT_PARSED_DATA.remote,
      
      // Notes: Comprehensive job details, can be empty but should be string
      notes: typeof rawData.notes === 'string' ? 
        rawData.notes.trim() || DEFAULT_PARSED_DATA.notes : DEFAULT_PARSED_DATA.notes
    };
    
    return parsedData;
    
  } catch (parseError) {
    DataParsingLogger.logParsingFallback('json_parse_error', {
      contentLength: content.length,
      errorMessage: parseError instanceof Error ? parseError.message : 'unknown'
    });

    // Enhanced recovery strategies for malformed JSON
    
    // Strategy 1: Extract JSON object from response
    const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const extractedData = JSON.parse(jsonObjectMatch[0]);
        if (typeof extractedData === 'object' && extractedData !== null) {
          DataParsingLogger.logParsingRecovery('json_object_extraction');
          return parseResponse(JSON.stringify(extractedData));
        }
      } catch (extractError) {
        // Continue to next strategy
      }
    }

    // Strategy 2: Extract JSON array if object fails
    const jsonArrayMatch = content.match(/\[[\s\S]*]/);
    if (jsonArrayMatch) {
      try {
        const extractedArray = JSON.parse(jsonArrayMatch[0]);
        if (Array.isArray(extractedArray) && extractedArray.length > 0) {
          // Use first element if it's an object
          const firstElement = extractedArray[0];
          if (typeof firstElement === 'object' && firstElement !== null) {
            DataParsingLogger.logParsingRecovery('json_array_extraction');
            return parseResponse(JSON.stringify(firstElement));
          }
        }
      } catch (extractError) {
        // Continue to next strategy
      }
    }

    // Strategy 3: Attempt to clean and parse common formatting issues
    const cleanedContent = content
      .replace(/^[^{[]*/, '') // Remove leading non-JSON characters
      .replace(/[^}]]*$/, '') // Remove trailing non-JSON characters
      .replace(/\n|\r/g, ' ') // Replace newlines with spaces
      .trim();
    
    if (cleanedContent && cleanedContent !== content) {
      try {
        const cleanedData = JSON.parse(cleanedContent);
        if (typeof cleanedData === 'object' && cleanedData !== null) {
          DataParsingLogger.logParsingRecovery('content_cleaning');
          return parseResponse(JSON.stringify(cleanedData));
        }
      } catch (cleanError) {
        // Continue to fallback
      }
    }
    
    // Final fallback with comprehensive logging
    DataParsingLogger.logParsingFallback('all_recovery_strategies_failed', {
      contentPreview: content.substring(0, 200),
      originalError: parseError instanceof Error ? parseError.message : 'unknown'
    });
    
    return DEFAULT_PARSED_DATA;
  }
}

/**
 * Maps parsed job data to form-ready data structure with optimized performance.
 * Converts skills array to comma-separated string and adds form-specific fields.
 * 
 * @param parsedData - The validated ParsedJobData object
 * @param folderId - The folder ID where the job application should be stored
 * @returns An OptimizedFormData object ready for form submission
 */
export function mapResponseToFormData(parsedData: ParsedJobData, folderId: string): OptimizedFormData {
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

/**
 * Validates that a form data object contains all required fields.
 * Used to ensure data integrity before form submission.
 * 
 * @param formData - The form data object to validate
 * @returns True if all required fields are present and valid, false otherwise
 */
export function isValidFormData(formData: unknown): formData is OptimizedFormData {
  if (!formData || typeof formData !== 'object') {
    return false;
  }

  const obj = formData as Record<string, unknown>;

  // Validate required string fields
  const requiredStringFields = ['role', 'company', 'location', 'experienceRequired', 'skills', 'notes', 'folderId', 'jobPostingUrl'];
  for (const field of requiredStringFields) {
    if (typeof obj[field] !== 'string') {
      return false;
    }
  }

  // Validate boolean field
  if (typeof obj.remote !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * Creates a deep copy of parsed job data to prevent mutation issues.
 * Useful when the same data needs to be used in multiple contexts.
 * 
 * @param data - The ParsedJobData object to clone
 * @returns A deep copy of the input data
 */
export function cloneParsedJobData(data: ParsedJobData): ParsedJobData {
  return {
    role: data.role,
    company: data.company,
    location: data.location,
    experienceRequired: data.experienceRequired,
    skills: [...data.skills], // Create new array to prevent mutation
    remote: data.remote,
    notes: data.notes
  };
}

/**
 * Merges parsed job data with partial updates, maintaining data integrity.
 * Useful for updating specific fields while preserving the rest of the data.
 * 
 * @param baseData - The base ParsedJobData object
 * @param updates - Partial updates to apply
 * @returns A new ParsedJobData object with updates applied
 */
export function mergeParsedJobData(baseData: ParsedJobData, updates: Partial<ParsedJobData>): ParsedJobData {
  const merged = {
    ...baseData,
    ...updates
  };

  // Ensure skills array is properly handled
  if (updates.skills) {
    merged.skills = [...updates.skills];
  }

  return sanitizeParsedJobData(merged);
}