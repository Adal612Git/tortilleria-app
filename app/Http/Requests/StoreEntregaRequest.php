<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEntregaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:entregado,no_entregado'],
            'observacion' => ['nullable', 'required_if:status,no_entregado', 'string', 'max:500'],
        ];
    }
}

