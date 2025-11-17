<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'email',
        'phone',
        'address',
    ];

    /**
     * Boot the model and add event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // When deleting a customer, also delete related customer_area records and branches
        static::deleting(function ($customer) {
            // Get all customer_area records for this customer
            $customerAreas = $customer->customerAreas;
            
            foreach ($customerAreas as $customerArea) {
                // Delete all branches associated with this customer_area
                $customerArea->branches()->delete();
                
                // Delete the customer_area record
                $customerArea->delete();
            }
        });
    }

    /**
     * Get the areas associated with the customer
     */
    public function areas(): BelongsToMany
    {
        return $this->belongsToMany(Area::class, 'customer_area', 'customer_id', 'area_id')
                    ->withPivot('customer_area_id')
                    ->using(CustomerArea::class);
    }

    /**
     * Get all customer areas for this customer
     */
    public function customerAreas(): HasMany
    {
        return $this->hasMany(CustomerArea::class, 'customer_id', 'id');
    }

    /**
     * Get all branches through customer areas
     */
    public function branches(): HasManyThrough
    {
        return $this->hasManyThrough(
            Branch::class,
            CustomerArea::class,
            'customer_id', // Foreign key on CustomerArea table
            'customer_area_id', // Foreign key on Branch table
            'id', // Local key on Customer table
            'customer_area_id' // Local key on CustomerArea table
        );
    }

    /**
     * Get branches grouped by area (helper method)
     */
    public function branchesByArea()
    {
        return $this->branches()->with('customerArea.area');
    }
}