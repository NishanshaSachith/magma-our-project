<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Description extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_home_id',
        'description'
    ];

    /**
     * Get the images for the description.
     */
    public function images()
    {
        return $this->hasMany(Image::class);
    }

    /**
     * Get the job home that owns the description.
     */
    public function jobHome()
    {
        return $this->belongsTo(JobHome::class);
    }
}
