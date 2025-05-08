const mongoose = require('mongoose');

const sheetRowSchema = new mongoose.Schema({
  row: [String],
  timestamp: Date
});

module.exports = mongoose.model('SheetRow', sheetRowSchema);
