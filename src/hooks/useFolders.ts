import { useState, useEffect, useCallback } from 'react';
import { Folder as FolderType } from '../types';
import { JobApplicationService } from '../services/jobApplicationService';

export function useFolders() {
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(() => {
        const savedFolderId = localStorage.getItem('selectedFolderId');
        return savedFolderId ? { id: savedFolderId } as FolderType : null;
    });

    const loadFolders = useCallback(async () => {
        try {
            const foldersData = await JobApplicationService.getAllFolders();
            setFolders(foldersData);
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    }, []);

    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    useEffect(() => {
        const savedFolderId = localStorage.getItem('selectedFolderId');
        if (savedFolderId && folders.length > 0) {
            const savedFolder = folders.find(folder => folder.id === savedFolderId);
            if (savedFolder) {
                setSelectedFolder(savedFolder);
            } else {
                localStorage.removeItem('selectedFolderId');
                setSelectedFolder(null);
            }
        }
    }, [folders]);

    useEffect(() => {
        if (selectedFolder) {
            localStorage.setItem('selectedFolderId', selectedFolder.id);
        } else {
            localStorage.removeItem('selectedFolderId');
        }
    }, [selectedFolder]);

    const createFolder = useCallback(async (folderData: Omit<FolderType, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
        try {
            const newFolder = await JobApplicationService.createFolder({ ...folderData, isActive: true });
            setFolders(prev => [...prev, newFolder]);
        } catch (error) {
            console.error('Error creating folder:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create folder. Please try again.';
            if (errorMessage.includes('Folders table does not exist')) {
                alert('Database setup required: The folders table does not exist. Please run sql/folder_updates.sql in your Supabase dashboard. See DATABASE_SETUP.md for detailed instructions.');
            } else {
                alert(`Error creating folder: ${errorMessage}\n\nIf this is a database setup issue, please run sql/folder_updates.sql in your Supabase dashboard.`);
            }
        }
    }, []);

    const updateFolder = useCallback(async (id: string, folderData: Partial<FolderType>) => {
        try {
            const updatedFolder = await JobApplicationService.updateFolder(id, { ...folderData, isActive: true });
            setFolders(prev => prev.map(f => f.id === id ? updatedFolder : f));
        } catch (error) {
            console.error('Error updating folder:', error);
            alert('Failed to update folder. Please try again.');
        }
    }, []);

    const deleteFolder = useCallback(async (id: string) => {
        if (window.confirm('Are you sure you want to delete this folder? Jobs in this folder will not be deleted.')) {
            try {
                await JobApplicationService.deleteFolder(id);
                setFolders(prev => prev.filter(f => f.id !== id));
                if (selectedFolder?.id === id) {
                    setSelectedFolder(null);
                }
            } catch (error) {
                console.error('Error deleting folder:', error);
                alert('Failed to delete folder. Please try again.');
            }
        }
    }, [selectedFolder]);

    return { folders, selectedFolder, setSelectedFolder, createFolder, updateFolder, deleteFolder };
}
