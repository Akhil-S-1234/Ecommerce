const express = require('express')
const router = express.Router()
const admincontroller = require('../controller/admincontroller')
const upload = require('../config/upload');
const {checkadminsession} = require('../middleware/checkadminsession')

router.get('/login',admincontroller.login)
router.post('/login',admincontroller.loginpost)

router.use(checkadminsession)

router.get('/customers',admincontroller.userlist)


router.get('/customers/:userId',admincontroller.userblock)


router.get('/dashboard',admincontroller.dashboard)

router.get('/category',admincontroller.Category)
router.get('/category/:userId',admincontroller.deletecateg)
router.post('/category/:id',admincontroller.editcateg)
router.post('/category',admincontroller.addcateg)
router.post('/setstatus/:id',admincontroller.setstatus)

router.get('/productlist',admincontroller.productlist)

router.post('/productstatus/:id',admincontroller.productstatus)


router.get('/productlist/:id',admincontroller.deleteproduct)
router.get('/addproduct',admincontroller.addproduct)
router.get('/editproduct/:id',admincontroller.editproduct)
router.post('/editproduct/:productId',upload,admincontroller.editproductpost)
router.post('/addproduct',upload,admincontroller.addproductpost)
router.post('/proImgEdit',admincontroller.deleteImg)

router.get('/orderlist',admincontroller.orderlist)
router.get('/orderdetail/:itemId/:orderId',admincontroller.orderdetail)
router.patch('/updatestatus/:orderId/:itemId',admincontroller.updatestatus)

router.get('/coupons',admincontroller.coupon)
router.get('/addcoupon',admincontroller.addcoupon)
router.get('/changecoupon/:id',admincontroller.changestatus)
router.post('/addcouponpost',admincontroller.addcouponpost)

router.get('/salesreport',admincontroller.salesreport)
router.post('/exceldownload',admincontroller.exceldownload)
router.post('/pdfdownload',admincontroller.pdfdownload)


router.get('/returnrequests',admincontroller.returnrequests)
router.post('/approvereturn',admincontroller.approvereturn)


router.get('/logout',admincontroller.logout)

module.exports = router