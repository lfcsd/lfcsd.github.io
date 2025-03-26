<?php
require_once 'admin-config.php';

header('Content-Type: application/json');

// Default data
$data = [
    'manual_day' => null,
    'special_schedule' => 'Regular Day'
];

// Load from file if exists
if (file_exists(DATA_FILE)) {
    $fileData = json_decode(file_get_contents(DATA_FILE), true);
    if ($fileData) {
        $data = array_merge($data, $fileData);
    }
}

echo json_encode($data);
?>
