// Folder UI Management
import { getFolders, createFolder, updateFolder, deleteFolder, getCurrentFolderId, setCurrentFolderId } from './api.js';

let renderApplications;
let updateStats;

// Set UI callback functions
export function setUICallbacks(renderFunc, statsFunc) {
    renderApplications = renderFunc;
    updateStats = statsFunc;
}

// Render folder tabs
export async function renderFolders() {
    try {
        console.log('Rendering folders...');
        const folders = await getFolders();
        const seasonSelect = document.getElementById('season-select');
        const editBtn = document.getElementById('edit-season-btn');
        const deleteBtn = document.getElementById('delete-season-btn');
        let currentFolderId = getCurrentFolderId();
        
        console.log('Available folders:', folders.length);
        console.log('Current folder ID:', currentFolderId);
        
        if (folders.length === 0) {
            seasonSelect.innerHTML = '<option value="">No seasons available</option>';
            seasonSelect.disabled = true;
            editBtn.style.display = 'none';
            deleteBtn.style.display = 'none';
            return;
        }
        
        // Enable the select and show edit/delete buttons
        seasonSelect.disabled = false;
        editBtn.style.display = 'flex';
        deleteBtn.style.display = 'flex';
        
        // If no current folder is set, set it to the first folder
        if (!currentFolderId && folders.length > 0) {
            currentFolderId = folders[0].id;
            setCurrentFolderId(currentFolderId);
            console.log('Set initial current folder to:', currentFolderId);
        }
        
        // Make sure the current folder ID exists in the folders list
        const folderExists = folders.find(f => f.id === currentFolderId);
        if (!folderExists && folders.length > 0) {
            currentFolderId = folders[0].id;
            setCurrentFolderId(currentFolderId);
            console.log('Current folder not found, switched to:', currentFolderId);
        }
        
        // Populate the dropdown
        seasonSelect.innerHTML = folders.map(folder => {
            const isSelected = folder.id === currentFolderId;
            return `<option value="${folder.id}" ${isSelected ? 'selected' : ''}>${folder.name}</option>`;
        }).join('');
        
        // Add event listener for dropdown changes
        setupSeasonSelectListener();
        
        console.log('Folders rendered successfully, active folder:', currentFolderId);
        
    } catch (error) {
        console.error('Error rendering folders:', error);
        const seasonSelect = document.getElementById('season-select');
        const editBtn = document.getElementById('edit-season-btn');
        const deleteBtn = document.getElementById('delete-season-btn');
        seasonSelect.innerHTML = '<option value="">Error loading seasons</option>';
        seasonSelect.disabled = true;
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
}

// Setup event listener for season select dropdown
function setupSeasonSelectListener() {
    const seasonSelect = document.getElementById('season-select');
    
    // Remove existing listener if any
    seasonSelect.removeEventListener('change', handleSeasonChange);
    
    // Add new listener
    seasonSelect.addEventListener('change', handleSeasonChange);
}

// Handle season dropdown change
async function handleSeasonChange(e) {
    const folderId = e.target.value;
    if (folderId) {
        await switchToFolder(folderId);
    }
}

// Setup event listeners for folder tabs
function setupFolderTabListeners() {
    // This function is now unused but kept for compatibility
    // All folder switching is now handled by the dropdown
}

// Switch to a different folder
async function switchToFolder(folderId) {
    try {
        console.log('Switching to folder:', folderId);
        setCurrentFolderId(folderId);
        
        // Update dropdown selection
        const seasonSelect = document.getElementById('season-select');
        if (seasonSelect) {
            seasonSelect.value = folderId;
        }
        
        console.log('Re-rendering applications for folder:', folderId);
        // Re-render applications and stats for the new folder
        await renderApplications();
        updateStats();
        
        console.log('Successfully switched to folder:', folderId);
    } catch (error) {
        console.error('Error switching folder:', error);
        alert('Error switching to folder: ' + error.message);
    }
}

// Open folder creation modal
export function openCreateFolderModal() {
    document.getElementById('folder-id').value = '';
    document.getElementById('folder-form').reset();
    document.getElementById('folder-modal-title').textContent = 'Create New Season';
    document.getElementById('save-folder-btn').textContent = 'Create Season';
    document.getElementById('folder-modal').style.display = 'flex';
}

// Open folder edit modal
async function openEditFolderModal(folderId) {
    try {
        const folders = await getFolders();
        const folder = folders.find(f => f.id === folderId);
        
        if (folder) {
            document.getElementById('folder-id').value = folder.id;
            document.getElementById('folder-name').value = folder.name;
            document.getElementById('folder-description').value = folder.description || '';
            document.getElementById('folder-modal-title').textContent = 'Edit Season';
            document.getElementById('save-folder-btn').textContent = 'Save Changes';
            document.getElementById('folder-modal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error opening edit modal:', error);
        alert('Error opening edit modal: ' + error.message);
    }
}

// Open folder deletion confirmation modal
async function openDeleteFolderModal(folderId) {
    try {
        const folders = await getFolders();
        const folder = folders.find(f => f.id === folderId);
        
        if (folder) {
            const confirmModal = document.getElementById('confirm-delete-folder-modal');
            const folderNameEl = confirmModal.querySelector('.folder-name');
            folderNameEl.textContent = folder.name;
            
            confirmModal.style.display = 'flex';
            
            // Store folder ID for deletion
            confirmModal.dataset.folderId = folderId;
        }
    } catch (error) {
        console.error('Error opening delete modal:', error);
        alert('Error opening delete modal: ' + error.message);
    }
}

// Close folder modal
export function closeFolderModal() {
    document.getElementById('folder-modal').style.display = 'none';
}

// Handle folder form submission
export async function handleFolderFormSubmit(e) {
    e.preventDefault();
    
    const folderId = document.getElementById('folder-id').value;
    const folderData = {
        name: document.getElementById('folder-name').value,
        description: document.getElementById('folder-description').value
    };
    
    try {
        let newFolderId = null;
        
        if (folderId) {
            // Update existing folder
            await updateFolder(folderId, folderData);
            console.log('Folder updated:', folderId);
        } else {
            // Create new folder
            const result = await createFolder(folderData);
            newFolderId = result.folder.id;
            console.log('New folder created:', newFolderId);
        }
        
        // Refresh folder list and close modal
        await renderFolders();
        closeFolderModal();
        
        // If this was a new folder, switch to it
        if (newFolderId) {
            console.log('Switching to new folder:', newFolderId);
            setCurrentFolderId(newFolderId);
            await renderFolders(); // Re-render to show active state
            await renderApplications(); // Re-render applications for new folder
            updateStats();
        }
        
        // If this was a new folder and we had no current folder, switch to it
        if (!folderId && !getCurrentFolderId()) {
            const folders = await getFolders();
            if (folders.length > 0) {
                await switchToFolder(folders[0].id);
            }
        }
        
    } catch (error) {
        console.error('Error saving folder:', error);
        alert('Error saving folder: ' + error.message);
    }
}

// Handle folder deletion
export async function handleFolderDeletion() {
    const confirmModal = document.getElementById('confirm-delete-folder-modal');
    const folderId = confirmModal.dataset.folderId;
    
    if (!folderId) return;
    
    try {
        await deleteFolder(folderId);
        
        // Refresh folder list
        await renderFolders();
        
        // Close modal
        confirmModal.style.display = 'none';
        
        // If we deleted the current folder, switch to another one
        const currentFolderId = getCurrentFolderId();
        if (!currentFolderId) {
            const folders = await getFolders();
            if (folders.length > 0) {
                await switchToFolder(folders[0].id);
            } else {
                // No folders left, clear applications view
                await renderApplications();
                updateStats();
            }
        }
        
    } catch (error) {
        console.error('Error deleting folder:', error);
        alert('Error deleting folder: ' + error.message);
        confirmModal.style.display = 'none';
    }
}

// Initialize folder event listeners
export function initFolderListeners() {
    // Create folder button
    document.getElementById('create-folder-btn').addEventListener('click', openCreateFolderModal);
    
    // Edit current season button
    document.getElementById('edit-season-btn').addEventListener('click', () => {
        const currentFolderId = getCurrentFolderId();
        if (currentFolderId) {
            openEditFolderModal(currentFolderId);
        }
    });
    
    // Delete current season button
    document.getElementById('delete-season-btn').addEventListener('click', () => {
        const currentFolderId = getCurrentFolderId();
        if (currentFolderId) {
            openDeleteFolderModal(currentFolderId);
        }
    });
    
    // Close folder modal
    document.getElementById('close-folder-modal').addEventListener('click', closeFolderModal);
    
    // Folder form submission
    document.getElementById('folder-form').addEventListener('submit', handleFolderFormSubmit);
    
    // Close folder modal when clicking outside
    document.getElementById('folder-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('folder-modal')) {
            closeFolderModal();
        }
    });
    
    // Folder deletion confirmation modal events
    document.getElementById('confirm-delete-folder-btn').addEventListener('click', handleFolderDeletion);
    
    document.getElementById('cancel-delete-folder-btn').addEventListener('click', () => {
        document.getElementById('confirm-delete-folder-modal').style.display = 'none';
    });
    
    document.getElementById('close-confirm-folder-modal').addEventListener('click', () => {
        document.getElementById('confirm-delete-folder-modal').style.display = 'none';
    });
    
    // Close confirmation modal when clicking outside
    document.getElementById('confirm-delete-folder-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirm-delete-folder-modal')) {
            document.getElementById('confirm-delete-folder-modal').style.display = 'none';
        }
    });
} 