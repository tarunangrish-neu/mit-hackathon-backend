import {
    setCreateResponse,
    setErrorResponse,
} from "./response-handler.js";

import ArticlesModel from "../model/Article.js";

export const createArticle = async (request, response) => {
    try {
        const articleData = request.body;
        const article = new ArticlesModel(articleData);
        const savedArticle = await article.save();
        setCreateResponse(savedArticle, response);
    } catch (error) {
        console.log(error);
        setErrorResponse(error, response);
    }
};