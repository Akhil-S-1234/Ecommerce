const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  discountoffer: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

module.exports = mongoose.model('Category', categorySchema);
