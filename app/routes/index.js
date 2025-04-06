import articlesRouter from './ArticleRoutes.js';
import prizePoolRouter from './PrizePoolRoutes.js';
import paymentRouter from './PaymentRoutes.js';

const API_PATH = '/api/v1';

const initializeRoutes = (app) => {
    app.use(`${API_PATH}/articles`, articlesRouter);
    app.use(`${API_PATH}/prizepool`, prizePoolRouter);
    app.use(`${API_PATH}/payments`, paymentRouter);
};

export default initializeRoutes;