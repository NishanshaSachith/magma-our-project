<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobHomeTechnician extends Model
{
    protected $table = 'jobhome_technicians';

    protected $fillable = [
        'jobhome_id',
        'user_id',
        'technician_name',
        'assign_date',
    ];

    public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
