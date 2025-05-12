const Subcategory = require('../../models/subcategories');
const Category = require('../../models/categories');

exports.getAll = async () => {
  try {
    return await Subcategory.find().populate('id_cat', 'nom');
  } catch (err) {
    console.error("Erreur getAll subcategories:", err);
    return [];
  }
};

exports.add = async (nom, id_cat) => {
  if (!nom || !id_cat) return { error: "Champs manquants." };

  try {
    const catExists = await Category.exists({ _id: id_cat });
    if (!catExists) return { error: "Catégorie inexistante." };

    const already = await Subcategory.findOne({ nom, id_cat });
    if (already) return { error: "Sous-catégorie déjà existante." };

    const sub = new Subcategory({ nom, id_cat });
    return await sub.save();
  } catch (err) {
    console.error("Erreur add subcategory:", err);
    return { error: err.message };
  }
};

exports.update = async (id, nom, id_cat) => {
  if (!id || !nom || !id_cat) return null;
  try {
    return await Subcategory.findByIdAndUpdate(id, { nom, id_cat }, { new: true });
  } catch (err) {
    console.error("Erreur update subcategory:", err);
    return null;
  }
};

exports.delete = async (id) => {
  try {
    return await Subcategory.findByIdAndDelete(id);
  } catch (err) {
    console.error("Erreur delete subcategory:", err);
    return null;
  }
};
