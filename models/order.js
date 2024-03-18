const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {   
            _id: { type: String, default: uuidv4 },
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, default: 1 },
            unitPrice: { type: Number, required: true },
            status: { type: String, enum: ['pending', 'shipped', 'delivered','cancelled','returned'], default: 'pending' },
            reason:{ type: String, required : false },
            returnRequest: {
                requested: { type: Boolean, default: false },
                status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
            }
        }
    ],
    shippingAddress: {
        houseName: { type: String, required: true },
        addresstype:{
            type: String,
            required:false
        },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String, required: true },
    },
    discount :  { 
        disamnt : {type: Number, default: 0},
        percent : {type: Number, default: 0}
                
    },
    paymentMethod: { type: String, required: true },
    paymentstatus : {type: String, enum : ['confirmed','failed'],default : 'confirmed'},
    totalPrice: { type: Number, required: true },
    createdAt: {
        type: Date,
        default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
