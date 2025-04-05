import express from "express";
import dotenv from "dotenv";
import initialize from "./app/app.js";

dotenv.config();


const app = express();
const port = 5000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

initialize(app);

app.listen(port, () => console.log(`Server Running on port ${port}`));