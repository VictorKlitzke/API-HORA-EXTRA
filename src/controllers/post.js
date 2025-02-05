const connectDB = require('../services/index');
const sql = require('mssql');
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
    const codrat = 0;
    const motsit = 0; 
    const codusu = 0;

    if (!numcad || !tipcol || !numemp || !selectedHours || selectedHours.length === 0) {
        return res.status(400).json({ message: 'Informações insuficientes para processamento.' });
    }
    try {
        const pool = await connectDB();
    
        const formattedHours = selectedHours.map(hour => {
            const datapu = moment(hour.DATA_EXTRA, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss.SSS'); 
            const qtdhor = convertTimeToMinutes(hour.HORA_EXTRA);
    
            const isSaturday = moment(hour.DATA_EXTRA).day() === 6;
            const codsit = isSaturday ? 305 : 301;
    
            return { datapu, qtdhor, codsit };
        });
    
        for (let hour of formattedHours) {
            try {
                const result = await pool.request()
                    .input('numcad', sql.Int, numcad)
                    .input('tipcol', sql.Int, tipcol)
                    .input('numemp', sql.Int, numemp)
                    .input('datapu', sql.DateTime, hour.datapu)  
                    .input('qtdhor', sql.Int, hour.qtdhor)
                    .input('codrat', sql.Int, codrat)
                    .input('motsit', sql.Int, motsit)
                    .input('codusu', sql.Int, codusu)
                    .input('codsit', sql.Int, hour.codsit)
                    .query(`
                        BEGIN TRY
                            INSERT INTO Test.Senior.R066SIT (numcad, tipcol, numemp, datapu, qtdhor, codrat, motsit, codusu, codsit)
                            VALUES (@numcad, @tipcol, @numemp, @datapu, @qtdhor, @codrat, @motsit, @codusu, @codsit)
                        END TRY
                        BEGIN CATCH
                            SELECT ERROR_MESSAGE() AS ErrorMessage;
                            PRINT 'Erro de inserção ignorado: ' + ERROR_MESSAGE();
                        END CATCH
                    `);
            } catch (error) {
                console.error('Erro ao tentar inserir dados:', error);
            }
            
        }
        
        return res.status(200).json({ message: 'Horas extras registradas com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar horas extras:', error);
        return res.status(500).json({ message: 'Erro no servidor ao registrar horas extras.' });
    }
    
};

exports.postSendEmail = async (req, res) => {
    const { data } = req.body;
    const { nomfun, titred, numcad, tipcol, numemp, motivo, selectedHours, nomloc } = data;
    
    if (!nomfun || !titred || !numcad || !tipcol || !numemp || !motivo || !nomloc) {
        return res.status(400).json({ message: 'Informações incompletas.' });
    }

    if (!selectedHours || !Array.isArray(selectedHours) || selectedHours.length === 0) {
        return res.status(400).json({ message: 'Nenhuma hora extra selecionada.' });
    }

    if (nomloc.includes(' - ADM')) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    
        const formattedHours = selectedHours.map(hour => {
            if (hour.DATA_EXTRA && hour.HORA_EXTRA) {
                return `${hour.DATA_EXTRA} - ${hour.HORA_EXTRA}`;
            }
            console.log(hour.DATA_EXTRA + hour.HORA_EXTRA);
            return 'Informação inválida de hora extra';
        }).join("\n"); 
        const mailOptions = {
            from: process.env.STMP_FROM,
            to: process.env.STMP_REMETENTE,
            subject: 'Reprovação de Horas Extras',
            text: `As horas extras do colaborador ${numcad}: ${nomfun} foram reprovadas.\n
                   Motivo: ${motivo}\n
                   Horas reprovadas:\n${formattedHours}\n
                   Cargos: ${titred}`
        };
    
        try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
    
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return res.status(500).json({ message: 'Erro no servidor ao enviar email.', error: error.message });
        }
    }

};