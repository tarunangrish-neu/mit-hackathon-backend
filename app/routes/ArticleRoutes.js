import express from 'express';
import * as articleController from '../controller/ArticleController.js';

const router = express.Router();

router.route('/')
  .post(articleController.createArticle)
  .get(articleController.getAllArticles);

router.route('/:id')
  .get(articleController.getArticle)
  .put(articleController.updateArticle)
  .delete(articleController.deleteArticle);

export default router;