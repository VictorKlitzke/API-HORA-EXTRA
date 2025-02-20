const express = require('express');
const postAuth = require('../controllers/post');
const getAuth = require('../controllers/get');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/getSafra', getAuth.getSafra);
router.get('/getTalhao', getAuth.getTalhao);
router.get('/getFazenda', getAuth.getFazenda);
router.get('/getOperador', getAuth.getOperador);
router.get('/getCiclo', getAuth.getCiclo);

const routes = {
    post: {
        '/postLogout': postAuth.postLogout,
        '/postHours': postAuth.postHours,
        '/postSendEmail': postAuth.postSendEmail
    },
    get: {
        '/getLogin': getAuth.getLogin,
        '/getColaboradorGestor': getAuth.getColaboradorGestor
    },
};

router.post('/postLogin', postAuth.postLogin);
router.use(auth);

Object.entries({ ...routes.post, ...routes.get }).forEach(([path, handler]) => {
    router[path.startsWith('/post') ? 'post' : 'get'](path, handler);
});

module.exports = router;