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
        const folders = await getFolders();
        const foldersContainer = document.getElementById('folders-tabs');
        const currentFolderId = getCurrentFolderId();
        
        if (folders.length === 0) {
            foldersContainer.innerHTML = '<div class="empty-folders">No seasons created yet</div>';
            return;
        }
        
        foldersContainer.innerHTML = folders.map(folder => {
            const isActive = folder.id === currentFolderId;
            return `
                <div class="folder-tab ${isActive ? 'active' : ''}" data-folder-id="${folder.id}">
                    <span class="folder-name">${folder.name}</span>
                    <div class="folder-actions">
                        <button class="folder-action-btn edit-folder" data-folder-id="${folder.id}" title="Edit season">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="folder-action-btn delete-folder" data-folder-id="${folder.id}" title="Delete season">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for folder tabs
        setupFolderTabListeners();
        
    } catch (error) {
        console.error('Error rendering folders:', error);
        document.getElementById('folders-tabs').innerHTML = '<div class="empty-folders">Error loading seasons</div>';
    }
}

// Setup event listeners for folder tabs
function setupFolderTabListeners() {
    const foldersContainer = document.getElementById('folders-tabs');
    
    // Tab click to switch folders
    foldersContainer.addEventListener('click', async (e) => {
        const folderTab = e.target.closest('.folder-tab');
        if (folderTab && !e.target.closest('.folder-actions')) {
            const folderId = folderTab.dataset.folderId;
            await switchToFolder(folderId);
        }
    });
    
    // Edit folder button
    foldersContainer.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-folder')) {
            e.stopPropagation();
            const folderId = e.target.closest('.edit-folder').dataset.folderId;
            await openEditFolderModal(folderId);
        }
    });
    
    // Delete folder button
    foldersContainer.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-folder')) {
            e.stopPropagation();
            const folderId = e.target.closest('.delete-folder').dataset.folderId;
            await openDeleteFolderModal(folderId);
        }
    });
}

// Switch to a different folder
async function switchToFolder(folderId) {
    try {
        setCurrentFolderId(folderId);
        
        // Update active tab
        document.querySelectorAll('.folder-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-folder-id="${folderId}"]`).classList.add('active');
        
        // Re-render applications and stats for the new folder
        await renderApplications();
        updateStats();
        
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
        if (folderId) {
            // Update existing folder
            await updateFolder(folderId, folderData);
        } else {
            // Create new folder
            await createFolder(folderData);
        }
        
        // Refresh folder list and close modal
        await renderFolders();
        closeFolderModal();
        
        // If this was a new folder and we have no current folder, switch to it
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