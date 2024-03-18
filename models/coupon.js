
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  expirationDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active',
  },
  usageLimit: {
    type: Number,
    default: null, // null for unlimited usage
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  minCart: {
    type: Number,
    default: 0, 
  },
});


couponSchema.index({ code: 1, expirationDate: 1 });

// Pre-save middleware to update the status based on the expiration date
couponSchema.pre('save', function (next) {
  if (this.isModified('expirationDate') || this.isNew) {
    const currentDate = new Date();
    if (currentDate > this.expirationDate) {
      this.status = 'expired';
    }
  }
  next();
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;









































