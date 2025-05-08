const express = require('express');
const router = express.Router();
const leadsCtrl = require('../controllers/leads');

router.post('/add', leadsCtrl.addLead);
router.put('/update/:id', leadsCtrl.updateLead);
router.get('/all', leadsCtrl.getAllLeads);
router.get('/', leadsCtrl.getAll);
router.delete('/delete/:id', leadsCtrl.deleteLead);
router.get('/search', leadsCtrl.searchLeads);

module.exports = router;
