import adminModel from '../models/adminModel.js'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import categoryModel from '../models/categoryModel.js'
import offerModel from '../models/offerModel.js'
import couponModel from '../models/couponModel.js'
import orderModel from '../models/orderModel.js'
import sharp from 'sharp'

export async function getAdminLogin(req, res) {
    if (req.session.admin) {
        res.redirect('/admin/')
    } else {
        res.render('admin/adminLogin')
    }
}
export async function getAdminHome(req, res) {

    if (req.session.admin) {
        const user=await userModel.find().lean()
        const order=await orderModel.find().lean()
        let revenue=0;
        let pendingOrders=0;
        let shippedOrders=0;
        let deliveredOrders=0;
        let cancelledOrders=0;


         let orderStatus=order.filter(item=>{
            if(item.orderStatus=='delivered'){
                deliveredOrders++
                revenue+=item.total
            }
            if(item.orderStatus=='pending'){
                pendingOrders++
            }
            if(item.orderStatus=='cancelled'){
                cancelledOrders++
            }
            
            if(item.orderStatus=='shipped'){
                shippedOrders++
            }
            return item
        })
        const monthlyDataArray= await orderModel.aggregate([{$match:{orderStatus:'delivered'}},{$group:{_id:{$month:"$dispatch"}, sum:{$sum:"$total"}}}])
        console.log(monthlyDataArray);
        let monthlyDataObject={}
        monthlyDataArray.map(item=>{
         monthlyDataObject[item._id]=item.sum
     })
     let monthlyData=[]
     for(let i=1; i<=12; i++){
         monthlyData[i-1]= monthlyDataObject[i] ?? 0
       }
       console.log(monthlyData);
        const orders=order.length
        const users=user.length  
        return res.render('admin/home',{users,orders,revenue,deliveredOrders,pendingOrders,cancelledOrders,shippedOrders,monthlyData})
    }
    else {
        res.redirect('/admin/login')
    }
}
export async function adminLogin(req, res) {
    const { email, password } = req.body
    const admin = await adminModel.findOne({ email })
    if (admin) {
        if (password == admin.password) {
            req.session.admin = {
                id: admin.email
            }
            res.redirect('/admin')
        } else {
            res.redirect('/admin')
        }
    }
    else {
        res.redirect('/admin')
    }
}
//user handling
export async function displayUser(req, res) {
    const user = await userModel.find().lean()
    res.render('admin/userManagement', { user })
}
export async function userBan(req, res) {
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
}
export async function editUser(req, res) {
    const _id = req.params.id
    console.log(_id)
    const { email, name, password } = req.body
    const user = await userModel.findOneAndUpdate({ _id }, { $set: { email: email, name: name, password: password } })
    console.log(user)
    res.json({ user, nm: "kaa" })
}
//products
export async function displayProducts(req, res) {
    const product = await productModel.find().lean()
    res.render('admin/products', { product })
}
export async function getAddProduct(req, res) {
    const category = await categoryModel.find().lean()
    console.log(category);
    res.render('admin/addProduct', { category })
}
export async function monthRevenue(req,res){
    const monthlyDataArray= await orderModel.aggregate([{$match:{orderStatus:'delivered'}},{$group:{_id:{$month:"$dispatch"}, sum:{$sum:"$total"}}}])
    let monthlyDataObject={}
    monthlyDataArray.map(item=>{
     monthlyDataObject[item._id]=item.sum
 })
 let monthlyData=[]
 for(let i=1; i<=12; i++){
     monthlyData[i-1]= monthlyDataObject[i] ?? 0
   }
     res.json( monthlyData)
}
//salesreport

