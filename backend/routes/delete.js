const express = require('express');
const File = require('../models/File');
const { getDriveService } = require('../config/googleDrive');
const router = express.Router();

// DELETE /delete/:fileId?password=YOUR_PASSWORD
router.delete('/:fileId', async (req, res) => {
  try {
    // Authenticate password from query
    const password = req.query.password;
    if (!password || password !== process.env.DOWNLOAD_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const fileRecord = await File.findById(req.params.fileId);
    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const drive = getDriveService();
    // Delete file from Google Drive
    await drive.files.delete({ fileId: fileRecord.googleDriveId });

    // Remove file record from database
    await File.deleteOne({ _id: req.params.fileId });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;