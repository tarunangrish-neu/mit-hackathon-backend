import * as PrizePoolService from '../service/PrizePoolService.js';
import {
    setSuccessResponse,
    setErrorResponse,
    setNotFoundResponse
} from "./response-handler.js";

// Get pool stats
export const getPoolStats = async (request, response) => {
    try {
        console.log("Request received for pool stats");
        const stats = await PrizePoolService.getPoolStats();
        setSuccessResponse(stats, response);
    } catch (error) {
        console.error("Error getting pool stats:", error);
        setErrorResponse(error, response);
    }
};

// Create donation request
export const createDonation = async (request, response) => {
    try {
        console.log("Request received for donation creation", request.body);
        const { amount } = request.body;
        
        if (!amount || isNaN(amount) || amount <= 0) {
            return setErrorResponse({
                code: "BAD_REQUEST",
                message: "Valid donation amount required"
            }, response);
        }
        
        const donation = await PrizePoolService.createDonationRequest(parseInt(amount));
        response.status(201).json(donation);
    } catch (error) {
        console.error("Error creating donation:", error);
        setErrorResponse(error, response);
    }
};

// Process donation payment
export const processDonation = async (request, response) => {
    try {
        const { invoiceId } = request.params;
        console.log(`Request received to process donation ${invoiceId}`);
        
        if (!invoiceId) {
            return setErrorResponse({
                code: "BAD_REQUEST",
                message: "Invoice ID required"
            }, response);
        }
        
        const result = await PrizePoolService.processDonationPayment(invoiceId);
        setSuccessResponse(result, response);
    } catch (error) {
        console.error("Error processing donation:", error);
        setErrorResponse(error, response);
    }
};

// Perform payout to top article
export const makeTopArticlePayout = async (request, response) => {
    try {
        console.log("Request received to payout top article");
        const result = await PrizePoolService.payoutTopArticle();
        setSuccessResponse(result, response);
    } catch (error) {
        console.error("Error making payout:", error);
        setErrorResponse(error, response);
    }
};