<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class BackupRestore extends Command
{
    protected $signature = 'backup:restore {file}';
    protected $description = 'Restore SQLite database from encrypted backup';

    public function handle(): int
    {
        $file = $this->argument('file');
        $path = $file;
        if (!str_starts_with($file, storage_path())) {
            $path = storage_path('backups'.DIRECTORY_SEPARATOR.$file);
        }
        if (!file_exists($path)) {
            $this->error('Backup file not found: '.$path);
            return self::FAILURE;
        }

        $contents = file_get_contents($path);
        [$ivB64, $encrypted] = explode("\n", $contents, 2);
        $iv = base64_decode($ivB64);

        $appKey = config('app.key');
        $key = hash('sha256', (string) $appKey, true);
        $cipher = 'AES-256-CBC';
        $decompressedRaw = openssl_decrypt($encrypted, $cipher, $key, OPENSSL_RAW_DATA, $iv);
        if ($decompressedRaw === false) {
            $this->error('OpenSSL decryption failed');
            return self::FAILURE;
        }
        $raw = @gzdecode($decompressedRaw);
        if ($raw === false) {
            $this->error('Gzip decompression failed');
            return self::FAILURE;
        }

        $dbPath = database_path('database.sqlite');
        // Optional: create backup of current db
        if (file_exists($dbPath)) {
            copy($dbPath, $dbPath.'.bak_'.now()->format('Ymd_His'));
        }
        file_put_contents($dbPath, $raw);
        $this->info('Database restored to '.$dbPath);
        return self::SUCCESS;
    }
}

