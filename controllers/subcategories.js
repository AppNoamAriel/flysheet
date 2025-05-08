const Subcategory = require('../models/subcategories');
const Campagne = require('../models/campagnes');

// 🔄 GET toutes les sous-catégories avec nom de la catégorie
exports.getAll = async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate('id_cat', 'nom');
    res.status(200).json({ status: true, data: subcategories });
  } catch (err) {
    console.error("❌ Erreur getAll subcategories :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ➕ Ajouter une sous-catégorie
exports.add = async (req, res) => {
  const { nom, id_cat } = req.body;

  if (!nom || !id_cat) {
    return res.status(400).json({ status: false, message: "Champs manquants." });
  }

  try {
    const existing = await Subcategory.findOne({ nom });
    if (existing) {
      return res.status(400).json({ status: false, message: "Cette sous-catégorie existe déjà." });
    }

    const subcat = new Subcategory({ nom, id_cat });
    await subcat.save();
    res.status(201).json({ status: true, message: "Sous-catégorie ajoutée." });
  } catch (err) {
    console.error("❌ Erreur add subcategory :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// 📝 Modifier une sous-catégorie
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nom, id_cat } = req.body;

  if (!nom || !id_cat) {
    return res.status(400).json({ status: false, message: "Champs manquants." });
  }

  try {
    const updated = await Subcategory.findByIdAndUpdate(id, { nom, id_cat }, { new: true });
    if (!updated) {
      return res.status(404).json({ status: false, message: "Sous-catégorie introuvable." });
    }

    res.status(200).json({ status: true, message: "Sous-catégorie modifiée.", data: updated });
  } catch (err) {
    console.error("❌ Erreur update subcategory :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ❌ Supprimer une sous-catégorie (protégée si utilisée)
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const isUsed = await Campagne.exists({ subcategory: id });
    if (isUsed) {
      return res.status(400).json({
        status: false,
        message: "Impossible de supprimer : cette sous-catégorie est utilisée."
      });
    }

    await Subcategory.findByIdAndDelete(id);
    res.status(200).json({ status: true, message: "Sous-catégorie supprimée." });
  } catch (err) {
    console.error("❌ Erreur suppression sous-catégorie :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};
