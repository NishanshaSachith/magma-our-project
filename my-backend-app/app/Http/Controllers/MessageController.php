<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\JobCard;
use App\Models\Message;
use App\Models\JobHome;
use Illuminate\Support\Facades\DB;

class MessageController extends Controller
{
    public function getPersons(Request $request)
    {
        try {
            $type = $request->query('type');
            $jobHomeId = $request->query('job_home_id');

            if (!$jobHomeId) {
                return response()->json([
                    'success' => false,
                    'message' => 'job_home_id is required'
                ], 400);
            }

            $jobHome = JobHome::with(['customer', 'jobCard'])->find($jobHomeId);

            if (!$jobHome) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job home not found'
                ], 404);
            }

            $person = null;

            if ($type === 'customer') {
                if ($jobHome->customer) {
                    $person = [
                        'name' => $jobHome->customer->customer_name,
                        'contact_number' => $jobHome->customer->phone,
                        'type' => 'customer'
                    ];
                }
            } elseif ($type === 'contact_person') {
                if ($jobHome->jobCard) {
                    $person = [
                        'name' => $jobHome->jobCard->contact_person,
                        'contact_number' => $jobHome->jobCard->contact_number,
                        'type' => 'contact_person'
                    ];
                }
            }

            if (!$person) {
                return response()->json([
                    'success' => false,
                    'message' => 'Person not found or missing contact information'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'person' => $person
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch person',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function sendMessage(Request $request)
    {
        try {
            $request->validate([
                'job_home_id' => 'required|exists:job_homes,id',
                'phoneno' => 'required|string',
                'person_number' => 'required|string',
                'message' => 'required|string|max:1000'
            ]);

            $message = Message::create([
                'job_home_id' => $request->job_home_id,
                'phoneno' => $request->phoneno,
                'person_number' => $request->person_number,
                'message' => $request->message
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully',
                'data' => $message
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index()
    {
        try {
            $messages = Message::join('job_homes', 'messages.job_home_id', '=', 'job_homes.id')
                ->select('messages.*', 'job_homes.job_no')
                ->orderBy('messages.created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'messages' => $messages
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMessageNotifications(Request $request)
    {
        try {
            $query = Message::with('jobHome')
                ->orderBy('created_at', 'desc');

            // Add time filtering if startDate and endDate are provided
            if ($request->has('startDate') && $request->has('endDate')) {
                $startDate = $request->query('startDate');
                $endDate = $request->query('endDate');

                // Validate date format
                if (\DateTime::createFromFormat('Y-m-d', $startDate) !== false &&
                    \DateTime::createFromFormat('Y-m-d', $endDate) !== false) {
                    $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
                }
            }

            $messages = $query->take(10)
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'sender_name' => 'System', // You can customize this based on your needs
                        'subject' => 'New Message',
                        'content' => $message->message,
                        'created_at' => $message->created_at,
                        'is_read' => false, // You can add a read status field to the messages table later
                        'type' => 'message',
                        // Include related job identifiers for frontend display/navigation
                        'job_home_id' => $message->job_home_id,
                        'job_no' => optional($message->jobHome)->job_no,
                    ];
                });

            return response()->json([
                'success' => true,
                'messages' => $messages,
                'count' => $messages->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch message notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $message = Message::findOrFail($id);
            $message->delete();

            return response()->json([
                'success' => true,
                'message' => 'Message deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete message',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
