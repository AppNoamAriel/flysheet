const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const apiCtrl = require('../controllers/user');
const userCtrl = require('../controllers/user');


router.post('/add', userController.register);

router.post('/login', userController.login);

router.get('/', userController.getAllUsers);

router.delete('/:id/delete', apiCtrl.delete);

router.get('/check/:username', userCtrl.checkUsernameExists);

module.exports = router;
