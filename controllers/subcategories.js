const subFuncData = require('../functions/database/subcategories');

// 🔄 GET toutes les sous-catégories
exports.getAll = async (req, res) => {
  const data = await subFuncData.getAll();
  res.status(200).json({ status: true, data });
};

// ➕ Ajouter
exports.add = async (req, res) => {
  const { nom, id_cat } = req.body;
  const result = await subFuncData.add(nom, id_cat);
  if (result.error) return res.status(400).json({ status: false, message: result.error });
  res.status(201).json({ status: true, message: "Sous-catégorie ajoutée." });
};

// 📝 Modifier
exports.update = async (req, res) => {
  const { nom, id_cat } = req.body;
  const { id } = req.params;

  const updated = await subFuncData.update(id, nom, id_cat);
  if (!updated) return res.status(404).json({ status: false, message: "Sous-catégorie non trouvée." });

  res.status(200).json({ status: true, message: "Modifiée.", data: updated });
};

// ❌ Supprimer
exports.delete = async (req, res) => {
  const { id } = req.params;

  const isUsed = await require('../models/campagnes').exists({ subcategory: id });
  if (isUsed) return res.status(400).json({ status: false, message: "Sous-catégorie utilisée." });

  await subFuncData.delete(id);
  res.status(200).json({ status: true, message: "Supprimée." });
};
