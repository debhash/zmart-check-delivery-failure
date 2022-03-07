const express = require('express');

const { fetchEmails } = require('../controller/userToken');

const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const emailExtracted = await fetchEmails();

    res.locals.emailExtracted = emailExtracted || [];
    res.locals.emailExtractedCount = emailExtracted.length || 0;

    res.render('index');
  } catch (err) {
    console.log(err);
    return res.render('login');
  }
});

module.exports = router;
