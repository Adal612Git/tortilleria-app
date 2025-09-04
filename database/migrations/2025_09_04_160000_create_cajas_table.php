<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opened_by')->constrained('users');
            $table->dateTime('opened_at');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->dateTime('closed_at')->nullable();
            $table->decimal('total_in', 8, 2)->default(0);
            $table->decimal('total_out', 8, 2)->default(0);
            $table->enum('status', ['abierta', 'cerrada']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cajas');
    }
};

