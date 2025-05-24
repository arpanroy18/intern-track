// Import Firebase services
import { 
    getApplications as getFirebaseApplications,
    addApplication as addFirebaseApplication,
    updateApplication as updateFirebaseApplication,
    deleteApplication as deleteFirebaseApplication,
    clearAllApplications as clearFirebaseApplications,
    getStatusEvents as getFirebaseStatusEvents,
    subscribeToApplications
} from './firebase-db.js';

// Keep API base URL for job parsing (still using server)
const API_BASE_URL = 'http://localhost:3000/api';

// Data storage functions - now using Firebase
async function getApplications() {
    try {
        const applications = await getFirebaseApplications();
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
    // Show confirmation modal
    const confirmModal = document.getElementById('confirm-clear-modal');
    confirmModal.style.display = 'flex';
    
    // Set up event listeners for confirmation
    const confirmBtn = document.getElementById('confirm-clear-btn');
    const cancelBtn = document.getElementById('cancel-clear-btn');
    const closeBtn = document.getElementById('close-clear-modal');
    
    const closeModal = () => {
        confirmModal.style.display = 'none';
        // Clean up event listeners
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', closeModal);
        closeBtn.removeEventListener('click', closeModal);
    };
    
    const handleConfirm = async () => {
        try {
            await clearFirebaseApplications();
            await renderApplications();
            updateStats();
            closeModal();
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data: ' + error.message);
            closeModal();
        }
    };
    
    // Attach event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
}

// Application CRUD operations
async function addApplication(application) {
    try {
        await addFirebaseApplication(application);
        await renderApplications();
        updateStats();
    } catch (error) {
        console.error('Error adding application:', error);
        alert('Error adding application: ' + error.message);
    }
}

async function updateApplication(id, updatedApplication) {
    try {
        await updateFirebaseApplication(id, updatedApplication);
        await renderApplications();
        updateStats();
    } catch (error) {
        console.error('Error updating application:', error);
        alert('Error updating application: ' + error.message);
    }
}

async function deleteApplication(id) {
    // Get the application data to display in the confirmation modal
    const applications = await getApplications();
    const application = applications.find(app => app.id === id);
    
    if (!application) {
        console.error('Application not found');
        return;
    }
    
    // Show confirmation modal
    const confirmModal = document.getElementById('confirm-delete-modal');
    const companyNameEl = confirmModal.querySelector('.company-name');
    companyNameEl.textContent = `${application.company} - ${application.role}`;
    
    confirmModal.style.display = 'flex';
    
    // Set up event listeners for confirmation
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const cancelBtn = document.getElementById('cancel-delete-btn');
    const closeBtn = document.getElementById('close-confirm-modal');
    
    const closeModal = () => {
        confirmModal.style.display = 'none';
        // Clean up event listeners
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', closeModal);
        closeBtn.removeEventListener('click', closeModal);
    };
    
    const handleConfirm = async () => {
        try {
            await deleteFirebaseApplication(id);
            await renderApplications();
            updateStats();
            closeModal();
        } catch (error) {
            console.error('Error deleting application:', error);
            alert('Error deleting application: ' + error.message);
            closeModal();
        }
    };
    
    // Attach event listeners
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
}

// Helper function to parse job postings
async function parseJobPosting(jobPostingText) {
    if (!jobPostingText.trim()) {
        alert('Please paste a job posting first');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/parse-job-posting`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                jobPostingText: jobPostingText
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
        }

        const jsonResult = await response.json();
        return jsonResult;
    } catch (error) {
        console.error('Error parsing job posting:', error);
        alert('Error parsing job posting: ' + error.message);
        return null;
    }
}

// Get status events for an application
async function getStatusEvents(applicationId) {
    try {
        const events = await getFirebaseStatusEvents(applicationId);
        return events;
    } catch (error) {
        console.error('Error fetching status events:', error);
        return [];
    }
}

// Export functions for use in other modules
export {
    getApplications,
    clearAllData,
    addApplication,
    updateApplication,
    deleteApplication,
    parseJobPosting,
    getStatusEvents
};