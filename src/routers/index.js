const express = require('express');
const postAuth = require('../controllers/post');
const getAuth = require('../controllers/get');
const auth = require('../middleware/auth');
const router = express.Router();


const routes = {
    post: {
        '/postLogin': postAuth.postLogin,
        '/postLogout': postAuth.postLogout,
        '/postHours': postAuth.postHours,
        '/postSendEmail': postAuth.postSendEmail
    },
    get: {
        '/getLogin': getAuth.getLogin,
        '/getColaboradorGestor': getAuth.getColaboradorGestor
    },
    siagri: {
        '/getSafra': getAuth.getSafra,
        '/getTalhao': getAuth.getTalhao
    }
};

router.use(auth);
router.post('/postLogin', routes.post['/postLogin']);

Object.entries({ ...routes.post, ...routes.get, ...routes.siagri }).forEach(([path, handler]) => {
    router[path.startsWith('/post') ? 'post' : 'get'](path, handler);
});

module.exports = router;