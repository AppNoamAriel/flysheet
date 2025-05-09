const Category = require('../models/categories');

// 🔄 Récupérer toutes les catégories
exports.getAll = async (req, res) => {
  try {
    const cats = await Category.find().sort({ nom: 1 });
    res.status(200).json({ status: true, data: cats });
  } catch (err) {
    console.error("Erreur getAll categories :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ➕ Ajouter une catégorie
exports.add = async (req, res) => {
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ status: false, message: "Nom requis." });

  try {
    const existing = await Category.findOne({ nom });
    if (existing) return res.status(400).json({ status: false, message: "Déjà existante." });

    await new Category({ nom }).save();
    res.status(201).json({ status: true, message: "Catégorie créée." });
  } catch (err) {
    console.error("Erreur ajout category :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ✏️ Modifier une catégorie
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;
  if (!nom) return res.status(400).json({ status: false, message: "Nom requis." });

  try {
    const updated = await Category.findByIdAndUpdate(id, { nom }, { new: true });
    if (!updated) return res.status(404).json({ status: false, message: "Non trouvée." });

    res.status(200).json({ status: true, message: "Modifiée.", data: updated });
  } catch (err) {
    console.error("Erreur update category :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

// ❌ Supprimer une catégorie
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const used = await require('../models/subcategories').exists({ id_cat: id });
    if (used) {
      return res.status(400).json({ status: false, message: "Catégorie utilisée dans une sous-catégorie." });
    }

    await Category.findByIdAndDelete(id);
    res.status(200).json({ status: true, message: "Supprimée." });
  } catch (err) {
    console.error("Erreur suppression category :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};
