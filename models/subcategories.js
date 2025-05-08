const mongoose = require('mongoose');

const subcategoriesSchema = mongoose.Schema({
    nom: { type: String, required: true, unique: true },
    id_cat: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories', required: true }
});

module.exports = mongoose.model('Subcategories', subcategoriesSchema);