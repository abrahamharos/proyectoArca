const express = require('express');
const csv = require('csvtojson');
const fs = require('fs');
const fetch = require('node-fetch');
const format = require("string-template")

const submitRouter = express.Router();
const messageTemplateRoute = 'src/templates/messageTemplate.txt';
const scoreMap = {
  'low': ['🟥', 'Malo'],
  'medium': ['🟨', 'Regular'],
  'high': ['🟩', 'Bueno'],
}
const columnList = ['Lácteos CU x Día', 'Café Costa Kg x Día', 'Cat.en Exp. CU x Día', 'Clientes con Venta x Sector', 'Gfn CO x Día'];

// Read indicadores from JSON file
function readIndicadores() {
  const indicadoresBuffer = fs.readFileSync('src/templates/indicadores.json');
  const indicadores = JSON.parse(indicadoresBuffer.toString());
  return indicadores["indicadores"];
}

async function getRutasFromCSV(reporteCSV){
  var rutas = [];
  const csvReport = reporteCSV['data'].toString();
  let data = csvReport.split("\n");
  
  for (let i = 0; i < data.length; i++) {
    if(i > 2 && i < data.length - 2) {
      let row = data[i].split(",");
      var formattedRows = row.map(function(e) { 
        e = e.replace(/["']/g, "");
        return e;
      });
      
      rutas.push({
        'region': formattedRows[0],
        'territorio': formattedRows[1],
        'subterritorio': formattedRows[2],
        'cedi': formattedRows[3],
        'ruta': formattedRows[4],
        'Lácteos CU x Día': (isNaN(parseFloat(formattedRows[5]))) ? 0 : parseFloat(formattedRows[5]),
        'Café Costa Kg x Día': (isNaN(parseFloat(formattedRows[6]))) ? 0 : parseFloat(formattedRows[6]),
        'Cat.en Exp. CU x Día': (isNaN(parseFloat(formattedRows[7]))) ? 0 : parseFloat(formattedRows[7]),
        'Clientes con Venta x Sector': (isNaN(parseFloat(formattedRows[8]))) ? 0 : parseFloat(formattedRows[8]),
        'Gfn CO x Día': (isNaN(parseFloat(formattedRows[9]))) ? 0 : parseFloat(formattedRows[9]),
      });
    }
  }

  return rutas;
}

async function sendWhatsappMessage(phone_number, message) {
  const whatsapp_api_url = 'https://graph.facebook.com/v15.0/' + process.env.WHATSAPP_API_BOT_ID + '/messages';
  const messageData = {
    to: phone_number,
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'text',
    text: {
      preview_url: false,
      body: message
    }
  };

  const postReq = {
    method: "POST",
    headers: {
      'Authorization': 'Bearer ' + process.env.WHATSAPP_API_AUTH_BEARER,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(messageData),
    json: true
  };

  const response = await fetch(whatsapp_api_url, postReq);
  const data = await response.json();
  console.log(data);
  return data;
}

async function evaluateRutas(rutas, indicadores) {
  // Get message template file
  const messageTemplateBuffer = fs.readFileSync(messageTemplateRoute);
  let messageTemplate = messageTemplateBuffer.toString();

  rutas.forEach((ruta) => {
    let messageVariables = [];
    messageVariables.push(ruta['subterritorio']);
    messageVariables.push(ruta['ruta']);

    indicadores.forEach((indicador) => {
      let score = 'low';
      if (ruta[indicador['nombre']] >= indicador['alto']) {
        score = 'high';
      } else if (ruta[indicador['nombre']] > indicador['bajo']) {
        score = 'medium';
      }
      messageVariables.push(scoreMap[score][0]);
      messageVariables.push(scoreMap[score][1]);
      messageVariables.push(parseFloat(ruta[indicador['nombre']]).toFixed(2));
      messageVariables.push(indicador['alto']);
    });
    
    // Compile File with variables
    let message = format(messageTemplate, messageVariables);
    // Send message
    sendWhatsappMessage(process.env.WHATSAPP_API_AUTH_PHONE, message);
  });
}

/* GET home page. */
submitRouter.get('/', function(req, res) {
    res.render('submit', {});
  });

submitRouter.post('/', async function(req, res) {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  let reporteCSV;
  if (!Array.isArray(req.files.reporteExcel)) {
    reporteCSV = req.files.reporteExcel;
  } else {
    return res.status(400).send('Please upload one xlsx file.');
  }
  const indicadores = readIndicadores();
  const rutas = await getRutasFromCSV(reporteCSV);
  await evaluateRutas(rutas, indicadores);
  
  res.redirect('/submit');
});

module.exports = submitRouter;