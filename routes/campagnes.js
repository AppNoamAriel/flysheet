const express = require('express');
const router = express.Router();
const apiCtrl = require('../controllers/campagnes');
const exportCtrl = require('../controllers/exportXLS');

router.get('/getfilters', apiCtrl.getFilters);

router.post('/add', apiCtrl.add);
router.delete('/:id/delete', apiCtrl.delete); // ✅ cohérent avec frontend
router.put('/update-objectif', apiCtrl.updateObjectif);
router.patch('/toggle/:id', apiCtrl.toggleEtat); // ✅ cohérent avec frontend
router.get('/:id/download', exportCtrl.exportOneToXlsx);
router.get('/:id', apiCtrl.getOneById);
router.get('/', apiCtrl.getAll);
router.put('/remove-departement', apiCtrl.removeDepartement);

module.exports = router;
