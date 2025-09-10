<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'cost')) {
            Schema::table('products', function (Blueprint $table) {
                $table->decimal('cost', 8, 2)->default(0)->after('price');
            });
        }
        if (!Schema::hasColumn('users', 'salary')) {
            Schema::table('users', function (Blueprint $table) {
                $table->decimal('salary', 10, 2)->nullable()->after('password');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('products', 'cost')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('cost');
            });
        }
        if (Schema::hasColumn('users', 'salary')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('salary');
            });
        }
    }
};

