const jwt = require('jsonwebtoken');
const t = require('../constante/token');

exports.createToken = function (userId, accountType) {
    let token =
        jwt.sign(
            {userId: userId, accountType: accountType},
            t.privateKey,
            {expiresIn: 60*60*24*30*12}
        );
    return token;
};

exports.destroy = async function(token) {
    jwt.destroy(token);
};

exports.parseCookie = async function(cookie) {
    if (cookie === undefined) {
        return null;
    }
    let list = {},
        rc = cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        let parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    return list;
};
