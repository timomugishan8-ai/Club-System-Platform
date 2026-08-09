require('dotenv').config();
const db = require('./config/db');
console.log('ENV DB_HOST=', process.env.DB_HOST);
console.log('ENV DB_USER=', process.env.DB_USER);
console.log('ENV DB_PASSWORD=', JSON.stringify(process.env.DB_PASSWORD));
console.log('ENV DB_NAME=', process.env.DB_NAME);

db.query('SELECT * FROM roles', (err, results) => {
  if (err) {
    console.error('ROLES_ERROR', err.code, err.sqlMessage || err.message);
    process.exit(1);
  }
  console.log('ROLES_COUNT', results.length);
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
});
