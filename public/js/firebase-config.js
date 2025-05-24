// Firebase Configuration
// Firebase services are loaded globally via CDN in index.html

// Get Firebase services from global variables
export const auth = window.firebaseAuth;
export const db = window.firebaseDb;
export default window.firebaseApp; 