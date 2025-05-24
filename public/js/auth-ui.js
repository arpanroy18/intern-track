// Authentication UI Handler
import { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signOutUser, 
    onAuthStateChange 
} from './firebase-auth.js';

let isSignUpMode = false;

// Initialize authentication UI
export function initAuthUI() {
    const authForm = document.getElementById('auth-form');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const googleSignInBtn = document.getElementById('google-sign-in');
    const signOutBtn = document.getElementById('sign-out-btn');

    // Form submission
    authForm.addEventListener('submit', handleAuthSubmit);
    
    // Switch between login and signup
    authSwitchBtn.addEventListener('click', toggleAuthMode);
    
    // Google sign in
    googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    
    // Sign out
    if (signOutBtn) {
        signOutBtn.addEventListener('click', handleSignOut);
    }

    // Listen for auth state changes
    onAuthStateChange((user) => {
        if (user) {
            console.log('User signed in:', user.email);
        } else {
            console.log('User signed out');
        }
    });
}

// Handle form submission
async function handleAuthSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    
    const submitBtn = document.getElementById('auth-submit');
    const submitText = document.getElementById('auth-submit-text');
    
    // Show loading state
    setButtonLoading(submitBtn, submitText, true);
    hideError();
    
    try {
        let result;
        
        if (isSignUpMode) {
            result = await signUp(email, password, name);
        } else {
            result = await signIn(email, password);
        }
        
        if (!result.success) {
            showError(result.error);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        setButtonLoading(submitBtn, submitText, false);
    }
}

// Handle Google sign in
async function handleGoogleSignIn() {
    const googleBtn = document.getElementById('google-sign-in');
    const originalText = googleBtn.innerHTML;
    
    // Show loading state
    googleBtn.disabled = true;
    googleBtn.innerHTML = '<div class="auth-loading"></div> Signing in...';
    hideError();
    
    try {
        const result = await signInWithGoogle();
        
        if (!result.success) {
            showError(result.error);
        }
    } catch (error) {
        showError(error.message);
    } finally {
        googleBtn.disabled = false;
        googleBtn.innerHTML = originalText;
    }
}

// Handle sign out
async function handleSignOut() {
    const signOutBtn = document.getElementById('sign-out-btn');
    const originalText = signOutBtn.textContent;
    
    signOutBtn.disabled = true;
    signOutBtn.textContent = 'Signing out...';
    
    try {
        const result = await signOutUser();
        
        if (!result.success) {
            console.error('Sign out error:', result.error);
        }
    } catch (error) {
        console.error('Sign out error:', error);
    } finally {
        signOutBtn.disabled = false;
        signOutBtn.textContent = originalText;
    }
}

// Toggle between sign in and sign up modes
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const authSubmitText = document.getElementById('auth-submit-text');
    const authSwitchText = document.getElementById('auth-switch-text');
    const authSwitchBtn = document.getElementById('auth-switch-btn');
    const nameGroup = document.getElementById('name-group');
    
    if (isSignUpMode) {
        // Switch to sign up mode
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to start tracking your applications';
        authSubmitText.textContent = 'Sign Up';
        authSwitchText.textContent = 'Already have an account? ';
        authSwitchBtn.textContent = 'Sign in';
        nameGroup.style.display = 'flex';
    } else {
        // Switch to sign in mode
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to your account to continue';
        authSubmitText.textContent = 'Sign In';
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchBtn.textContent = 'Sign up';
        nameGroup.style.display = 'none';
    }
    
    // Clear form and hide errors
    document.getElementById('auth-form').reset();
    hideError();
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('auth-error');
    errorDiv.style.display = 'none';
}

// Set button loading state
function setButtonLoading(button, textElement, isLoading) {
    if (isLoading) {
        button.disabled = true;
        textElement.innerHTML = '<div class="auth-loading"></div>';
    } else {
        button.disabled = false;
        textElement.textContent = isSignUpMode ? 'Sign Up' : 'Sign In';
    }
} 