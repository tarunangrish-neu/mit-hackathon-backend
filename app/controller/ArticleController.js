import * as ArticleService from "../service/ArticleService.js";
import {
    setCreateResponse,
    setErrorResponse,
    setSuccessResponse,
    setNotFoundResponse
} from "./response-handler.js";
import { createWallet, createInvoice} from "../service/LightningService.js";
import { v4 as uuidv4 } from 'uuid';

export const createArticle = async (request, response) => {
    try {
        const articleData = request.body;

        console.log("Article data:", articleData);
        
        // Add unique articleId if not provided
        if (!articleData.articleId) {
            articleData.articleId = uuidv4();
        }

        // Create wallet Id
        if (!articleData.walletId) {
            articleData.walletId = uuidv4(); // Generate a unique wallet ID if not provided
            await createWallet(articleData.walletId)
                .then(wallet => {
                    console.log("Wallet created successfully:", wallet);
                })
                .catch(err => {
                    console.error("Error creating wallet:", err);
                });
        }

        // Create Invoice
        const invoice = await createInvoice(articleData.articleId, articleData.amount);

        //add invoice to the saved article
        articleData.payment = {
            status: 'pending',
            invoiceId: invoice.id,
            paymentRequest: invoice.request,
            amount: invoice.tokens,
            expiresAt: invoice.expiresAt,
            bolt11: invoice.bolt11 // Store the bolt11 string for reference
        };

        const savedArticle = await ArticleService.save(articleData);

        console.log(savedArticle.payment)

        setCreateResponse(savedArticle, response);
    } catch (error) {
        console.error("Error creating article:", error);
        setErrorResponse(error, response);
    }
};

export const getArticle = async (request, response) => {
    try {
        const articleId = request.params.id;
        const article = await ArticleService.get(articleId);
        
        if (!article) {
            return setNotFoundResponse("Article not found", response);
        }
        
        setSuccessResponse(article, response);
    } catch (error) {
        console.error("Error fetching article:", error);
        setErrorResponse(error, response);
    }
};

export const getAllArticles = async (request, response) => {
    try {
        const articles = await ArticleService.getAll();
        setSuccessResponse(articles, response);
    } catch (error) {
        console.error("Error fetching all articles:", error);
        setErrorResponse(error, response);
    }
};

export const updateArticle = async (request, response) => {
    try {
        const articleId = request.params.id;
        const updateData = request.body;
        
        const updatedArticle = await ArticleService.updateById(articleId, updateData);
        
        if (!updatedArticle) {
            return setNotFoundResponse("Article not found", response);
        }
        
        setSuccessResponse(updatedArticle, response);
    } catch (error) {
        console.error("Error updating article:", error);
        setErrorResponse(error, response);
    }
};

export const deleteArticle = async (request, response) => {
    try {
        const articleId = request.params.id;
        const deletedArticle = await ArticleService.deleteById(articleId);
        
        if (!deletedArticle) {
            return setNotFoundResponse("Article not found", response);
        }
        
        setSuccessResponse({ message: "Article successfully deleted" }, response);
    } catch (error) {
        console.error("Error deleting article:", error);
        setErrorResponse(error, response);
    }
};

