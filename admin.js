// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Get Firebase auth and db instances
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        try {
            // Show loading state
            loginForm.querySelector('button').textContent = 'Logging in...';
            
            // Sign in with email/password
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Check if user has admin privileges
            const token = await user.getIdTokenResult();
            if (!token.claims.admin) {
                throw new Error('This account is not an administrator');
            }
            
            // Success - show admin panel
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            
        } catch (error) {
            // Handle errors
            let errorMessage = 'Login failed: ';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'Account disabled';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage += 'Invalid email or password';
                    break;
                default:
                    errorMessage += error.message;
            }
            
            alert(errorMessage);
            auth.signOut();
        } finally {
            // Reset login button
            loginForm.querySelector('button').textContent = 'Login';
        }
    });

    // Admin control functions
    async function updateSettings(updates) {
        try {
            await db.collection("settings").doc("current").update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Update error:", error);
            alert("Error saving changes: " + error.message);
            return false;
        }
    }

    // Set day number (1 or 2)
    window.setDay = async function(day) {
        if (await updateSettings({
            manualDay: day,
            autoMode: false
        })) {
            alert(`Successfully set to Day ${day}`);
        }
    };

    // Set special schedule
    window.setSchedule = async function(type) {
        if (await updateSettings({
            schedule: type,
            autoMode: type === 'Regular Day'
        })) {
            alert(`Schedule set to ${type}`);
        }
    };

    // Reset to automatic mode
    window.resetAuto = async function() {
        if (await updateSettings({
            manualDay: null,
            schedule: 'Regular Day',
            autoMode: true
        })) {
            alert('Reset to automatic day detection');
        }
    };

    // Check if user is already logged in
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            try {
                const token = await user.getIdTokenResult();
                if (token.claims.admin) {
                    loginContainer.style.display = 'none';
                    adminPanel.style.display = 'block';
                } else {
                    await auth.signOut();
                }
            } catch (error) {
                console.error("Auth state error:", error);
            }
        }
    });
});
