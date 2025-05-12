const Category = require('../../models/categories');

exports.getAll = async () => {
  try {
    return await Category.find().sort({ nom: 1 });
  } catch (err) {
    console.error("Erreur getAll categories :", err);
    return [];
  }
};

exports.add = async (nom) => {
  try {
    if (!nom) throw new Error("Nom requis.");
    const existing = await Category.findOne({ nom });
    if (existing) throw new Error("Cette catégorie existe déjà.");
    return await new Category({ nom }).save();
  } catch (err) {
    console.error("Erreur ajout category :", err);
    return { error: err.message };
  }
};

exports.update = async (id, nom) => {
  try {
    if (!nom) return null;
    return await Category.findByIdAndUpdate(id, { nom }, { new: true });
  } catch (err) {
    console.error("Erreur update category :", err);
    return null;
  }
};

exports.delete = async (id) => {
  try {
    return await Category.findByIdAndDelete(id);
  } catch (err) {
    console.error("Erreur delete category :", err);
    return null;
  }
};
