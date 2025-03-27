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

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!email || !password) {
        alert("Please enter both email and password");
        return;
    }

    try {
        loginForm.querySelector('button').disabled = true;
        loginForm.querySelector('button').textContent = 'Logging in...';
        
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const token = await userCredential.user.getIdTokenResult();
        
        if (!token.claims.admin) {
            throw new Error("This account doesn't have admin privileges");
        }
        
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
        
    } catch (error) {
        let message = "Login failed: ";
        if (error.code === 'auth/invalid-email') {
            message += "Invalid email format";
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message += "Invalid email or password";
        } else {
            message += error.message;
        }
        alert(message);
        await firebase.auth().signOut();
    } finally {
        loginForm.querySelector('button').disabled = false;
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
