const usersModel = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const token = require('../middleware/token');

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

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new usersModel({ username, password: hashedPassword });
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
    const user = await usersModel.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const userToken = token.createToken(user._id, 'admin'); // adapte accountType si besoin

    res.status(200).json({
      message: "OK.",
      token: userToken,
      id: user._id,
      typeAccount: "admin" // ou autre selon tes besoins
    });
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
