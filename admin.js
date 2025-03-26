// Simple SHA-256 hashing (not truly secure but obscures credentials)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const ADMIN_CREDS = {
    username: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    password: 'dfeac2b4de01e15d7e2a0c93f2c55a5178c824c0d21d6bc8c298b5b46ef31ded'
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            // Hash the entered credentials
            const usernameHash = await hashString(username);
            const passwordHash = await hashString(password);
            
            // Compare with stored hashes
            if (usernameHash === CORRECT_USERNAME_HASH && passwordHash === CORRECT_PASSWORD_HASH) {
                loginContainer.style.display = 'none';
                adminPanel.style.display = 'block';
                errorMessage.style.display = 'none';
            } else {
                showError('Invalid username or password');
            }
        } catch (error) {
            showError('An error occurred during login');
            console.error('Login error:', error);
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
});

// SHA-256 hashing function
async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Admin control functions
function setDay(day) {
    localStorage.setItem('lfcsd_manualDay', day);
    localStorage.setItem('lfcsd_autoMode', 'false');
    alert(`Day set to ${day}. Changes will appear on the main page.`);
}

function setSchedule(type) {
    localStorage.setItem('lfcsd_schedule', type);
    alert(`Schedule set to ${type}. Changes will appear on the main page.`);
}

function resetAuto() {
    localStorage.setItem('lfcsd_autoMode', 'true');
    alert('Reset to automatic day detection. Changes will appear on the main page.');
}

// Make functions available globally
window.setDay = setDay;
window.setSchedule = setSchedule;
window.resetAuto = resetAuto;
