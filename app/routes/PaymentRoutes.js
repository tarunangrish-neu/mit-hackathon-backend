import express from 'express';
import * as paymentController from '../controller/PaymentController.js';

const router = express.Router();

// Check payment status
router.get('/status/:articleId', paymentController.checkPaymentStatus);

export default router;