const express = require('express');
const postAuth = require('../controllers/post');
const getAuth = require('../controllers/senior');;
const auth = require('../middleware/auth');
const routerSenior = express.Router();


routerSenior.post('/postLogin', postAuth.postLogin);
routerSenior.post('/postHours', auth, postAuth.postHours);
routerSenior.post('/postSendEmail', auth, postAuth.postSendEmail);


routerSenior.get('/postSendEmail', auth, getAuth.getColaboradorGestor);
routerSenior.get('/getLogin', auth, getAuth.getLogin);


module.exports = routerSenior;