export async function salesReport(req, res){

    console.log("dfaf", req.query.filter);
    try {
      let startDate = new Date(new Date().setDate(new Date().getDate() - 8));
      let endDate = new Date();
      let filter = req.query.filter ?? "";
  
      if (req.query.startDate) startDate = new Date(req.query.startDate);
      if (req.query.endDate) endDate = new Date(req.query.endDate);
  
      const currentDate = new Date();
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
  
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(24, 0, 0, 0);
  
  
      let salesCount = 0;
  
  
      let deliveredOrders
      let salesSum
      let result
      if (req.query.startDate || req.query.endDate || req.query.filter) {
        console.log("inside query");
  
        let startDate, endDate, filter;
        if (req.query.startDate) {
          startDate = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          endDate = new Date(req.query.endDate);
        }
        if (req.query.filter) {
          filter = req.query.filter;
        }
  
        const query = {};
        if (startDate && endDate) {
          query.date = { $gte: startDate, $lte: endDate };
        }
        if (filter) {
          query.filter = filter;
        }
  
        const orders = await orderModel.find(query).sort({ date: -1 }).lean();
        console.log("orders", orders);
        salesCount = orders.length;
  
        deliveredOrders = orders.filter(order => order.orderItems.some(item => item.status === "Delivered"));
        console.log("delivered", deliveredOrders);
        salesSum = deliveredOrders.reduce((acc, order) => acc + order.totalPrice, 0);
      }
      else {
        console.log("else case");
        deliveredOrders = await orderModel.find({ 'orderItems.status': "Delivered" }).populate("orderItems").lean();
        deliveredOrders = deliveredOrders.map((order) => {
          order.date = new Date(order.date).toLocaleString();
          return order;
        });
        console.log(deliveredOrders);
        
  
        salesCount = await orderModel.countDocuments({ 'orderItems.status': 'Delivered' });
  
  
  
        result = await orderModel.aggregate([
          {
            $match: { 'orderItems.status': 'Delivered' }
          },
          {
            $unwind: "$orderItems" // unwind the orderItems array
          },
          {
            $match: { 'orderItems.status': 'Delivered' }
          },
          {
            $group: { _id: null, totalPrice: { $sum: '$orderItems.price' } }
          }
        ]);
  
  
        console.log("result", result);
  
        salesSum = result[0]?.totalPrice
        console.log("salessum",deliveredOrders );
      }
      const users = await orderModel.distinct('user')
      const userCount = users.length
      res.render("admin/salesReport", { userCount, salesCount, salesSum, deliveredOrders })
  
    } catch (error) {
      console.log(error);
      res.status(404)
      throw new Error("cant get")
    }
  }

