var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('var/db');

var db = new sqlite3.Database('var/db/todos.db');

db.serialize(function () {
  db.run(
    `CREATE TABLE IF NOT EXISTS "users" (
      "email"	TEXT UNIQUE,
      "token"	BLOB,
      "name"	TEXT
    , "user_id"	NUMERIC)`,
  );
});

module.exports = db;
