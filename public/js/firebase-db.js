// Firebase Firestore Database Service
import { getDb } from './firebase-config.js';
import { getCurrentUser } from './firebase-auth.js';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

// Collections
const APPLICATIONS_COLLECTION = 'applications';
const STATUS_EVENTS_COLLECTION = 'statusEvents';
const FOLDERS_COLLECTION = 'folders';

let db = null;

// Initialize database connection
async function initializeDb() {
    if (!db) {
        db = await getDb();
    }
    return db;
}

// Get user-specific collection reference
async function getUserApplicationsRef(userId) {
    const database = await initializeDb();
    return collection(database, 'users', userId, APPLICATIONS_COLLECTION);
}

async function getUserStatusEventsRef(userId) {
    const database = await initializeDb();
    return collection(database, 'users', userId, STATUS_EVENTS_COLLECTION);
}

async function getUserFoldersRef(userId) {
    const database = await initializeDb();
    return collection(database, 'users', userId, FOLDERS_COLLECTION);
}

// Folder management functions
export async function getFolders() {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.error('No user logged in');
            return [];
        }

        const foldersRef = await getUserFoldersRef(user.uid);
        const q = query(foldersRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const folders = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Handle timestamps
            if (data.createdAt && data.createdAt.toDate) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            
            folders.push({
                id: doc.id,
                ...data
            });
        });
        
        return folders;
    } catch (error) {
        console.error('Error fetching folders:', error);
        return [];
    }
}

export async function createFolder(folderData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const foldersRef = await getUserFoldersRef(user.uid);
        
        const folder = {
            name: folderData.name,
            description: folderData.description || '',
            userId: user.uid,
            createdAt: serverTimestamp(),
            isDefault: false
        };

        const docRef = await addDoc(foldersRef, folder);
        
        return {
            success: true,
            id: docRef.id,
            folder: {
                ...folder,
                id: docRef.id
            }
        };
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

export async function updateFolder(folderId, updatedData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const database = await initializeDb();
        const folderRef = doc(database, 'users', user.uid, FOLDERS_COLLECTION, folderId);
        
        const updateData = {
            name: updatedData.name,
            description: updatedData.description || ''
        };

        await updateDoc(folderRef, updateData);
        
        return { success: true };
    } catch (error) {
        console.error('Error updating folder:', error);
        throw error;
    }
}

export async function deleteFolder(folderId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        // First, check if this folder has any applications
        const applicationsRef = await getUserApplicationsRef(user.uid);
        const appsQuery = query(applicationsRef, where('folderId', '==', folderId));
        const appsSnapshot = await getDocs(appsQuery);
        
        if (!appsSnapshot.empty) {
            throw new Error('Cannot delete folder that contains applications. Please move or delete applications first.');
        }

        const database = await initializeDb();
        const folderRef = doc(database, 'users', user.uid, FOLDERS_COLLECTION, folderId);
        await deleteDoc(folderRef);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting folder:', error);
        throw error;
    }
}

// Create default folder for new users
async function createDefaultFolder() {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // Determine the season based on current month
        let season, year;
        if (currentMonth >= 0 && currentMonth <= 4) { // Jan-May: Spring
            season = 'Spring';
            year = currentYear;
        } else if (currentMonth >= 5 && currentMonth <= 7) { // Jun-Aug: Summer
            season = 'Summer';
            year = currentYear;
        } else if (currentMonth >= 8 && currentMonth <= 10) { // Sep-Nov: Fall
            season = 'Fall';
            year = currentYear + 1; // Fall internships are usually for next year
        } else { // Dec: Winter
            season = 'Winter';
            year = currentYear + 1;
        }

        const folderData = {
            name: `${season} ${year}`,
            description: `${season} ${year} internship applications`,
            isDefault: true
        };

        const result = await createFolder(folderData);
        return result.folder;
    } catch (error) {
        console.error('Error creating default folder:', error);
        return null;
    }
}

