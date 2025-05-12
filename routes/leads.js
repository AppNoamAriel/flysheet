const express = require('express');
const router = express.Router();
const leadsCtrl = require('../controllers/leads');

const userOrAdminLogged = require('../middleware/users');

router.post('/', userOrAdminLogged, leadsCtrl.addLead);
router.put('/:id', userOrAdminLogged, leadsCtrl.updateLead);
router.get('/all', userOrAdminLogged, leadsCtrl.getAllLeads);
router.get('/search', userOrAdminLogged, leadsCtrl.searchLeads);
router.get('/', userOrAdminLogged, leadsCtrl.getAll);
router.delete('/:id', userOrAdminLogged, leadsCtrl.deleteLead);

module.exports = router;
