// Job Posting Parser Module
import { parseJobPosting } from './api.js';
import { getCurrentLocalDate } from './utils.js';
import { openModal, closeJobPostingModal } from './ui.js';

// Function to handle job posting parsing
async function handleJobPostingParse() {
    const jobPostingText = document.getElementById('job-posting-text').value;
    if (!jobPostingText.trim()) {
        alert('Please paste a job posting first');
        return;
    }

    const parseBtn = document.getElementById('parse-posting-btn');
    parseBtn.disabled = true;
    parseBtn.textContent = 'Parsing...';
    
    try {
        const parsedData = await parseJobPosting(jobPostingText);
        
        if (parsedData) {
            // Show raw response for debugging
            const parseResultEl = document.getElementById('parse-result');
            parseResultEl.style.display = 'block';
            parseResultEl.querySelector('pre').textContent = JSON.stringify(parsedData, null, 2);
            
            // Fill the application form
            document.getElementById('company').value = parsedData.company || '';
            document.getElementById('role').value = parsedData.role || '';
            document.getElementById('location').value = parsedData.location || '';
            document.getElementById('notes').value = parsedData.description || '';
            
            // Hide date applied field for new applications since we'll use server timestamp
            document.getElementById('date-applied-group').style.display = 'none';
            
            // Close job posting modal and open application form
            closeJobPostingModal();
            openModal('Add Application');
        }
    } catch (error) {
        console.error('Error parsing job posting:', error);
        alert('Error parsing job posting: ' + error.message);
    } finally {
        parseBtn.disabled = false;
        parseBtn.textContent = 'Parse Posting';
    }
}

// Function to clear job posting input
function clearJobPostingInput() {
    document.getElementById('job-posting-text').value = '';
    document.getElementById('job-posting-text').focus();
}

// Initialize job parser event listeners
function initJobParserListeners() {
    document.getElementById('parse-posting-btn').addEventListener('click', handleJobPostingParse);
    document.getElementById('clear-posting-btn').addEventListener('click', clearJobPostingInput);
    
    // Handle paste events on the textarea
    const jobPostingTextarea = document.getElementById('job-posting-text');
    
    // Add paste event listener for debugging
    jobPostingTextarea.addEventListener('paste', () => {
        console.log('Paste event triggered on textarea');
    });
}

export {
    handleJobPostingParse,
    clearJobPostingInput,
    initJobParserListeners
}; 