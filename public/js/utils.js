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

// Get CSS class for status styling
function getStatusClass(status) {
    switch (status) {
        case 'Applied': return 'status-applied';
        case 'Interview': return 'status-interview';
        case 'Offered': return 'status-offered';
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
    getStatusClass,
    handleWindowResize
}; 