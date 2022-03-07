const cron = require('node-cron');

const { usersRefreshToken, fetchEmails, sendEmails } = require('./controller/userToken');

module.exports = () => {
  /*
   * every one minute
   */
  cron.schedule('*/1 * * * *', async () => {
    try {
      const refresh = await usersRefreshToken();
      console.info(`TaskRefreshToken...${refresh}`);
    } catch (err) {
      console.log(err);
    }
  });

  /*
   * every 10 minute
   */
  cron.schedule('*/10 * * * *', async () => {
    try {
      const emails = await fetchEmails();
      const response = await sendEmails(emails);
      console.info(emails);
    } catch (err) {
      console.log(err);
    }
  });
};
