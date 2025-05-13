const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const userRoutes = require('./routes/user');
const campagneRoutes = require('./routes/campagnes');
const leadsRoutes = require('./routes/leads');
const categoriesRoutes = require('./routes/categories');

const app = express(); 
const session = require('express-session');

app.use(express.json());

app.use((req, res, next) => {
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRoutes);
app.use('/api/campagnes', campagneRoutes);
app.use('/api/subcategories', require('./routes/subcategories'));
app.use('/api/categories', categoriesRoutes);
app.use('/api/leads', leadsRoutes);

app.use((req, res) => {
  res.status(404).send('Erreur.');
});

module.exports = app;
