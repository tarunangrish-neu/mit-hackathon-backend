import articlesRouter from './ArticleRoutes.js';
import paymentRouter from './PaymentRoutes.js';
const API_PATH = '/api/v1';

const initializeRoutes = (app) => {
    console.log("Initializing routes at", `${API_PATH}/articles`);
    app.use(`${API_PATH}/articles`, articlesRouter);
    
    console.log("Initializing payment routes at", `${API_PATH}/payments`);
    app.use(`${API_PATH}/payments`, paymentRouter);
};

export default initializeRoutes;