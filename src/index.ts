/**
 * Required External Modules
 */

 import * as dotenv from "dotenv";
 import express from "express";
 import cors from "cors";
 import helmet from "helmet";
 var path = require('path');
 import { messageRequestRouter } from "./routes/ApiWhatsApp.router"
 import { webhookRequestRouter } from "./routes/webhook.router"
 import { submitRouter } from "./routes/submit.router"

 dotenv.config();

 /**
 * App Variables
 */
const PORT = (process.env.PORT || '8080');  
const app = express();

 /**
 *  App Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.json());

/**
 * Server Activation
 */
 app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use("/ApiWhatsApp", messageRequestRouter);
app.use("/webhooks", webhookRequestRouter);
app.use("/submit", submitRouter);

