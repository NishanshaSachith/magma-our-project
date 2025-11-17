<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Area extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
    ];

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'customer_area', 'area_id', 'customer_id');
    }

    public function branches()
    {
        return $this->hasManyThrough(
            \App\Models\Branch::class,
            \App\Models\CustomerArea::class,
            'area_id', // Foreign key on customer_area table...
            'customer_area_id', // Foreign key on branches table...
            'id', // Local key on areas table...
            'customer_area_id' // Local key on customer_area table...
        );
    }
}
