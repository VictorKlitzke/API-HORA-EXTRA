const connectDB = require('../services/index');
const jwt = require("jsonwebtoken");
const moment = require('moment');
const convertTimeToMinutes = require('../utils/index');
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
            .query('SELECT * FROM Test.Senior.r034fun WHERE numcad = @matricula');
            
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
    const { data } = req.body;
    const { numcad, tipcol, numemp, motivo, selectedHours } = data;

    if (!numcad || !tipcol || !numemp || !selectedHours || selectedHours.length === 0) {
        return res.status(400).json({ message: 'Informações insuficientes para processamento.' });
    }

    try {
        const pool = await connectDB();

        const formattedHours = selectedHours.map(hour => {
            const dataExtra = moment(hour.DATA_EXTRA, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss.SSS');
            const qtdhor = convertTimeToMinutes(hour.HORA_EXTRA);
            return { dataExtra, qtdhor };
        });

        console.log('Horas processadas:', formattedHours);

        for (let hour of formattedHours) {
            await pool.request()
                .input('numcad', numcad)
                .input('tipcol', tipcol)
                .input('numemp', numemp)
                .input('data_extra', hour.dataExtra)
                .input('qtdhor', hour.qtdhor)
                .query(`
                    INSERT INTO sua_tabela (numcad, tipcol, numemp, data_extra, qtdhor) 
                    VALUES (@numcad, @tipcol, @numemp, @data_extra, @qtdhor)
                `);
        }

        return res.status(200).json({ message: 'Horas extras registradas com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar horas extras:', error);
        return res.status(500).json({ message: 'Erro no servidor ao registrar horas extras.' });
    }
};