// Get all applications for current user with optional folder filter
export async function getApplications(folderId = null) {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.error('No user logged in');
            return [];
        }

        const applicationsRef = await getUserApplicationsRef(user.uid);
        let q;
        
        if (folderId) {
            // Use only where clause to avoid compound index requirements
            q = query(applicationsRef, where('folderId', '==', folderId));
        } else {
            // Get all applications if no folder filter
            q = query(applicationsRef);
        }
        
        const snapshot = await getDocs(q);
        
        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Handle dateApplied - support both timestamp and string formats
            if (data.dateApplied) {
                if (data.dateApplied.toDate) {
                    // It's a Firestore timestamp, convert to YYYY-MM-DD
                    data.dateApplied = data.dateApplied.toDate().toISOString().split('T')[0];
                } else if (typeof data.dateApplied === 'string') {
                    // It's already a string, keep as is
                    data.dateApplied = data.dateApplied;
                }
            }
            
            // Handle lastUpdated and createdAt timestamps
            if (data.lastUpdated && data.lastUpdated.toDate) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
            }
            if (data.createdAt && data.createdAt.toDate) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            
            applications.push({
                id: doc.id,
                ...data
            });
        });
        
        // Sort in JavaScript instead of Firestore to avoid compound index
        applications.sort((a, b) => {
            const dateA = new Date(a.lastUpdated || a.createdAt || 0);
            const dateB = new Date(b.lastUpdated || b.createdAt || 0);
            return dateB - dateA; // Newest first
        });
        
        console.log(`Retrieved ${applications.length} applications for folder: ${folderId || 'all'}`);
        return applications;
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

// Add new application - now requires folderId
export async function addApplication(application, folderId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        if (!folderId) {
            throw new Error('Folder ID is required');
        }

        console.log('Firebase: Adding application to folder:', folderId);
        const applicationsRef = await getUserApplicationsRef(user.uid);
        
        // Prepare application data
        const applicationData = {
            ...application,
            userId: user.uid,
            folderId: folderId,
            dateApplied: new Date().toISOString().split('T')[0], // Use current local date in YYYY-MM-DD format
            lastUpdated: serverTimestamp(),
            hadInterview: application.status === 'Interview' || application.status === 'Offer' ? true : false,
            createdAt: serverTimestamp()
        };

        console.log('Firebase: Application data to save:', applicationData);
        const docRef = await addDoc(applicationsRef, applicationData);
        console.log('Firebase: Application saved with ID:', docRef.id);
        
        return {
            success: true,
            id: docRef.id,
            application: {
                ...application,
                id: docRef.id,
                folderId: folderId
            }
        };
    } catch (error) {
        console.error('Firebase: Error adding application:', error);
        throw error;
    }
}

// Update application
export async function updateApplication(id, updatedApplication) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const database = await initializeDb();
        const applicationRef = doc(database, 'users', user.uid, APPLICATIONS_COLLECTION, id);
        
        // Get existing application to check for status changes
        const existingDoc = await getDoc(applicationRef);
        if (!existingDoc.exists()) {
            throw new Error('Application not found');
        }
        
        const existingData = existingDoc.data();
        
        // Prepare updated data
        const updateData = {
            ...updatedApplication,
            dateApplied: new Date(updatedApplication.dateApplied),
            lastUpdated: serverTimestamp(),
            hadInterview: updatedApplication.status === 'Interview' || 
                         updatedApplication.status === 'Offer' || 
                         existingData.hadInterview ? true : false
        };

        // Record status change if status is different
        if (existingData.status !== updatedApplication.status) {
            console.log('Status change detected:', {
                applicationId: id,
                oldStatus: existingData.status,
                newStatus: updatedApplication.status
            });
            await recordStatusEvent(user.uid, id, existingData.status, updatedApplication.status);
        }

        await updateDoc(applicationRef, updateData);
        
        return { success: true };
    } catch (error) {
        console.error('Error updating application:', error);
        throw error;
    }
}

// Delete application
export async function deleteApplication(id) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const database = await initializeDb();
        const applicationRef = doc(database, 'users', user.uid, APPLICATIONS_COLLECTION, id);
        await deleteDoc(applicationRef);
        
        // Also delete related status events
        await deleteStatusEvents(user.uid, id);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting application:', error);
        throw error;
    }
}

