const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'bitnami',
  database: 'IAccess'
});

module.exports = pool;
