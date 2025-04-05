import express from "express";
import dotenv from "dotenv";
import initialize from "./app/app.js";
import { closeDbConnection } from "./app/utils/Mongo.js";
import { closeNostrConnections } from "./app/service/NostrService.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize application
initialize(app);

// Start server
const server = app.listen(port, () => console.log(`Server running on port ${port}`));

// Handle graceful shutdown
const handleShutdown = async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    console.log('Server closed');
    await closeDbConnection();
    closeNostrConnections();
  });
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);