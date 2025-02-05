const connectDB = require('../services/index');
const convertTimeToMinutes = require('../utils/index');

const jwt = require("jsonwebtoken");
const moment = require('moment');
const nodemailer = require('nodemailer');

require('dotenv').config();

exports.postLogin = async (req, res) => {
    const { matricula } = req.body;
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
    const { codrat = 0, motsit, codusu } = 0;

    if (!numcad || !tipcol || !numemp || !selectedHours || selectedHours.length === 0) {
        return res.status(400).json({ message: 'Informações insuficientes para processamento.' });
    }

    try {
        const pool = await connectDB();

        const formattedHours = selectedHours.map(hour => {
            const dataExtra = moment(hour.DATA_EXTRA, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss.SSS');
            const qtdhor = convertTimeToMinutes(hour.HORA_EXTRA);

            const isSaturday = moment(hour.DATA_EXTRA).day() === 6;
            const codsit = isSaturday ? 305 : 301;

            return { dataExtra, qtdhor, codsit };
        });

        console.log('Horas processadas:', formattedHours);

        for (let hour of formattedHours) {
            await pool.request()
                .input('numcad', numcad)
                .input('tipcol', tipcol)
                .input('numemp', numemp)
                .input('data_extra', hour.dataExtra)
                .input('qtdhor', hour.qtdhor)
                .input('codrat', codrat)
                .input('motsit', motsit)
                .input('codusu', codusu)
                .input('codsit', hour.codsit)
                .query(`
                    INSERT INTO R066SIT (numcad, tipcol, numemp, data_extra, qtdhor, codrat, motsit, codusu, codsit) 
                    VALUES (@numcad, @tipcol, @numemp, @data_extra, @qtdhor, @codrat, @motsit, @codusu, @codsit)
                `);
        }

        return res.status(200).json({ message: 'Horas extras registradas com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar horas extras:', error);
        return res.status(500).json({ message: 'Erro no servidor ao registrar horas extras.' });
    }
};


exports.postSendEmail = async (req, res) => {
    const { nomfun, titred, numcad, tipcol, numemp, motivo, selectedHours } = req.body;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    })

    const mailOptions = {
        from: 'seu-email@gmail.com',  
        to: 'email-rh@dominio.com', 
        subject: 'Reprovação de Horas Extras', 
        text: `As horas extras do colaborador ${JSON.stringify(nomfun)} foram reprovadas.
            Motivo: ${motivo}
            Horas reprovadas: ${JSON.stringify(selectedHours)} 
            Cargos: ${JSON.stringify(titred)}`};

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso: ', info.response);

    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return res.status(500).json({ message: 'Erro no servidor ao enviar email.' });
    }
}
