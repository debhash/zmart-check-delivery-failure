const refresh = require('passport-oauth2-refresh');
const Gmail = require('node-gmail-api');
const fetch = require('node-fetch');

const db = require('../db');
const { strategy } = require('../strategy');

refresh.use(strategy);

const getUsersForTokenRefresh = async (config) =>
  new Promise((resolve, reject) => {
    if (config.force) {
      db.get(`SELECT * FROM users`, (errCheckUser, row) => {
        if (errCheckUser) {
          return reject(errCheckUser);
        }

        resolve(row);
      });
    } else {
      db.get(
        `SELECT * FROM users
        WHERE DATETIME(token_date_created, '+' || (token_expires_in - 600) || ' seconds') <= DATETIME('now','localtime')`,
        (errCheckUser, row) => {
          if (errCheckUser) {
            return reject(errCheckUser);
          }

          resolve(row);
        },
      );
    }
  });

const usersRefreshToken = async (config) => {
  config = config || { force: false };
  const user = await getUsersForTokenRefresh(config);

  return new Promise((resolve, reject) => {
    if (!user) {
      return reject('No users for token refresh');
    }

    refresh.requestNewAccessToken('google', user.token_refresh, (errRefreshToken, accessToken, refreshToken) => {
      if (errRefreshToken) {
        return reject(errRefreshToken);
      }

      console.info(`accessToken => ${accessToken}`);
      console.info(`refreshToken => ${refreshToken}`);

      db.run(
        `UPDATE users SET token = ?, token_date_created = datetime('now','localtime') WHERE user_id = ?`,
        [accessToken, user.user_id],
        (errUpdateToken) => {
          if (errUpdateToken) {
            return reject(errUpdateToken);
          }

          resolve(true);
        },
      );
    });
  });
};

const fetchEmails = async (userId) =>
  new Promise((resolve, reject) => {
    db.get('SELECT email, token, name, user_id FROM users', (err, row) => {
      if (err || !row) {
        return reject(err);
      }

      try {
        const emailExtracted = [];
        const gmail = new Gmail(row.token);
        const s = gmail.messages('label:projects-delivery-failure', {
          max: 30,
          fields: ['id', 'payload'],
        });

        s.on('error', (errGmail) => {
          reject(errGmail);
        });

        s.on('data', (d) => {
          const foundHeader = d.payload.headers.find(({ name }) => name === 'Date');
          let buff = Buffer.from(d.payload.parts[0].body.data, 'base64');
          const regex =
            /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
          const bodyEmail = buff.toString();
          let m;

          if ((m = regex.exec(bodyEmail)) !== null) {
            emailExtracted.push({
              email: m[0],
              date: foundHeader.value,
            });
          }
        });

        s.on('end', () => {
          resolve(emailExtracted);
        });
      } catch (errFetch) {
        reject(errFetch);
      }
    });
  });

const sendEmails = async (emails) => {
  const request = await fetch('https://app.zmart.cl:3100/api/zmart/admin/emailDeliveryFailure', {
    method: 'POST',
    body: JSON.stringify(emails),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await request.json();
  const status = request.status === 200 || false;

  return {
    response,
    status,
  };
};

module.exports = {
  usersRefreshToken,
  fetchEmails,
  sendEmails,
};
