import express, { Request, Response } from "express";

export const submitRouter = express.Router();

/* GET home page. */
submitRouter.get('/', function(req, res) {
    res.render('submit', {});
  });