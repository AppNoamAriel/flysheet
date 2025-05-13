const campagnesModel = require('../../models/campagnes');

exports.add = async function (nom, url, typeProduit, objectif, departements = [], pile = false) {
  try {
    const campagne = new campagnesModel({
      nom,
      url,
      typeProduit,
      objectif,
      departements,
      pile
    });
    return await campagne.save();
  } catch (error) {
    console.error("Erreur ajout campagne :", error.message);
    return { error: error.message };
  }
};

exports.delete = async function (id) {
  try {
    const result = await campagnesModel.findByIdAndDelete(id);
    return result ? true : false;
  } catch (error) {
    console.error("Erreur.", error);
    return false;
  }
};

exports.updateDocument = function (id, update) {
  return campagnesModel.findByIdAndUpdate(id, update)
    .then(result => {return result;})
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    });
};


exports.getBySearch = function (nom, typeProduit, objectif) {
  const search = {};

  if (nom) {
    search.nom = { $regex: nom, $options: 'i' };
  }

  if (typeProduit) {
    search.typeProduit = typeProduit;
  }

  return campagnesModel.find(search)
    .then(results => {
      if (objectif) {
        return results.filter(c => {
          const progress = c.objectif > 0 ? Math.round((c.valide || 0) / c.objectif * 100) : 0;
          if (objectif === 'lte25') return progress <= 25;
          if (objectif === 'lte50') return progress <= 50;
          if (objectif === 'gte50') return progress >= 50;
          if (objectif === 'gte75') return progress >= 75;
          return true;
        });
      }

      return results;
    })
    .catch(err => {
      console.error("Erreur getBySearch :", err);
      return false;
    });
};

exports.getOneById = async function (id) {
  return campagnesModel.findById(id)
    .then(result => result)
    .catch(err => {
      console.error("Erreur.", err);
      return false;
    });
};
exports.getAllFilters = async function () {
  try {
    return await campagnesModel.find({}, {
      typeProduit: 1,
      departements: 1,
      objectif: 1,
      _id: 0
    });
  } catch (error) {
    console.error("Erreur.", error);
    return false;
  }
};

