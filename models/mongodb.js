const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    houseName: {
        type: String,
        required: false
    },
    addresstype:{
        type: String,
        required:false
    },
    street: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    state: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    zipCode: {
        type: String,
        required: false
    }
});

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phoneNumber: {
        type: Number,
        required: true
    },
    gender:{
        type:String,
        required:false
    },
    password: {
        type: String,
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    addresses: [addressSchema],
    wishlist: [
       { product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false }}
    ],
    wallet: {
        balance: { type: Number, default: 0 },
        transactions: [{
            amount: { type: Number, required: true },
            description: { type: String, required: true },
            date: { type: Date, default: Date.now },
        }],
    },
});

module.exports = mongoose.model('User', userSchema);
