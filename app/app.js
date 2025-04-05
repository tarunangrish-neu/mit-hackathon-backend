import cors from "cors";
import express from "express";

const initialize = (app) => {
    app.use(cors());
    app.use(express.json());
  };
  
  export default initialize;