const mongoose = require('mongoose');
const UserModel = require('../../models/user');

exports.register = function (username, password) {
  const user = new UserModel({ username: username, password: password });
  return user.save()
    .then(result => { return result })
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    });
};

exports.login = function (username, password) {
  return UserModel.findOne({ username: username, password: password })
    .then(result => { return result })
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    });
};

exports.getAll = function () {
  return UserModel.find({})
    .then(result => { return result })
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    });
};

exports.getOneByUsername = function (username) {
  return UserModel.findOne({ username: username })
    .then(result => { return result })
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    }); 
};

exports.deleteUser = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error("Erreur.", id);
    return Promise.resolve(false);
  }

  return UserModel.findByIdAndDelete(id)
    .then(result => { return result })
    .catch(error => {
      console.error("Erreur.", error);
      return false;
    });
};
