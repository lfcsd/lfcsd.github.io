<?php
session_start();

// Verify admin is logged in
if (!isset($_SESSION['admin_logged_in'])) {
    header('HTTP/1.0 403 Forbidden');
    die('Access denied');
}

// Handle actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_once 'admin-config.php'; // Contains our storage configuration
    
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        case 'set_day':
            $day = (int)($_POST['day'] ?? 0);
            if ($day === 1 || $day === 2) {
                file_put_contents(DATA_FILE, json_encode([
                    'manual_day' => $day,
                    'special_schedule' => 'Regular Day'
                ]));
                echo json_encode(['status' => 'success', 'message' => "Day set to $day"]);
            }
            break;
            
        case 'set_schedule':
            $schedule = $_POST['schedule'] ?? '';
            if (in_array($schedule, ['Half-Day', '2hr Delay', 'Regular Day'])) {
                $current = json_decode(file_get_contents(DATA_FILE), true) ?? [];
                $current['special_schedule'] = $schedule;
                file_put_contents(DATA_FILE, json_encode($current));
                echo json_encode(['status' => 'success', 'message' => "Schedule set to $schedule"]);
            }
            break;
            
        case 'reset':
            file_put_contents(DATA_FILE, json_encode([
                'manual_day' => null,
                'special_schedule' => 'Regular Day'
            ]));
            echo json_encode(['status' => 'success', 'message' => 'Reset to automatic day detection']);
            break;
            
        default:
            header('HTTP/1.0 400 Bad Request');
            echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
    }
} else {
    header('HTTP/1.0 405 Method Not Allowed');
    die('Method not allowed');
}
?>
