const express = require('express');
const postAuth = require('../controllers/post');
const getAuth = require('../controllers/get');
const auth = require('../middleware/auth');
const router = express.Router();

// POST
router.post('/postLogin', postAuth.postLogin);
router.post('/postLogout', postAuth.postLogout);


// GET
router.get('/getLogin', auth, getAuth.getLogin);
router.get('/getColaboradorGestor', auth, getAuth.getColaboradorGestor);

module.exports = router;