export async function addProducts(req, res) {
    const { productName, productPrice, category, mrp, description, quantity } = req.body;
    // handle the mainImage file
    const mainImage = req.files.mainImage[0];
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
    // handle the sideImages files
    const sideImages = req.files.sideImages;
    // create a new product document with the processed files
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
    await product.save(); // save the new product to the database
    res.redirect('/admin/products'); // redirect to the product list page
}
export async function getEditProduct(req, res) {
    console.log(req.params.id);
    let product = await productModel.findOne({ _id: req.params.id }).lean()
    res.render('admin/editProduct', { product })
}
export async function editProduct(req, res) {
    const _id = req.params.id
    const { productName, productPrice, category, description, quantity, mrp } = req.body
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
    if(!req.files?.mainImage&&req.files.sideImages){
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
    if(req.files?.mainImage&&!req.files.sideImages){
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
    if(!req.files?.mainImage&&!req.files.sideImages){
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
}
export async function listProduct(req, res) {
    const _id = req.params.id
    const product = await productModel.findById({ _id })
    if (!product.list) {
        const newProduct = await productModel.findOneAndUpdate({ _id }, { $set: { list: true } })
        res.redirect('/admin/products')
    } else {
        const newProduct = await productModel.findOneAndUpdate({ _id }, { $set: { list: false } })
        res.redirect('/admin/products')
    }
}
//category
export async function getAddCategory(req,res){
    res.render('admin/addCategory')
}
export async function addCategory(req, res) {
    const { categoryName } = req.body
    const category = await categoryModel.findOne({ categoryName });
    if (category) {
        return res.render('admin/addCoupon', { error: true, message: 'category already exists' })
    }else{

        const categories = new categoryModel({ categoryName })
        await categories.save()
        console.log(categories)
        res.redirect('/admin/showCategories')
   }
}
export async function showCategory(req, res) {
    const categories = await categoryModel.find().lean()
    res.render('admin/categories', { categories })
}
export async function getEditcategory(req,res){
    const category=await categoryModel.findOne({_id:req.params.id}).lean()
    res.render('admin/editCategory',{category})
}
export async function editCategory(req, res) {
    const _id = req.params.id
    const { categoryName } = req.body
    const category = await categoryModel.findOneAndUpdate({ _id }, { $set: { categoryName } }).lean()
    res.redirect('/admin/showCategories')
}
export async function listCategory(req, res) {
    const _id = req.params.id
    let category = await categoryModel.findOne({ _id })
    if (category.list) {
        category = await categoryModel.findByIdAndUpdate(_id, { $set: { list: false } })
        return res.redirect('/admin/showCategories')
    } else {
        category = await categoryModel.findByIdAndUpdate(_id, { list: true })
        return res.redirect('/admin/showCategories')
    }
}
//coupon
export async function getAddCoupon(req,res){
    res.render('admin/addCoupon')
}
export async function addCoupon(req, res) {
    const { name, code, minAmount, cashback, expiry } = req.body
    if (name == "" || code == "" || minAmount == "" || cashback == "" || expiry == "") {
        res.redirect('/admin/addCoupon')
    }else{
        const coupon = await new couponModel({ name, code, minAmount, cashback, expiry })
        coupon.save((err, data) => {
            if (err) {
                console.log(err)
            }
            else {
                res.redirect('/admin/showCoupon')
            }
        })
    }
}
export async function showCoupon(req, res) {
    const coupons = await couponModel.find().lean()
    const coupon = coupons.map(item => {
        return { ...item, expiry: item.expiry.toLocaleDateString() }
    })  
    res.render('admin/coupon', {coupon})
}
export async function getEditCoupon(req,res){
    const coupon =await couponModel.findOne({_id:req.params.id}).lean()

    res.render('admin/editCoupon',{coupon})
}
export async function editCoupon(req, res) {
    const _id = req.params.id
    const { name, code, minAmount, cashback, expiry } = req.body
    if (name == "" || code == "" || minAmount == "" || cashback == "" || expiry == "") {
        res.json({ error: true, message: "enter all fields" })
    }
    else {
        await couponModel.updateOne({ _id }, {
            $set: {
                name, code, minAmount, cashback, expiry
            }
        })
        res.redirect('/admin/showCoupon')
    }
}
export async function listCoupon(req, res) {
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
}
//offer
export async function getAddOffer(req,res){
    res.render('admin/addOffer')
}
export async function addOffer(req, res) {
    try {
        const { name, url } = req.body;
        const image = req.file;
        console.log(req.file)
        if(image==""||name==""||url==""){
            res.redirect('/admin/addOffer')
        }else{
            await offerModel.create({ name, url, image })
            res.redirect('/admin/getOfferPage')
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
    const offer=await offerModel.findOne({_id:req.params.id}).lean()
    res.render('admin/editOffer',{offer})
}
export async function editOffer(req, res) {
    const offer = await offerModel.findOne({ _id: req.params.id }).lean()
    const { name, url } = req.body
    const image = req.file
    if(req.file){
        await offerModel.updateOne({ _id: req.params.id }, { $set: { name, url, image} })
    }else{
        await offerModel.updateOne({ _id: req.params.id }, { $set: { name, url} })
    }
    res.redirect('/admin/getOfferPage')
}
export async function listOffer(req, res) {
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
}
//orders
export async function showOrders(req, res) {
    const orders = await orderModel.find().lean()
    res.render('admin/orderManagement', { orders })
}
export async function getViewOrder(req, res) {
    const order=await orderModel.findOne({_id:req.params.id}).lean()
    res.render('admin/viewOrder',{order})
}
export async function adminLogout(req, res) {
    req.session.admin = null
    res.redirect('/admin/login')
}
export async function updateOrder(req,res){
    const {id, status}=req.query;
    await orderModel.findByIdAndUpdate(id, {
        $set:{
            orderStatus:status
        }
    })
    res.redirect("/admin/orders")
}