<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone_no',
        'customer_area_id',
    ];

    /**
     * Get the customer area that owns the branch
     */
    public function customerArea(): BelongsTo
    {
        return $this->belongsTo(CustomerArea::class, 'customer_area_id', 'customer_area_id');
    }

    /**
     * Get the customer through the customer area
     */
    public function customer()
    {
        return $this->hasOneThrough(
            Customer::class,
            CustomerArea::class,
            'customer_area_id', // Foreign key on CustomerArea table
            'id', // Foreign key on Customer table
            'customer_area_id', // Local key on Branch table
            'customer_id' // Local key on CustomerArea table
        );
    }

    /**
     * Get the area through the customer area
     */
    public function area()
    {
        return $this->hasOneThrough(
            Area::class,
            CustomerArea::class,
            'customer_area_id', // Foreign key on CustomerArea table
            'id', // Foreign key on Area table
            'customer_area_id', // Local key on Branch table
            'area_id' // Local key on CustomerArea table
        );
    }
}