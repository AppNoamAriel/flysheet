const bcrypt = require('bcrypt');

exports.encrypt = (password) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

exports.compareHash = (password, hashed) => {
    return bcrypt.compareSync(password, hashed);
};
