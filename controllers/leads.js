const Lead = require('../models/leads');

exports.addLead = async (req, res) => {
  try {
    const newLead = new Lead(req.body);
    await newLead.save();
    res.status(201).json({ status: true, message: 'Lead ajouté.', data: newLead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Erreur.' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ status: false, message: 'Lead non trouvé.' });
    res.status(200).json({ status: true, message: 'Lead mis à jour.', data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Erreur.' });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find();
    res.status(200).json({ status: true, message: 'OK.', data: leads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: 'Erreur.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { url_flysheet, status_transmission } = req.query;

    const search = {};

    if (url_flysheet) {
      search.url_flysheet = { $regex: url_flysheet, $options: 'i' }; 
    }

    if (typeof status_transmission !== 'undefined') {
      if (status_transmission === 'true' || status_transmission === 'false') {
        search.status_transmission = status_transmission === 'true';
      }
    }

    const leads = await Lead.find(search);

    res.status(200).json({
      status: true,
      message: "OK.",
      data: leads
    });
  } catch (err) {
    console.error("Erreur récupération leads :", err);
    res.status(500).json({ status: false, message: "Erreur." });
  }
};

  exports.deleteLead = async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await Lead.findByIdAndDelete(id);
  
      if (!deleted) {
        return res.status(404).json({ status: false, message: "Lead introuvable." });
      }
  
      res.status(200).json({ status: true, message: "Lead supprimé." });
    } catch (err) {
      console.error("Erreur suppression lead :", err);
      res.status(500).json({ status: false, message: "Erreur." });
    }
  };
  exports.searchLeads = async (req, res) => {
    try {
      const { url_flysheet, status_transmission } = req.query;
  
      const search = {};
      if (url_flysheet) search.url_flysheet = url_flysheet;
      if (status_transmission) search.status_transmission = status_transmission;
  
      const leads = await Leads.find(search);
      res.status(200).json({ status: true, message: "OK.", data: leads });
    } catch (err) {
      console.error("Erreur recherche leads :", err);
      res.status(500).json({ status: false, message: "Erreur." });
    }
  };
  
  
