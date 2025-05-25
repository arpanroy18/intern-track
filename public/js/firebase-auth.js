// Firebase Authentication Service
import { auth } from './firebase-config.js';

// Import Firebase auth functions from CDN
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js';

// Auth state management
let currentUser = null;
let authStateCallbacks = [];
let authStateInitialized = false;

// Initialize auth state listener with timeout fallback
try {
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authStateInitialized = true;
        authStateCallbacks.forEach(callback => callback(user));
        
        // Show/hide UI elements based on auth state
        updateUIForAuthState(user);
    });
} catch (error) {
    console.error('Error setting up auth state listener:', error);
    // Fallback to show login screen
    setTimeout(() => {
        updateUIForAuthState(null);
    }, 100);
}

// Add timeout fallback to prevent infinite loading
setTimeout(() => {
    if (!authStateInitialized) {
        console.warn('Auth state check timed out, showing login screen');
        updateUIForAuthState(null);
    }
}, 5000); // 5 second timeout

// Register callback for auth state changes
export function onAuthStateChange(callback) {
    authStateCallbacks.push(callback);
    // Call immediately with current state if already initialized
    if (authStateInitialized) {
        callback(currentUser);
    }
}

// Get current user
export function getCurrentUser() {
    return currentUser;
}

// Sign up with email and password
export async function signUp(email, password, displayName = '') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with display name if provided
        if (displayName) {
            await updateProfile(userCredential.user, {
                displayName: displayName
            });
        }
        
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in with email and password
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign in with Google
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { success: false, error: error.message };
    }
}

// Sign out
export async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// Update UI based on authentication state
function updateUIForAuthState(user) {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const loadingContainer = document.getElementById('loading-container');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    
    // Always hide loading container
    if (loadingContainer) {
        loadingContainer.classList.add('fade-out');
        setTimeout(() => {
            loadingContainer.style.display = 'none';
        }, 300); // Match CSS transition duration
    }
    
    // Ensure at least one container is shown
    if (!authContainer && !appContainer) {
        console.error('Neither auth nor app container found in DOM');
        return;
    }
    
    if (user) {
        // User is signed in
        if (authContainer) {
            authContainer.style.display = 'none';
            authContainer.classList.remove('show');
        }
        if (appContainer) {
            appContainer.style.display = 'block';
            // Small delay to ensure display change takes effect before fade in
            setTimeout(() => {
                appContainer.classList.add('show');
            }, 10);
        }
        if (userEmail) userEmail.textContent = user.email;
        if (userInfo) userInfo.style.display = 'block';
    } else {
        // User is signed out
        if (appContainer) {
            appContainer.style.display = 'none';
            appContainer.classList.remove('show');
        }
        if (authContainer) {
            authContainer.style.display = 'block';
            // Small delay to ensure display change takes effect before fade in
            setTimeout(() => {
                authContainer.classList.add('show');
            }, 10);
        }
        if (userInfo) userInfo.style.display = 'none';
    }
} 