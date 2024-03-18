const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    // Generate a unique identifier using uuid
    let uniqueFilename = uuidv4() + ext;
    cb(null, uniqueFilename);
  }
});

const fileFilter = function (req, file, callback) {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    console.log('Only image files supported');
    callback(null, false);
  }
};

const limits = {
  fileSize: 1024 * 1024 * 100, 
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).array('productImages', 5);
module.exports = upload;
