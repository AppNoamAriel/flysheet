const mongoose = require('mongoose');

const leadsSchema = mongoose.Schema({
  etes_vous: { type: String },
  chauffage: { type: String },
  confirmation_nom: { type: String },
  comment_vous_appeler_vous: { type: String },
  lastname: { type: String },
  firstname: { type: String },
  phone: { type: String },
  zipcode: { type: String },
  cid: { type: String },
  addr: { type: String },
  city: { type: String },
  state: { type: String },
  message: { type: String },
  email: { type: String },
  date: { type: String },
  token: { type: String },
  url_flysheet: { type: String, default:''},
  status_transmission: { type: Boolean, default: false}
});

module.exports = mongoose.model('Leads', leadsSchema);
