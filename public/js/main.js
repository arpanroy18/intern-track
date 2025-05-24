// Main application entry point
import { getApplications, addApplication, updateApplication, clearAllData, setUIFunctions } from './api.js';
import { renderApplications, updateStats, openModal, closeModal, openJobPostingModal, closeJobPostingModal } from './ui.js';
import { getCurrentLocalDate, handleWindowResize, getPageSizePreference, setPageSizePreference, setCurrentPage } from './utils.js';
import { initJobParserListeners } from './job-parser.js';
import { initAuthUI } from './auth-ui.js';
import { onAuthStateChange } from './firebase-auth.js';

// Set the UI functions in api.js to avoid circular dependency issues
setUIFunctions(renderApplications, updateStats);

// Wait for Firebase to be loaded
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebaseReady) {
            console.log('Firebase already loaded');
            resolve();
        } else {
            console.log('Waiting for Firebase ready event...');
            window.addEventListener('firebaseReady', () => {
                console.log('Firebase ready event received');
                resolve();
            }, { once: true });
        }
    });
}

// Initialization function
async function initApp() {
    try {
        // Wait for Firebase to be available
        await waitForFirebase();
        
        console.log('Initializing authentication...');
        // Initialize authentication UI
        initAuthUI();
        
        console.log('Setting up auth state listener...');
        // Listen for auth state changes to initialize app data
        onAuthStateChange(async (user) => {
            if (user) {
                console.log('User signed in:', user.email);
                // User is signed in, load their data
                await renderApplications();
                updateStats();
            } else {
                console.log('User signed out');
                // User is signed out, clear any displayed data
                updateStats(); // This will show 0s
            }
        });
        
        console.log('App initialization complete');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
    
    // Setup page size selector
    const pageSizeSelect = document.getElementById('page-size-select');
    pageSizeSelect.value = getPageSizePreference();
    
    pageSizeSelect.addEventListener('change', () => {
        setPageSizePreference(pageSizeSelect.value);
        // Reset to first page when changing page size
        setCurrentPage(1);
        renderApplications();
    });
    
    // Add application button
    document.getElementById('add-application-btn').addEventListener('click', () => {
        document.getElementById('application-id').value = '';
        document.getElementById('application-form').reset();
        // Hide date applied field for new applications since we'll use server timestamp
        document.getElementById('date-applied-group').style.display = 'none';
        openModal('Add Application');
    });
    
    // Close modal event
    document.getElementById('close-modal').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    document.getElementById('application-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('application-modal')) {
            closeModal();
        }
    });
    
    // Form submission
    document.getElementById('application-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const applicationId = document.getElementById('application-id').value;
        const application = {
            company: document.getElementById('company').value,
            role: document.getElementById('role').value,
            location: document.getElementById('location').value,
            applicationLink: document.getElementById('application-link').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value
        };
        
        // Only include dateApplied for updates, not for new applications
        if (applicationId) {
            application.dateApplied = document.getElementById('date-applied').value;
            await updateApplication(applicationId, application);
        } else {
            // For new applications, dateApplied will be set by server timestamp
            await addApplication(application);
        }
        
        closeModal();
    });
    
    // Search functionality
    document.getElementById('search-input').addEventListener('input', renderApplications);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.filter-btn.active').classList.remove('active');
            btn.classList.add('active');
            renderApplications();
        });
    });

    // Clear all data
    document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
    
    // Close confirmation modals when clicking outside
    document.getElementById('confirm-delete-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirm-delete-modal')) {
            document.getElementById('confirm-delete-modal').style.display = 'none';
        }
    });
    
    document.getElementById('confirm-clear-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirm-clear-modal')) {
            document.getElementById('confirm-clear-modal').style.display = 'none';
        }
    });
    
    // Job parsing modal
    document.getElementById('parse-job-btn').addEventListener('click', openJobPostingModal);
    document.getElementById('close-job-modal').addEventListener('click', closeJobPostingModal);
    
    // Close job posting modal when clicking outside
    document.getElementById('job-posting-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('job-posting-modal')) {
            closeJobPostingModal();
        }
    });
    
    // Initialize job parser
    initJobParserListeners();
    
    // Window resize handler
    window.addEventListener('resize', handleWindowResize);
    handleWindowResize(); // Initial call
}

// Edit application function
async function editApplication(id) {
    const applications = await getApplications();
    const application = applications.find(app => app.id === id);
    
    if (application) {
        document.getElementById('application-id').value = application.id;
        document.getElementById('company').value = application.company;
        document.getElementById('role').value = application.role;
        document.getElementById('date-applied').value = application.dateApplied;
        document.getElementById('location').value = application.location || '';
        document.getElementById('application-link').value = application.applicationLink || '';
        document.getElementById('status').value = application.status;
        document.getElementById('notes').value = application.notes || '';
        
        // Show date applied field for editing applications
        document.getElementById('date-applied-group').style.display = 'block';
        
        openModal('Edit Application');
    }
}

// Make editApplication globally available
window.editApplication = editApplication;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);