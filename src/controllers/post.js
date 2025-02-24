const { connectDB } = require('../services/index');
const connectDBSiagri = require('../services/index');
const { validateArray } = require('../utils');
const sql = require('mssql');

const jwt = require("jsonwebtoken");
const moment = require('moment');
const nodemailer = require('nodemailer');

require('dotenv').config();

exports.postLogin = async (req, res) => {
    const { matricula } = req.body;

    if (!matricula) {
        return res.status(400).json({ message: 'Matricula não informada.' });
    }

    try {

        const pool = await connectDB();

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
    const { numcad, tipcol, numemp, motivo, selectedHours, status, numFunAut, numempAut, tipcolAut } = data;
    const codrat = 0;
    const motsit = 0;
    const codusu = 0;
    const horini = 0;
    const horfim = 0;
    const tolaea = 0;     
    const tolasa = 0;     
    const tolaep = 0;    
    const tolasp = 0;
    const staacc = 0
    validateArray(selectedHours);

    if (!numcad || !tipcol || !numemp || selectedHours.length === 0) {
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
                    .input('numemp', sql.Int, numemp)
                    .input('tipcol', sql.Int, tipcol)
                    .input('numcad', sql.Int, numcad)
                    .input('datini', sql.DateTime, hour.datapu)
                    .input('horini', sql.Int, horini)
                    .input('horfim', sql.Int, horfim)
                    .input('datfim', sql.DateTime, hour.datapu)
                    .input('empaut', sql.Int, numempAut)
                    .input('tclaut', sql.Int, tipcolAut)
                    .input('cadaut', sql.Int, numFunAut)
                    .input('codusu', sql.Int, numcad)
                    .input('staacc', sql.Int, staacc)
                    .input('tolaea', sql.Int, tolaea)
                    .input('tolaep', sql.Int, tolaep)
                    .input('tolasp', sql.Int, tolasp)
  
                    .query(`
                        INSERT INTO R064EXT (
                            numemp,      
                            tipcol,      
                            numcad,      
                            datini,    
                            horini,     
                            horfim,     
                            datfim,      
                            empaut,    
                            tclaut,     
                            cadaut,    
                            codusu,    
                            staacc,    
                            tolaea,     
                            tolasa,     
                            tolaep,    
                            tolasp   
                        )
                        VALUES (
                            @numemp,
                            @tipcol,    
                            @numcad,     
                            @datini,     
                            @horini,    
                            @horfim,   
                            @datfim,    
                            @empaut,    
                            @tclaut,     
                            @cadaut,     
                            @codusu,     
                            @staacc,     
                            @tolaea,     
                            @tolasa,     
                            @tolaep,    
                            @tolasp,   
                        );
                        `);
            } catch (error) {
                console.error('Erro ao tentar inserir dados:', error);
            }

            try {
                await pool.request()
                    .input('numcad', sql.Int, numcad)
                    .input('tipcol', sql.Int, tipcol)
                    .input('numemp', sql.Int, numemp)
                    .query(`
                        UPDATE R066SIT
                        SET codsit = 16
                        WHERE numcad = @numcad AND tipcol = @tipcol AND numemp = @numemp;
                        `);

            } catch (error) {
                console.error('Erro ao tentar atualizar dados:', error);
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

exports.postDBO = async (req, res) => {

    const { data } = req.body;
    const { Safra, CicloProducao, Talhao, NumeroServico, Maquina, Operador, Inicio, Final, HorimetroInicial, HorimetroFinal, AreaTalhao, Servico, Fazenda } = data;

    if (!Safra || !Talhao || !NumeroServico || !AreaTalhao || !HorimetroInicial || !HorimetroFinal || !CicloProducao) {
        return res.status(400).json({ message: 'Informações insuficientes.' });
    }

    try {

        const pool = connectDBSiagri();

    } catch (error) {
        console.error('Erro ao tentar conectar ao banco de dados:', error);
        return res.status(500).json({ message: 'Erro no servidor ao conectar ao banco de dados.' });
    }
};