<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobCancellation extends Model
{
    protected $fillable = ['job_home_id', 'reason', 'description'];

    public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }
}
