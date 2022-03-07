const GoogleStrategy = require('passport-google-oauth20');
const db = require('./db');

const strategy = new GoogleStrategy(
  {
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/oauth2/redirect/google',
    scope: [
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    session: false,
    state: true,
    accessType: 'offline',
    prompt: 'consent',
  },
  function (accessToken, refreshToken, params, profile, cb) {
    console.log(accessToken);
    console.log(refreshToken);
    console.log(params);
    console.log(profile);
    db.get('SELECT email, token, name, user_id FROM users WHERE user_id = ?', [profile.id], function (err, row) {
      if (err) {
        return cb(err);
      }
      if (!row) {
        db.run(
          `INSERT INTO users (email, token, token_refresh, token_date_created, token_expires_in, name, user_id) VALUES (?, ?, ?, datetime('now','localtime'), ?, ?, ?)`,
          [profile.emails[0].value, accessToken, refreshToken, params.expires_in, profile.displayName, profile.id],
          function (err) {
            if (err) {
              return cb(err);
            }
            var user = {
              id: profile.id,
              email: profile.emails[0].value,
            };
            return cb(null, user);
          },
        );
      } else {
        db.run(
          `UPDATE users SET token = ?, token_refresh = ?, token_date_created = datetime('now','localtime'), token_expires_in = ? WHERE user_id = ?`,
          [accessToken, refreshToken, params.expires_in, profile.id],
          function (err) {
            if (err) {
              return cb(err);
            }
            var user = {
              id: row.user_id,
              email: row.email,
            };
            return cb(null, user);
          },
        );
      }
    });
  },
);

module.exports = {
  strategy,
};
