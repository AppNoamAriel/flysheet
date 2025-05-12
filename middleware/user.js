const jwt = require('jsonwebtoken');
const tokenConst = require('../constante/token');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '').trim();
        const userId = req.headers.id?.trim();

        if (!token || !userId) {
            return res.status(403).json({ status: false, error: 'Token ou ID manquant' });
        }

        const decodedToken = jwt.verify(token, tokenConst.privateKey);

        if (
            decodedToken.userId === userId &&
            ['admin', 'sous_admin', 'client'].includes(decodedToken.accountType)
        ) {
            res.setHeader('userId', userId);
            res.setHeader('isAdmin', decodedToken.accountType === 'admin');
            res.setHeader('isSousAdmin', decodedToken.accountType === 'sous_admin');
            return next();
        }

        return res.status(403).json({ status: false, error: 'Accès refusé' });
    } catch (err) {
        return res.status(403).json({ status: false, error: 'Token invalide' });
    }
};
