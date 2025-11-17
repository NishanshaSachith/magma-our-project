<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobHome extends Model
{
    protected $fillable = ['job_no', 'job_type', 'job_status', 'service_start', 'service_end', 'customer_ok', 'special_approve', 'customer_id'];

    protected $casts = [
        'service_start' => 'boolean',
        'service_end' => 'boolean',
        'customer_ok' => 'boolean',
        'special_approve' => 'boolean',
    ];

    public function jobCard()
    {
        return $this->hasOne(JobCard::class);
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\Customer::class);
    }

    public function jobItems()
    {
        return $this->hasMany(JobItem::class, 'job_home_id');
        // Make sure 'job_home_id' is the correct foreign key in your job_items table
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'jobhomeid');
    }

    public function quotation()
    {
        return $this->hasOneThrough(Quotation::class, JobCard::class);
    }

    public function technicians()
    {
        return $this->hasMany(JobHomeTechnician::class, 'jobhome_id');
    }
}
