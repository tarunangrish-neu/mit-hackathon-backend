import * as ArticleService from "../service/ArticleService.js";
import {
    setCreateResponse,
    setErrorResponse,
    setSuccessResponse,
    setNotFoundResponse
} from "./response-handler.js";
import { v4 as uuidv4 } from 'uuid';

export const createArticle = async (request, response) => {
    try {
        const articleData = request.body;
        
        // Add unique articleId if not provided
        if (!articleData.articleId) {
            articleData.articleId = uuidv4();
        }
        
        const savedArticle = await ArticleService.save(articleData);
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