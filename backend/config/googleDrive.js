const { google } = require('googleapis');

let driveService = null;

const getDriveService = () => {
  if (!driveService) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    driveService = google.drive({ version: 'v3', auth });
  }
  
  return driveService;
};

module.exports = { getDriveService };
