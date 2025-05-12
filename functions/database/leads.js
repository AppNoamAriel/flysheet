const Lead = require('../../models/leads');

exports.add = async (leadData) => {
  try {
    const lead = new Lead(leadData);
    return await lead.save();
  } catch (err) {
    console.error("Erreur add lead:", err);
    return { error: err.message };
  }
};

exports.update = async (id, updateData) => {
  try {
    return await Lead.findByIdAndUpdate(id, updateData, { new: true });
  } catch (err) {
    console.error("Erreur update lead:", err);
    return null;
  }
};

exports.getAll = async () => {
  try {
    return await Lead.find();
  } catch (err) {
    console.error("Erreur getAll leads:", err);
    return [];
  }
};

exports.getBySearch = async ({ url_flysheet, status_transmission }) => {
  try {
    const search = {};
    if (url_flysheet) search.url_flysheet = { $regex: url_flysheet, $options: 'i' };
    if (status_transmission !== undefined) search.status_transmission = status_transmission === 'true';

    return await Lead.find(search);
  } catch (err) {
    console.error("Erreur getBySearch leads:", err);
    return [];
  }
};

exports.delete = async (id) => {
  try {
    return await Lead.findByIdAndDelete(id);
  } catch (err) {
    console.error("Erreur delete lead:", err);
    return null;
  }
};
