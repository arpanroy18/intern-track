// Utility functions for the InternTrack application

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Get current local date in YYYY-MM-DD format for date input fields
function getCurrentLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Get current ISO string in local timezone
function getLocalISOString() {
    const now = new Date();
    return now.toISOString();
}

// Store and retrieve page size preference
function getPageSizePreference() {
    const storedValue = localStorage.getItem('pageSize');
    return storedValue || '10'; // Default to 10 if not set
}

function setPageSizePreference(size) {
    localStorage.setItem('pageSize', size);
}

// Get current page preference
function getCurrentPage() {
    const storedPage = localStorage.getItem('currentPage');
    return storedPage ? parseInt(storedPage, 10) : 1; // Default to page 1
}

function setCurrentPage(page) {
    localStorage.setItem('currentPage', page.toString());
}

// Get CSS class for status styling
function getStatusClass(status) {
    switch (status) {
        case 'Applied': return 'status-applied';
        case 'OA': return 'status-oa';
        case 'Interview': return 'status-interview';
        case 'Offer': return 'status-offer';
        case 'Closed': return 'status-closed';
        default: return '';
    }
}

// Optimization function for window resize
function handleWindowResize() {
    const width = window.innerWidth;
    const table = document.querySelector('table');
    const buttons = document.querySelectorAll('.button-group .btn');
    
    // Adjust UI elements based on screen width
    if (width < 480) {
        table?.classList.add('compact-table');
        buttons.forEach(btn => btn.classList.add('full-width'));
    } else {
        table?.classList.remove('compact-table');
        buttons.forEach(btn => btn.classList.remove('full-width'));
    }
}

// Export all utility functions
export {
    formatDate,
    getCurrentLocalDate,
    getLocalISOString,
    getPageSizePreference,
    setPageSizePreference,
    getCurrentPage,
    setCurrentPage,
    getStatusClass,
    handleWindowResize
};