<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobItem extends Model
{
    protected $fillable = [
        'job_home_id',              
        'materials_no', 
        'materials', 
        'quantity',
        'unit_price',
    
    ];

    public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }
}
