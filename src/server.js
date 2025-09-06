// const express = require("express")
import express from "express"
import dotenv from "dotenv"
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

import trascationsRoute from "./routes/transactionsRoute.js"
import job from "./config/cron.js"

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start(); // we only want to start the cron job in production environment

// middleware
app.use(rateLimiter);
app.use(express.json());

// our custom simple middleware
// app.use((req, res, next) => {
//     console.log("Hey we hit a req, the method is", req.method);
//     next();
// })

const PORT = process.env.PORT || 5001;
// Here we put the PORT number in an .env file for security and if we dont have any number in a .env we force the number 5001

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});


app.use("/api/transactions", trascationsRoute);



initDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server is up and running on PORT:", PORT)
    })
})

//Vamos campeon, tu puedes con esta app, pronto haras las propias sin necesidad de ver video tutoriales
//Confio en mi, tu eres yo, y yo soy tu, animo little kimosabi