<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCard extends Model
{
    protected $fillable = [
        'job_home_id',
        'selected_date',
        'customer_name', 
        'fam_no', 
        'contact_person',
        'area', 
        'contact_number',
        'branch_sc',
        'generator_make', 
        'kva',
        'engine_make', 
        'engine_se_no',
        'last_service', 
        'alternator_make', 
        'alternator_se_no',
        'gen_model',
        'controller_module', 
        'avr', 'ats_info', 
        'job_description', 
        'oil_filter_state',
        'oil_filter_value',
        'air_filter_state',
        'air_filter_value',
        'oil_state',
        'oil_value',
        'fuel_filter_state',
        'fuel_filter_value',
        'battery_charge_state',
        'battery_charge_value',
        'battery_value',
        'other_value',
    ];

    protected $casts = [
    ];

    public function items()
    {
        // Items are related through job_home_id, not directly to job_card
        // This relationship is not used in the current implementation
        return $this->hasMany(JobItem::class, 'job_home_id', 'job_home_id');
    }
     public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }
}
