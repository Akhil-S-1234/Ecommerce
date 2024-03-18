const mongoose = require('mongoose')

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, default: 1 },
    total: { type: Number, required: true },
  });
  
  const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [cartItemSchema],
    couponused : { 
              couponid : { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
              discount_amount : { type : Number, default : 0},

    },
    totalPrice: { type: Number, default: 0 },
  });
  
  const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

// if(!cart.couponused){
//   let coupon =  await Coupon.findOne({ _id : cart.couponused.couponid})

//   const couponAmount = (itemsubtotal * coupon.discount) / 100;
//   }else{
//       const couponAmount = 0
//   }
      

//   cart.totalPrice = itemsubtotal - couponAmount
