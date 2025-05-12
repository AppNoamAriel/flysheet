const leadsFuncData = require('../functions/database/leads');

// ➕ Ajouter un lead
exports.addLead = async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) return res.status(400).json({ status: false, message: "Champ 'product' requis." });

    const result = await leadsFuncData.add(req.body);
    if (result.error) return res.status(500).json({ status: false, message: result.error });

    res.status(201).json({ status: true, message: 'Lead ajouté.', data: result });
  } catch (err) {
    console.error("Erreur addLead:", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ✏️ Mettre à jour un lead
exports.updateLead = async (req, res) => {
  try {
    const updated = await leadsFuncData.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ status: false, message: 'Lead non trouvé.' });

    res.status(200).json({ status: true, message: 'Lead mis à jour.', data: updated });
  } catch (err) {
    console.error("Erreur updateLead:", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// 📥 Récupérer tous les leads
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await leadsFuncData.getAll();
    res.status(200).json({ status: true, message: 'OK.', data: leads });
  } catch (err) {
    console.error("Erreur getAllLeads:", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// 🔍 Récupération avec recherche dynamique
exports.getAll = async (req, res) => {
  try {
    const leads = await leadsFuncData.getBySearch(req.query);
    res.status(200).json({ status: true, message: 'OK.', data: leads });
  } catch (err) {
    console.error("Erreur getAll (recherche):", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// 🔍 Recherche spécifique
exports.searchLeads = async (req, res) => {
  try {
    const leads = await leadsFuncData.getBySearch(req.query);
    res.status(200).json({ status: true, message: "OK.", data: leads });
  } catch (err) {
    console.error("Erreur searchLeads:", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// 🗑️ Suppression d’un lead
exports.deleteLead = async (req, res) => {
  try {
    const deleted = await leadsFuncData.delete(req.params.id);
    if (!deleted) return res.status(404).json({ status: false, message: "Lead introuvable." });

    res.status(200).json({ status: true, message: "Lead supprimé." });
  } catch (err) {
    console.error("Erreur deleteLead:", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};
