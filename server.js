const http = require('http');
const app = require('./app');
const mongoose = require('mongoose');
const SheetRow = require('./models/sheetRow');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

mongoose.connect('mongodb://localhost:27017/prestalys', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connexion MongoDB réussie à la base "prestalys"');
}).catch((err) => {
  console.error('❌ Erreur de connexion MongoDB :', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);

  app.post('/webhook', async (req, res) => {
    const rowData = req.body.row;
    const timestamp = req.body.timestamp;

    console.log('📥 Nouvelle ligne reçue de Google Sheet :');
    console.log('🧾 Données :', rowData);
    console.log('🕒 Timestamp :', timestamp);

    try {
      await SheetRow.create({ row: rowData, timestamp });
      console.log('📦 Donnée enregistrée dans MongoDB');
      res.status(200).send('Donnée enregistrée');
    } catch (err) {
      console.error('❌ Erreur d’enregistrement MongoDB :', err);
      res.status(500).send('Erreur.');
    }
  });
  const cron = require('node-cron');
  
  cron.schedule('* * * * *', () => {
    console.log('txt');
  });
});
