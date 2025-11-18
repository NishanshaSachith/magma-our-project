const express = require('express');
const router = express.Router();

// Import controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const itemController = require('../controllers/itemController');
const customerController = require('../controllers/customerController');
const areaController = require('../controllers/areaController');
const jobCardController = require('../controllers/jobCardController');
const jobHomeController = require('../controllers/jobHomeController');
const quotationController = require('../controllers/quotationController');
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');
const jobCancellationController = require('../controllers/jobCancellationController');
const jobHomeTechnicianController = require('../controllers/jobHomeTechnicianController');
const notificationController = require('../controllers/notificationController');
const messageController = require('../controllers/messageController');
const imageUploadController = require('../controllers/imageUploadController');
const companySettingsController = require('../controllers/companySettingsController');
const profileController = require('../controllers/profileController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.use(authenticateToken);

// User routes
router.get('/user', authController.getUser);
router.get('/users', userController.getUsers);
router.get('/technicians', userController.getTechnicians);
router.put('/users/:id/role', userController.updateRole);
router.put('/users/:id/password', userController.updatePassword);
router.post('/users', userController.createUser);
router.delete('/users/:id', userController.deleteUser);

// Profile routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.profileImageUpload.single('profile_image'), profileController.updateProfile);
router.get('/profile/image/:id', profileController.getProfileImage);

// Logout
router.post('/logout', authController.logout);

// Item routes
router.get('/items', itemController.getItems);
router.post('/items', itemController.createItem);
// router.get('/items/:id', itemController.getItem);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

// Customer routes
router.get('/customers', customerController.getCustomers);
router.post('/customers', customerController.createCustomer);
router.get('/customers/:id', customerController.getCustomer);
router.put('/customers/:id', customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);
//router.get('/customers/:id/areas', customerController.getCustomerAreas);

// Area routes
router.get('/areas', areaController.getAreas);
router.post('/areas', areaController.createArea);
router.get('/areas/:id', areaController.getArea);
router.put('/areas/:id', areaController.updateArea);
router.delete('/areas/:id', areaController.deleteArea);

// Job Home routes
router.get('/job-homes', jobHomeController.getJobHomes);
router.post('/job-homes', jobHomeController.createJobHome);
router.get('/job-homes/:id', jobHomeController.getJobHome);
router.put('/job-homes/:id', jobHomeController.updateJobHome);
// router.delete('/job-homes/:id', jobHomeController.deleteJobHome);

// Job Card routes
// router.get('/job-cards', jobCardController.getJobCards);
router.post('/job-cards', jobCardController.createJobCard);
router.get('/job-cards/:id', jobCardController.getJobCard);
router.put('/job-cards/:id', jobCardController.updateJobCard);
// router.delete('/job-cards/:id', jobCardController.deleteJobCard);
router.get('/job-cards/:jobCardId/items', jobCardController.getItemsForQuotation);

// Quotation routes
router.get('/quotations', quotationController.getQuotations);
router.post('/quotations', quotationController.createQuotation);
router.get('/quotations/:id', quotationController.getQuotation);
router.put('/quotations/:id', quotationController.updateQuotation);
router.delete('/quotations/:id', quotationController.deleteQuotation);
router.get('/quotations/:jobCardId', quotationController.getItemsByJobCard);
router.get('/quotations/by-id/:quotationId', quotationController.getById);
router.put('/quotations/update-prices/:jobCardId', quotationController.updatePrices);
router.get('/quotations/total/by-jobhome', quotationController.getTotalByJobHomeId);

// Invoice routes
router.get('/invoices', invoiceController.getInvoices);
router.post('/invoices', invoiceController.createInvoice);
router.get('/invoices/:id', invoiceController.getInvoice);
router.put('/invoices/:id', invoiceController.updateInvoice);
router.delete('/invoices/:id', invoiceController.deleteInvoice);
router.get('/invoices/by-quotation/:quotationId', invoiceController.getByQuotationId);
router.put('/invoices/update-info', invoiceController.updateInfo);

// Payment routes
router.get('/payments', paymentController.getPayments);
router.post('/payments', paymentController.createPayment);
router.get('/payments/:id', paymentController.getPayment);
router.put('/payments/:id', paymentController.updatePayment);
router.delete('/payments/:id', paymentController.deletePayment);
router.get('/payments/by-jobhome/:jobhomeid', paymentController.getByJobHomeId);

// Job Cancellation routes
// router.get('/job-cancellations', jobCancellationController.getJobCancellations);
router.post('/job-cancellations', jobCancellationController.createJobCancellation);
router.get('/job-cancellations/:id', jobCancellationController.getJobCancellation);
// router.put('/job-cancellations/:id', jobCancellationController.updateJobCancellation);
// router.delete('/job-cancellations/:id', jobCancellationController.deleteJobCancellation);

// Job Home Technician routes
router.get('/jobhome-technicians', jobHomeTechnicianController.getJobHomeTechnicians);
router.get('/jobhome-technicians/states', jobHomeTechnicianController.getStates);
router.put('/jobhome-technicians/:jobhomeId/state', jobHomeTechnicianController.updateState);

// Notification routes
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/:id/read', notificationController.markAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

// Message routes
router.get('/persons', messageController.getPersons);
router.post('/messages', messageController.sendMessage);
router.get('/messages', messageController.getMessages);
router.get('/messages/notifications', messageController.getMessageNotifications);
router.delete('/messages/:id', messageController.deleteMessage);

// Image Upload routes
router.get('/job-homes/:jobHomeId/images', imageUploadController.getImages);
router.post('/job-homes/:jobHomeId/images', imageUploadController.upload.array('images'), imageUploadController.store);
router.delete('/job-homes/:jobHomeId/images/:imageId', imageUploadController.destroy);

// Company Settings routes
router.get('/company-settings', companySettingsController.show);
router.put('/company-settings', companySettingsController.logoUpload.single('logo'), companySettingsController.update);
router.get('/company-settings/logo/:id', companySettingsController.getLogo);

module.exports = router;
