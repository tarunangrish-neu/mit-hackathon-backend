import articlesRouter from './ArticleRoutes.js';
const API_PATH = '/api/v1';

const initializeRoutes = (app) => {
    console.log("Initializing routes at", `${API_PATH}/articles`);
    app.use(`${API_PATH}/articles`, articlesRouter);
};

export default initializeRoutes;