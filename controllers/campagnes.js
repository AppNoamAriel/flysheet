const campagnesModel = require('../models/campagnes');
const campagnesFuncData = require('../functions/database/campagnes');

exports.add = async (req, res) => {
  try {
    console.log("REQUETE REÇUE :", req.body);

    if (typeof req.body.departements === 'string') {
      req.body.departements = req.body.departements
        .split(',')
        .map(dep => dep.trim())
        .filter(Boolean);
    }

    const { nom, url, typeProduit, objectif, departements = [], pile = false } = req.body;
    const result = await campagnesFuncData.add(nom, url, typeProduit, objectif, departements, pile);

    if (result.error) {
      return res.status(400).json({ status: false, message: result.error });
    }

    res.status(201).json({ status: true, message: "OK." });
  } catch (err) {
    console.error("Erreur ajout campagne :", err);
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

    res.status(200).json({
      status: true,
      message: "OK."
    });
  } catch (err) {
    console.error("Erreur suppression campagne :", err);
    res.status(500).json({
      status: false,
      message: "Erreur serveur."
    });
  }
};

exports.updateObjectif = async (req, res) => {
  const { id, objectif } = req.body;
  const result = await campagnesFuncData.updateDocument(id, { objectif });

  if (!result) {
    return res.status(400).json({
      status: false,
      message: "Erreur."
    });
  }

  res.status(200).json({
    status: true,
    message: "OK."
  });
};

exports.toggleEtat = async (req, res) => {
  try {
    const { id } = req.body;
    const campagne = await campagnesModel.findById(id);

    if (!campagne) {
      return res.status(404).json({ status: false, message: "Erreur." });
    }

    const nouveauEtat = !campagne.etat;
    await campagnesFuncData.updateDocument(id, { etat: nouveauEtat });

    res.status(200).json({
      status: true,
      message: "OK.",
      etat: nouveauEtat
    });
  } catch (error) {
    console.error("Erreur toggle état :", error);
    res.status(500).json({ status: false, message: "Erreur serveur." });
  }
};

exports.getAll = async (req, res) => {
  const { nom, typeProduit, objectif } = req.query;

  try {
    const result = await campagnesFuncData.getBySearch(nom, typeProduit, objectif);

    if (!result) {
      return res.status(400).json({
        status: false,
        message: "Erreur."
      });
    }

    res.status(200).json({
      status: true,
      message: "OK.",
      data: result
    });
  } catch (err) {
    console.error("Erreur getAll :", err);
    res.status(500).json({
      status: false,
      message: "Erreur serveur."
    });
  }
};

exports.getOneById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await campagnesFuncData.getOneById(id);

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Campagne non trouvée."
      });
    }

    res.status(200).json({
      status: true,
      message: "OK.",
      data: result
    });
  } catch (err) {
    console.error("Erreur getOneById :", err);
    res.status(500).json({
      status: false,
      message: "Erreur serveur."
    });
  }
};

exports.getFilters = async (req, res, next) => {
  try {
    const { typeProduit, nom, objectif } = req.query;
    const filters = {};

    if (typeProduit) filters.typeProduit = typeProduit;
    if (nom) filters.nom = { $regex: nom, $options: 'i' };
    if (objectif) filters.objectif = parseInt(objectif, 10);

    const result = await campagnesModel.find(filters);

    res.status(200).json({
      status: true,
      message: "OK.",
      data: result
    });
  } catch (err) {
    console.error("Erreur dans getFilters :", err);
    res.status(500).json({
      status: false,
      message: "Erreur."
    });
  }
};

exports.removeDepartement = async (req, res) => {
  const { id, departement } = req.body;

  console.log("📨 Requête suppression département reçue :", req.body);

  if (!id || !departement) {
    console.warn("⚠️ Champs manquants :", { id, departement });
    return res.status(400).json({ status: false, message: "Champs manquants" });
  }

  try {
    const campagne = await campagnesModel.findById(id);
    if (!campagne) {
      console.warn("⚠️ Campagne non trouvée pour l'id :", id);
      return res.status(404).json({ status: false, message: "Campagne non trouvée" });
    }

    console.log("🔍 Campagne trouvée :", campagne.nom, "Départements initiaux :", campagne.departements);

    campagne.departements = (campagne.departements || []).filter(
        dep => dep.toString() !== departement.toString()
    );

    console.log("🧹 Nouveau tableau départements :", campagne.departements);

    await campagne.save();

    console.log("✅ Département supprimé avec succès !");
    res.json({ status: true });
  } catch (err) {
    console.error("❌ Erreur suppression département (serveur) :", err);
    res.status(500).json({ status: false, message: "Erreur serveur" });
  }
};

