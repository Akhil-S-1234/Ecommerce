const user = require('../models/mongodb')
const product = require('../models/product')
const category = require('../models/category')
const Order = require('../models/order')
const Coupon = require('../models/coupon')
const excelJS = require("exceljs");
const pdfmake = require('pdfmake');



const login = async (req,res)=>{
    if(req.session.admin)
      res.redirect('/admin/dashboard')
    else
     res.render('admin/login') 
}

const loginpost = async (req,res)=>{
    const name = 'admin@gmail.com'
    const password = 'admin123'
    if(name ===  req.body.username && password === req.body.password){
        //adding session 
        req.session.admin = req.body.username;

        res.redirect("/admin/dashboard")
       
    }else {
        res.send("wrong data....")
    }
}

const dashboard = async (req, res) => {
    try {
        // if(req.session.admin)
        const orderCount = await Order.countDocuments();
        const customerCount = await user.countDocuments(); // Assuming User is your user model
        const productCount = await product.countDocuments();

        const productPurchaseCounts = await getProductPurchaseCounts();
        const salesreport = await getsalesreport();

        const orderSourceData = await Order.aggregate([
            {
              $group: {
                _id: '$paymentMethod',
                count: { $sum: 1 },
              },
            },
          ]);

        console.log(orderSourceData);
        console.log(salesreport);
        
        const userStats = await user.aggregate([
            {
              $group: {
                _id: {
                  year: { $year: { $toDate: '$_id' } },
                  month: { $month: { $toDate: '$_id' } },
                  day: { $dayOfMonth: { $toDate: '$_id' } },
                },
                count: { $sum: 1 },
              },
            },
            {
              $sort: {
                '_id.year': 1,
                '_id.month': 1,
                '_id.day': 1,
              },
            },
          ]);

          console.log(userStats);

        res.render('admin/dashboard', { orderCount, customerCount, productCount,salesreport, productPurchaseCounts,orderSourceData,userStats});
        // else {
        //     res.redirect('/admin/login')
        // }
    } catch (error) {
        console.error('Error in dashboard route:', error);
        res.status(500).send('Internal Server Error');
    }
};

const getsalesreport = async ()=>{
    const pipeline = [
        {
            $unwind: "$items",
        },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productDetails",
            },
        },
        {
            $unwind: "$productDetails",
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                productName: "$productDetails.name",
                quantity: "$items.quantity",
                totalAmount: "$totalPrice",
            },
        },
        
        {
            $group: {
                _id: { date: "$date", productName: "$productName" },
                totalSales: { $sum: "$totalAmount" },
                totalQuantity: { $sum: "$quantity" },
                countOrders: { $sum: 1 },
            },
        }
    ]
    const result = await Order.aggregate(pipeline).exec();
    return result
}

const getProductPurchaseCounts = async () => {
    try {
        const productPurchaseCounts = await Order.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    count: { $sum: '$items.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'products', // Adjust based on your actual product collection name
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $project: {
                    _id: 0,
                    productName: '$productDetails.name',
                    purchaseCount: '$count'
                }
            }
        ]);
        
        console.log(productPurchaseCounts);
        return productPurchaseCounts;
    } catch (error) {
        console.error('Error retrieving product purchase counts:', error);
        throw error;
    }
};




const userlist = async (req,res)=>{
    try {
        const users = await user.find({}, { password: 0 }); 
        res.render('admin/userlist',{users})
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
  
}

const userblock = async (req,res)=>{
    const userId = req.params.userId;

    try {
        const foundUser = await user.findById(userId);
            
        if (!foundUser) {
            return res.status(404).send('User not found');
        }

        foundUser.isBlocked = !foundUser.isBlocked;

        await foundUser.save();

        res.redirect('/admin/customers'); 
    } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).send('Internal Server Error');
    }
}





