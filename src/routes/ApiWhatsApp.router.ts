import express, { Request, Response } from "express";
import { MessageRequest } from "../interfaces/MessageRequest.interface";

export const messageRequestRouter = express.Router();

/**
 * Controller Definitions
 */

// POST /ApiWhatsApp
messageRequestRouter.post("/", async (req: Request, res: Response) => {
    let receivedMessageRequest: MessageRequest = JSON.parse(JSON.stringify(req.body));
    
    
    res.status(200).send(receivedMessageRequest);
});