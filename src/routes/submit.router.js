const express = require('express');
const fileUpload = require('express-fileupload');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');


const submitRouter = express.Router();

// Get indicadores
async function getIndicadores(reporteExcel) {
  var indicadores;
 await readXlsxFile(Buffer.from(reporteExcel['data'])).then((rows) => {
    rows.forEach((iValue, iIndex) => {
      // Titulo columnas
      if (iIndex == 0) {
        rows[iIndex].forEach((jValue, jIndex) => {
          if (jIndex >= 9) {
            console.log(jValue);
          }
        });
      }
    });
  });

  console.log(indicadores);
  return ';';
}

/* GET home page. */
submitRouter.get('/', function(req, res) {
    res.render('submit', {});
  });

submitRouter.post('/', function(req, res) {

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  
  let reporteExcel;
  if (!Array.isArray(req.files.reporteExcel)) {
    reporteExcel = req.files.reporteExcel;
  } else {
    return res.status(400).send('Please upload one xlsx file.');
  }
  
  getIndicadores(reporteExcel);
  res.render('submit', {});
});

module.exports = submitRouter;