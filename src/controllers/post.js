const connectDB = require('../services/index');
const jwt = require("jsonwebtoken");
require('dotenv').config();

exports.postLogin = async (req, res) => {
    const { matricula }  = req.body;

    console.log(matricula);
    const pool = await connectDB();

    if (!matricula) {
        return res.status(400).json({ message: 'Matricula não informada.' });
    }

    try {

        const result = await pool.request()
            .input('matricula', matricula)
            .query('SELECT * FROM r034fun WHERE numcad = @matricula');
            
        if (!result.recordset[0]) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }
        
        const user = result.recordset[0];

        const token = jwt.sign({ id: user.numcad, postra: user.postra }, process.env.TOKEN, { expiresIn: "3h" });
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 18000000
        });

        return res.json({
            authorization: true,
            token: token,
            message: "Login realizado com sucesso",
            UserId: user.numcad,
            postra: user.postra
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}

exports.postLogout = async (req, res) => {
    const token = req.cookies['token'] || req.headers['authorization'];

    if (token) {
        res.cookie('token', '', {
            expires: new Date(0),
            path: '/',
            httpOnly: true,
        });
    }
    res.status(200).json({ authorization: false, message: 'Logout realizado com sucesso' });
}

exports.postHours = async (req, res) => {
    const { matricula, data, horas }  = req.body;

    const codray = 0;
    const motsit = 0;
    const codusu = 0;
}