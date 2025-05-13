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
      const existingPile = await campagnesModel.findOne({ pile: true, typeProduit }).populate('typeProduit');

      if (existingPile) {
        const subcatName = existingPile.typeProduit?.nom || "ce produit";
        return res.status(400).json({
          status: false,
          message: `Pile déjà ajoutée. Vous ne pouvez pas en créer une deuxième pour ${subcatName}.`
        });
      }
    }


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
    const { id } = req.params;
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
  console.log("🟡 getAll() appelée");

  const { nom, typeProduit, objectif } = req.query;

  try {
    const result = await campagnesFuncData.getBySearch(nom, typeProduit, objectif);
    if (!result) return res.status(400).json({ status: false, message: "Erreur." });

    console.log(`🟡 Campagnes trouvées : ${result.length}`);

    const leads = await leadModel.find({ url_flysheet: "" });
    console.log(`🔎 Leads en pile (url_flysheet vide) : ${leads.length}`);

    for (let campagne of result) {
      if (!campagne.pile) continue;

      let campagneTypeName = '';
      let campagneTypeId = campagne.typeProduit?.toString().trim();

      // Récupérer nom de sous-catégorie
      try {
        const subcat = await subcategoryModel.findById(campagne.typeProduit);
        if (subcat && subcat.nom) {
          campagneTypeName = subcat.nom.toLowerCase().trim();
        } else {
          campagneTypeName = campagne.typeProduit?.toString().toLowerCase().trim();
        }
      } catch (e) {
        console.warn("⚠️ Erreur récupération sous-catégorie :", e.message);
        campagneTypeName = campagne.typeProduit?.toString().toLowerCase().trim();
      }

      console.log(`📦 Analyse de la pile pour campagne : ${campagne.nom}`);
      console.log(`🔧 Type produit attendu (nom) : "${campagneTypeName}"`);
      console.log(`🆔 Type produit attendu (id) : "${campagneTypeId}"`);

      // Logs tous les leads
      leads.forEach((lead, i) => {
        console.log(`➡️ [Lead ${i + 1}] lead.product = "${lead.product}"`);
      });

      // Comparaison robuste
      const pileLeads = leads.filter(lead => {
        const leadProd = (lead.product || "").toString().toLowerCase();

        const matchNom = leadProd == campagneTypeName;
        const matchId  = leadProd == campagneTypeId;

        if (matchNom || matchId) {
          console.log(`✅ Match trouvé pour lead.product="${leadProd}"`);
        }

        return matchNom || matchId;
      });

      console.log(`🔢 Leads dans cette pile : ${pileLeads.length}`);

      campagne.valide = pileLeads.filter(l =>
          l.etes_vous === "Propriétaire d'une maison"
      ).length;

      campagne.invalide = pileLeads.filter(l =>
          l.etes_vous !== "Propriétaire d'une maison"
      ).length;

      campagne.tel = campagne.valide + campagne.invalide;
      campagne.unique = [...new Set(pileLeads.map(l => l.phone).filter(Boolean))].length;
      campagne.installer = [...new Set(pileLeads.map(l => l.zipcode).filter(Boolean))].length;

      console.log(`✅ Résumé pile: ${campagne.valide} valides, ${campagne.invalide} invalides, ${campagne.tel} tél., ${campagne.unique} uniques, ${campagne.installer} installés`);
    }

    return res.status(200).json({ status: true, message: "OK.", data: result });

  } catch (err) {
    console.error("❌ Erreur getAll :", err);
    res.status(500).json({ status: false, message: "Erreur serveur." });
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
