const express = require('express');
const getAuth = require('../controllers/agrimanager');
const routerAgrimanager = express.Router();

routerAgrimanager.get('/getSafra', getAuth.getSafra);
routerAgrimanager.get('/getTalhao', getAuth.getTalhao);
routerAgrimanager.get('/getFazenda', getAuth.getFazenda);
routerAgrimanager.get('/getOperador', getAuth.getOperador);
routerAgrimanager.get('/getCiclo', getAuth.getCiclo);
routerAgrimanager.get('/getCultura', getAuth.getCultura);

module.exports = routerAgrimanager;