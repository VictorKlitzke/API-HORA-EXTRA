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
            .query(`SELECT * FROM R034FUN FU JOIN R024CAR RC ON RC.CODCAR = FU.CODCAR WHERE FU.NUMCAD = @MATRICULA`);

        const user = result.recordset[0];

        if (!result.recordset[0]) {
            return res.status(401).json({ message: 'Usuário ou senha inválidos.' });
        }

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
            numloc: user.numloc
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
    const { numcad, tipcol, numemp, motivo, selectedHours, status } = data;
    const codrat = 0;
    const motsit = 0;
    const codusu = 0;

    console.log('Recebendo dados:', data);

    if (!numcad || !tipcol || !numemp || !Array.isArray(selectedHours) || selectedHours.length === 0) {
        return res.status(400).json({ message: 'Informações insuficientes para processamento.' });
    }

    try {
        const pool = await connectDB();

        const convertTimeToMinutes = (timeString) => {
            if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
                console.error('Formato inválido ao converter horas:', timeString);
                return 0;
            }
            const [hours, minutes] = timeString.split(':').map(Number);
            return (hours * 60) + (minutes || 0);
        };

        const formattedHours = selectedHours
            .map(hourStr => {
                if (typeof hourStr !== 'string' || !hourStr.includes('-')) {
                    console.error('Formato inválido de hora extra:', hourStr);
                    return null;
                }

                const [datePart, timePart] = hourStr.split(' - ');
                const datapu = moment(datePart, 'DD/MM/YYYY').format('YYYY-MM-DD HH:mm:ss.SSS');
                const qtdhor = convertTimeToMinutes(timePart.replace(' h', ''));
                const isSaturday = moment(datePart, 'DD/MM/YYYY').day() === 6;
                const codsit = isSaturday ? 305 : 301;

                return { datapu, qtdhor, codsit };
            })
            .filter(item => item !== null);

        if (formattedHours.length === 0) {
            return res.status(400).json({ message: 'Nenhuma hora extra válida foi encontrada.' });
        }

        for (let hour of formattedHours) {
            try {
                await pool.request()
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
                                INSERT INTO R066SIT (numcad, tipcol, numemp, datapu, qtdhor, codrat, motsit, codusu, codsit)
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

            if (!status === 'aprovado') await this.postSendEmail(motivo, selectedHours, numcad, nomfun, titred, nomloc);
            return res.status(200).json({ message: 'Horas extras reprovadas e e-mail enviado!' });
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

    console.log(selectedHours);


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

        const formattedHours = selectedHours
            .map(hour => {

                if (typeof hour === 'string') {
                    return hour.replace(/\s?h$/, '').trim();
                } else if (typeof hour === 'object' && hour.DATA_EXTRA && hour.HORA_EXTRA) {
                    const hora = hour.HORA_EXTRA.replace(/\s?h$/, '').trim();
                    return `${hour.DATA_EXTRA} - ${hora}`;
                }
                return 'Informação inválida de hora extra';
            })
            .join("\n");

        const mailOptions = {
            from: process.env.STMP_FROM,
            to: process.env.STMP_REMETENTE,
            subject: 'Reprovação de Horas Extras',
            text: `As horas extras do colaborador ${numcad}: ${nomfun} foram reprovadas.\n
                   Motivo: ${motivo}\n
                   Horas reprovadas: ${formattedHours}\n
                   Cargos: ${titred}`
        };

        try {
            await transporter.sendMail(mailOptions);
            return res.status(200).json({ message: 'E-mail enviado com sucesso!' });
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return res.status(500).json({ message: 'Erro no servidor ao enviar email.', error: error.message });
        }
    } else {
        return res.status(400).json({ message: 'Local não permitido para envio de e-mail.' });
    }
};