function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; 
    }
    return hash.toString();
}

const CORRECT_USERNAME_HASH = "96354";
const CORRECT_PASSWORD_HASH = "-1386618049"

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginContainer = document.getElementById('loginContainer');
    const adminPanel = document.getElementById('adminPanel');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const usernameHash = simpleHash(username);
        const passwordHash = simpleHash(password);
        
        if (usernameHash === CORRECT_USERNAME_HASH && passwordHash === CORRECT_PASSWORD_HASH) {
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            errorMessage.style.display = 'none';
        } else {
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.style.display = 'block';
        }
    });
});

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

window.setDay = setDay;
window.setSchedule = setSchedule;
window.resetAuto = resetAuto;
