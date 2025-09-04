<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete()->unique();
            $table->foreignId('motociclista_id')->constrained('users');
            $table->enum('status', ['en_progreso', 'entregado', 'no_entregado'])->default('en_progreso');
            $table->string('observacion')->nullable();
            $table->dateTime('entregado_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entregas');
    }
};

