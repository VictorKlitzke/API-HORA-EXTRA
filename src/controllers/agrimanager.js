const { connectDBSiagri } = require('../services/index');
const sql = require('mssql');
require('dotenv').config();

exports.getTalhao = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result  = await poolSiagri.request().query("select Codigo, Identificacao, Safra, Fazenda from Talhoes")

        console.log(result.recordset);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'Nenhum talhão encontrado.' });
        }

        return res.status(200).json({ getTalhao: result.recordset });

    } catch (error) {
        console.error('Erro ao buscar talhão:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
}
exports.getFazenda = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = poolSiagri.request()
            .query("select dp.Codigo, dp.Descricao, dp.Sequencial from DetPessoas dp where dp.Codigo = 1 and dp.Descricao like '%MAURO%'")

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Nenhuma fazenda encontrada.' });
        }
        return res.status(200).json({
            authorization: true,
            getFazenda: result.recordset
        });

    } catch (error) {
        console.error('Erro ao buscar Fazenda:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};
exports.getOperador = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request()
            .query("SELECT p.Nome, p.Codigo FROM Pessoas p WHERE p.Tipo = 'F2O1' AND p.Desativar <> 'S'");

        if (!result.recordset.length) {
            return res.status(404).json({ message: 'Nenhuma pessoa encontrada.' });
        }
        return res.status(200).json({
            getOperador: result.recordset
        });

    } catch (error) {
        console.error('Erro ao buscar operador:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};
exports.getSafra = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request().query('SELECT Codigo, Descricao, Mascara FROM Safras');

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
        const result = await poolSiagri.request().query('SELECT Codigo, Descricao, Safra, Cultura FROM CicloProd');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'Nenhuma safra encontrada.' });
        }

        return res.status(200).json({ getCiclo: result.recordset });

    } catch (error) {
        console.error('Erro ao buscar ciclo:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

exports.getCultura = async (req, res) => {
    try {
        const poolSiagri = await connectDBSiagri();
        const result = await poolSiagri.request().query('select Codigo, Descricao from Culturas c ');

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ message: 'Nenhuma safra encontrada.' });
        }

        return res.status(200).json({ getCultura: result.recordset });

    } catch (error) {
        console.error('Erro ao buscar cultura:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};