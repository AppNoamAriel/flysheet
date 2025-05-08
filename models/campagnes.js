const mongoose = require('mongoose');

const campagnesSchema = mongoose.Schema({
  nom: { type: String, required: true },
  url: { type: String, required: true },
  typeProduit: { type: String, required: true },
  objectif: { type: Number, required: true },
  valide: { type: Number, default: 0 },
  invalide: { type: Number, default: 0 },
  tel: { type: Number, default: 0 },
  unique: { type: Number, default: 0 },
  installer: { type: Number, default: 0 },
  etat: { type: Boolean, default: false },
  departements: { type: [String], default: [] }, 
  pile: { type: Boolean, default: false },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategories' },        
});

module.exports = mongoose.model('Campagnes', campagnesSchema);
