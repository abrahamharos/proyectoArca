/**
 * Required External Modules
 */
 const express = require('express');
 const dotenv = require('dotenv');
 const path = require('path');
 const fileUpload = require('express-fileupload');

/**
 * Required routes
 */
 const webhookRequestRouter = require('./routes/webhook.router');
 const submitRouter = require('./routes/submit.router');

 dotenv.config();

 /**
 * App Variables
 */
const PORT = (process.env.PORT || '8080');  
const app = express();

 /**
 *  App Configuration
 */

app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());

/**
 * Server Activation
 */
 app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use("/webhooks", webhookRequestRouter);
app.use("/", submitRouter);