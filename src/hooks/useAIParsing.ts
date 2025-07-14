import React, { useState, useCallback } from 'react';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { Folder as FolderType } from '../types';

export function useAIParsing(
    setFormData: React.Dispatch<React.SetStateAction<any>>,
    setShowAIParseModal: (show: boolean) => void,
    setShowAddModal: (show: boolean) => void,
    setIsFromAIParse: (isFromAI: boolean) => void,
    selectedFolder: FolderType | null
) {
    const [jobDescription, setJobDescription] = useState<string>('');
    const [isParsingAI, setIsParsingAI] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [showErrorModal, setShowErrorModal] = useState<boolean>(false);

    const handleAIParseJob = useCallback(async () => {
        if (!jobDescription.trim()) return;

        setIsParsingAI(true);
        try {
            const cerebras = new Cerebras({
                apiKey: import.meta.env.VITE_CEREBRAS_API_KEY
            });

            const completionCreateResponse = await cerebras.chat.completions.create({
                messages: [
                    {
                        "role": "system",
                        "content": `Extract the following information from this job description and respond ONLY with a valid JSON object:

Job Description:
${jobDescription}

Extract these fields:
– role (only the core, standardized job title as it would appear in an HR system, stripping away levels, seniority, numbering, seasons, dates, or extra details; e.g., return “Software Engineer” instead of “Software Engineer I” or “Principal Associate, Software Engineer”, and “Software Developer” instead of “Software Developer (Fall 2025)”)
- company (company name)
- location (job location in the format "city, province/state" with no abbreviations, e.g., "Toronto, Ontario")
- experienceRequired (years of experience required, otherwise "Not specified")
- skills (array of key skills mentioned, maximum 6)
- remote (boolean - true if remote work is mentioned)
- notes (comprehensive summary that captures ALL important information including responsibilities, requirements, nice-to-haves, benefits, and any other relevant details. Be thorough but concise)

IMPORTANT: Your response MUST be ONLY a valid JSON object. DO NOT include any other text, backticks, or markdown formatting.
IMPORTANT: For the location field, strictly use the format "city, province/state" with no abbreviations (e.g., "Toronto, Ontario", not "Toronto, ON" or "Toronto, Canada").`
                    },
                    {
                        "role": "user",
                        "content": jobDescription
                    }
                ],
                model: 'llama-4-scout-17b-16e-instruct',
                stream: false,
                max_completion_tokens: 2048,
                temperature: 0.2,
                top_p: 1,
                response_format: { type: "json_object" }
            });
            
            const content = (completionCreateResponse.choices as { message?: { content?: string } }[])?.[0]?.message?.content;
            
            if (!content) {
                throw new Error('No response from AI service');
            }

            const parsedData = JSON.parse(content);
            
            setFormData({
                role: parsedData.role || 'Unknown Role',
                company: parsedData.company || 'Unknown Company',
                location: parsedData.location || 'Not specified',
                experienceRequired: parsedData.experienceRequired || 'Not specified',
                skills: Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : '',
                remote: parsedData.remote || false,
                notes: parsedData.notes || 'No additional notes',
                folderId: selectedFolder?.id || ''
            });
            
            setShowAIParseModal(false);
            setIsFromAIParse(true);
            setShowAddModal(true);
            setJobDescription('');
            
        } catch (error) {
            console.error('❌ Error parsing job with AI:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
            setErrorMessage(`Failed to parse job description: ${errorMsg}`);
            setShowErrorModal(true);
        } finally {
            setIsParsingAI(false);
        }
    }, [jobDescription, selectedFolder, setFormData, setIsFromAIParse, setShowAIParseModal, setShowAddModal]);

    return {
        jobDescription,
        setJobDescription,
        isParsingAI,
        handleAIParseJob,
        errorMessage,
        showErrorModal,
        setShowErrorModal
    };
}
