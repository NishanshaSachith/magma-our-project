<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'jobhomeid',
        'payment_amount',
        'date',
    ];

    protected $casts = [
        'payment_amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Get the job home that owns the payment.
     */
    public function jobHome()
    {
        return $this->belongsTo(JobHome::class, 'jobhomeid');
    }
}
