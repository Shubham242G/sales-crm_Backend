import { CONFIG } from "@common/config.common";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import createError from "http-errors";
import mongoose from "mongoose";
import logger from "morgan";
import path from "path";
import { errorHandler } from "./middlewares/errorHandler.middleware";


const app = express();

// ==============<>============== //

import { adminSeeder } from "@seeder/adminSeeder";

import v1Router from './v1/router.v1';
import { roleSeeder } from "@seeder/roleSeeder";




// ==============<>============== //

mongoose.connect(CONFIG.MONGOURI).then(() => console.log("DB Connected to ", CONFIG.MONGOURI)).catch((err) => console.error(err));

mongoose.set("debug", true);





app.use(cors());
app.set("trust proxy", true);

app.use(logger("dev"));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));
app.use(cookieParser());

app.use(express.static(path.join(process.cwd(), "public")));



adminSeeder();
roleSeeder();



// Add this before your other route setups






// ==============<>============== //

app.use("/v1", v1Router)

// ==============<>============== //

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(errorHandler);

export default app;
