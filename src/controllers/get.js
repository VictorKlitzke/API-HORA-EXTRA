const { connectDBSiagri, connectDB } = require('../services/index');
const sql = require('mssql');
require('dotenv').config();

exports.getLogin = async (req, res) => {
    const userId = req.user.numcad;

    if (!userId) {
        return res.status(401).json({ message: 'Acesso não autorizado.' });
    }
    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input('numcad', userId)
            .query('select fun.numcad, fun.nomfun, car.titred, car.usu_tbcarges FROM r034fun fun inner join r024car car on car.codcar = fun.codcar where numcad = @numcad');

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Matrícula não encontrada.' });
        }
        const matricula = result.recordset[0];
        return res.status(200).json({
            authorization: true,
            getLogin: matricula
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

exports.getColaboradorGestor = async (req, res) => {
    const userId = req.user.numcad;
    const numloc = req.user.numloc;

    if (!userId) {
        return res.status(401).json({ message: 'Acesso não autorizado.' });
    }

    try {
        const pool = await connectDB();
        const { recordset: ListHora } = await pool.request()
            .input('numcad', sql.Int, userId)
            .input('numloc', sql.Int, numloc)
            .query(`
                SELECT 
                    GES.POSTRA AS GESTOR,
                    COL.NUMCAD,
                    COL.NUMEMP,
                    COL.TIPCOL,
                    COL.NOMFUN,
                    CAR.TITRED,
                    CAR.USU_TBCARGES,
                    ORN.NUMLOC,
                    ORN.NOMLOC
                FROM
                    R034FUN GES
                JOIN R034FUN COL 
                    ON GES.NUMLOC = COL.NUMLOC
                    AND COL.SITAFA = 1
                JOIN R024CAR CAR
                    ON CAR.CODCAR = COL.CODCAR
                JOIN R016ORN ORN 
                    ON ORN.NUMLOC = COL.NUMLOC
                WHERE
                    GES.NUMCAD = @numcad
                    
            `);

        const uniqueResults = ListHora.filter((item, index, self) => 
            index === self.findIndex((t) => t.NUMCAD === item.NUMCAD)
        );

        if (uniqueResults.length === 0) {
            return res.status(404).json({ message: 'Nenhum colaborador encontrado para este gestor.' });
        }

        const numcadList = uniqueResults.map(item => item.NUMCAD);
        const jornadaList = await getJornadas(numcadList);
        const HoursList = await getHours(numcadList);
        const response = await Promise.all(uniqueResults.map(async (item) => {
            item.ListJornada = jornadaList.filter(J => J.NUMCAD === item.NUMCAD);
            item.ListHorasExtras = HoursList.filter(H => H.NUMCAD === item.NUMCAD);

            return item;
        }));

        return res.status(200).json({
            authorization: true,
            getColaboradorGestor: response
        });

    } catch (error) {
        console.error('Erro ao buscar colaboradores:', error);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

const getHours = async (numcadList) => {
    try {
        
        const numcalist2 = numcadList.join(' ,');
        const pool = await connectDB();
        const result = await pool.request()
            .query(
                `
                SELECT 
                    COL.NUMCAD,
                    SIT.DATAPU AS DATA_EXTRA,
                    FORMAT(FLOOR(SIT.QTDHOR / 60), '00') + ':' + FORMAT(SIT.QTDHOR % 60, '00') AS HORA_EXTRA 
                FROM  
                    R066SIT SIT 
                    JOIN R034FUN COL 
                        ON SIT.NUMCAD = COL.NUMCAD
                    JOIN r024car CR 
                        ON CR.CODCAR = COL.CODCAR
                WHERE
                    COL.NUMCAD in (${numcalist2})
                    AND SIT.CODSIT IN (301,302,303,304,305,306,307,308,309,310)
                    AND SIT.DATAPU >= '2025-01-01 00:00:00.000'
                    ORDER BY SIT.DATAPU DESC
                `
            )

            if (result.recordset.length === 0) {
                throw new Error('Nenhuma hora extra encontrada para este colaborador.');
            }
    
            return result.recordset;

    } catch (error) {
        console.error('Erro ao buscar horas:', error);
        throw new Error('Erro ao buscar horas.');
    }
}

const getJornadas = async (numcadList) => {
    try {
        const numcalist2 = numcadList.join(' ,');
        const pool = await connectDB();
        const result = await pool.request()
            .query(`
                SELECT DISTINCT 
                    AC.NUMCAD,
                    AC.DATACC,
                    STRING_AGG(FORMAT(FLOOR(AC.HORACC / 60), '00') + ':' + FORMAT(AC.HORACC % 60, '00'), ', ') AS HORAS_FORMATADAS,
                    AC.QTDACC,
                    AC.NUMCRA 
                FROM R070ACC AC
                WHERE AC.DATACC >= '2025-01-01 00:00:00.000' 
                AND AC.NUMCAD IN (${numcalist2})  
                GROUP BY AC.NUMCAD, AC.DATACC, AC.QTDACC, AC.NUMCRA
            `);

        if (result.recordset.length === 0) {
            throw new Error('Nenhuma jornada encontrada para este colaborador.');
        }

        return result.recordset;

    } catch (error) {
        console.error('Erro ao buscar jornadas:', error);
        throw new Error('Erro ao buscar jornadas.');
    }
};

exports.getTalhao = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const  result  = poolSiagri.request()
            .query('select * from Talhoes')

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Nenhum talhão encontrado.' });
        }

        const talhao = result.recordset[0];

        return res.status(200).json({
            authorization: true,
            getTalhao: talhao
        });

    } catch (error) {
        console.error('Erro ao buscar talhão:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
}

exports.getFazenda = async (req, res) => {
    const data = "MAURO";
    try {
        const poolSiagri = await connectDBSiagri();
        const result  = poolSiagri.request()
            .query('select * from DetPessoas dp where dp.Codigo = 1 and dp.Descricao like '%data%'')

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Nenhuma safra encontrada.' });
        }

        const fazenda = result.recordset[0];

        return res.status(200).json({
            authorization: true,
            getFazenda: fazenda
        });

    } catch (error) {
        console.error('Erro ao buscar talhão:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getOperador = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request()
            .query("SELECT p.Nome, p.Codigo FROM Agrimanager.dbo.Pessoas p WHERE p.Tipo = 'F2O1' AND p.Desativar <> 'S'");

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Nenhuma pessoa encontrada.' });
        }

        const operador = result.recordset[0];

        return res.status(200).json({
            getOperador: operador
        });

    } catch (error) {
        console.error('Erro ao buscar operador:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getSafra = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request().query('SELECT Codigo, Descricao, Mascara FROM agrimanager.dbo.Safras');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'Nenhuma safra encontrada.' });
        }

        return res.status(200).json({ getSafra: result.recordset });

    } catch (error) {
        console.error('Erro ao buscar safra:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getCiclo = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request().query('SELECT Codigo, Descricao, Safra, Cultura FROM agrimanager.dbo.CicloProd');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'Nenhuma safra encontrada.' });
        }

        return res.status(200).json({ getCiclo: result.recordset });

    } catch (error) {
        console.error('Erro ao buscar safra:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};
