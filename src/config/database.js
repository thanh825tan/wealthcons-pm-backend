const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

const getSequelize = () => {
  if (!sequelize) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      }
    });
  }
  return sequelize;
};

module.exports = getSequelize();
