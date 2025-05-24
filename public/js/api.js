// Import Firebase services
import { 
    getApplications as getFirebaseApplications,
    addApplication as addFirebaseApplication,
    updateApplication as updateFirebaseApplication,
    deleteApplication as deleteFirebaseApplication,
    clearAllApplications as clearFirebaseApplications,
    getStatusEvents as getFirebaseStatusEvents,
    subscribeToApplications,
    fixApplicationDates as fixFirebaseApplicationDates,
    getFolders as getFirebaseFolders,
    createFolder as createFirebaseFolder,
    updateFolder as updateFirebaseFolder,
    deleteFolder as deleteFirebaseFolder
} from './firebase-db.js';

// Keep API base URL for job parsing (still using server)
const API_BASE_URL = 'http://localhost:3000/api';

// Current folder state
let currentFolderId = null;

// Data storage functions - now using Firebase
async function getApplications(folderId = null) {
    try {
        const currentFolder = folderId || currentFolderId;
        console.log('Getting applications for folder:', currentFolder);
        const applications = await getFirebaseApplications(currentFolder);
        console.log('Retrieved applications:', applications.length);
        return applications;
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

// Folder management functions
async function getFolders() {
    try {
        const folders = await getFirebaseFolders();
        console.log('Retrieved folders:', folders);
        
        // Set current folder to first folder if none is set
        if (!currentFolderId && folders.length > 0) {
            currentFolderId = folders[0].id;
            console.log('Set current folder to:', currentFolderId);
        }
        
        return folders;
    } catch (error) {
        console.error('Error fetching folders:', error);
        return [];
    }
}

async function createFolder(folderData) {
    try {
        const result = await createFirebaseFolder(folderData);
        
        // If this is the first folder, set it as current
        if (!currentFolderId) {
            currentFolderId = result.folder.id;
        }
        
        return result;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

async function updateFolder(folderId, updatedData) {
    try {
        const result = await updateFirebaseFolder(folderId, updatedData);
        return result;
    } catch (error) {
        console.error('Error updating folder:', error);
        throw error;
    }
}

async function deleteFolder(folderId) {
    try {
        const result = await deleteFirebaseFolder(folderId);
        
        // If we deleted the current folder, switch to another one
        if (currentFolderId === folderId) {
            const folders = await getFolders();
            currentFolderId = folders.length > 0 ? folders[0].id : null;
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
}

function getCurrentFolderId() {
    return currentFolderId;
}

function setCurrentFolderId(folderId) {
    currentFolderId = folderId;
}

// We will import these from ui.js when we need them
let renderApplications;
let updateStats;
let renderFolders;

export function setUIFunctions(renderFunc, statsFunc, foldersFunc = null) {
    renderApplications = renderFunc;
    updateStats = statsFunc;
    renderFolders = foldersFunc;
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
        console.log('Adding application, current folder ID:', currentFolderId);
        
        if (!currentFolderId) {
            console.log('No current folder set, attempting to get/create one...');
            // If no folder is set, create a default one
            const folders = await getFolders();
            console.log('Available folders:', folders);
            
            if (folders.length === 0) {
                throw new Error('No folder available. Please create a folder first.');
            }
            currentFolderId = folders[0].id;
            console.log('Set current folder to first available:', currentFolderId);
        }
        
        console.log('Calling Firebase addApplication with folder ID:', currentFolderId);
        const result = await addFirebaseApplication(application, currentFolderId);
        console.log('Firebase addApplication result:', result);
        
        console.log('Re-rendering applications...');
        await renderApplications();
        updateStats();
        
        console.log('Application added successfully');
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

// Fix application dates (one-time fix for timezone issues)
async function fixApplicationDates() {
    try {
        const result = await fixFirebaseApplicationDates();
        await renderApplications();
        updateStats();
        console.log('Application dates fixed:', result.message);
        return result;
    } catch (error) {
        console.error('Error fixing application dates:', error);
        alert('Error fixing application dates: ' + error.message);
        throw error;
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
    getStatusEvents,
    fixApplicationDates,
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getCurrentFolderId,
    setCurrentFolderId
};