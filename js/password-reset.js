// Import Firebase Auth
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

// Get Firebase configuration from firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDM4VTFBHocqRQbNzBDo4NT8L9QN_B-jEc",
    authDomain: "portfolio-64574.firebaseapp.com",
    projectId: "portfolio-64574",
    storageBucket: "portfolio-64574.appspot.com",
    messagingSenderId: "536280530710",
    appId: "1:536280530710:web:4cb253e0747e8f04d51a37",
    measurementId: "G-NSSMSRZK03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to send password reset email
async function sendPasswordReset(email) {
    try {
        // First check if the email exists in Firebase Auth
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${firebaseConfig.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: email,
                continueUri: window.location.href,
            }),
        });
        
        const data = await response.json();
        
        // If registered is false, the email doesn't exist
        if (!data.registered) {
            showMessage('No account exists with this email address.', 'error');
            return;
        }

        // If email exists, send the reset email
        await sendPasswordResetEmail(auth, email);
        showMessage('Password reset email sent! Please check your inbox.', 'success');
        closePasswordResetModal();
    } catch (error) {
        console.error('Error sending password reset email:', error);
        showMessage(getErrorMessage(error), 'error');
    }
}

// Helper function to show messages to the user
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }

    const messageElement = document.createElement('div');
    messageElement.className = `alert alert-${type}`;
    messageElement.textContent = message;
    messageElement.style.padding = '10px 20px';
    messageElement.style.marginBottom = '10px';
    messageElement.style.borderRadius = '4px';
    messageElement.style.backgroundColor = type === 'success' ? '#4CAF50' : '#f44336';
    messageElement.style.color = 'white';

    document.getElementById('messageContainer').appendChild(messageElement);

    // Remove the message after 5 seconds
    setTimeout(() => {
        messageElement.remove();
        if (document.getElementById('messageContainer').children.length === 0) {
            document.getElementById('messageContainer').remove();
        }
    }, 5000);
}

// Helper function to get user-friendly error messages
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address format. Please check and try again.';
        case 'auth/user-not-found':
            return 'No account exists with this email address.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return 'An error occurred. Please try again later.';
    }
}

// Function to close the password reset modal
function closePasswordResetModal() {
    const modal = document.getElementById('passwordResetModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear the input field
        const emailInput = document.getElementById('resetEmail');
        if (emailInput) {
            emailInput.value = '';
        }
    }
}

// Export the functions to be used in other files
export { sendPasswordReset }; 