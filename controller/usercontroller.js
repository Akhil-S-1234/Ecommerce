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




const home = async (req,res)=>{
    const products = await product.find({ isListed: true });


    res.render('user/main',{products})
}

const login = (req,res)=>{
    if(req.session.user){
        res.redirect('/home')
    }else
    res.render('user/login')
}

const loginpost = async (req, res) => {
    try {
        const check = await user.findOne({ email: req.body.email });

        if (!check) {
            return res.status(400).json({ noemail: 'Email not found' });
        }

        if (check.isBlocked) {
            return res.status(400).json({ block: 'You are Blocked by admin' });
        }

        // Compare the hashed password
        const passwordMatch = await bcrypt.compare(req.body.password, check.password);

        if (passwordMatch) {
            req.session.user = check._id.toHexString();
            console.log(req.session.user);

            res.json({ success: 'User logged in successfully' });
        } else {
            return res.status(401).json({ error: 'Wrong password' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const home1 = async (req,res)=>{
    const products = await product.find({ isListed: true });

    res.render('user/home',{products})
}

const signup = async(req,res)=>{
    res.render('user/signup')
}

const signuppost = async (req, res) => {
    
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    try {
        const existingUser = await user.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        
        req.session.signupData = {
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
        };

        const newOTP = new otp({
            email,
            otp: generatedOTP,
        });
        await newOTP.save();

        const mailBody = `Your OTP for registration is ${generatedOTP}`;
        await mailSender(email, 'Registration OTP', mailBody);

        res.json({success:'OTP is sent for verification'});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }


}

const mailSender = async (email, title, body)=>{
    try {
        let transporter = nodemailer.createTransport({
            service:'gmail', 
                auth:{
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                }
        }) 

        let info = await transporter.sendMail({
            from: 'www.sandeepdev.me - Sandeep Singh',
            to:`${email}`,
                subject: `${title}`,
                html: `${body}`,
        })

        console.log("Info is here: ",info)
        return info

    } catch (error) {
        console.log(error.message);
    }
}



const verifyemail = async (req,res)=>{
    res.render('user/verifyemail')
}
const verifypost = async (req,res)=>{
    
    try {
        const enteredOTP = req.body.otp;
        const signupData = req.session.signupData;

        if (!signupData) {
            return res.json({ error: 'User data not found. Please sign up again.' });
        }

        const otpRecord = await otp.findOne({ email: signupData.email  });

        if (!otpRecord) {
            return res.json({ error: 'OTP not found. Please request a new one.' });
        }

        if (enteredOTP === otpRecord.otp) {
            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(signupData.password, 10);

            const newUser = new user({
                firstName: signupData.firstName,
                lastName: signupData.lastName,
                email: signupData.email,
                phoneNumber: signupData.phoneNumber,
                password: hashedPassword, // Save the hashed password
            });

            const savedUser = await newUser.save();

            delete req.session.signupData;

            const { email, otp } = otpRecord;

            res.json({
                success: 'User registered successfully',
                user: savedUser,
                email,
                otp,
            });
        } else {
            res.json({ error: 'Incorrect OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const resendotp = async (req,res)=>{
    
    try {
        const userEmail = req.session.signupData.email; 
            
        const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
        const newOTP = new otp({
            email: userEmail,
            otp: generatedOTP,
        });
        await newOTP.save();
    
        const mailBody = `Your OTP for registration is ${generatedOTP}`;
        await mailSender(userEmail, 'Registration OTP', mailBody);
    
        res.json({ success: 'OTP Resent successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const headphone = async (req,res)=>{
    const products = await product.find({ category: 'Headphone', isListed: true });

    res.render('user/Headphone',{products})
}
const speaker = async (req,res)=>{
    const products = await product.find({ category: 'Speaker', isListed: true });

    res.render('user/speaker',{products})
}


const soundbar = async (req,res)=>{
    const products = await product.find({ category: 'Sound Bar', isListed: true });

    res.render('user/soundbar',{products})
}

const display = async(req,res)=>{
    const name = req.params.name
    console.log(name)
    const products = await product.findOne({name:name})
    res.render('user/productinfo',{products})
    
}

const forgot = async(req,res)=>{

    res.render('user/forgot',{ mes: '' })
}

const forgotpost = async(req,res)=>{
    try{

    const email = req.body.email
    const exist = await user.findOne({email})

    if(!exist){

        res.render('user/forgot',{mes:' User not found'})

    }else {
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
    req.session.emailData = {
        email
    };

    const newOTP = new otp({
        email,
        otp: generatedOTP,
    });
    await newOTP.save();

    const mailBody = `Your OTP for new password is ${generatedOTP}`;
    await mailSender(email, 'Change Password OTP', mailBody);
     
    res.redirect('/otpverify')
    } 
    }catch(error){
        console.error('Error:', error);
    }
}

const forgototp = async(req,res)=>{

    res.render('user/forgotpverify')

}
const forgototppost = async (req,res)=>{
    try {
        const enteredOTP = req.body.otp;
        const { email }= req.session.emailData;

        if (!email) {
            return res.json({ error: 'User email not found. Please try again.' });
        }


        console.log(email);

        const otpRecord = await otp.findOne({ email });

        if (!otpRecord) {
            return res.json({ error: 'OTP not found. Please request a new one.' });
        }

        if (enteredOTP === otpRecord.otp) {
                 
            const { email} = otpRecord;

            res.json({
                success: 'User verified successfully',
                email,
                otp,
            });
        } else {
            res.json({ error: 'Incorrect OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const changepass = async (req,res)=>{
    res.render('user/changepass')
}

const changepasspost = async (req, res) => {
    const { newpass } = req.body;
    const { email } = req.session.emailData;

    try {
        const User = await user.findOne({ email });

        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newpass, 10);

        User.password = hashedPassword;

        await User.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const cart = async (req, res) => {
    try {
        // Assuming you fetch the cart data from the database or another source
        const userId = req.session.user;
        const cart = await Cart.findOne({ user: userId }).populate('items.product couponused.couponid');
        const coupons = await Coupon.find({status : 'active'})
        console.log(cart)
        let itemsubtotal
        if(cart){
         itemsubtotal = cart.items.reduce((total, item) => total + item.total, 0)
        }// Render the 'user/cart' template with the cart data
        res.render('user/cart', { cart ,coupons, itemsubtotal});
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const cartadd = async (req, res) => {
    let { productId, productPrice, quantity } = req.body;
    const userId = req.session.user;

    productPrice = parseInt(productPrice);
    quantity = parseInt(quantity);

    try {
        // Retrieve the product details including stock information
        const product1 = await product.findById(productId);

        if (!product1) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if the requested quantity exceeds the available stock
        if (quantity > product1.stock) {
            return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [],couponused :{discount_amount:0}, totalPrice: 0 });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (existingItemIndex !== -1) {
            // Check if adding the quantity exceeds the available stock
            if (quantity + cart.items[existingItemIndex].quantity > product1.stock) {
                return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
            }

            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].total =
                cart.items[existingItemIndex].unitPrice * cart.items[existingItemIndex].quantity;
        } else {
            // Check if adding the quantity exceeds the available stock
            if (quantity > product1.stock) {
                return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
            }

            const newItem = {
                product: productId,
                unitPrice: productPrice,
                quantity: quantity,
                total: productPrice * quantity,
            };
            cart.items.push(newItem);
        }

        itemsubtotal = cart.items.reduce((total, item) => total + item.total, 0);
        // await cart.save();
        
        let couponAmount = 0;

        // Check if couponused exists and has a discount amount
        if (cart.couponused && cart.couponused.discount_amount !== 0) {
            let coupon = await Coupon.findOne({ _id: cart.couponused.couponid });
            couponAmount = (itemsubtotal * coupon.discount) / 100;
        }

        cart.totalPrice = itemsubtotal - couponAmount;
        cart.couponused.discount_amount = couponAmount
        await cart.save();

        const addedItem = cart.items.find(item => item.product.toString() === productId);
        const responseData = {
            success: true,
            message: 'Product added to cart successfully',
            quantity: addedItem.quantity,
            totalProductPrice: addedItem.total,
            cartTotalPrice: cart.totalPrice,
            itemsubtotal : itemsubtotal,
            discount_amount : couponAmount
        };

        res.json(responseData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const removeCartItem = async (req, res) => {
    try {
        const productId = req.params.proid;
        const userId = req.session.user; 
        console.log(productId)
        const updatedCart = await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { items: { product: productId } } },
            { new: true }
        );
        console.log(updatedCart)
        if (updatedCart.items.length === 0) {
            await Cart.findOneAndDelete({ user: userId });
            return res.redirect('/cart');
        }

        
        // Calculate the updated total price based on the remaining items in the cart
        const totalPrice = updatedCart.items.reduce((total, item) => total + item.total, 0);
    
        // Update the total price in the cart
        updatedCart.totalPrice = totalPrice;
    
        // Save the updated cart
        await updatedCart.save();
        
        // Redirect to the cart page or send a response as needed
        res.redirect('/cart');
        
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    
};
const checkout = async (req, res) => {
    const userId = req.session.user;

    try {
        const User = await user.findById(userId).select('addresses wallet.balance');
        const cart = await Cart.findOne({ user: userId }).populate('totalPrice items.product');

        console.log(cart)
        if (!User) {
            return res.status(404).send('User not found');
        }
        itemsubtotal = cart.items.reduce((total, item) => total + item.total, 0);

        const walletbalance = User.wallet.balance;
        const addresses = User.addresses || [];
        res.render('user/checkout1', { addresses,cart,walletbalance,itemsubtotal });
    } catch (error) {
        console.error('Error fetching user addresses:', error);
        res.status(500).send('Internal Server Error');
    }
};

const add_address = async(req,res)=>{
    const userId = req.session.user;
    console.log(userId);
  const { houseName, addresstype, street, city, state, country, zipCode } = req.body;

  try {
    const user1 = await user.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newAddress = {
      houseName,
      addresstype,
      street,
      city,
      state,
      country,
      zipCode,
    };

    user1.addresses.push(newAddress);
    await user1.save();

    const newAddressId = user1.addresses[user1.addresses.length - 1]._id;

        // Instead of redirecting, send the address ID in the response
    res.status(201).json({ addressId: newAddressId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }

}
const checkoutpay = async (req, res) => {
    try {
        const { addressid, paymethod , Paymentstatus } = req.body;
        console.log(req.body);
        const userId = req.session.user;

        // Assuming you have a User model with an 'addresses' field
        const User = await user.findById(userId).select('addresses wallet');

        const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price');

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const paymentstatus = Paymentstatus || 'confirmed';
        
        const items = cart.items;
        console.log(items)
        const total = cart.totalPrice;
        
         
        const orderItems = items.map(item => ({
            product: item.product._id, // Assuming product._id is the ObjectId
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        }));

        if (!user) {
            // Handle case where user is not found
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Find the selected address based on addressid
        const selectedAddress = User.addresses.find(address => address._id == addressid);
        if (!selectedAddress) {
            return res.status(404).json({ error: 'Selected address not found' });
        }



          const couponId = cart.couponused.couponid;
          const coupon = await Coupon.findById(couponId);
          
  
        //   if (!coupon) {
        //       return res.status(404).json({ error: 'Coupon not found' });
        //   }
  
          // Use coupon percentage in your order
          const orderDiscount = {
              disamnt: cart.couponused.discount_amount,
              percent: !coupon ? 0 : coupon.discount,

          };

        if(paymethod=='wallet'){
            User.wallet.balance -= total
            User.wallet.transactions.push({
             amount: -parseInt(total),
             description: 'Deducted from Wallet', 
             date: new Date(),
         });
        }
        User.save()
        console.log('Order created successfully:');

        const order = new Order({
            user: userId,
            items: orderItems, // You need to add items to the order based on the user's cart or other logic
            shippingAddress: {
                addresstype:selectedAddress.addresstype,
                houseName: selectedAddress.houseName,
                street: selectedAddress.street,
                city: selectedAddress.city,
                state: selectedAddress.state,
                country: selectedAddress.country,
                zipCode: selectedAddress.zipCode,
            },
            // disamnt : cart.couponused.discount_amount,
            discount : orderDiscount , 
            paymentMethod: paymethod,
            paymentstatus : paymentstatus,
            totalPrice: total,
        });

        const savedOrder = await order.save();
        
        await Cart.findOneAndDelete({ user: userId });

        
        console.log('Order created successfully:', savedOrder);

        
        const products = items.map(item => ({
            item: item.product._id,
            quantity: item.quantity
        }));
        console.log(products)
        for (const orderItem of products) {
            const item = await product.findById(orderItem.item);
             console.log(item)
            if (!item) {
                console.error(`Product not found with ID: ${orderItem.product}`);
                continue; 
            }
            item.stock -= orderItem.quantity;
            await item.save();
        }


        res.status(200).json({ message: 'Order created successfully', order: savedOrder });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



  





const wishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        
        const User = await user.findById(userId).populate('wishlist.product');

        if (!User) {
            // Handle case when user is not found
            return res.status(404).json({ error: 'User not found' });
        }

        const wishlistData = User.wishlist;

        // Pass the wishlist data to the rendering function
        res.render('user/wishlist', { wishlist: wishlistData });
    } catch (error) {
        console.error('Error rendering wishlist page:', error);
        // Handle the error and send an appropriate response
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const wishadd = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

    
        // Find the user by ID
        const User = await user.findById(userId);
    
        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }
    
        // Check if the product is already in the wishlist
        const isProductInWishlist = User.wishlist.some(item => item.product.equals(productId));
    
        if (isProductInWishlist) {
            return res.status(200).json({ exist : 'Product already in wishlist' });
        }
    
        // Add product to wishlist
        User.wishlist.push({ product: productId });
        await User.save();
    
        res.status(200).json({ message: 'Product added to wishlist successfully' });
    } catch (error) {
        console.error('Error adding product to wishlist:', error);
        // Send an error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
    
  };
  

const wishremove = async (req, res) => {
    const userId = req.session.user;

    const productId = req.params.proid;

    try {
        const User = await user.findById(userId);

        if (!User) {
            return res.status(404).render('error', { message: 'User not found' });
            // or res.redirect('/error?message=User not found');
        }

        User.wishlist.pull({product : productId});

        await User.save();

        const wishlistData = User.wishlist;

        // res.status(200).render('user/wishlist', { message: 'Product removed from wishlist successfully' ,wishlist: wishlistData });
        res.status(200).redirect('/wishlist')
        // or res.redirect('/success?message=Product removed from wishlist successfully');
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
        // or res.redirect('/error?message=Internal Server Error');
    }
};

const razorpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret,
  });


const razord = async(req,res)=>{
    const {amount, currency} = req.body

    const options = {
        amount,
        currency,
      };
    
      try {
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id });
      } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('Internal Server Error');
      }
}

const walletadd = async (req, res) => {
    try {
        const userId = req.session.user;
        const { amount } = req.body;
 
        const User = await user.findById(userId);

        if (!User) {
            return res.status(404).json({ error: 'User not found' });
        }

        User.wallet.balance += parseInt(amount);
        
        User.wallet.transactions.push({
            amount: parseInt(amount),
            description: 'Added to wallet', 
            date: new Date(),
        });

        await User.save();

        res.json({ message: User.wallet.balance  });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const applycoupon = async (req, res) => {
    const { code } = req.params;
    const userId = req.session.user;

    try {
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        
        if(cart.couponused.discount_amount != 0){
            return res.status(404).json({ message: "Coupon Alreaady applied" });
        }
        const couponAmount = (cart.totalPrice * coupon.discount) / 100;
        console.log(couponAmount);
        cart.totalPrice -= couponAmount ;
        cart.couponused = {
            couponid: coupon._id,
            discount_amount: couponAmount ,
        };

        
        await cart.save();

        res.json({ message: "Coupon applied successfully", cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const removecoupon = async (req, res) => {
    const userId = req.session.user;

    try {
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        cart.totalPrice += cart.couponused.discount_amount

        cart.couponused = {
            couponid: null,  
            discount_amount: 0 
        };

        
        await cart.save();

        return res.status(200).json({ message: "Coupon removed successfully", cart });
    } catch (error) {
        console.error('Error removing coupon:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const downloadinvoice = async (req, res) => {
    const orderId = req.params.id;

    try {
        const order = await Order.findById(orderId).populate('items.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }
        console.log(order);
        const pdfPath = 'invoice.pdf';

        await createInvoice(order, pdfPath);

        // Set the response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');

        // Stream the generated PDF to the response
        const pdfStream = fs.createReadStream(pdfPath);
        pdfStream.pipe(res);

        // Clean up: Delete the generated PDF file after streaming
        pdfStream.on('end', () => {
            fs.unlinkSync(pdfPath);
        });
    } catch (error) {
        console.error('Error generating or streaming PDF:', error);
        res.status(500).send('Internal Server Error');
    }
};




const searchresult = async (req,res)=>{

    try {
        const query = req.query.product; 

        const products = await product.find({ name: { $regex: new RegExp(query, 'i') } });

        res.render('user/search', { products });
    } catch (error) {
        console.error('Error during product search:', error);
        res.status(500).send('Internal Server Error');
    }


}

const failedpay = async (req, res) => {
    const { orderId } = req.body;
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentstatus = 'confirmed';

        await order.save();

        return res.status(200).json({ message: 'Retrying Payment Successful' });

    } catch (error) {
        console.error('Error during finding the order:', error);
        res.status(500).send('Internal Server Error');
    }
};

const logout =(req,res)=>{
    req.session.user = false
    res.redirect('/login')
}
module.exports = {
       home,login,loginpost,signup,signuppost,verifyemail,verifypost,mailSender,resendotp,headphone,display,speaker,soundbar,forgot,forgotpost
       ,forgototp,forgototppost,cart,cartadd,removeCartItem,checkout,add_address,checkoutpay,logout,home1,wishlist,wishadd,wishremove,razord,walletadd,applycoupon,removecoupon,downloadinvoice,searchresult,failedpay,changepass,changepasspost
}