// Clear all applications for user
export async function clearAllApplications() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const applicationsRef = await getUserApplicationsRef(user.uid);
        const snapshot = await getDocs(applicationsRef);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        // Also clear status events
        const statusEventsRef = await getUserStatusEventsRef(user.uid);
        const statusSnapshot = await getDocs(statusEventsRef);
        statusSnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        return { success: true };
    } catch (error) {
        console.error('Error clearing applications:', error);
        throw error;
    }
}

// Record status change event
async function recordStatusEvent(userId, applicationId, oldStatus, newStatus) {
    try {
        const statusEventsRef = await getUserStatusEventsRef(userId);
        
        const eventData = {
            applicationId: applicationId,
            oldStatus: oldStatus,
            newStatus: newStatus,
            timestamp: serverTimestamp(),
            userId: userId
        };
        
        console.log('Recording status event:', eventData);
        const docRef = await addDoc(statusEventsRef, eventData);
        console.log('Status event recorded with ID:', docRef.id);
    } catch (error) {
        console.error('Error recording status event:', error);
    }
}

// Delete status events for an application
async function deleteStatusEvents(userId, applicationId) {
    try {
        const statusEventsRef = await getUserStatusEventsRef(userId);
        const q = query(statusEventsRef, where('applicationId', '==', applicationId));
        const snapshot = await getDocs(q);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
    } catch (error) {
        console.error('Error deleting status events:', error);
    }
}

// Get status events for an application
export async function getStatusEvents(applicationId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.log('No user logged in for getStatusEvents');
            return [];
        }

        console.log('Fetching status events for application:', applicationId);
        const statusEventsRef = await getUserStatusEventsRef(user.uid);
        const q = query(
            statusEventsRef,
            where('applicationId', '==', applicationId)
        );
        
        const snapshot = await getDocs(q);
        const events = [];
        
        console.log('Status events snapshot size:', snapshot.size);
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Raw status event data:', data);
            // Convert Firestore timestamp to ISO string
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            events.push({
                id: doc.id,
                ...data
            });
        });
        
        // Sort events by timestamp in JavaScript (ascending order)
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        console.log('Processed status events:', events);
        return events;
    } catch (error) {
        console.error('Error fetching status events:', error);
        return [];
    }
}

// Listen to real-time updates
export async function subscribeToApplications(callback) {
    const user = getCurrentUser();
    if (!user) {
        console.error('No user logged in');
        return () => {}; // Return empty unsubscribe function
    }

    const applicationsRef = await getUserApplicationsRef(user.uid);
    const q = query(applicationsRef, orderBy('lastUpdated', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Handle dateApplied - support both timestamp and string formats
            if (data.dateApplied) {
                if (data.dateApplied.toDate) {
                    // It's a Firestore timestamp, convert to YYYY-MM-DD
                    data.dateApplied = data.dateApplied.toDate().toISOString().split('T')[0];
                } else if (typeof data.dateApplied === 'string') {
                    // It's already a string, keep as is
                    data.dateApplied = data.dateApplied;
                }
            }
            
            // Handle lastUpdated and createdAt timestamps
            if (data.lastUpdated && data.lastUpdated.toDate) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
            }
            if (data.createdAt && data.createdAt.toDate) {
                data.createdAt = data.createdAt.toDate().toISOString();
            }
            
            applications.push({
                id: doc.id,
                ...data
            });
        });
        callback(applications);
    }, (error) => {
        console.error('Error listening to applications:', error);
    });
}

// Fix existing applications with future dates (one-time fix)
export async function fixApplicationDates() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const applications = await getApplications();
        const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Tomorrow's date
        
        console.log('Today:', today);
        console.log('Tomorrow:', tomorrow);
        
        for (const app of applications) {
            console.log('Checking application:', app.company, 'Date:', app.dateApplied);
            
            // If dateApplied is tomorrow, change it to today
            if (app.dateApplied === tomorrow) {
                console.log('Fixing date for application:', app.company);
                
                const database = await initializeDb();
                const applicationRef = doc(database, 'users', user.uid, APPLICATIONS_COLLECTION, app.id);
                await updateDoc(applicationRef, {
                    dateApplied: today
                });
                
                console.log('Fixed date for:', app.company, 'from', tomorrow, 'to', today);
            }
        }
        
        return { success: true, message: 'Application dates fixed' };
    } catch (error) {
        console.error('Error fixing application dates:', error);
        throw error;
    }
} 