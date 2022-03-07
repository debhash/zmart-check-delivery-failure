const express = require('express');
const passport = require('passport');

const { strategy } = require('../strategy');
const { usersRefreshToken } = require('../controller/userToken');

passport.use(strategy);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

var router = express.Router();

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.get('/login/federated/google', passport.authorize('google', { accessType: 'offline', prompt: 'consent' }));

router.get('/login/authorize/refresh', async (req, res, next) => {
  try {
    const update = await usersRefreshToken({ force: true });

    res.json(update);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

router.get(
  '/oauth2/redirect/google',
  passport.authenticate('google', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    accessType: 'offline',
    prompt: 'consent',
  }),
);

module.exports = router;
