const jwt = require('jsonwebtoken');
const tokenConst = require('../constante/token');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '').trim();
        const userId = req.headers.id?.trim();

        if (!token || !userId) {
            return res.status(403).json({ status: false, error: 'Token ou ID manquant' });
        }

        const decoded = jwt.verify(token, tokenConst.privateKey);

        if (
            decoded.userId === userId &&
            ['admin', 'sous_admin', 'client'].includes(decoded.accountType)
        ) {
            res.setHeader('userId', userId);
            res.setHeader('isAdmin', decoded.accountType === 'admin');
            res.setHeader('isSousAdmin', decoded.accountType === 'sous_admin');
            return next();
        }

        return res.status(403).json({ status: false, error: 'Accès refusé' });
    } catch (err) {
        return res.status(403).json({ status: false, error: 'Token invalide' });
    }
};
