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
