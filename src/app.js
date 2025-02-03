const express = require('express');
const cors = require('cors');
const authRouter = require('./routers/index');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const CorsOptions = {
    origin: 'http://192.168.103.251:3000/api',
    credentials: true,
    optionsSuccessStatus: 200,
}

const app = express();
app.use(cors(CorsOptions));
app.use(cookieParser())
app.use(bodyParser.json());
app.use('/api', authRouter);

module.exports = app;