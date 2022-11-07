const express = require('express');
const readXlsxFile = require('read-excel-file/node');
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
const columnList = ['xDxRLacteos', 'xDxRCafe', 'xDxRCatEnExp', 'clientesCompra', 'altaFdeV'];

// Get indicadores
async function getIndicadores(reporteExcel) {
  var indicadores = [];
  await readXlsxFile(Buffer.from(reporteExcel['data'])).then((rows) => {
    rows[0].forEach((jValue, jIndex) => {
      if (jIndex >= 9) {
        indicadores.push({
              'nombre': columnList[jIndex - 9],
              'bajo': rows[1][jIndex],
              'alto': rows[3][jIndex]
          });
      }
    });
  });

  console.log(indicadores);
  return indicadores;
}

async function getRutas(reporteExcel) {
  var rutas = [];
  await readXlsxFile(Buffer.from(reporteExcel['data'])).then((rows) => {
    rows.forEach((iValue, iIndex) => {
      if (iIndex > 6) {
        rutas.push({
          'year': iValue[0],
          'zona': iValue[1],
          'territorio': iValue[2],
          'subterritorio': iValue[3],
          'cedi': iValue[4],
          'ruta': iValue[5],
          'recuento': (typeof iValue[6] === 'number') ? iValue[6] : 0,
          'dias22': (typeof iValue[7] === 'number') ? iValue[7] : 0,
          'xRutaCte': (typeof iValue[8] === 'number') ? iValue[8] : 0,
          'xDxRLacteos': (typeof iValue[9] === 'number') ? iValue[9] : 0,
          'xDxRCafe': (typeof iValue[10] === 'number') ? iValue[10] : 0,
          'xDxRCatEnExp': (typeof(iValue[11]) == 'number') ? iValue[11] : 0,
          'clientesCompra': (typeof iValue[12] == 'number') ? iValue[12] : 0,
          'altaFdeV': (typeof iValue[13] == 'number') ? iValue[13] : 0,
        });
      }
    });
  });

  console.log(rutas);
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
    console.log(message);
    console.log('\n\n\n\n\n\n');
    // Send message
    //sendWhatsappMessage(process.env.WHATSAPP_API_AUTH_PHONE, message);
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
  
  let reporteExcel;
  if (!Array.isArray(req.files.reporteExcel)) {
    reporteExcel = req.files.reporteExcel;
  } else {
    return res.status(400).send('Please upload one xlsx file.');
  }
  
  const rutas = await getRutas(reporteExcel);
  const indicadores = await getIndicadores(reporteExcel);
  await evaluateRutas(rutas, indicadores);
  
  res.redirect('/submit');
});

module.exports = submitRouter;