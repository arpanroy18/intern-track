// Firebase Authentication Service
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';

// Auth state management
let currentUser = null;
let authStateCallbacks = [];

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    authStateCallbacks.forEach(callback => callback(user));
    
    // Show/hide UI elements based on auth state
    updateUIForAuthState(user);
});

// Register callback for auth state changes
export function onAuthStateChange(callback) {
    authStateCallbacks.push(callback);
    // Call immediately with current state
    callback(currentUser);
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
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    
    if (user) {
        // User is signed in
        if (authContainer) authContainer.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        if (userEmail) userEmail.textContent = user.email;
        if (userInfo) userInfo.style.display = 'block';
    } else {
        // User is signed out
        if (authContainer) authContainer.style.display = 'block';
        if (appContainer) appContainer.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
} 