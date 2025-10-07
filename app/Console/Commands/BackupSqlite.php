<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class BackupSqlite extends Command
{
    protected $signature = 'backup:sqlite';
    protected $description = 'Backup SQLite database with compression and encryption';

    public function handle(): int
    {
        $dbPath = database_path('database.sqlite');
        if (!file_exists($dbPath)) {
            $this->error('SQLite database not found at '.$dbPath);
            return self::FAILURE;
        }

        $backupDir = storage_path('backups');
        if (!is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $timestamp = now()->format('Ymd_His');
        $raw = file_get_contents($dbPath);
        $compressed = gzencode($raw, 9);

        // Derive 32-byte key from app key
        $appKey = config('app.key');
        $key = hash('sha256', (string) $appKey, true);
        $iv = random_bytes(16);
        $cipher = 'AES-256-CBC';
        $encrypted = openssl_encrypt($compressed, $cipher, $key, OPENSSL_RAW_DATA, $iv);
        if ($encrypted === false) {
            $this->error('OpenSSL encryption failed');
            return self::FAILURE;
        }

        // Store as base64(iv)|ciphertext
        $payload = base64_encode($iv)."\n".$encrypted;
        $file = $backupDir.DIRECTORY_SEPARATOR."sqlite_{$timestamp}.enc";
        file_put_contents($file, $payload);

        $this->info('Backup created: '.$file);
        return self::SUCCESS;
    }
}

