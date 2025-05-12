const catFuncData = require('../functions/database/categories');
const Subcategory = require('../models/subcategories');

// 🔄 Récupérer toutes les catégories
exports.getAll = async (req, res) => {
  const data = await catFuncData.getAll();
  res.status(200).json({ status: true, data });
};

// ➕ Ajouter une catégorie
exports.add = async (req, res) => {
  const { nom } = req.body;
  const result = await catFuncData.add(nom);
  if (result.error) return res.status(400).json({ status: false, message: result.error });
  res.status(201).json({ status: true, message: "Catégorie créée." });
};

// ✏️ Modifier une catégorie
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;
  const result = await catFuncData.update(id, nom);
  if (!result) return res.status(404).json({ status: false, message: "Catégorie non trouvée." });
  res.status(200).json({ status: true, message: "Modifiée.", data: result });
};

// ❌ Supprimer une catégorie
exports.delete = async (req, res) => {
  const { id } = req.params;
  const isUsed = await Subcategory.exists({ id_cat: id });
  if (isUsed) return res.status(400).json({ status: false, message: "Catégorie utilisée." });

  await catFuncData.delete(id);
  res.status(200).json({ status: true, message: "Supprimée." });
};
