// UI Functions for InternTrack
import { getApplications, updateApplication, deleteApplication, getStatusEvents } from './api.js';
import { formatDate, getStatusClass, getPageSizePreference, setPageSizePreference, getCurrentPage, setCurrentPage } from './utils.js';

// Render applications in the table
async function renderApplications() {
    try {
        console.log('UI: Starting to render applications...');
        const applications = await getApplications();
        console.log('UI: Got applications from API:', applications.length);
        
        const tableBody = document.getElementById('applications-table');
        const emptyState = document.getElementById('empty-state');
        const tableContainer = document.querySelector('.applications-table-container');
        
        // Get current filters
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        const pageSize = getPageSizePreference();
        
        console.log('UI: Current filters - search:', searchTerm, 'status:', activeFilter, 'pageSize:', pageSize);
        
        // Apply filters
        let filteredApplications = applications.filter(app => {
            const matchesSearch = !searchTerm || 
                app.company.toLowerCase().includes(searchTerm) ||
                app.role.toLowerCase().includes(searchTerm) ||
                (app.notes && app.notes.toLowerCase().includes(searchTerm));
            
            const matchesFilter = activeFilter === 'all' || app.status === activeFilter;
            
            return matchesSearch && matchesFilter;
        });
        
        console.log('UI: Filtered applications:', filteredApplications.length);
        
        // Remove existing pagination controls
        const existingPagination = document.querySelector('.pagination-controls');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        if (filteredApplications.length === 0) {
            console.log('UI: No applications to display, showing empty state');
            tableContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        // Show table, hide empty state
        tableContainer.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Calculate pagination
        const currentPage = getCurrentPage();
        const totalPages = pageSize === 'all' ? 1 : Math.ceil(filteredApplications.length / parseInt(pageSize));
        const startIndex = pageSize === 'all' ? 0 : (currentPage - 1) * parseInt(pageSize);
        const endIndex = pageSize === 'all' ? filteredApplications.length : startIndex + parseInt(pageSize);
        
        console.log('UI: Pagination - page:', currentPage, 'totalPages:', totalPages, 'showing:', startIndex, 'to', endIndex);
        
        const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
        
        // Sort by creation date (oldest first) so new applications appear at the bottom
        paginatedApplications.sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.dateApplied).getTime();
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.dateApplied).getTime();
            return aTime - bTime;
        });
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Create table rows for displayed applications
        paginatedApplications.forEach((app, index) => {
            const row = document.createElement('tr');
            const displayIndex = pageSize === 'all' ? 
                index + 1 : 
                (currentPage - 1) * parseInt(pageSize, 10) + index + 1;
            
            row.innerHTML = `
                <td>${displayIndex}</td>
                <td>
                    <strong>${app.company}</strong>
                    ${app.location ? `<div style="color: var(--text-secondary); font-size: 0.875rem;">${app.location}</div>` : ''}
                </td>
                <td>${app.role}</td>
                <td>
                    <select class="status-select ${getStatusClass(app.status)}" data-id="${app.id}">
                        <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                        <option value="OA" ${app.status === 'OA' ? 'selected' : ''}>Online Assessment</option>
                        <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
                        <option value="Offer" ${app.status === 'Offer' ? 'selected' : ''}>Offer</option>
                        <option value="Closed" ${app.status === 'Closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </td>
                <td>${formatDate(app.lastUpdated)}</td>
                <td class="action-cell">
                    <button class="icon-btn timeline-btn" data-id="${app.id}" title="View Timeline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </button>
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
            tableBody.appendChild(row);
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
                        const updatedApp = {
                            company: currentApp.company,
                            role: currentApp.role,
                            dateApplied: currentApp.dateApplied,
                            location: currentApp.location || '',
                            applicationLink: currentApp.applicationLink || '',
                            status: newStatus,
                            notes: currentApp.notes || ''
                        };
                        
                        await updateApplication(applicationId, updatedApp);
                    }
                } catch (error) {
                    console.error('Error updating status:', error);
                    alert('Error updating status: ' + error.message);
                    // Revert the UI to previous status
                    renderApplications();
                }
            });
        });

        // Add timeline event listeners
        addTimelineEventListeners();
        
        // Add pagination controls if needed
        if (pageSize !== 'all' && totalPages > 1) {
            renderPaginationControls(filteredApplications.length, parseInt(pageSize, 10), currentPage, totalPages);
        } else {
            // Remove pagination controls if they exist
            const existingControls = document.querySelector('.pagination-controls');
            if (existingControls) {
                existingControls.remove();
            }
        }
    } catch (error) {
        console.error('Error rendering applications:', error);
        alert('Error rendering applications: ' + error.message);
    }
}

// Add pagination controls to the table
function renderPaginationControls(totalItems, pageSize, currentPage, totalPages) {
    // Remove existing pagination controls if they exist
    const existingControls = document.querySelector('.pagination-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create pagination container
    const paginationControls = document.createElement('div');
    paginationControls.className = 'pagination-controls';
    
    // Page info text (e.g., "Showing 1-10 of 50 applications")
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(startItem + pageSize - 1, totalItems);
    
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} applications`;
    
    // Pagination buttons
    const paginationButtons = document.createElement('div');
    paginationButtons.className = 'pagination-buttons';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn';
    prevButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Prev
    `;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            renderApplications();
        }
    });
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn';
    nextButton.innerHTML = `
        Next
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    `;
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            renderApplications();
        }
    });
    
    // Add buttons to container
    paginationButtons.appendChild(prevButton);
    paginationButtons.appendChild(nextButton);
    
    // Add elements to pagination controls
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(paginationButtons);
    
    // Add pagination controls after the table
    const tableContainer = document.querySelector('.applications-table-container');
    tableContainer.after(paginationControls);
}

// Update statistics display
async function updateStats() {
    const applications = await getApplications();
    const totalApplications = applications.length;
    
    // Count applications that ever had an interview (using hadInterview flag)
    const totalInterviews = applications.filter(app => app.hadInterview === true).length;
    
    // Count applications with Offered status
    const totalOffers = applications.filter(app => app.status === 'Offer').length;
    
    // Count applications that ever had an interview (using hadInterview flag)
    const totalResponses = applications.filter(app => app.hadInterview === true).length;
    
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

// Timeline modal functions
function openTimelineModal() {
    document.getElementById('timeline-modal').style.display = 'flex';
}

function closeTimelineModal() {
    document.getElementById('timeline-modal').style.display = 'none';
    document.getElementById('timeline-content').innerHTML = '';
}

async function renderTimeline(applicationId) {
    const timelineContent = document.getElementById('timeline-content');
    timelineContent.innerHTML = '<div class="loading">Loading timeline...</div>';
    
    try {
        const [events, applications] = await Promise.all([
            getStatusEvents(applicationId),
            getApplications()
        ]);
        
        console.log('Timeline Debug - Application ID:', applicationId);
        console.log('Timeline Debug - Status Events:', events);
        console.log('Timeline Debug - Applications:', applications);
        
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            timelineContent.innerHTML = '<div class="error">Application not found</div>';
            return;
        }

        // Create events array starting with the "Applied" event
        const timelineEvents = [];
        
        // Always add the initial "Applied" event using the actual creation timestamp
        const appliedTimestamp = application.createdAt || (() => {
            // Fallback to start of day on dateApplied if createdAt is not available
            const localDate = new Date(application.dateApplied + 'T00:00:00');
            return localDate.toISOString();
        })();
        
        timelineEvents.push({
            status: 'Applied',
            timestamp: appliedTimestamp,
            notes: null,
            isInitial: true
        });

        // Add all status change events
        events.forEach(event => {
            timelineEvents.push({
                status: event.newStatus,
                timestamp: event.timestamp,
                notes: null,
                isInitial: false
            });
        });

        // Sort events chronologically (newest first for timeline display)
        timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (timelineEvents.length === 0) {
            timelineContent.innerHTML = '<div class="empty-timeline">No status changes recorded</div>';
            return;
        }

        const timeline = document.createElement('div');
        timeline.className = 'timeline';

        timelineEvents.forEach((event, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            
            // Format the date more clearly
            const eventDate = new Date(event.timestamp);
            const formattedDate = eventDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Create status text
            let statusText;
            if (event.isInitial) {
                statusText = `Applied to ${application.company}`;
            } else {
                statusText = `Status changed to: ${event.status}`;
            }
            
            timelineItem.innerHTML = `
                <div class="timeline-point ${getStatusClass(event.status)}"></div>
                <div class="timeline-content">
                    <div class="timeline-date">${formattedDate}</div>
                    <div class="timeline-status">${statusText}</div>
                    ${event.notes ? `<div class="timeline-notes">${event.notes}</div>` : ''}
                </div>
            `;
            
            timeline.appendChild(timelineItem);
        });

        timelineContent.innerHTML = '';
        timelineContent.appendChild(timeline);
    } catch (error) {
        console.error('Error rendering timeline:', error);
        timelineContent.innerHTML = '<div class="error">Error loading timeline</div>';
    }
}

// Add event listeners after rendering applications
function addTimelineEventListeners() {
    document.querySelectorAll('.timeline-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openTimelineModal();
            renderTimeline(btn.dataset.id);
        });
    });
    
    // Timeline modal close button
    document.getElementById('close-timeline-modal').addEventListener('click', closeTimelineModal);
}

// Export UI functions
export {
    renderApplications,
    updateStats,
    openModal,
    closeModal,
    openJobPostingModal,
    closeJobPostingModal,
    addTimelineEventListeners
};