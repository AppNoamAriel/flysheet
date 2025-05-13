const mongoose = require('mongoose');
const leadModel = require('../models/leads');
const campagnesModel = require('../models/campagnes');
const campagnesFuncData = require('../functions/database/campagnes');
const subcategoryModel = require('../models/subcategories');

exports.add = async (req, res) => {
  try {
    if (typeof req.body.departements === 'string') {
      req.body.departements = req.body.departements
          .split(',')
          .map(dep => dep.trim())
          .filter(Boolean);
    }

    const { nom, url, typeProduit, objectif, departements = [], pile = false } = req.body;

    if (pile) {
      const typeProduitId = mongoose.Types.ObjectId.isValid(typeProduit)
          ? new mongoose.Types.ObjectId(typeProduit)
          : typeProduit;

      const existingPile = await campagnesModel.findOne({
        pile: true,
        typeProduit: typeProduitId
      }).populate('typeProduit');

      if (existingPile) {
        const subcatName = existingPile.typeProduit?.nom || "ce produit";
        return res.status(400).json({
          status: false,
          message: `Une pile existe déjà pour la sous-catégorie "${subcatName}".`
        });
      }
    }

    const result = await campagnesFuncData.add(nom, url, typeProduit, objectif, departements, pile);

    if (result.error) {
      return res.status(400).json({ status: false, message: result.error });
    }

    res.status(201).json({ status: true, message: "OK." });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await campagnesFuncData.delete(id);

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Campagne introuvable."
      });
    }

    res.status(200).json({ status: true, message: "OK." });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

exports.updateObjectif = async (req, res) => {
  const { id, objectif } = req.body;

  const result = await campagnesFuncData.updateDocument(id, { objectif });

  if (!result) {
    return res.status(400).json({ status: false, message: "Erreur." });
  }

  res.status(200).json({ status: true, message: "OK." });
};

exports.toggleEtat = async (req, res) => {
  try {
    const { id } = req.params;
    const campagne = await campagnesModel.findById(id);

    if (!campagne) {
      return res.status(404).json({ status: false, message: "Erreur." });
    }

    const nouveauEtat = !campagne.etat;
    await campagnesFuncData.updateDocument(id, { etat: nouveauEtat });

    res.status(200).json({ status: true, message: "OK.", etat: nouveauEtat });
  } catch (error) {
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

exports.getAll = async (req, res) => {
  const { nom, typeProduit, objectif } = req.query;

  try {
    const filters = {};

    if (typeProduit) filters.typeProduit = typeProduit;
    if (nom) filters.nom = { $regex: nom, $options: 'i' };
    if (objectif) filters.objectif = parseInt(objectif, 10);

    // 1. Récupère toutes les piles (TOUJOURS)
    const campagnesPile = await campagnesModel.find({ pile: true });

    // 2. Récupère les campagnes filtrées (hors pile)
    const campagnesFiltres = await campagnesModel.find({ ...filters, pile: false });

    // 3. Combine les deux (pile toujours en haut)
    const campagnes = [...campagnesPile, ...campagnesFiltres];

    // 4. Prépare les leads pour les piles
    const leads = await leadModel.find({ url_flysheet: "" });

    for (let campagne of campagnes) {
      if (!campagne.pile) continue;

      let campagneTypeName = '';
      let campagneTypeId = campagne.typeProduit?.toString().trim();

      try {
        const subcat = await subcategoryModel.findById(campagne.typeProduit);
        campagneTypeName = subcat?.nom?.toLowerCase().trim() || campagneTypeId.toLowerCase();
      } catch {
        campagneTypeName = campagneTypeId.toLowerCase();
      }

      const pileLeads = leads.filter(lead => {
        const leadProd = (lead.product || "").toString().toLowerCase();
        return leadProd === campagneTypeName || leadProd === campagneTypeId;
      });

      campagne.valide = pileLeads.filter(l => l.etes_vous === "Propriétaire d'une maison").length;
      campagne.invalide = pileLeads.filter(l => l.etes_vous !== "Propriétaire d'une maison").length;
      campagne.tel = campagne.valide + campagne.invalide;
      campagne.unique = [...new Set(pileLeads.map(l => l.phone).filter(Boolean))].length;
      campagne.installer = [...new Set(pileLeads.map(l => l.zipcode).filter(Boolean))].length;
    }

    return res.status(200).json({ status: true, message: "OK.", data: campagnes });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};
exports.getOneById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await campagnesFuncData.getOneById(id);

    if (!result) {
      return res.status(404).json({ status: false, message: "Campagne non trouvée." });
    }

    res.status(200).json({ status: true, message: "OK.", data: result });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

exports.getFilters = async (req, res) => {
  try {
    const { typeProduit, nom, objectif } = req.query;
    const filters = {};

    if (typeProduit) filters.typeProduit = typeProduit;
    if (nom) filters.nom = { $regex: nom, $options: 'i' };
    if (objectif) filters.objectif = parseInt(objectif, 10);

    const result = await campagnesModel.find(filters);

    res.status(200).json({ status: true, message: "OK.", data: result });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur." });
  }
};

exports.removeDepartement = async (req, res) => {
  const { id, departement } = req.body;

  if (!id || !departement) {
    return res.status(400).json({ status: false, message: "Champs manquants" });
  }

  try {
    const campagne = await campagnesModel.findById(id);
    if (!campagne) {
      return res.status(404).json({ status: false, message: "Campagne non trouvée" });
    }

    campagne.departements = (campagne.departements || []).filter(
        dep => dep.toString() !== departement.toString()
    );

    await campagne.save();

    res.json({ status: true });
  } catch (err) {
    res.status(500).json({ status: false, message: "Erreur serveur" });
  }
};
