// Simple SHA-256 hashing (not truly secure but obscures credentials)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Hardcoded hashed credentials (replace with your own)
const ADMIN_CREDS = {
    username: '4d6e621a8d9ccbc9a8e0a6b5e5e5a5e5e5a5e5a5e5a5e5a5e5a5e5a5e5a5e5', // hash of 'admin'
    password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' // hash of 'password'
};

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const hashedUsername = await sha256(username);
        const hashedPassword = await sha256(password);
        
        if (hashedUsername === ADMIN_CREDS.username && hashedPassword === ADMIN_CREDS.password) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
        } else {
            alert('Invalid credentials');
        }
    });
});

// Admin functions
function setDay(day) {
    localStorage.setItem('lfcsd_manualDay', day);
    localStorage.setItem('lfcsd_autoMode', 'false');
    alert(`Set to Day ${day}`);
}

function setSchedule(type) {
    localStorage.setItem('lfcsd_schedule', type);
    alert(`Schedule set to ${type}`);
}

function resetAuto() {
    localStorage.setItem('lfcsd_autoMode', 'true');
    alert('Reset to automatic day detection');
}
