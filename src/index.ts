/**
 * Required External Modules
 */

 import * as dotenv from "dotenv";
 import express from "express";
 import cors from "cors";
 import helmet from "helmet";
 import { messageRequestRouter } from "./routes/ApiWhatsApp.router"
 import { webhookRequestRouter } from "./routes/webhook.router"

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


app.use("/ApiWhatsApp", messageRequestRouter);
app.use("/webhooks", webhookRequestRouter);

