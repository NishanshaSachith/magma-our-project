<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NotificationController extends Controller
{
    public function index()
    {
        // First, ensure notifications exist for expiring items
        $this->createNotificationsForExpiringItems();

        // Get notifications that are not deleted
        $notifications = DB::table('notifications')
            ->join('job_items', 'notifications.job_item_id', '=', 'job_items.id')
            ->join('job_homes', 'job_items.job_home_id', '=', 'job_homes.id')
            ->join('job_cards', 'job_homes.id', '=', 'job_cards.job_home_id')
            ->join('quotations', 'job_cards.id', '=', 'quotations.job_card_id')
            ->join('invoices', 'quotations.id', '=', 'invoices.quotation_id')
            ->join('items', 'job_items.materials_no', '=', 'items.id')
            ->where('notifications.is_deleted', false)
            ->select(
                'notifications.id',
                'notifications.is_read',
                'notifications.created_at',
                'job_homes.id as job_home_id',
                'job_homes.job_no',
                'job_cards.customer_name',
                'items.name as item_name',
                'items.service_timeout',
                'invoices.invoice_date',
                DB::raw('DATE_ADD(invoices.invoice_date, INTERVAL items.service_timeout DAY) as expiry_date'),
                DB::raw('DATEDIFF(DATE_ADD(invoices.invoice_date, INTERVAL items.service_timeout DAY), CURDATE()) as days_remaining')
            )
            ->havingRaw('days_remaining >= 0 AND days_remaining <= 5')
            ->orderBy('days_remaining', 'asc')
            ->get();

        $unreadCount = $notifications->where('is_read', false)->count();

        return response()->json([
            'notifications' => $notifications,
            'count' => $unreadCount
        ]);
    }

    private function createNotificationsForExpiringItems()
    {
        // Get expiring items that don't have any notifications (including deleted ones)
        $expiringItems = DB::table('items')
            ->join('job_items', 'items.id', '=', 'job_items.materials_no')
            ->join('job_homes', 'job_items.job_home_id', '=', 'job_homes.id')
            ->join('job_cards', 'job_homes.id', '=', 'job_cards.job_home_id')
            ->join('quotations', 'job_cards.id', '=', 'quotations.job_card_id')
            ->join('invoices', 'quotations.id', '=', 'invoices.quotation_id')
            ->leftJoin('notifications', 'job_items.id', '=', 'notifications.job_item_id')
            ->whereRaw('DATEDIFF(DATE_ADD(invoices.invoice_date, INTERVAL items.service_timeout DAY), CURDATE()) <= 5')
            ->whereRaw('DATEDIFF(DATE_ADD(invoices.invoice_date, INTERVAL items.service_timeout DAY), CURDATE()) >= 0')
            ->whereNull('notifications.id') // Only create if no notification exists at all
            ->select('job_items.id as job_item_id')
            ->distinct()
            ->get();

        foreach ($expiringItems as $item) {
            Notification::create([
                'job_item_id' => $item->job_item_id,
                'is_read' => false,
                'is_deleted' => false,
            ]);
        }
    }

    public function markAsRead($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        $notification->is_read = true;
        $notification->save();

        return response()->json(['message' => 'Notification marked as read']);
    }

    public function destroy($id)
    {
        $notification = Notification::find($id);
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }
        $notification->is_deleted = true;
        $notification->save();

        return response()->json(['message' => 'Notification deleted']);
    }
}
