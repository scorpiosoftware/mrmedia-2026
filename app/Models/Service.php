<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'title',
        'title_ar',
        'description',
        'description_ar',
        'icon',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_published' => 'boolean',
    ];
}
