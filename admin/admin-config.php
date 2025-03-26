<?php
// Secure configuration - this should be outside web root if possible
define('DATA_FILE', dirname(__FILE__) . '/data/admin-data.json');

// Create data directory if it doesn't exist
if (!file_exists(dirname(DATA_FILE))) {
    mkdir(dirname(DATA_FILE), 0700, true);
}

// Initialize data file if it doesn't exist
if (!file_exists(DATA_FILE)) {
    file_put_contents(DATA_FILE, json_encode([
        'manual_day' => null,
        'special_schedule' => 'Regular Day'
    ]));
}
?>
