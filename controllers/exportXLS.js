const XLSX = require('xlsx');
const Campagne = require('../models/campagnes');

exports.exportOneToXlsx = async (req, res) => {
    try {
        const id = req.params.id;
        console.log("🟡 Export ID:", id);

        const campagne = await Campagne.findById(id);

        if (!campagne) {
            console.error("🔴 Campagne non trouvée pour l'ID:", id);
            return res.status(404).send("Erreur.");
        }
        const rows = [
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 5, 6, 7, 8, 9]
        ];

        const ws = XLSX.utils.aoa_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Feuille1');

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        const safeFilename = campagne.nom.replace(/\s+/g, "").replace(/[^a-zA-Z0-9-]/g, "");
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=campagne_${safeFilename}.xlsx`);
        res.end(buffer);
    } catch (error) {
        console.error("❌ Erreur d'export XLSX :", error);
        res.status(500).send("Erreur.");
    }
};
