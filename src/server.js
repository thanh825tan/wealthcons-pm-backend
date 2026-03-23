require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/projects',     require('./routes/projects'));
app.use('/api/shopdrawings', require('./routes/shopdrawings'));
app.use('/api/rfi',          require('./routes/rfi'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Lỗi server' });
});

// Sync DB lazily (không block startup)
sequelize.authenticate()
  .then(() => sequelize.sync({ alter: false }))
  .catch(err => console.error('DB error:', err.message));

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;