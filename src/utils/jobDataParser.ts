/**
 * Job Data Parser Utilities
 * 
 * This module provides utilities for parsing, validating, and transforming
 * AI-generated job data responses. It handles JSON parsing, data validation,
 * and conversion between different data formats used throughout the application.
 */

import { ParsedJobData, OptimizedFormData, DEFAULT_PARSED_DATA } from '../types/aiParsing';

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
 * Parses and validates a JSON response string from the AI service.
 * Handles malformed JSON, missing fields, and provides fallback data.
 * This function was moved from the AI service to centralize data processing logic.
 * 
 * @param content - The raw JSON string response from the AI service
 * @returns A validated ParsedJobData object with fallback values for invalid fields
 */
export function parseResponse(content: string): ParsedJobData {
  if (!content || typeof content !== 'string') {
    return DEFAULT_PARSED_DATA;
  }

  try {
    // Direct JSON parsing without intermediate string operations for performance
    const rawData = JSON.parse(content.trim());
    
    // Fast validation of API response structure - check essential fields exist
    if (typeof rawData !== 'object' || rawData === null) {
      return DEFAULT_PARSED_DATA;
    }
    
    // Create parsed data with direct property assignment and type validation
    // Use fallback values for any invalid or missing fields
    const parsedData: ParsedJobData = {
      role: typeof rawData.role === 'string' && rawData.role.trim() ? rawData.role.trim() : DEFAULT_PARSED_DATA.role,
      company: typeof rawData.company === 'string' && rawData.company.trim() ? rawData.company.trim() : DEFAULT_PARSED_DATA.company,
      location: typeof rawData.location === 'string' && rawData.location.trim() ? rawData.location.trim() : DEFAULT_PARSED_DATA.location,
      experienceRequired: typeof rawData.experienceRequired === 'string' ? rawData.experienceRequired.trim() || DEFAULT_PARSED_DATA.experienceRequired : DEFAULT_PARSED_DATA.experienceRequired,
      skills: Array.isArray(rawData.skills) ? 
        rawData.skills
          .filter((skill: unknown): skill is string => typeof skill === 'string' && skill.trim().length > 0)
          .map((skill: string) => skill.trim())
          .slice(0, 6) // Limit to maximum 6 skills as per business rules
        : DEFAULT_PARSED_DATA.skills,
      remote: typeof rawData.remote === 'boolean' ? rawData.remote : DEFAULT_PARSED_DATA.remote,
      notes: typeof rawData.notes === 'string' ? rawData.notes.trim() || DEFAULT_PARSED_DATA.notes : DEFAULT_PARSED_DATA.notes
    };
    
    return parsedData;
    
  } catch (parseError) {
    // Attempt to extract JSON from potentially malformed response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const extractedData = JSON.parse(jsonMatch[0]);
        if (typeof extractedData === 'object' && extractedData !== null) {
          // Recursively call parseResponse with the extracted JSON
          return parseResponse(JSON.stringify(extractedData));
        }
      } catch (extractError) {
        // Silent fallback - no logging needed in production
      }
    }
    
    // Final fallback to default data to maintain functionality
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