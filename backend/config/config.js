require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME || 'challenger_user',
    password: process.env.DB_PASSWORD || 'challenger_password',
    database: process.env.DB_DATABASE || 'challenger_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USERNAME || 'challenger_user',
    password: process.env.DB_PASSWORD || 'challenger_password',
    database: process.env.DB_DATABASE_TEST || 'challenger_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USERNAME || 'challenger_user',
    password: process.env.DB_PASSWORD || 'challenger_password',
    database: process.env.DB_DATABASE || 'challenger_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};
