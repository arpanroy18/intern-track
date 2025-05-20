// Main application entry point
import { getApplications, addApplication, updateApplication, clearAllData, setUIFunctions } from './api.js';
import { renderApplications, updateStats, openModal, closeModal, openJobPostingModal, closeJobPostingModal } from './ui.js';
import { getCurrentLocalDate, handleWindowResize } from './utils.js';
import { initJobParserListeners } from './job-parser.js';

// Set the UI functions in api.js to avoid circular dependency issues
setUIFunctions(renderApplications, updateStats);

// Initialization function
async function initApp() {
    // Initial render of applications and stats
    await renderApplications();
    updateStats();
    
    // Add application button
    document.getElementById('add-application-btn').addEventListener('click', () => {
        document.getElementById('application-id').value = '';
        document.getElementById('application-form').reset();
        document.getElementById('date-applied').value = getCurrentLocalDate();
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
            dateApplied: document.getElementById('date-applied').value,
            location: document.getElementById('location').value,
            applicationLink: document.getElementById('application-link').value,
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value
        };
        
        if (applicationId) {
            await updateApplication(applicationId, application);
        } else {
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
    document.querySelector('button[onclick="clearAllData()"]').addEventListener('click', clearAllData);
    
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
        
        openModal('Edit Application');
    }
}

// Make editApplication globally available
window.editApplication = editApplication;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 