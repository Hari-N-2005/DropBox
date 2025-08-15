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

router.post('/', upload.single('file'), authenticatePassword, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const drive = getDriveService();
    
    // Upload to Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID] // Optional: specific folder
    };

    const media = {
      mimeType: req.file.mimetype,
      body: require('stream').Readable.from(req.file.buffer)
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, size, createdTime'
    });

    console.log(`File was uploaded in the backend: ${req.file.originalname} (Google Drive ID: ${driveResponse.data.id})`);

    // Save metadata to database
    const fileRecord = new File({
      filename: req.file.originalname,
      googleDriveId: driveResponse.data.id,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date()
    });

    await fileRecord.save();

    res.json({
      success: true,
      message: 'File uploaded successfully',
      fileId: fileRecord._id,
      googleDriveId: driveResponse.data.id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
