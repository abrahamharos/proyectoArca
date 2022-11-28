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

const sendTo = "jefe";

// Read indicadores from JSON file
function readIndicadores() {
  const indicadoresBuffer = fs.readFileSync('src/templates/indicadores.json');
  const indicadores = JSON.parse(indicadoresBuffer.toString());
  return indicadores["indicadores"];
}

async function getContactsFromCSV(contactosCSV, res) {
  try {
    var contacts = {};
    const csvReport = contactosCSV['data'].toString();
    let data = csvReport.split("\n");

    for (let i = 0; i < data.length; i++) {
      if (i > 0) {
        let row = data[i].split(",");
        var formattedRows = row.map(function (e) {
          e = e.replace(/["'\r]/g, "");
          return e;
        });

        contactObj = {
          'nombre': formattedRows[0],
          'telefono': formattedRows[1],
          'puesto': formattedRows[3],
        };

        if (formattedRows[2] in contacts) {
          contacts[formattedRows[2]].push(contactObj);
        } else {
          contacts[formattedRows[2]] = [contactObj];
        }
      }
    }

    console.log(contacts);

    return contacts;
  } catch (e) {
    return res.status(400).send('Invalid format of contacts CSV provided.');
  }
}

async function getRutasFromCSV(reporteCSV, res) {
  try {
    var rutas = [];
    const csvReport = reporteCSV['data'].toString();
    let data = csvReport.split("\n");

    for (let i = 0; i < data.length; i++) {
      if (i > 2 && i < data.length - 2) {
        let row = data[i].split(",");
        var formattedRows = row.map(function (e) {
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
  } catch (e) {
    return res.status(400).send('Invalid format of report CSV provided.');
  }
}

async function sendWhatsappMessage(phone_number, message, res) {
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

async function evaluateRutas(rutas, indicadores, contactos, res) {
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


    // get contacts for this ruta
    if (ruta['ruta'] in contactos) {
      let contacts = contactos[ruta['ruta']];
      contacts.forEach((contact) => {
        if (contact['puesto'] == sendTo) {
          let phone_number = contact['telefono'];
          let nombre = contact['nombre'];
          messageVariables.push(nombre);

          // Compile File with variables
          let message = format(messageTemplate, messageVariables);

          // Send message
          sendWhatsappMessage(phone_number, message, res);
        }
      });
    } else {
      console.log('No contacts for ruta ' + ruta['ruta']);
    }
  });
}

async function getReporteCSV(req, res) {
  let reporteCSV;

  if (!Array.isArray(req.files.reporteCSV)) {
    reporteCSV = req.files.reporteCSV;
  } else {
    return res.status(400).send('Please upload report csv file.');
  }

  return await getRutasFromCSV(reporteCSV, res);
}

async function getContactosCSV(req, res) {
  let contactosCSV;

  if (!Array.isArray(req.files.contactosCSV)) {
    contactosCSV = req.files.contactosCSV;
  } else {
    return res.status(400).send('Please upload contacts csv file.');
  }

  return await getContactsFromCSV(contactosCSV, res);
}

/* GET home page. */
submitRouter.get('/', function (req, res) {
  res.render('submit', {});
});

submitRouter.post('/', async function (req, res) {

  if (!req.files || Object.keys(req.files).length <= 1) {
    return res.status(400).send('No all files were uploaded.');
  }

  const rutas = await getReporteCSV(req, res);
  const indicadores = readIndicadores();
  const contacts = await getContactosCSV(req, res);
  await evaluateRutas(rutas, indicadores, contacts, res);

  res.redirect('/');
});

module.exports = submitRouter;