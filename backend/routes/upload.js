const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const File = require('../models/File');
const { authenticatePassword } = require('./auth');
const { getDriveService } = require('../config/googleDrive');

const router = express.Router();

// Configure multer for memory storage (v2.x syntax)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  // Accept any file type
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

router.post('/', upload.array('file', 10), authenticatePassword, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Process each file
    const results = [];
    const errors = [];
    for (const file of req.files) {
      try {
        const drive = getDriveService();
        const fileMetadata = {
          name: file.originalname,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
        };
        const media = {
          mimeType: file.mimetype,
          body: require('stream').Readable.from(file.buffer)
        };
        const driveResponse = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, name, size, createdTime'
        });
        const fileRecord = new File({
          filename: file.originalname,
          googleDriveId: driveResponse.data.id,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date()
        });
        await fileRecord.save();
        results.push({ name: file.originalname, id: driveResponse.data.id });
      } catch (err) {
        errors.push({ name: file.originalname, error: err.message });
      }
    }
    res.json({ success: true, files: results, errors });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
