const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  color : {
    type : String,
    required : true,
  },
  price: {
    type: Number,
    required: true,
  },
  offerprice: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
  },
  productImages: {
    type: Array, 
    required: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
});


module.exports = mongoose.model('Product', productSchema);
