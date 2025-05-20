// API URLs and constants
const API_BASE_URL = 'http://localhost:3000/api';

// Data storage functions
async function getApplications() {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const applications = await response.json();
        return applications;
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

// We will import these from ui.js when we need them
let renderApplications;
let updateStats;

export function setUIFunctions(renderFunc, statsFunc) {
    renderApplications = renderFunc;
    updateStats = statsFunc;
}

async function clearAllData() {
    if (confirm('Are you sure you want to clear all application data? This cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await renderApplications();
            updateStats();
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data: ' + error.message);
        }
    }
}

// Application CRUD operations
async function addApplication(application) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(application)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await renderApplications();
        updateStats();
    } catch (error) {
        console.error('Error adding application:', error);
        alert('Error adding application: ' + error.message);
    }
}

async function updateApplication(id, updatedApplication) {
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedApplication)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await renderApplications();
        updateStats();
    } catch (error) {
        console.error('Error updating application:', error);
        alert('Error updating application: ' + error.message);
    }
}

async function deleteApplication(id) {
    if (confirm('Are you sure you want to delete this application?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await renderApplications();
            updateStats();
        } catch (error) {
            console.error('Error deleting application:', error);
            alert('Error deleting application: ' + error.message);
        }
    }
}

// Helper function to parse job postings
async function parseJobPosting(jobPostingText) {
    if (!jobPostingText.trim()) {
        alert('Please paste a job posting first');
        return null;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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',
                'HTTP-Referer': 'localhost',
                'X-Title': 'Job Parser'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.3-70b-instruct:free',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a job posting parser. Extract and return ONLY a JSON object with no markdown formatting, code blocks, or additional text. Use this exact format:\n{\n  "company": "Company Name",\n  "role": "Job Title",\n  "location": "City, State/Province",\n  "description": "Brief job description"\n}\n\nEnsure all values are properly escaped JSON strings.'
                    },
                    {
                        role: 'user',
                        content: jobPostingText
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let parsedResult = data.choices[0].message.content.trim();
        
        // Remove markdown code blocks if present
        if (parsedResult.startsWith('```') && parsedResult.endsWith('```')) {
            parsedResult = parsedResult.replace(/^```(?:json)?\n/, '').replace(/\n```$/, '');
        }

        // Parse the JSON response
        return JSON.parse(parsedResult);
    } catch (error) {
        console.error('Error parsing job posting:', error);
        alert('Error parsing job posting: ' + error.message);
        return null;
    }
}

// Export functions for use in other modules
export {
    getApplications,
    clearAllData,
    addApplication,
    updateApplication,
    deleteApplication,
    parseJobPosting
}; 