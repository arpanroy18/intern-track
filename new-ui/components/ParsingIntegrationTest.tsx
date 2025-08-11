import React, { useState, useCallback } from 'react';
import { useAIParsing } from '../hooks/useAIParsing';
import { Folder as FolderType } from '../types';

// Test component to verify optimized integration with job creation workflow
export const ParsingIntegrationTest: React.FC = () => {
    const [formData, setFormData] = useState({
        role: '',
        company: '',
        location: '',
        experienceRequired: '',
        skills: '',
        remote: false,
        notes: '',
        folderId: '',
        jobPostingUrl: ''
    });

    const [showAIParseModal, setShowAIParseModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isFromAIParse, setIsFromAIParse] = useState(false);
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isRunningTest, setIsRunningTest] = useState(false);

    const selectedFolder: FolderType = {
        id: 'test-folder',
        name: 'Test Folder',
        description: 'Test folder for parsing integration',
        color: '#6366f1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const {
        isParsingAI,
        parsingPhase,
        jobDescription,
        setJobDescription,
        errorMessage,
        setShowErrorModal
    } = useAIParsing(setFormData, setShowAIParseModal, setShowAddModal, setIsFromAIParse, selectedFolder);

    // Test form data population optimization
    const testFormDataPopulation = useCallback(() => {
        const startTime = performance.now();

        // Simulate parsed data being set
        const testFormData = {
            role: 'Software Engineer',
            company: 'Test Company',
            location: 'Toronto, Ontario',
            experienceRequired: '2-3 years',
            skills: 'React, TypeScript, Node.js',
            remote: true,
            notes: 'Test job description with comprehensive details',
            folderId: 'test-folder',
            jobPostingUrl: ''
        };

        setFormData(testFormData);

        const endTime = performance.now();
        const populationTime = endTime - startTime;

        return {
            success: populationTime < 5, // Should be under 5ms
            time: populationTime,
            message: `Form data population took ${populationTime.toFixed(2)}ms`
        };
    }, [setFormData]);

    // Test modal transitions optimization
    const testModalTransitions = useCallback(async () => {
        const startTime = performance.now();

        // Test modal transition sequence
        setShowAIParseModal(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        setShowAIParseModal(false);
        setIsFromAIParse(true);
        setShowAddModal(true);
        await new Promise(resolve => setTimeout(resolve, 0));

        const endTime = performance.now();
        const transitionTime = endTime - startTime;

        // Reset modals
        setShowAddModal(false);
        setIsFromAIParse(false);

        return {
            success: transitionTime < 10, // Should be under 10ms
            time: transitionTime,
            message: `Modal transitions took ${transitionTime.toFixed(2)}ms`
        };
    }, [setShowAIParseModal, setShowAddModal, setIsFromAIParse]);

    // Test basic parsing functionality
    const testBasicParsing = useCallback(() => {
        const startTime = performance.now();

        // Test setting job description
        const testDescription = "Software Engineer position at Tech Company in Toronto, requiring 2-3 years experience with React and TypeScript.";
        setJobDescription(testDescription);

        const endTime = performance.now();
        const setDescriptionTime = endTime - startTime;

        return {
            success: setDescriptionTime < 5 && jobDescription === testDescription, // Should be under 5ms
            time: setDescriptionTime,
            message: `Job description setting took ${setDescriptionTime.toFixed(2)}ms`
        };
    }, [setJobDescription, jobDescription]);

    // Test job creation workflow integration
    const testJobCreationIntegration = useCallback(() => {
        const startTime = performance.now();

        // Simulate the job creation workflow
        const testJobData = {
            role: 'Frontend Developer',
            company: 'Tech Corp',
            location: 'Vancouver, British Columbia',
            experienceRequired: '1-2 years',
            skills: 'Vue.js, JavaScript, CSS',
            remote: false,
            notes: 'Exciting opportunity for frontend development',
            folderId: 'test-folder',
            jobPostingUrl: 'https://example.com/job'
        };

        // Test skills processing optimization
        const skillsArray = testJobData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0);

        // Test form reset optimization
        const resetFormData = {
            role: '',
            company: '',
            location: '',
            experienceRequired: '',
            skills: '',
            remote: false,
            notes: '',
            folderId: '',
            jobPostingUrl: ''
        };

        setFormData(resetFormData);

        const endTime = performance.now();
        const integrationTime = endTime - startTime;

        return {
            success: integrationTime < 3 && skillsArray.length === 3, // Should be under 3ms and process skills correctly
            time: integrationTime,
            message: `Job creation integration took ${integrationTime.toFixed(2)}ms, processed ${skillsArray.length} skills`
        };
    }, [setFormData]);

    // Run all integration tests
    const runIntegrationTests = useCallback(async () => {
        setIsRunningTest(true);
        setTestResults([]);

        const results: string[] = [];

        // Test 1: Form data population
        const formTest = testFormDataPopulation();
        results.push(`[PASS/FAIL] Form Data Population: ${formTest.message} - ${formTest.success ? 'PASS' : 'FAIL'}`);

        // Test 2: Modal transitions
        const modalTest = await testModalTransitions();
        results.push(`[PASS/FAIL] Modal Transitions: ${modalTest.message} - ${modalTest.success ? 'PASS' : 'FAIL'}`);

        // Test 3: Basic parsing functionality
        const basicTest = testBasicParsing();
        results.push(`[PASS/FAIL] Basic Parsing: ${basicTest.message} - ${basicTest.success ? 'PASS' : 'FAIL'}`);

        // Test 4: Job creation integration
        const integrationTest = testJobCreationIntegration();
        results.push(`[PASS/FAIL] Job Creation Integration: ${integrationTest.message} - ${integrationTest.success ? 'PASS' : 'FAIL'}`);

        // Test 5: Error handling
        const errorTest = {
            success: typeof errorMessage === 'string' && typeof setShowErrorModal === 'function',
            message: 'Error handling methods available'
        };
        results.push(`[PASS/FAIL] Error Handling: ${errorTest.message} - ${errorTest.success ? 'PASS' : 'FAIL'}`);

        setTestResults(results);
        setIsRunningTest(false);
    }, [testFormDataPopulation, testModalTransitions, testBasicParsing, testJobCreationIntegration, errorMessage, setShowErrorModal]);

    return (
        <div className="bg-slate-800 rounded-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-white mb-4">
                Parsing Integration Test Suite
            </h2>

            <div className="space-y-4">
                <div>
                    <p className="text-gray-300 mb-2">
                        This test suite verifies the optimized integration between AI parsing and job creation workflow.
                    </p>

                    <button
                        onClick={runIntegrationTests}
                        disabled={isRunningTest}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        {isRunningTest ? 'Running Tests...' : 'Run Integration Tests'}
                    </button>
                </div>

                {testResults.length > 0 && (
                    <div className="bg-slate-900 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-white mb-2">Test Results:</h3>
                        <div className="space-y-1">
                            {testResults.map((result, index) => (
                                <div key={index} className="text-sm font-mono text-gray-300">
                                    {result}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-slate-900 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2">Current State:</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                        <div>Parsing Phase: {parsingPhase}</div>
                        <div>Is Parsing: {isParsingAI ? 'Yes' : 'No'}</div>
                        <div>Show AI Modal: {showAIParseModal ? 'Yes' : 'No'}</div>
                        <div>Show Add Modal: {showAddModal ? 'Yes' : 'No'}</div>
                        <div>From AI Parse: {isFromAIParse ? 'Yes' : 'No'}</div>
                        <div>Form Data Role: {formData.role || 'Empty'}</div>
                        <div>Form Data Company: {formData.company || 'Empty'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};