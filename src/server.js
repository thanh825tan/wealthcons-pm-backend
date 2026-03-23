require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/projects',     require('./routes/projects'));
app.use('/api/shopdrawings', require('./routes/shopdrawings'));
app.use('/api/rfi',          require('./routes/rfi'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Loi server' });
});

module.exports = app;