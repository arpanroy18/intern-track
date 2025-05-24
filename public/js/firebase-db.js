// Firebase Firestore Database Service
import { db } from './firebase-config.js';
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

// Get user-specific collection reference
function getUserApplicationsRef(userId) {
    return collection(db, 'users', userId, APPLICATIONS_COLLECTION);
}

function getUserStatusEventsRef(userId) {
    return collection(db, 'users', userId, STATUS_EVENTS_COLLECTION);
}

// Get all applications for current user
export async function getApplications() {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.error('No user logged in');
            return [];
        }

        const applicationsRef = getUserApplicationsRef(user.uid);
        const q = query(applicationsRef, orderBy('lastUpdated', 'desc'));
        const snapshot = await getDocs(q);
        
        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore timestamps to ISO strings
            if (data.dateApplied && data.dateApplied.toDate) {
                data.dateApplied = data.dateApplied.toDate().toISOString().split('T')[0];
            }
            if (data.lastUpdated && data.lastUpdated.toDate) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
            }
            applications.push({
                id: doc.id,
                ...data
            });
        });
        
        return applications;
    } catch (error) {
        console.error('Error fetching applications:', error);
        return [];
    }
}

// Add new application
export async function addApplication(application) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('No user logged in');
        }

        const applicationsRef = getUserApplicationsRef(user.uid);
        
        // Prepare application data
        const applicationData = {
            ...application,
            userId: user.uid,
            dateApplied: serverTimestamp(), // Use server timestamp to match createdAt
            lastUpdated: serverTimestamp(),
            hadInterview: application.status === 'Interview' || application.status === 'Offer' ? true : false,
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(applicationsRef, applicationData);
        
        return {
            success: true,
            id: docRef.id,
            application: {
                ...application,
                id: docRef.id
            }
        };
    } catch (error) {
        console.error('Error adding application:', error);
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

        const applicationRef = doc(db, 'users', user.uid, APPLICATIONS_COLLECTION, id);
        
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

        const applicationRef = doc(db, 'users', user.uid, APPLICATIONS_COLLECTION, id);
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

        const applicationsRef = getUserApplicationsRef(user.uid);
        const snapshot = await getDocs(applicationsRef);
        
        const deletePromises = [];
        snapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        // Also clear status events
        const statusEventsRef = getUserStatusEventsRef(user.uid);
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
        const statusEventsRef = getUserStatusEventsRef(userId);
        
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
        const statusEventsRef = getUserStatusEventsRef(userId);
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
        const statusEventsRef = getUserStatusEventsRef(user.uid);
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
export function subscribeToApplications(callback) {
    const user = getCurrentUser();
    if (!user) {
        console.error('No user logged in');
        return () => {}; // Return empty unsubscribe function
    }

    const applicationsRef = getUserApplicationsRef(user.uid);
    const q = query(applicationsRef, orderBy('lastUpdated', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const applications = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore timestamps to ISO strings
            if (data.dateApplied && data.dateApplied.toDate) {
                data.dateApplied = data.dateApplied.toDate().toISOString().split('T')[0];
            }
            if (data.lastUpdated && data.lastUpdated.toDate) {
                data.lastUpdated = data.lastUpdated.toDate().toISOString();
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