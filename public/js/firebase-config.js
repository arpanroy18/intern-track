// Firebase Configuration
// Firebase services are loaded globally via CDN in index.html

let auth = null;
let db = null;
let app = null;
let initPromise = null;

// Initialize Firebase services
function initializeFirebaseServices() {
    if (initPromise) {
        return initPromise;
    }
    
    initPromise = new Promise((resolve, reject) => {
        // Check if Firebase is already ready
        if (window.firebaseReady && window.firebaseAuth && window.firebaseDb && window.firebaseApp) {
            auth = window.firebaseAuth;
            db = window.firebaseDb;
            app = window.firebaseApp;
            resolve();
            return;
        }
        
        // Wait for Firebase ready event
        const handleFirebaseReady = () => {
            if (window.firebaseAuth && window.firebaseDb && window.firebaseApp) {
                auth = window.firebaseAuth;
                db = window.firebaseDb;
                app = window.firebaseApp;
                resolve();
            } else {
                reject(new Error('Firebase services not properly initialized'));
            }
        };
        
        if (window.firebaseReady) {
            handleFirebaseReady();
        } else {
            window.addEventListener('firebaseReady', handleFirebaseReady, { once: true });
            
            // Timeout fallback
            setTimeout(() => {
                if (!auth || !db || !app) {
                    reject(new Error('Firebase initialization timeout'));
                }
            }, 10000);
        }
    });
    
    return initPromise;
}

// Export functions that wait for initialization
export async function getAuth() {
    await initializeFirebaseServices();
    return auth;
}

export async function getDb() {
    await initializeFirebaseServices();
    return db;
}

export async function getApp() {
    await initializeFirebaseServices();
    return app;
}

// Legacy exports for backward compatibility (these will wait for initialization)
export const authPromise = getAuth();
export const dbPromise = getDb();
export const appPromise = getApp();

// Synchronous exports (use with caution - only after Firebase is ready)
export { auth, db };
export default app; 