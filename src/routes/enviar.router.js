const express = require('express');
const csv = require('csvtojson');
const fs = require('fs');
const fetch = require('node-fetch');
const format = require("string-template")

const enviarRouter = express.Router();

/* GET home page. */
enviarRouter.get('/', function (req, res) {
    res.render('enviar', {});
});

enviarRouter.post('/', async function (req, res) {
    res.render('enviar', {});
});

module.exports = enviarRouter;