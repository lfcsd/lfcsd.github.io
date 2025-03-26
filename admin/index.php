<?php
// Secure Admin Page - credentials are validated server-side
session_start();

// Configuration - CHANGE THESE VALUES
$admin_username = 'admin';
$admin_password = 'lfcsddays1!'; // Use a strong password

// Check if user is already logged in
if (isset($_SESSION['admin_logged_in']) {
    displayAdminPanel();
    exit;
}

// Check login attempt
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username === $admin_username && $password === $admin_password) {
        $_SESSION['admin_logged_in'] = true;
        displayAdminPanel();
        exit;
    } else {
        $error = "Invalid credentials";
    }
}

// Show login form
displayLoginForm($error ?? '');

// Functions
function displayLoginForm($error) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LFCSD Admin Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="admin.css">
    </head>
    <body>
        <div class="login-container">
            <h2>Admin Login</h2>
            <?php if ($error): ?>
                <div class="error"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            <form method="POST">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">Login</button>
            </form>
        </div>
    </body>
    </html>
    <?php
}

function displayAdminPanel() {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LFCSD Admin Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@700&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="admin.css">
    </head>
    <body>
        <div class="admin-panel">
            <h2>Admin Controls</h2>
            <div class="admin-buttons">
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="set_day">
                    <input type="hidden" name="day" value="1">
                    <button type="submit" class="admin-btn">Day 1</button>
                </form>
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="set_day">
                    <input type="hidden" name="day" value="2">
                    <button type="submit" class="admin-btn">Day 2</button>
                </form>
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="set_schedule">
                    <input type="hidden" name="schedule" value="Half-Day">
                    <button type="submit" class="admin-btn">Half-Day</button>
                </form>
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="set_schedule">
                    <input type="hidden" name="schedule" value="2hr Delay">
                    <button type="submit" class="admin-btn">2 Hour Delay</button>
                </form>
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="set_schedule">
                    <input type="hidden" name="schedule" value="Regular Day">
                    <button type="submit" class="admin-btn">Regular Day</button>
                </form>
                <form action="admin-action.php" method="POST">
                    <input type="hidden" name="action" value="reset">
                    <button type="submit" class="admin-btn">Reset to Auto</button>
                </form>
            </div>
            <div class="logout-btn">
                <a href="admin.php?logout=1">Logout</a>
            </div>
        </div>
    </body>
    </html>
    <?php
}

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}
?>
