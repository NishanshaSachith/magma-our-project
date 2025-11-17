<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'logo',
        'logo_mime',
        'account_name',
        'account_number',
        'bank_name',
        'bank_branch',
        'head_of_technical_name',
        'head_of_technical_contact',
    ];
}
