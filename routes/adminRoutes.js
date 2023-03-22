import express from 'express'
import multer from 'multer'
import verifyAdmin from '../middleware/verifyAdmin.js'
import { addProducts, adminLogin, listProduct, editProduct, userBan,displayUser, displayProducts, editUser, addCategory, editCategory, listCategory, showCategory, addOffer, getOfferPage, adminLogout, getAdminLogin, addCoupon, editCoupon, showCoupon, listCoupon, getAddProduct, getAdminHome, getEditProduct, showOrders, getEditOffer, editOffer, getEditcategory, getAddCategory, getViewOrder, updateOrder, monthRevenue, getSalesReport, getAddCoupon, getEditCoupon, getAddOffer, listOffer } from '../controllers/adminController.js'

const router=express.Router()

const Storage=multer.diskStorage({
    destination:"public/uploads",
    filename:(req,file,cb)=>{
         cb(null,new Date()+file.originalname)
    }
})
const upload=multer({
    storage:Storage
})


router.get('/', getAdminHome)
router.get('/login',getAdminLogin)
router.post('/login', adminLogin)
router.get('/logout',adminLogout)

router.use(verifyAdmin)




router.get('/users',displayUser)
router.get('/products',displayProducts)
router.get('/listProduct/:id',listProduct)
router.get('/addProducts',getAddProduct)
router.get('/editProduct/:id',getEditProduct)
router.get('/editCategory/:id', getEditcategory)
router.get('/listCategory/:id',listCategory)
router.get('/showCategories',showCategory)
router.get('/getOfferPAge',verifyAdmin, getOfferPage)
router.get('/editOffer/:id',getEditOffer)
// router.get('/userControl',verifyAdmin,getUserBan)
// router.get('/adminHome',verifyAdmin, adminHome)
router.get('/showCoupon', showCoupon)
router.get('/editCoupon/:id',getEditCoupon)
router.get('/listCoupon/:id',listCoupon)
router.get('/orders',showOrders)
router.get('/addCategory',getAddCategory)
router.get('/viewOrder/:id',getViewOrder)
router.get('/update-order', updateOrder)   
router.get('/salesReport',getSalesReport)
router.get('/addCoupon',getAddCoupon)
router.get('/monthRevenue',monthRevenue)
router.get('/addOffer',getAddOffer)
router.get('/listOffer/:id',listOffer)
router.get('/userControl/:id',userBan)

router.post('/editUser/:id',editUser)
router.post('/addCategory', addCategory)
router.post('/editCategory/:id',editCategory)
router.post('/addProducts', upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'sideImages', maxCount: 12 }]), addProducts)
router.post('/editproduct/:id',upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'sideImages', maxCount: 12 }]),editProduct)
router.post('/addCoupon',addCoupon) 
router.post('/editCoupon/:id',editCoupon) 
router.post('/editOffer/:id',upload.single('image'),editOffer)
router.post('/addOffer',upload.single('image'),addOffer)

export default router