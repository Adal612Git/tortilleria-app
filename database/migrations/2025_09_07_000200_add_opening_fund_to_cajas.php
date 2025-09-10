<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('cajas', 'opening_fund')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->decimal('opening_fund', 8, 2)->default(0)->after('opened_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('cajas', 'opening_fund')) {
            Schema::table('cajas', function (Blueprint $table) {
                $table->dropColumn('opening_fund');
            });
        }
    }
};

