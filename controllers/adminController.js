import adminModel from '../models/adminModel.js'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import categoryModel from '../models/categoryModel.js'
import offerModel from '../models/offerModel.js'
import couponModel from '../models/couponModel.js'
import orderModel from '../models/orderModel.js'
import sharp from 'sharp'
import e from 'express'

export async function getAdminLogin(req, res) {
    try {
        if (req.session.admin) {
            res.redirect('/admin/')
        } else {
            res.render('admin/adminLogin')
        }
    } catch (err) {
        console.log(err);
    }
}
export async function getAdminHome(req, res) {
    try {
        if (req.session.admin) {
            const user = await userModel.find().lean()
            const order = await orderModel.find().lean()
            let revenue = 0;
            let pendingOrders = 0;
            let shippedOrders = 0;
            let deliveredOrders = 0;
            let cancelledOrders = 0;
            let cancelledProduct = []
            let orderStatus = order.filter(item => {
                if (item.orderStatus == 'delivered') {
                    deliveredOrders++
                    revenue += item.total
                }
                if (item.orderStatus == 'pending') {
                    pendingOrders++
                }
                if (item.orderStatus == 'cancelled') {
                    cancelledOrders++
                    cancelledProduct = [item.product._id, item.quantity]
                }
                if (item.orderStatus == 'shipped') {
                    shippedOrders++
                }
                return item
            })
            console.log(cancelledProduct)
            const monthlyDataArray = await orderModel.aggregate([{ $match: { orderStatus: 'delivered' } }, { $group: { _id: { $month: "$dispatch" }, sum: { $sum: "$total" } } }])
            console.log(monthlyDataArray);
            let monthlyDataObject = {}
            monthlyDataArray.map(item => {
                monthlyDataObject[item._id] = item.sum
            })
            let monthlyData = []
            for (let i = 1; i <= 12; i++) {
                monthlyData[i - 1] = monthlyDataObject[i] ?? 0
            }
            console.log(monthlyData);
            const orders = order.length
            const users = user.length
            return res.render('admin/home', {users,orders,revenue,deliveredOrders,pendingOrders,cancelledOrders,shippedOrders,monthlyData})
        }
        else {
            res.redirect('/admin/login')
        }
    } catch (err) {
        console.log(err);
    }
}
export async function adminLogin(req, res) {
    try {
        const { email, password } = req.body
        const admin = await adminModel.findOne({ email })
        if (admin) {
            if (password == admin.password) {
                req.session.admin = {
                    id: admin.email
                }
                res.redirect('/admin')
            } else {
                return res.render('admin/adminLogin', { error: true, message: 'incorrect password' })
            }
        }
        else {
            return res.render('admin/adminLogin', { error: true, message: 'admin not found' })
        }
    } catch (err) {
        console.log(err);
    }
}
//user handling
export async function displayUser(req, res) {
    try {
        const user = await userModel.find().lean()
        res.render('admin/userManagement', { user })
    } catch (err) {
        console.log(err);
    }
}
export async function userBan(req, res) {
    try {
        const _id = req.params.id
        let user = await userModel.findOne({ _id: _id }).lean()
        if (user) {
            if (user.ban) {
                await userModel.findOneAndUpdate({ _id: _id }, { $set: { ban: false } })

                res.redirect('/admin/users')
            } else {
                await userModel.findOneAndUpdate({ _id: _id }, { $set: { ban: true } })

                res.redirect('/admin/users')
            }
        }
    } catch (err) {
        console.log(err);
    }
}
//products
export async function displayProducts(req, res) {
    try {
        const product = await productModel.find().lean()
        res.render('admin/products', { product })
    } catch (err) {
        console.log(err);
    }
}
export async function getAddProduct(req, res) {
    try {

        const categories = await categoryModel.find().lean()
        console.log(category.categoryName);
        res.render('admin/addProduct', { categories })
    } catch (err) {
        console.log(err); 
    }
}
export async function monthRevenue(req, res) {
    try {
        const monthlyDataArray = await orderModel.aggregate([{ $match: { orderStatus: 'delivered' } }, { $group: { _id: { $month: "$dispatch" }, sum: { $sum: "$total" } } }])
        let monthlyDataObject = {}
        monthlyDataArray.map(item => {
            monthlyDataObject[item._id] = item.sum
        })
        let monthlyData = []
        for (let i = 1; i <= 12; i++) {
            monthlyData[i - 1] = monthlyDataObject[i] ?? 0
        }
        res.json(monthlyData)
    } catch (err) {
        console.log(err);
    }
}
//salesreport
export async function salesReport(req, res) {
    try {
        let startDate = new Date(new Date().setDate(new Date().getDate() - 8));
        let endDate = new Date();
        let filter = req.query.filter ?? "";
        if (req.query.startDate) startDate = new Date(req.query.startDate);
        if (req.query.endDate) endDate = new Date(req.query.endDate);
        const currentDate = new Date();
        startDate.setHours(0,0,0,0)
        endDate.setHours(24,0,0,0)

        console.log("date",startDate,"end",endDate);
        switch (req.query.filter) {
            case 'thisYear':
                startDate = new Date(currentDate.getFullYear(), 0, 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                break;
            case 'lastYear':
                startDate = new Date(currentDate.getFullYear() - 1, 0, 1);
                endDate = new Date(currentDate.getFullYear() - 1, 11, 31);
                break;
            case 'thisMonth':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                break;
            case 'lastMonth':
                startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                break;
            default:
                if (!req.query.filter && !req.query.startDate) filter = "lastWeek";
            }
        let salesCount = 0;
        let deliveredOrders
        let salesSum = 0
        let result
        if (req.query.startDate || req.query.endDate || req.query.filter) {
            if (req.query.startDate) {
                startDate = new Date(startDate);
            }
            if (req.query.endDate) {
                endDate = new Date(endDate);
            }
            if (req.query.filter) {
                filter = req.query.filter;
            }
            const query = {};
            query.dispatch = { $gte: startDate, $lte: endDate };
            const orders = await orderModel.find(query).sort({ date: -1 }).lean();
            salesCount = orders.length;
            deliveredOrders = orders.filter(item => item.orderStatus === "delivered");
            deliveredOrders.forEach((item) =>{
                salesSum = item.total+salesSum
                console.log(item)
            });
            console.log(salesSum);
        }
        else {
            console.log("else case");
            deliveredOrders = await orderModel.find({ orderStatus: "delivered" }).lean();
         
            deliveredOrders = deliveredOrders.map((order) => {
                order.date = new Date(order.date).toLocaleString();
                return order;
            });
            salesCount=await orderModel.countDocuments({ 'orderStatus': 'delivered' });
            result=await orderModel.aggregate([
                {
                    $match: { 'orderStatus': 'delivered' }
                },
                {
                    $unwind: "$orderStatus"
                },
                {
                    $match: { 'orderStatus': 'delivered' }
                },
                {
                    $group: { _id: null, totalPrice: { $sum: '$total' } }
                }
            ]);
            salesSum = result[0]?.totalPrice ?? 0
        }
        const users = await orderModel.distinct('address.name')
        const userCount = users.length
        for (const i of deliveredOrders) {
            i.dispatch = new Date(i.dispatch).toLocaleDateString()
        }
        console.log(salesSum)
        console.log(startDate,endDate,'sdfghjksdfghj');
        res.render("admin/salesReport", { userCount, salesCount, salesSum, deliveredOrders })
    } catch (error) {
        console.log(error)
        res.status(404)
        throw new Error("cant get")
    }
}
export async function addProducts(req, res) {
    try {
        const { productName, productPrice, category, mrp, description, quantity } = req.body;
        // const categories=await categoryModel.find({list:false}).lean()
        if (productName == '' || productPrice == '' || category == '' || mrp == '' || description == '' || quantity == '') {
            return res.render('admin/addProduct', { error: true, message: 'please fill all the fields' })

        } else {
            if (req.files?.mainImage && req.files?.sideImages) {
                if (mrp >= productPrice &&mrp>0) {
                    if(quantity>0){
                        const mainImage = req.files.mainImage[0];
                        const sideImages = req.files.sideImages;
                        await sharp(mainImage.path) // read the image file
                        .png() // convert to PNG format
                        .resize(300, 300, { // resize to 300x300 with nearest neighbor interpolation
                            kernel: sharp.kernel.nearest,
                            fit: 'contain',
                            position: 'center',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .toFile(mainImage.path + ".png"); // save the resized image as PNG
                        mainImage.filename = mainImage.filename + ".png"; // update the filename with the new extension
                        mainImage.path = mainImage.path + ".png"; // update the path with the new extension
                        const product = new productModel({
                            productName,
                            productPrice,
                            category,
                            mrp,
                            description,
                            quantity,
                            mainImage,
                            sideImages,
                        });
                        await product.save();
                        res.redirect('/admin/products');
                    }else{
                        return res.render('admin/addProduct',{ error: true, message: 'quantity must be greater than zero' })
                    }
                } else {
                    return res.render('admin/addProduct',{ error: true, message: 'price must be lower than mrp' })
                }
            } else {
                return res.render('admin/addProduct',{ error: true, message: 'please add the images' })
            }
        }
    } catch (err) {
        console.log('error',err);
    }
}
export async function getEditProduct(req, res) {
    try {
        let product = await productModel.findOne({ _id: req.params.id }).lean()
        res.render('admin/editProduct', { product })
    } catch (err) {
        console.log(err);
    }
}
export async function editProduct(req, res) {
    try {
        const _id = req.params.id
        const { productName, productPrice, category, description, quantity, mrp } = req.body
        if (productName == '' || productPrice == '' || category == '' || mrp == '' || description == '' || quantity == ''){
            return res.render('admin/editProduct', { error: true, message: 'please fill all the fields' })
        }else{
            if (mrp>0){
                if(mrp>=productPrice){
                    if(quantity>0){

                        if (req.files?.mainImage && req.files?.sideImages) {
                            await productModel.updateOne({ _id: _id }, {
                                $set: {
                                    productName: productName,
                                    productPrice: productPrice,
                                    mrp: mrp,
                                    category: category,
                                    description: description,
                                    quantity: quantity,
                                    mainImage: req.files.mainImage[0],
                                    sideImages: req.files.sideImages
                                }
                            })
                            res.redirect('/admin/products')
                        }
                        if (!req.files?.mainImage && req.files.sideImages) {
                            await productModel.updateOne({ _id: _id }, {
                                $set: {
                                    productName: productName,
                                    productPrice: productPrice,
                                    mrp: mrp,
                                    category: category,
                                    description: description,
                                    quantity: quantity,
                                    sideImages: req.files.sideImages
                                }
                            })
                            res.redirect('/admin/products')
                        }
                        if (req.files?.mainImage && !req.files.sideImages) {
                            await productModel.updateOne({ _id: _id }, {
                                $set: {
                                    productName: productName,
                                    productPrice: productPrice,
                                    mrp: mrp,
                                    category: category,
                                    description: description,
                                    quantity: quantity,
                                    mainImage: req.files.mainImage[0]
                                }
                            })
                            res.redirect('/admin/products')
                        }
                        if (!req.files?.mainImage && !req.files.sideImages) {
                            await productModel.updateOne({ _id: _id }, {
                                $set: {
                                    productName: productName,
                                    productPrice: productPrice,
                                    mrp: mrp,
                                    category: category,
                                    description: description,
                                    quantity: quantity,
                                }
                            })
                            res.redirect('/admin/products')
                        }

                    }else{
                        return res.render('admin/editProduct', { error: true, message: 'quantity must be greater than zero' })

                    }

                }else{
                    return res.render('admin/editProduct', { error: true, message: 'mrp must be greater than offer price' })

                }

            }else{
                return res.render('admin/editProduct', { error: true, message: 'mrp must be greater than zero' })
 
            }
        }

       
    } catch (err) {
        console.log(err);
    }
}
export async function listProduct(req, res) {
    try {
        const _id = req.params.id
        const product = await productModel.findById({ _id })
        if (!product.list) {
            const newProduct = await productModel.findOneAndUpdate({ _id }, { $set: { list: true } })
            res.redirect('/admin/products')
        } else {
            const newProduct = await productModel.findOneAndUpdate({ _id }, { $set: { list: false } })
            res.redirect('/admin/products')
        }
    } catch (err) {
        console.log(err);
    }
}
//category
export async function getAddCategory(req, res) {
    try {
        res.render('admin/addCategory')
    } catch (err) {
        console.log(err);
    }
}
export async function addCategory(req, res) {
    try {
        const { categoryName } = req.body
        const category = await categoryModel.findOne({ categoryName });
        if (category) {
            return res.render('admin/addCategory', { error: true, message: 'category already exists' })
        } else {
            if(categoryName==''){
                return res.render('admin/addCategory', { error: true, message: 'please enter category name' })
            }else{
                const categories = new categoryModel({ categoryName })
                await categories.save()
                console.log(categories)
                res.redirect('/admin/showCategories')
            }

        }
    } catch (err) {
        console.log(err);
    }
}
export async function showCategory(req, res) {
    try {
        const categories = await categoryModel.find().lean()
        res.render('admin/categories', { categories })
    } catch (err) {
        console.log(err);
    }
}
export async function getEditcategory(req, res) {
    try {
        const category = await categoryModel.findOne({ _id: req.params.id }).lean()
        res.render('admin/editCategory', { category })
    } catch (err) {
        console.log(err);
    }
}
export async function editCategory(req, res) {
    try {
        const _id = req.params.id
        const { categoryName } = req.body
        if(categoryName==''){
            return res.render('admin/addCategory', { error: true, message: 'please enter category name' })
        }else{
            const category = await categoryModel.findOneAndUpdate({ _id }, { $set: { categoryName } }).lean()
            res.redirect('/admin/showCategories')
        }
    } catch (err) {
        console.log(err);
    }
}
export async function listCategory(req, res) {
    try {
        const _id = req.params.id
        let category = await categoryModel.findOne({ _id })
        if (category.list) {
            category = await categoryModel.findByIdAndUpdate(_id, { $set: { list: false } })
            return res.redirect('/admin/showCategories')
        } else {
            category = await categoryModel.findByIdAndUpdate(_id, { list: true })
            return res.redirect('/admin/showCategories')
        }
    } catch (err) {
        console.log(err);
    }
}
//coupon
export async function getAddCoupon(req, res) {
    try {
        res.render('admin/addCoupon')
    } catch (err) {
        console.log(err);
    }
}
export async function addCoupon(req, res) {
    try {
        const { name, code, minAmount, cashback, expiry } = req.body
        if (name == "" || code == "" || minAmount == "" || cashback == "" || expiry == "") {
          return  res.render('admin/addCoupon',{error:true, message:'enter all fields'})
        } else {
            const cpn=await couponModel.findOne({name})
            if(cpn){
                return res.render('admin/addCoupon',{error:true, message:'coupon already exists'})
            }else{
                if(cashback>minAmount){
                    return res.render('admin/addCoupon',{error:true,message:'cashback must be lower than Amount'})
                }else{
                    if(cashback>0&&minAmount>0){
                        const coupon = await new couponModel({ name, code, minAmount, cashback, expiry })
                        coupon.save((err, data) => {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                res.redirect('/admin/showCoupon')
                            }
                        })
                    }else{
                        return  res.render('admin/addCoupon',{error:true, message:'cannot add negative numbers'})
                    }

                }

            }
        }
    } catch (err) {
        console.log(err);
    }
}
// export async function showCoupon(req, res) {
//     try {
//         const coupons = await couponModel.find().lean()
//         const coupon = coupons.map(item => {
//             return { ...item, expiry: item.expiry.toLocaleDateString() }
//         })
//         res.render('admin/coupon', { coupon })
//     } catch (err) {
//         console.log(err);
//     }
// }
export async function showCoupon(req, res) {
    try {
      const coupons = await couponModel.find().lean()
      const coupon = coupons.map(item => {
        if (item.expiry instanceof Date && !isNaN(item.expiry)) {
          return { ...item, expiry: item.expiry.toLocaleDateString() }
        } else {
          return item
        }
      })
      res.render('admin/coupon', { coupon })
    } catch (err) {
      console.log(err)
    }
  }
  
export async function getEditCoupon(req, res) {
    try {
        const coupon = await couponModel.findOne({ _id: req.params.id }).lean()
        const expiry = coupon.expiry.toISOString().slice(0,10); //formatting expir date YYYY-MM-DD
        res.render('admin/editCoupon', { coupon,expiry })
    } catch (err) {
        console.log(err);
    }
}
export async function editCoupon(req, res) {
    try {
        const _id = req.params.id
        const { name, code, minAmount, cashback, expiry } = req.body
        if (name == "" || code == "" || minAmount == "" || cashback == "" || expiry == "") {
            res.render('admin/editCoupon',{ error: true, message: "enter all fields" })
        }
        else {
            await couponModel.updateOne({ _id }, {
                $set: {
                    name, code, minAmount, cashback, expiry
                }
            })
            res.redirect('/admin/showCoupon')
        }
    } catch (err) {
        console.log(err);
    }
}
export async function listCoupon(req, res) {
    try {
        const _id = req.params.id
        const coupons = await couponModel.findOne({ _id })
        if (coupons) {
            if (coupons.unlist) {
                await couponModel.findOneAndUpdate({ _id }, { $set: { unlist: false } })
                res.redirect('/admin/showCoupon')
            } else {
                await couponModel.findOneAndUpdate({ _id }, { $set: { unlist: true } })
                res.redirect('/admin/showCoupon')
            }
        }
    } catch (err) {
        console.log(err);
    }
}
//offer
export async function getAddOffer(req, res) {
    try {
        res.render('admin/addOffer')
    } catch (err) {
        console.log(err);
    }
}
export async function addOffer(req, res) {
    try {
        const { name, url } = req.body;
        const banner=await offerModel.findOne({name})
        const image = req.file;
        if (image == "" || name == "" || url == "") {
           return res.render('admin/addOffer',{error:true,message:'please fill all details'})
        } else {
            if(banner){
                return res.render('admin/addOffer',{error:true,message:'banner is already created'})
            }else{
                await offerModel.create({ name, url, image })
                res.redirect('/admin/getOfferPage')
            }
        }
    } catch (err) {
        res.render('admin/addOffer')
    }
}
export async function getOfferPage(req, res) {
    try {
        const offers = await offerModel.find().lean()
        res.render('admin/offer', { offers })
    } catch (err) {
        res.render('admin/offer', { error: true, message: err })
    }
}
export async function getEditOffer(req, res) {
    try {
        const offer = await offerModel.findOne({ _id: req.params.id }).lean()
        res.render('admin/editOffer', { offer })
    } catch (err) {
        console.log(err);
    }
}
export async function editOffer(req, res) {
    try {
        const offer = await offerModel.findOne({ _id: req.params.id }).lean()
        const { name, url } = req.body
        const image = req.file
        if (req.file) {
            await offerModel.updateOne({ _id: req.params.id }, { $set: { name, url, image } })
        } else {
            await offerModel.updateOne({ _id: req.params.id }, { $set: { name, url } })
        }
        res.redirect('/admin/getOfferPage')
    } catch (err) {
        console.log(err);
    }
}
export async function listOffer(req, res) {
    try {
        const _id = req.params.id
        const offer = await offerModel.findOne({ _id })
        if (offer) {
            if (offer.list) {
                await offerModel.findOneAndUpdate({ _id }, { $set: { list: false } })
                res.redirect('/admin/getOfferPage')
            } else {
                await offerModel.findOneAndUpdate({ _id }, { $set: { list: true } })
                res.redirect('/admin/getOfferPage')
            }
        }
    } catch (err) {
        console.log(err);
    }
}
//orders
export async function showOrders(req, res) {
    try {
        const orders = await orderModel.find().lean()
        res.render('admin/orderManagement', { orders })
    } catch (err) {
        console.log(err);
    }
}
export async function getViewOrder(req, res) {
    try {
        const order = await orderModel.findOne({ _id: req.params.id }).lean()
        res.render('admin/viewOrder', { order })
    } catch (err) {
        console.log(err);
    }
}
export async function adminLogout(req, res) {
    try {
        req.session.admin = null
        res.redirect('/admin/login')
    } catch (err) {
        console.log(err);
    }
}
export async function updateOrder(req, res) {
    try {
        const { id, status } = req.query;
        await orderModel.findByIdAndUpdate(id, {
            $set: {
                orderStatus: status
            }
        })
        res.redirect("/admin/orders")
    } catch (err) {
        console.log(err);
    }
}
export async function search(req, res) {
    try {
        const product = await productModel.find({ productName: new RegExp(req.body.key, "i") }).lean()
        res.redirect('/admin/products')
    } catch (err) {
        console.log(err);
    }
} 