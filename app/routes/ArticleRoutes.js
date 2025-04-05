import express from 'express';
import * as articleController from '../controller/ArticleController.js';

const router = express.Router();

router
    .route('/')  // Change from '/create' to '/'
    .post(articleController.createArticle);

export default router;