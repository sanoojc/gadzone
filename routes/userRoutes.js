import express  from 'express'
import verifyLogin from '../middleware/verifyLogin.js'
import { userSignup,userLogin, addAdress, addToCart, addToWishlist, getWishlist, getCart, getHome, userProfile, editProfile, removeFromWhishlist, showWhishlist, removeFromCart, checkout, loginPage, signupPage, logout, resetPassword, enterOtp, resetPass, addCartQuantity, minusCartQuantity, viewProduct, orderPlaced, postCheckout, editAddress, myOrders, getUserPayment, shopPage, getAddAddress, getEditAddress, deleteAddress, viewOrder, productCategory, cancelOrder, applyCoupon, getResetPassword, getSetPassword, getEnterOtp} from '../controllers/userController.js'
// import userModel from '../models/userModel.js'
const router=express.Router()


router.get('/',getHome)
router.get('/logout',logout)
router.get('/enterOtp',getEnterOtp)
router.get('/signup',signupPage)
// router.get('/checkout',getCheckout)
router.get('/viewProduct',viewProduct)
router.get('/cart',verifyLogin, getCart)
router.get('/login',loginPage)
router.get('/forgotPassword',resetPassword)
router.get('/checkout',verifyLogin,checkout)
router.get('/wishlist',verifyLogin, getWishlist)
router.get('/addCartQuantity/:id',addCartQuantity)
router.get("/addToCart/:id",verifyLogin, addToCart)
router.get('/userProfile/',verifyLogin,userProfile)
router.get('/minusCartQuantity/:id',minusCartQuantity)
router.get('/showWhishlist',verifyLogin,showWhishlist)
router.get("/addToWishlist/:id",verifyLogin, addToWishlist)
router.get('/removeFromCart/:id',verifyLogin,removeFromCart)
router.get('/removeFromWhishlist/:id',verifyLogin,removeFromWhishlist)
router.get('/orderPlaced',orderPlaced)
router.get('/orders',verifyLogin,myOrders)
router.get ('/verifyPayment',getUserPayment)
router.get('/shop',verifyLogin,shopPage)
router.get('/addAddress',getAddAddress)
router.get('/editAddress/:id',getEditAddress)
router.get('/deleteAddress/:id',deleteAddress)
router.get('/viewOrder/:id',viewOrder)
router.get('/showCategoryProd/:id',productCategory)  
router.get('/cancelOrder/:id',cancelOrder)
router.get ('/applyCoupon/:coupon/:purchaseAmount',applyCoupon)
router.get('/resetPassword',getResetPassword)
router.get('/setPassword',getSetPassword)


router.post('/login',userLogin)
router.post('/signup',userSignup)
router.post('/addAddress',addAdress)
router.post('/resetPassword',resetPassword)
router.post('/editUser',verifyLogin,editProfile)
router.post('/checkout', postCheckout)
router.post('/editAddress/:id', editAddress)
router.post('/setPassword',resetPass)
router.post('/enterOtp',enterOtp)



export default router