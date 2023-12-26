const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  uploadfiles: String,  
  filePath: String,
  
});

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;