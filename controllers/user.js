const usersModel = require('../models/user');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await usersModel.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur." });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await usersModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "OK." });
  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await usersModel.findOne({ username });
    if (existing) {
      return res.status(400).json({ message: "Utilisateur déjà existant." });
    }

    const user = new usersModel({ username, password });
    await user.save();

    res.status(201).json({ message: "OK." });
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await usersModel.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    res.status(200).json({ message: "OK." });
  } catch (err) {
    console.error("Erreur:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
exports.checkUsernameExists = async (req, res) => {
  try {
    const user = await usersModel.findOne({ username: req.params.username });
    if (!user) {
      return res.json({ exists: false });
    }
    res.json({ exists: true });
  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ exists: false });
  }
};
