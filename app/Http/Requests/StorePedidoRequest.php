<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePedidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'cliente' => ['required', 'string', 'max:255'],
            'direccion' => ['required', 'string', 'max:500'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'total' => ['required', 'numeric', 'min:0'],
        ];
    }
}

