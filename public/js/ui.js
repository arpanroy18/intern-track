// UI Functions for InternTrack
import { getApplications, updateApplication, deleteApplication } from './api.js';
import { formatDate, getStatusClass } from './utils.js';

// Render applications in the table
async function renderApplications() {
    const applicationsTable = document.getElementById('applications-table');
    const emptyState = document.getElementById('empty-state');
    const applications = await getApplications();
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    
    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = 
            app.company.toLowerCase().includes(searchTerm) || 
            app.role.toLowerCase().includes(searchTerm) || 
            (app.notes && app.notes.toLowerCase().includes(searchTerm));
        
        const matchesFilter = activeFilter === 'all' || app.status === activeFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    // Sort by date applied (most recent first)
    filteredApplications.sort((a, b) => new Date(b.dateApplied) - new Date(a.dateApplied));
    
    // Clear existing rows
    applicationsTable.innerHTML = '';
    
    if (applications.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    if (filteredApplications.length === 0) {
        const noResultsRow = document.createElement('tr');
        noResultsRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 2rem;">
                No matching applications found
            </td>
        `;
        applicationsTable.appendChild(noResultsRow);
        return;
    }
    
    // Create table rows
    filteredApplications.forEach(app => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${app.company}</strong>
                ${app.location ? `<div style="color: var(--text-secondary); font-size: 0.875rem;">${app.location}</div>` : ''}
            </td>
            <td>${app.role}</td>
            <td>
                <select class="status-select ${getStatusClass(app.status)}" data-id="${app.id}">
                    <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
                    <option value="Offered" ${app.status === 'Offered' ? 'selected' : ''}>Offered</option>
                    <option value="Closed" ${app.status === 'Closed' ? 'selected' : ''}>Closed</option>
                </select>
            </td>
            <td>${formatDate(app.lastUpdated)}</td>
            <td class="action-cell">
                <button class="icon-btn edit-btn" data-id="${app.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="icon-btn delete-btn" data-id="${app.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
                ${app.applicationLink ? `
                <a href="${app.applicationLink}" target="_blank" class="icon-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
                ` : ''}
            </td>
        `;
        applicationsTable.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editApplication(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteApplication(btn.dataset.id));
    });

    // Add status select event listeners
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const applicationId = e.target.dataset.id;
            const newStatus = e.target.value;
            
            // Update status classes
            e.target.className = `status-select ${getStatusClass(newStatus)}`;
            
            try {
                // Get the full application data first
                const applications = await getApplications();
                const currentApp = applications.find(app => app.id === applicationId);
                
                if (currentApp) {
                    // Only update the status field, preserving all other data
                    await updateApplication(applicationId, { 
                        ...currentApp,
                        status: newStatus 
                    });
                }
            } catch (error) {
                console.error('Error updating status:', error);
                alert('Error updating status: ' + error.message);
                // Revert the UI to previous status
                renderApplications();
            }
        });
    });
}

// Update statistics display
async function updateStats() {
    const applications = await getApplications();
    const totalApplications = applications.length;
    
    // Count applications that ever had an interview (using hadInterview flag)
    const totalInterviews = applications.filter(app => app.hadInterview === 1).length;
    
    // Count applications with Offered status
    const totalOffers = applications.filter(app => app.status === 'Offered').length;
    
    // Count applications that ever had an interview (using hadInterview flag)
    const totalResponses = applications.filter(app => app.hadInterview === 1).length;
    
    // Calculate response rate based on applications that ever had an interview
    const responseRate = totalApplications > 0 ? 
        Math.round((totalResponses / totalApplications) * 100) : 0;
    
    document.getElementById('total-applications').textContent = totalApplications;
    document.getElementById('total-interviews').textContent = totalInterviews;
    document.getElementById('total-offers').textContent = totalOffers;
    document.getElementById('response-rate').textContent = `${responseRate}%`;
}

// Modal management functions
function openModal(title = 'Add Application') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('application-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('application-modal').style.display = 'none';
    document.getElementById('application-form').reset();
}

function openJobPostingModal() {
    document.getElementById('job-posting-modal').style.display = 'flex';
    
    setTimeout(() => {
        const textarea = document.getElementById('job-posting-text');
        textarea.focus();
    }, 100);
}

function closeJobPostingModal() {
    document.getElementById('job-posting-modal').style.display = 'none';
    document.getElementById('job-posting-text').value = '';
    document.getElementById('parse-result').style.display = 'none';
}

// Export UI functions
export {
    renderApplications,
    updateStats,
    openModal,
    closeModal,
    openJobPostingModal,
    closeJobPostingModal
}; 