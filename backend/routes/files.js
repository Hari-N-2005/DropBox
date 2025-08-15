const express = require('express');
const File = require('../models/File');
const { authenticatePassword } = require('./auth');
const { getDriveService } = require('../config/googleDrive');

const router = express.Router();

// Get list of files
router.post('/list', authenticatePassword, async (req, res) => {
  try {
    const files = await File.find()
      .sort({ uploadedAt: -1 })
      .select('filename size uploadedAt _id');
    
    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Download file
router.post('/download/:fileId', authenticatePassword, async (req, res) => {
  try {
    const fileRecord = await File.findById(req.params.fileId);
    
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const drive = getDriveService();
    
    // Get file from Google Drive
    const driveResponse = await drive.files.get({
      fileId: fileRecord.googleDriveId,
      alt: 'media'
    }, { responseType: 'stream' });

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.filename}"`);
    res.setHeader('Content-Type', fileRecord.mimeType);

    // Pipe the file stream to response
    driveResponse.data.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

module.exports = router;
