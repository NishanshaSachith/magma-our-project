<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MessageController;

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\JobHomeTechnicianController;

use App\Http\Controllers\Api\CustomerController;

use App\Http\Controllers\CompanySettingsController; // Assuming you still have this
use App\Http\Controllers\ProfileController; // Add this lin
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\Api\AreaController;
use App\Http\Controllers\Api\JobCardController;
use App\Http\Controllers\Api\JobHomeController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\ImageUploadController;
use App\Http\Controllers\Api\JobCancellationController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\InvoiceController;



/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
// These routes are accessible to anyone without a login token.
Route::post('/login', [AuthController::class, 'login']);
// Route::post('/register', [AuthController::class, 'register']); // Assuming this is for general user registration

// Protected routes (require authentication via Sanctum token)
// Routes within this group will require a valid API token to be accessed.
Route::middleware('auth:sanctum')->group(function () {
    // Get authenticated user's details
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Profile route to get authenticated user's profile
    Route::get('/profile', [ProfileController::class, 'show']);

    // Logout endpoint
    Route::post('/logout', [AuthController::class, 'logout']);

    // User management routes
    // It's highly recommended that these routes also have additional authorization
    // (e.g., only 'Administrator' roles can access 'store' or 'index').

    // Get all users (typically an admin-only function)
    Route::get('/users', [UserController::class, 'index']);

    // Get technicians
    Route::get('/technicians', [UserController::class, 'getTechnicians']);

    // Route for adding a new user (likely an admin-only function)
    // The UserController@store method allows setting roles (Administrator, Manager, Staff),
    // which implies it should be a protected route and likely require specific permissions.
    Route::post('/users', [UserController::class, 'store']);

    // Update user role
    Route::patch('/users/{id}', [UserController::class, 'update']);

    // Delete user
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Update user role
    Route::patch('/users/{id}/role', [UserController::class, 'updateRole']);
    Route::put('/users/{id}/role', [UserController::class, 'updateRole']);

    // Update user password
    Route::patch('/users/{id}/password', [UserController::class, 'updatePassword']);

    Route::patch('/profile', [ProfileController::class, 'update']); 
    Route::put('/profile', [ProfileController::class, 'update']);

    // Add new route to delete customers by branch type
    Route::delete('/customers/delete-by-branch-type/{branchName}', [CustomerController::class, 'deleteByBranchType']);

    // New routes for technicians assignment
    Route::get('/technicians', [UserController::class, 'getTechnicians']);
    Route::get('/technicians', function () {
    return \App\Models\User::where('role', 'technician')->get(); // Example
});
    Route::get('/jobhomes/{jobhomeId}/technicians', [JobHomeTechnicianController::class, 'getAssignedTechnicians']);
    Route::post('/jobhomes/{jobhomeId}/technicians', [JobHomeTechnicianController::class, 'assignTechnicians']);
    Route::delete('/jobhomes/{jobhomeId}/technicians/{technicianId}', [JobHomeTechnicianController::class, 'deleteTechnician']);

    // Job cancellation route
    Route::post('/job-cancellations', [JobCancellationController::class, 'store']);
    Route::get('/job-cancellations/{jobHomeId}', [JobCancellationController::class, 'show']);
});

Route::middleware('auth:sanctum')->group(function () {
    // This covers all CRUD operations for items: index, store, show, update, destroy
    Route::apiResource('items', ItemController::class);
});

// Item routes moved outside auth:sanctum middleware to make them public
Route::post('/items', [ItemController::class, 'store']);
Route::get('/items', [ItemController::class, 'index']); // Optional: to fetch all items
Route::put('/items/{id}', [ItemController::class, 'update']);
Route::patch('/items/{id}', [ItemController::class, 'update']);
Route::delete('/items/{id}', [ItemController::class, 'destroy']);

Route::get('/company-settings', [CompanySettingsController::class, 'show']);
Route::post('/company-settings', [CompanySettingsController::class, 'update']);
Route::get('/company-settings/logo/{id}', [CompanySettingsController::class, 'logo'])->name('company.logo');
Route::get('/profile/image/{id}', [ProfileController::class, 'profileImage'])->name('user.profile.image');

Route::get('/areas', [CustomerController::class, 'areas']);
Route::apiResource('customers', CustomerController::class);

Route::apiResource('areas', AreaController::class);

Route::post('/jobcards', [JobCardController::class, 'store']);
Route::put('/jobcards/{id}', [JobCardController::class, 'update']);
Route::get('/jobcards/{id}', [JobCardController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/job-homes', [JobHomeController::class, 'index']);
    Route::get('/job-homes/{id}', [JobHomeController::class, 'show']);
    Route::post('/job-homes', [JobHomeController::class, 'store']);
    Route::put('/job-homes/{id}', [JobHomeController::class, 'update']);

    Route::post('/job-homes/{jobHomeId}/images', [ImageUploadController::class, 'store']);
    Route::get('job-homes/{jobHomeId}/images', [ImageUploadController::class, 'getImages']);
    Route::delete('job-homes/{jobHomeId}/images/{imageId}', [ImageUploadController::class, 'destroy']);
});

//Route::get('/job-homes/{jobCardId}/quotation', [QuotationController::class, 'itemshow']);
Route::get('/quotations/{jobCardId}', [QuotationController::class, 'itemshow']);
Route::get('/quotations/by-id/{quotationId}', [QuotationController::class, 'getById']);
Route::put('/quotations/update-prices/{jobCardId}', [QuotationController::class, 'updatePrices']);
Route::get('/quotations/total/by-jobhome', [QuotationController::class, 'getTotalByJobHomeId']);
Route::post('/quotations', [QuotationController::class, 'store']);
Route::get('/test-quotation', [QuotationController::class, 'index']);
Route::put('/quotations/{quotation}', [QuotationController::class, 'update']);

Route::apiResource('invoices', InvoiceController::class);
Route::get('/invoices/by-quotation/{quotationId}', [InvoiceController::class, 'getByQuotationId']);
Route::put('/invoices/update-info', [InvoiceController::class, 'updateInfo']);

Route::get('/job-cards/{jobCardId}/items', [JobCardController::class, 'showItemsForQuotation']);

Route::apiResource('payments', PaymentController::class);
Route::get('/payments/by-jobhome/{jobhomeid}', [PaymentController::class, 'getByJobHomeId']);
// Route::get('/payments/advance/{jobhomeid}', [PaymentController::class, 'getAdvancePayment']);
// Route::get('/payments/total/{jobCardId}', [PaymentController::class, 'getTotalByJobCardId']);
// Route::get('/payments/test-database', [PaymentController::class, 'testDatabase']);


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    // Message routes
    Route::get('/persons', [MessageController::class, 'getPersons']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);
    Route::get('/messages', [MessageController::class, 'getMessages']);
    Route::get('/messages/notifications', [MessageController::class, 'getMessageNotifications']);
    Route::delete('/messages/{id}', [MessageController::class, 'destroy']);

    // JobHomeTechnician routes
    Route::get('/jobhome-technicians', [JobHomeTechnicianController::class, 'index']);
    Route::get('/jobhome-technicians/states', [JobHomeTechnicianController::class, 'getStates']);
    Route::put('/jobhome-technicians/{jobhomeId}/state', [JobHomeTechnicianController::class, 'updateState']);
});
