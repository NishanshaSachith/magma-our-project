<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerArea extends Model
{
    use HasFactory;

    // If your pivot table is named 'customer_area'
    protected $table = 'customer_area';
    
    // If your primary key is 'customer_area_id'
    protected $primaryKey = 'customer_area_id';

    protected $fillable = [
        'customer_id',
        'area_id',
    ];

    /**
     * Get the customer that owns this customer area
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the area that owns this customer area
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get all branches for this customer area
     */
    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'customer_area_id', 'customer_area_id');
    }
}