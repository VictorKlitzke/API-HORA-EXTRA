const express = require('express');
const getAuth = require('../controllers/agrimanager');
const auth = require('../middleware/auth');

const routerAgrimanager = express.Router();

routerAgrimanager.get('/getSafra', auth, getAuth.getSafra);
routerAgrimanager.get('/getTalhao', auth, getAuth.getTalhao);
routerAgrimanager.get('/getFazenda', auth, getAuth.getFazenda);
routerAgrimanager.get('/getOperador', auth, getAuth.getOperador);
routerAgrimanager.get('/getCiclo', auth, getAuth.getCiclo);
routerAgrimanager.get('/getCultura', auth, getAuth.getCultura);

module.exports = routerAgrimanager;