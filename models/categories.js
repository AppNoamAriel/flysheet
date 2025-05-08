const mongoose = require('mongoose');

const categoriesSchema = mongoose.Schema({
    nom: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Categories', categoriesSchema);