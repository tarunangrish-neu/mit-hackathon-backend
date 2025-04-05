import * as LightningService from '../service/LightningService.js';
import ArticlesModel from '../model/Article.js';
import {
    setSuccessResponse,
    setErrorResponse,
    setNotFoundResponse
} from "./response-handler.js";

// Create an invoice for an article submission
export const createArticleInvoice = async (request, response) => {
    try {
        const articleId = request.params.articleId;
        const amount = request.body.amount || 1000; // Default 1000 sats if not specified
        
        // Check if article exists
        const article = await ArticlesModel.findOne({ articleId });
        if (!article) {
            return setNotFoundResponse("Article not found", response);
        }
        
        // If already paid, return error
        if (article.payment && article.payment.status === 'paid') {
            return setErrorResponse({
                code: "PAYMENT_ALREADY_COMPLETE",
                message: "This article has already been paid for"
            }, response);
        }
        
        // Create Lightning invoice
        const invoice = await LightningService.createInvoice(articleId, amount);
        
        // Update article with invoice info
        article.payment = {
            status: 'pending',
            invoiceId: invoice.id,
            paymentRequest: invoice.request,
            amount: invoice.tokens
        };
        await article.save();
        
        setSuccessResponse({
            articleId: articleId,
            paymentRequest: invoice.request,
            amount: invoice.tokens,
            expiresAt: invoice.expiresAt
        }, response);
    } catch (error) {
        console.error("Error creating invoice:", error);
        setErrorResponse(error, response);
    }
};

// Check payment status for an article
export const checkPaymentStatus = async (request, response) => {
    try {
        const articleId = request.params.articleId;
        
        // Get article with payment info
        const article = await ArticlesModel.findOne({ articleId });
        if (!article) {
            return setNotFoundResponse("Article not found", response);
        }
        
        // If no payment info or no invoice ID
        if (!article.payment || !article.payment.invoiceId) {
            return setSuccessResponse({
                articleId,
                status: 'no_invoice'
            }, response);
        }
        
        // If already marked as paid in our database
        if (article.payment.status === 'paid') {
            return setSuccessResponse({
                articleId,
                status: 'paid',
                paidAt: article.payment.paidAt
            }, response);
        }
        
        // Check current invoice status from LNbits
        const invoiceStatus = await LightningService.checkInvoice(article.payment.invoiceId);
        
        // If paid, update article
        if (invoiceStatus.isPaid && article.payment.status !== 'paid') {
            article.payment.status = 'paid';
            article.payment.paidAt = invoiceStatus.settleDate;
            article.published = true; // Auto-publish once paid
            await article.save();
            
            return setSuccessResponse({
                articleId,
                status: 'paid',
                paidAt: invoiceStatus.settleDate
            }, response);
        }
        
        // Return current status
        setSuccessResponse({
            articleId,
            status: article.payment.status,
            invoiceId: article.payment.invoiceId,
            paymentRequest: article.payment.paymentRequest
        }, response);
    } catch (error) {
        console.error("Error checking payment status:", error);
        setErrorResponse(error, response);
    }
};