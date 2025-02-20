const jwt = require('jsonwebtoken');
const connectDB = require('../services/index');

module.exports = async (req, res, next) => {
    let token = req.cookies['token'];

    if (!token && req.headers['authorization']) {
        const authHeader = req.headers['authorization'];
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: '[AVISO] - TOKEN NÃO INFORMADO' });
    }

    try {
        const pool = connectDB;
        const decoded = jwt.verify(token, process.env.TOKEN);
        const userId = decoded.id;

        const result = await pool.request()
            .input('numcad', userId)
            .query('SELECT * FROM r034fun WHERE numcad = @numcad');

        if (!result.recordset[0]) {
            return res
                .status(404)
                .json({ message: '[AVISO] - USUÁRIO NÃO ENCONTRADO' });
        }

        const user = result.recordset[0];
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res
                .status(403)
                .json({ message: '[AVISO] - AUTENTICAÇÃO NÃO VALIDADA' });
        } else {
            console.error('[AVISO] - ERRO AO VERIFICAR USUÁRIO:', error);
            return res
                .status(500)
                .json({ message: '[AVISO] - ERRO INTERNO DO SERVIDOR' });
        }
    }
};