<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'attention',
        'quotation_no',
        'select_date', // Changed from selected_date
        'region',
        'ref_qtn',
        'site',
        'job_date',
        'fam_no',
        'complain_nature',
        'po_no',
        'po_date',
        'actual_break_down',
        'tender_no',
        'signed_date',
        'total_without_tax',
        'vat',
        'total_with_tax',
        'discount',
        'total_with_tax_vs_disc',
        'special_note',
    ];

    protected $casts = [
        'select_date' => 'date',
        'job_date' => 'date',
        'po_date' => 'date',
        'signed_date' => 'date',
        'total_without_tax' => 'decimal:2',
        'vat' => 'decimal:2',
        'total_with_tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_with_tax_vs_disc' => 'decimal:2',
    ];

    /**
     * Get the job card that owns the quotation.
     */
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id');
    }

    /**
     * Get the invoice associated with the quotation.
     */
    public function invoice()
    {
        return $this->hasOne(Invoice::class, 'quotation_id');
    }
}