const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const mongoURI = 'mongodb://127.0.0.1:27017/media-player';
  
//mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let gfs;
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
});


// Storage
// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
      return {
        bucketName: 'uploads', // collection name in MongoDB
        filename: file.originalname,
      };
    }
  });
const upload = multer({ storage });

// Routes
app.post('/upload', upload.single('file'), (req, res) => {
    console.log("upload section")
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ file: req.file });
});

app.get('/files', (req, res) => {
    if (!gfs || !gfs.files) {
      return res.status(500).json({ err: 'GridFS is not initialized properly' });
    }
  
    gfs.files.find().toArray((err, files) => {
      if (!files || files.length === 0) {
        return res.status(404).json({ err: 'No files exist' });
      }
      return res.json(files);
    });
  });

app.get('/files/:filename', (req, res) => {
if (!gfs || !gfs.files) {
    return res.status(500).json({ err: 'GridFS is not initialized properly' });
}

gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (!file || file.length === 0) {
    return res.status(404).json({ err: 'No file exists' });
    }
    return res.json(file);
});
});
  
app.get('/video/:filename', (req, res) => {
    if (!gfs || !gfs.files) {
      return res.status(500).json({ err: 'GridFS is not initialized properly' });
    }
  
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
      if (!file || file.length === 0) {
        return res.status(404).json({ err: 'No file exists' });
      }
      if (file.contentType === 'video/mp4') {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        res.status(404).json({ err: 'Not a video' });
      }
    });
  });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
