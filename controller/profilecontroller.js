const nodemailer = require('nodemailer')
const mongoose = require('mongoose');
require('dotenv').config();
const user = require('../models/mongodb')
const otp = require('../models/otp')
const product = require('../models/product')
const Cart = require('../models/cart')
const Order = require('../models/order')
const Coupon = require('../models/coupon')

const { createInvoice } = require('../config/createinvoice');
const Razorpay = require('razorpay');
const fs = require('fs');
const { log } = require('console');
const bcrypt = require('bcrypt');


const profile = async (req, res) => {
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const perPage = 10; // Adjust as needed

        // Find user by ID and retrieve specific fields
        const User = await user.findById(userId, 'firstName lastName email phoneNumber gender addresses wallet');

        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Paginate user's orders
        const totalOrders = await Order.countDocuments({ user: userId });
        const totalPages = Math.ceil(totalOrders / perPage);

        const orders = await Order.find({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name productImages',
            })
            .sort({ createdAt: 'desc' })
            .skip((page - 1) * perPage)
            .limit(perPage);

        console.log(orders);

        res.render('user/profile', { User, orders, currentPage: page, totalPages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const updateprofile = async (req, res) => {
    const userId = req.session.user; // Assuming you have the user ID stored in the request

    try {
        const updatedUser = await user.findByIdAndUpdate(
            userId,
            {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                gender: req.body.gender
                // Add other fields you want to update
            },
            { new: true } // To return the updated document
        );

        // Handle the case where the user is not found
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send the updated user as a response
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
const updatepassword = async (req, res) => {
    const userId = req.session.user;

    // Gather data from the request
    const { currentPassword, newPassword } = req.body;

    // Find the user by ID
    const User = await user.findById(userId, 'password');

    // Check if the user exists
    if (!User) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Compare the entered current password with the one in the database
    const passwordMatch = await bcrypt.compare(currentPassword, User.password);
    if (!passwordMatch) {
        // If the current password does not match, return an error
        return res.status(401).json({ error: 'Incorrect current password' });
    }

    try {
        // Hash the new password before updating it
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        User.password = hashedNewPassword;

        // Save the updated user to the database
        const updatedUser = await User.save();

        // You may want to avoid sending the entire user object in the response for security reasons
        // Instead, you can selectively include the necessary details in the response
        const responseData = {
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            // Add other necessary fields
        };

        // Send a success response
        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        // Handle database save error
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



const updateaddress = async (req,res)=>{
    const userId = req.session.user;

try {
    const { addressId, updatedAddress } = req.body;

    // Find the user by ID
    const User = await user.findById(userId);

    if (!User) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Find the address in the user's addresses array by ID
    const existingAddress = User.addresses.find(address => address._id.toString() === addressId);

    if (!existingAddress) {
        return res.status(404).json({ error: 'Address not found' });
    }

    // Update the address fields
    existingAddress.addresstype = updatedAddress.addresstype;
    existingAddress.houseName = updatedAddress.houseName;
    existingAddress.street = updatedAddress.street;
    existingAddress.city = updatedAddress.city;
    existingAddress.state = updatedAddress.state;
    existingAddress.country = updatedAddress.country;
    existingAddress.zipCode = updatedAddress.zipCode;

    // Save the updated user
    await User.save();

    res.json({ message: 'Address updated successfully' });
} catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}

}


const deleteaddress = async(req,res)=>{
    
    const userId = req.session.user;
      
    try {
        const { addressId } = req.body;


        // Find the user
        const User = await user.findById(userId);

        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the index of the address with the given ID
        const addressIndex = User.addresses.findIndex(address => address._id.toString() === addressId);

        if (addressIndex === -1) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Remove the address from the array
        User.addresses.splice(addressIndex, 1);

        // Save the updated user
        await User.save();

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const orderdetail = async (req, res) => {
    const orderId = req.params.id;

    try {
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('user/orderdetail', { order });

    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
};

const cancelorder = async (req, res) => {
    try {
        const userId = req.session.user;
         
        const orderId = req.body.orderId;
        const itemId = req.body.itemId;
        const reason = req.body.reason;
        const status = req.body.status;
            

        console.log('orderId:', orderId);
        console.log('itemId:', itemId);
        const order = await Order.findOne({ _id: orderId });
        const User = await user.findOne({ _id: userId });
        console.log(order);
        if (!order) {
            return res.status(404).json({ error: 'Order not found or user does not have permission to cancel' });
        }

        const itemToCancel = order.items.find(item => item._id.toString() === itemId);

        if (!itemToCancel) {
            return res.status(404).json({ error: 'Item not found in the order.' });
        }

        // Check if the item is cancelable (based on status, business rules, etc.)
        // if (itemToCancel.status !== 'pending') {
        //     return res.status(400).json({ error: 'This item cannot be cancelled.' });
        // }
        
         if(status=='cancelled'){
           
        if(order.paymentMethod == 'razorpay' || order.paymentMethod == 'wallet'){
               
            //    User.wallet.balance += (itemToCancel.unitPrice * itemToCancel.quantity)
            User.wallet.balance += (itemToCancel.unitPrice * itemToCancel.quantity) * (1 - order.discount.percent / 100);

               User.wallet.transactions.push({
                amount: parseInt((itemToCancel.unitPrice * itemToCancel.quantity) * (1 - order.discount.percent / 100)),
                description: 'Refunded to Wallet', 
                date: new Date(),
            });
               
        }
        itemToCancel.status = 'cancelled';
        itemToCancel.reason = reason
        
        const productId = itemToCancel.product; // Assuming 'product' is the field in your item representing the product ID
        const quantityToRestore = itemToCancel.quantity;

        // Increment the stock of the canceled product
        const canceledProduct = await product.findOne({ _id: productId });
        canceledProduct.stock += quantityToRestore;

        await order.save();
        await User.save()
        await canceledProduct.save();

        res.status(200).json({ success: 'Item cancelled successfully.' });
    } else if (status === 'returned') {
        
        itemToCancel.returnRequest = {
            requested: true,
            status: 'pending',
        };
        itemToCancel.reason = reason

        // Save changes to the order and related entities
        await order.save();

        res.status(200).json({ return: 'Requested to return the product' });
    } else {

        res.status(400).json({ error: 'Invalid status provided.' });
    }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { profile ,updateprofile,updatepassword,updateaddress,
    deleteaddress,orderdetail,cancelorder}