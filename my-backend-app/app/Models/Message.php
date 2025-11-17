<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_home_id',
        'phoneno',
        'person_number',
        'message',
    ];

    public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }
}
