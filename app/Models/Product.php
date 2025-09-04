<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'price', 'stock'];

    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class);
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class);
    }
}
