<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'description_id',
        'image_path',
        'original_name',
        'file_size'
    ];

    /**
     * Get the description that owns the image.
     */
    public function description()
    {
        return $this->belongsTo(Description::class);
    }
}
