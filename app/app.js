import cors from "cors";
import express from "express";
import initializeRoutes from "./routes/index.js";
import { createDbConnection } from "./utils/Mongo.js";
import { initLightningConnection } from "./service/LightningService.js";
import { closeNostrConnections } from "./service/NostrService.js";

const initialize = async (app) => {
    try {
        app.use(cors());
        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "*");
            res.header("Access-Control-Allow-Methods", "*");
            next();
          });
        app.use(express.json());
        
        // Connect to database
        await createDbConnection();
        
        // Test LNbits connection
        await initLightningConnection();
        
        // Initialize routes
        initializeRoutes(app);
        
        console.log("Application initialized successfully");
    } catch (error) {
        console.error("Error during application initialization:", error.message);
        process.exit(1);
    }
};

export default initialize;