const mongoose = require('mongoose');

const subcategoriesSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    id_cat: { type: mongoose.Schema.Types.ObjectId, ref: 'Categories' }
});

module.exports = mongoose.model('Subcategories', subcategoriesSchema);
