import cors from "cors";
import express from "express";
import initializeRoutes from "./routes/index.js";
import { createDbConnection } from "./utils/Mongo.js";

const initialize = async (app) => {
    try {
        app.use(cors());
        app.use(express.json());
        await createDbConnection(); // Use the createDbConnection function
        initializeRoutes(app);
        console.log("Application initialized successfully");
    } catch (error) {
        console.error("Error during application initialization:", error.message);
        process.exit(1); // Exit if initialization fails
    }
};

export default initialize;