const Category = async (req,res)=>{
    try {
        const catname = await category.find({});

        for (const cat of catname) {
            if (cat.discountoffer !== undefined) {
                const offerPercentage = cat.discountoffer !== 0 ? cat.discountoffer / 100 : 0;

                const products = await product.find({ category: cat.name });

                for (const prod of products) {
                    prod.price = Math.floor(prod.price)
                    prod.offerprice = prod.price - prod.price * offerPercentage;
                    await prod.save();
                }

                await cat.save();
            }
        }
        res.render('admin/category',{catname})
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
}

const addcateg = async (req,res)=>{
    const {name,discountoffer} = req.body
   try{
      const existingcategory =  await category.findOne({name})
      if(existingcategory){
        return res.status(400).json({ error: 'category already exists' });
      }
      const newCategory = new category({name,discountoffer});  

      await newCategory.save()

      res.json({success: 'category added successfully'})

   }catch(error){
     console.error(error);
     res.status(500).json({ error: 'Internal server error' });
   }
}

const setstatus = async (req, res) => {
    const catid = req.params.id;

    try {
        const categ = await category.findById(catid);

        if (!categ) {
            return res.status(404).json({ error: 'Category not found' });
        }

        categ.isListed = !categ.isListed;

        await categ.save();

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



const deletecateg = async (req,res)=>{
    const userId = req.params.userId;
    try{
        const deletedCategory = await category.findOneAndDelete({ _id: userId });

        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.redirect('/admin/category')

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const editcateg = async (req, res) => {
    try {
        const catid = req.params.id;
        const { discountoffer } = req.body;
        const editedCategoryName = req.body.editedcategoryName

        // Input validation
        console.log(editedCategoryName);
        console.log(discountoffer);
        if (!editedCategoryName || !discountoffer) {
            return res.status(400).json({ error: 'Both editedCategoryName and discountoffer are required.' });
        }

        const parsedDiscountOffer = parseFloat(discountoffer);

        if (isNaN(parsedDiscountOffer) || parsedDiscountOffer < 0 || parsedDiscountOffer > 100) {
            return res.status(400).json({ error: 'Invalid discountoffer. It should be a number between 0 and 100.' });
        }

        // Check if the edited value is already present
        const existingCategory = await category.findOne({ name: editedCategoryName });

        if (existingCategory && existingCategory._id.toString() !== catid) {
            return res.status(400).json({ error: 'The edited category name already exists.' });
        }

        const editedCat = editedCategoryName.trim().toLowerCase();

        const existing = await category.findOne({ name: editedCat });

        if (existing) {
            return res.status(400).json({ error: 'The edited category name already exists.' });
        }

        const categ = await category.findById(catid);

        if (!categ) {
            return res.status(404).json({ error: 'Category not found' });
        }

        categ.name = editedCategoryName;
        categ.discountoffer = parsedDiscountOffer;
        await categ.save();

        

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};






const productlist = async (req,res)=>{
    const products = await product.find({})
    res.render('admin/productlist',{products})
}

const productstatus = async (req, res) => {
    const proid = req.params.id;

    try {
        const prod = await product.findById(proid);

        if (!prod) {
            return res.status(404).json({ error: 'Category not found' });
        }

        prod.isListed = !prod.isListed;

        await prod.save();

        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};



const addproduct = async (req,res)=>{
    const categories = await category.distinct('name'); 
    res.render('admin/addproduct',{categories})
}

const addproductpost = async (req,res)=>{
    try {
        const {
          name,
          model,
         description,
         category,
          price,
          brand,
          color,
          stock,
        } = req.body;
        
        let productImages = [];

        console.log(req.files);

        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
            productImages = fileUrls;  
        }
        console.log(productImages);

        const newProduct = new product({
            name,
            model,
           description,
           category,
            price,
            brand,
            color,
            stock,
            productImages
        });
    
        const savedProduct = await newProduct.save();

        res.json({
          message: 'Product added successfully',
          product: savedProduct,
        });
      } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}

const deleteproduct = async (req,res)=>{
    const id = req.params.id;
    try{
       await product.findOneAndDelete({ _id: id});
         res.redirect('/admin/productlist')
    }catch(error){
        console.log(error)
    }
}

const editproduct = async (req,res)=>{
    const id = req.params.id
    const categories = await category.distinct('name'); 
    const prod = await product.findOne({_id:id})
    res.render('admin/editproduct',{prod,categories})
}

const deleteImg = async (req,res)=>{
    try {
        console.log("here in the deleting phase");
        const {productId,imgName} = req.body;
        console.log(productId);
        console.log(imgName);
        const products = await product.findById(productId);
       const filteredImg = products.productImages.filter(item => item != imgName );
       console.log(filteredImg);
       products.productImages = filteredImg;
       await products.save()
       console.log(products);
    } catch (error) {
        console.log(error.message)

    }
}

const editproductpost = async (req,res)=>{
    try {
        const {productId} = req.params;
        const {
            name,
            model,
            description,
            category,
            price,
            brand,
            color,
            stock,
            offerprice
        } = req.body;

        let productImages = [];

        if (req.files && req.files.length > 0) {
            const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
            productImages = fileUrls;
        }

        const existingProduct = await product.findById(productId);

        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        existingProduct.name = name;
        existingProduct.model = model;
        existingProduct.description = description;
        existingProduct.category = category;
        existingProduct.price = price;
        existingProduct.brand = brand;
        existingProduct.color = color;
        existingProduct.stock = stock;
        existingProduct.offerprice = offerprice;
        existingProduct.productImages = productImages.concat(existingProduct.productImages);

        const updatedProduct = await existingProduct.save();

        res.json({
            message: 'Product updated successfully',
            product: updatedProduct,
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


const orderlist = async (req,res)=>{
    try {
        const orders = await Order.find()
        .populate({
            path: 'user',
            select: 'firstName lastName', // Specify the user fields you want to populate
        })
        .populate({
            path: 'items.product',
            select: 'name productImages', // Specify the product fields you want to populate
        })
        .select('_id user shippingAddress totalPrice items.quantity items.unitPrice items._id paymentMethod items.status createdAt');

        const pendingReturnCount = await Order.aggregate([
            {
              $unwind: "$items"
            },
            {
              $match: {
                "items.returnRequest.requested": true,
                "items.returnRequest.status": "pending"
              }
            },
            {
              $count: "pendingReturnCount"
            }
          ]);
        console.log(pendingReturnCount);
        let index=1
        // console.log(orders)
        res.render('admin/orderlist', { orders,index,pendingReturnCount });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
}


const updatestatus = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { newStatus } = req.body;

      

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const itemToUpdate = order.items.find(item => item._id.toString() === itemId);

        if (!itemToUpdate) {
            return res.status(404).json({ error: 'Item not found in the order' });
        }

        itemToUpdate.status = newStatus;

        await order.save();

        res.json({ message: 'Item status updated successfully' });
    } catch (error) {
        console.error('Error updating item status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const coupon = async (req,res)=>{
    try {
         const currentDate = new Date();
         await Coupon.updateMany({ expirationDate: { $lt: currentDate }, status: { $ne: 'expired' } }, { $set: { status: 'expired' } });
        const Coupons = await Coupon.find();
         
        res.render('admin/coupon',{Coupons})
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
}

const changestatus = async (req,res)=>{
    const couponId = req.params.id

    try{
        const coupon = await Coupon.findOne({_id : couponId }); 

        if(coupon.status=='active'){
            coupon.status = 'inactive'
        } else {
            coupon.status = 'active'
        }

        await coupon.save()

        res.redirect('/admin/coupons')

    } catch (error){
        console.error('Error fetching users:', error);
        res.status(500).send( 'Internal Server Error' );
    }
}

const addcoupon = async (req,res)=>{
    res.render('admin/addcoupon')
}

const addcouponpost = async (req, res) => {
    try {
        const { code, discount, expirationDate, usageLimit ,minCart } = req.body;


        const existingCoupon = await Coupon.findOne({ code });

        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        if (discount<100 ){
            return res.status(400).json({error : "coupon discount exceeds" })
    }
        if(expirationDate > new Date()){
            return res.status(400).json({error : "date  exceeds" })
        }


        const newCoupon = new Coupon({
            code,
            discount,
            expirationDate,
            usageLimit,
            minCart
        });

        await newCoupon.save();

        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const orderdetail = async (req, res) => {
    try {
        const { itemId, orderId } = req.params;

        const order = await Order.findById(orderId).populate({
            path: 'user',
            select: 'firstName lastName email', // Specify the user fields you want to populate
        })
        .populate({
            path: 'items.product',
            select: 'name productImages category', // Specify the product fields you want to populate
        })
        .select('_id user shippingAddress totalPrice items.quantity items.unitPrice items._id paymentMethod items.status createdAt');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        const item = order.items.find(item => item._id.toString() === itemId);

        if (!item) {
            return res.status(404).send('Item not found in the order');
        }

        res.render('admin/orderdetail', { order, item });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const salesreport = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const period = req.query.period; 
    const selectedDate = req.query.selectedDate; 

    const matchStage = {};

    if (startDate && endDate) {
        matchStage.date = { $gte: startDate, $lte: endDate };
    }
    console.log(period);

    if (period == 'day') {
        // Get the current date
        const currentDate = new Date();
        
        // Set both start and end dates to the current date
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the day (midnight)
        
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day (just before midnight)
    
        matchStage.date = {
            $gte: startOfDay.toISOString().split('T')[0],
            $lte: endOfDay.toISOString().split('T')[0]
        };
    }
    else if (period === 'week') {
        // Adjust start and end dates to the current week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the current week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the current week (Saturday)
        matchStage.date = {
            $gte: startOfWeek.toISOString().split('T')[0],
            $lte: endOfWeek.toISOString().split('T')[0]
        };
    } else if (period === 'month') {
        // Adjust start and end dates to the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1); // Start of the current month
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0); // End of the current month
        matchStage.date = {
            $gte: startOfMonth.toISOString().split('T')[0],
            $lte: endOfMonth.toISOString().split('T')[0]
        };
    } else if (selectedDate) {
        // Filter for the selected date
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0); // Set to the beginning of the selected date
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999); // Set to the end of the selected date
        matchStage.date = { $gt: startOfDay.toISOString().split('T')[0], $lte: endOfDay.toISOString().split('T')[0] };
    }
    
    

    console.log(matchStage);
 
    const pipeline = [
        {
            $unwind: "$items",
        },
        {
            $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "productDetails",
            },
        },
        {
            $unwind: "$productDetails",
        },
        {
            $project: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                productName: "$productDetails.name",
                quantity: "$items.quantity",
                totalAmount: "$totalPrice",
            },
        },
        {
            $match: matchStage, // Include the match stage based on the filter
        },
        {
            $group: {
                _id: { date: "$date", productName: "$productName" },
                totalSales: { $sum: "$totalAmount" },
                totalQuantity: { $sum: "$quantity" },
                countOrders: { $sum: 1 },
            },
        },
        {
            $sort: { "_id.date": 1, "_id.productName": 1 },
        },
    ];

    try {
        const result = await Order.aggregate(pipeline).exec();
        const totalItems = result.length;

        // Apply pagination to the stored result
        const paginatedResult = result.slice((page - 1) * limit, page * limit);

        console.log(paginatedResult);
        console.log(totalItems);

        res.render('admin/salesreport', {
            download: result,
            result: paginatedResult,
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            limit: limit,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};



module.exports = { salesreport };


const returnrequests = async (req, res) => {
    try {
        const requestedOrders = await Order.find({
            'items': {
                $elemMatch: {
                    'returnRequest.requested': true,
                    'returnRequest': { $exists: true }
                }
            }
        }).populate({
            path: 'user',
            select: 'firstName lastName email', // Specify the user fields you want to populate
        })
        .populate({
            path: 'items.product',
            select: 'name productImages category', // Specify the product fields you want to populate
        })

        console.log(requestedOrders);
        res.render('admin/return', { requestedOrders });
    } catch (error) {
        console.error('Error fetching return requests:', error);
        res.status(500).send('Internal Server Error');
    }
};

const approvereturn = async (req, res) => {
    try {
        const { orderId, itemId ,status } = req.body;
        const order = await Order.findOne({ _id: orderId }).populate('user');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const User = await user.findOne({_id : order.user._id})
        const itemToReturn = order.items.find(item => item._id.toString() === itemId);

        if (!itemToReturn) {
            return res.status(404).json({ error: 'Item not found in the order.' });
        }

        if(status=='approved'){
            
           itemToReturn.returnRequest = {
                requested : true,
               status: 'approved',
        };
        User.wallet.balance += (itemToReturn.unitPrice * itemToReturn.quantity) * (1 - order.discount.percent / 100);

        User.wallet.transactions.push({
         amount: parseInt((itemToReturn.unitPrice * itemToReturn.quantity) * (1 - order.discount.percent / 100)),
         description: 'Refunded to Wallet for the return of the item', 
         date: new Date(),
        });

        const productId = itemToReturn.product; // Assuming 'product' is the field in your item representing the product ID
        const quantityToRestore = itemToReturn.quantity;

        // Increment the stock of the canceled product
        const canceledProduct = await product.findOne({ _id: productId });
        canceledProduct.stock += quantityToRestore;
        await canceledProduct.save();


        } else {
            itemToReturn.returnRequest = {
                requested : true,
                status: 'rejected',
            };
        }
        console.log(order);
        await User.save()
        await order.save();

        res.status(200).json({ success: 'Return request approved successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const exceldownload = async (req, res) => {
    const data = req.body;

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("My Users");

    // Define columns
    worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Product Name", key: "productName", width: 20 },
        { header: "Total Quantity", key: "totalQuantity", width: 15 },
        { header: "Count Orders", key: "countOrders", width: 15 },
        { header: "Total Sales", key: "totalSales", width: 15 },
    ];
    // Loop through user data and add rows
    let counter = 1;
    data.forEach((data) => {
        user.s_no = counter;
        worksheet.addRow({
            date: data._id.date,
            productName: data._id.productName,
            totalQuantity: data.totalQuantity,
            countOrders: data.countOrders,
            totalSales: data.totalSales,

        });
        counter++;
    });

    // Set headers for file download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");

    // Send the Excel file as a response
    return workbook.xlsx.write(res)
        .then(() => {
            res.end();
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send("Internal Server Error");
        });
};

const pdfdownload = async (req,res)=>{

    const data = req.body;

    const fonts = {
        Roboto: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        }
    };
    

    const printer = new pdfmake(fonts);

    const tableBody = [
        ["Date", "Product Name", "Total Quantity", "Count Orders", "Total Sales"]
    ];

    data.forEach((item) => {
        tableBody.push([
            item._id.date,
            item._id.productName,
            item.totalQuantity,
            item.countOrders,
            Math.floor(item.totalSales)
        ]);
    });

    const table = {
        body: tableBody
    };

    const pdfDoc = printer.createPdfKitDocument({
        content: [
            {
                text: `Sales Report (${data[0]._id.date} - ${data[data.length-1]._id.date}) `,
                style: 'header'
            },
            {
                table: {
                    headerRows: 1,
                    widths: [100, '*', 80, 80, 80], // Adjust column widths as needed
                    body: tableBody,
                    
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 1 : 1;
                    },
                    vLineWidth: function (i) {
                        return i ? 1 : 1;
                    },
                    hLineColor: function (i) {
                        return i === 0 ? '#555' : '#aaa';
                    },
                    vLineColor: function () {
                        return '#aaa';
                    }
                },
                style: 'tableStyle'
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            tableStyle: {
                margin: [0, 10, 0, 10],
                fontSize: 12,
                color: '#333',
                alignment: 'center',
            }
        }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");

    pdfDoc.pipe(res);
    pdfDoc.end();

}

const logout =(req,res)=>{
    req.session.admin = false
    res.redirect('/admin/login')
}


module.exports = {
         login,loginpost,dashboard, addproduct,addproductpost,logout,userlist,userblock,Category,addcateg,deletecateg,editcateg,productlist,deleteproduct,editproduct,
         editproductpost,orderlist,updatestatus,coupon,addcoupon,addcouponpost,orderdetail,salesreport,returnrequests,approvereturn,exceldownload,pdfdownload,changestatus,
         setstatus,deleteImg,productstatus
}