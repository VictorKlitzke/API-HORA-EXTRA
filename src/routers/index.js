const express = require('express');
const postAuth = require('../controllers/post');
const getAuth = require('../controllers/get');
const auth = require('../middleware/auth');
const router = express.Router();

// POST
router.post('/postLogin', postAuth.postLogin);
router.post('/postLogout', auth, postAuth.postLogout);
router.post('/postHours', auth, postAuth.postHours);
router.post('/postSendEmail', auth, postAuth.postSendEmail);

// GET
router.get('/getLogin', auth, getAuth.getLogin);
router.get('/getColaboradorGestor', auth, getAuth.getColaboradorGestor);

module.exports = router;