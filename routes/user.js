const express = require('express')
const router = express.Router()
const usercontroller = require('../controller/usercontroller')
const profilecontroller = require('../controller/profilecontroller')
const {checkblock} = require('../middleware/checkblock')
const {checkcateg} = require('../middleware/checkcateg')
const {checksession} = require('../middleware/checksession')

router.use(checkcateg)

router.get('/',checkcateg,usercontroller.home)
router.get('/login',checkcateg,usercontroller.login)
router.post('/login',usercontroller.loginpost)
router.get('/signup',checkcateg,usercontroller.signup)
router.post('/signup',usercontroller.signuppost)
router.get('/verifyemail',checkcateg,usercontroller.verifyemail)
router.post('/verifyemail',usercontroller.verifypost)
router.post('/resendotp',usercontroller.resendotp)

router.get('/forgot',checkcateg,usercontroller.forgot)
router.post('/forgot',usercontroller.forgotpost)
router.get('/otpverify',checkcateg,usercontroller.forgototp)
router.post('/otpverify',usercontroller.forgototppost)
router.get('/changepass',usercontroller.changepass)
router.post('/changepass',usercontroller.changepasspost)


router.get('/headphone',checkcateg,checkblock,usercontroller.headphone)
router.get('/speaker',checkcateg,checkblock,usercontroller.speaker)
router.get('/soundbar',checkblock,checkcateg,usercontroller.soundbar)
router.get('/display/:name',checkblock,checkcateg,usercontroller.display)

router.get('/cart',checkcateg,checksession,usercontroller.cart)
router.post('/cart/add',checksession,usercontroller.cartadd)
router.get('/cart/:proid',usercontroller.removeCartItem)

router.get('/checkout',checkcateg,usercontroller.checkout)
router.post('/checkout',usercontroller.checkoutpay)
router.post('/checkout/add_address',usercontroller.add_address)

router.get('/home',checkblock, checkcateg ,usercontroller.home1)
router.get('/profile',checkblock,checkcateg,checksession,profilecontroller.profile)
router.post('/updateProfile',checkcateg,profilecontroller.updateprofile)
router.post('/updatePassword',profilecontroller.updatepassword)

router.post('/updateaddress',profilecontroller.updateaddress)
router.post('/deleteaddress',profilecontroller.deleteaddress)


router.get('/orderdetail/:id',checkcateg,profilecontroller.orderdetail)
router.post('/cancelorder',profilecontroller.cancelorder)

router.get('/wishlist',checkcateg,usercontroller.wishlist)
router.post('/wishlist/add',usercontroller.wishadd)
router.get('/wishremove/:proid',usercontroller.wishremove)

router.post('/create-order',usercontroller.razord)

router.get('/applycoupon/:code',usercontroller.applycoupon)
router.get('/removecoupon',usercontroller.removecoupon)

router.post('/walletadd',usercontroller.walletadd)

router.get('/downloadinvoice/:id',usercontroller.downloadinvoice)

router.get('/search',checkcateg,usercontroller.searchresult)

router.post('/failedpay',usercontroller.failedpay)

router.get('/logout',usercontroller.logout)

module.exports = router ; 