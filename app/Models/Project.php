<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'title',
        'title_ar',
        'slug',
        'category',
        'client',
        'client_ar',
        'description',
        'description_ar',
        'external_url',
        'image_url',
        'color',
        'sort_order',
        'is_published',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_published' => 'boolean',
    ];
}
