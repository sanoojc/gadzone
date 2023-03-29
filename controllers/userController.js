
import { application } from 'express'
import offerModel from '../models/offerModel.js'
import productModel from '../models/productModel.js'
import userModel from '../models/userModel.js'
import categoryModel from '../models/categoryModel.js'
import sentOTP from '../otp.js'
import orderModel from '../models/orderModel.js'
import couponModel from '../models/couponModel.js'
import createId from '../helpers/createId.js'
import axios from 'axios'
import uniqid from 'uniqid'

export function loginPage(req, res) {
    try{
        if (req.session.user) {
            res.redirect('/')
        } else {
    
            res.render('user/userLogin')
        }
    }catch(err){
        console.log(err)
    }
}

export function signupPage(req, res) {
    try{
        if (req.session.user) {
            res.redirect('/')
        } else {
    
            res.render('user/userSignup')
        }
    }catch(err){
        console.log(err)
    }
}

export async function userLogin(req, res) {
    try{

        if (req.session?.user?.id) {
            res.redirect('/')
        }
        const { email, password } = req.body
        const user = await userModel.findOne({ email })
        if (user) {
            if (user.ban) {
                res.render('user/userLogin', {
                    error: true,
                    message: 'you have been blocked by admin'
                })
            }
            else {
                if (user.password == password) {
                    req.session.user = {
                        id: user._id
                    }
                    res.redirect('/')
                } else {
                    res.render('user/userLogin', {
                        error: true,
                        message: 'incorrect password'
                    })
                }
            }
        }
        else {
            return res.render('user/userLogin', {
                error: true,
                message: 'user not found'
            })
        }
    }catch(err){
        console.log(err)
    }
}

export async function userSignup(req, res) {
    try{

        const { email, name, password, confPassword } = req.body
        let user = await userModel.findOne({ email })
        if (user) {
            return res.render('user/userSignup', { error: true, message: 'user alreday exist' })
        } else {
            if (email == '' || name == '' || password == '' || confPassword == '') {
                return res.render('user/userSignup', { error: true, message: 'please fill all fields' })
            }
            if (password == confPassword) {
                let user = new userModel({ email, name, password })
                user.save()
                res.redirect('/login')
            }
            else {
                return res.render('user/userSignup', { error: true, message: 'incorrect password' })
            }
        }
    }catch(err){
        console.log(err)
    }
}

export async function userLogout(req, res) {
    try{
        req.session.user = null
    }catch(err){
        console.log(err)
    }
}

export async function getHome(req, res) {
    try{

        // const products = await productModel.find({ list: false }).lean()
         const category = await categoryModel.find({ list: false }).lean()
         const offers = await offerModel.find().lean();
         
         req.session.pageNum = parseInt(req.query.page ?? 1);
         req.session.perpage = 6; 
         let docCount;
         const products = await productModel
         .find()
         .countDocuments()
         .then((documentCount) => {
              docCount = documentCount;
               return productModel
                 .find( {list:false})
                 .skip((req.session.pageNum - 1) * req.session.perpage)
                 .limit(req.session.perpage)
                 .lean();
             });
           let pageCount = Math.ceil(docCount / req.session.perpage);
           let pagination = [];
           for (let i = 1; i <= pageCount; i++) {
             pagination.push(i);
           }
         if (req.session?.user?.id) {
             res.render('user/userLandingPage', { category, products, offers ,pagination})
         }
         else {
             let category = await categoryModel.find().lean()
             res.render('user/landingPage', { category, products, offers ,pagination})
         }
    }catch(err){
        console.log(err)
    }
}

export async function viewProduct(req, res) {
    try{

        const _id = req.query.id
        const product = await productModel.findOne({ _id }).lean()
    
        res.render('user/product', { product })
    }catch(err){
        console.log(err)
    }
}

export async function getAddAddress(req, res) {
    try{

        const adress = await userModel.findOne({ adress: 1 }).lean()
        res.render('user/addAdress', { adress })
    }catch(err){
        console.log(err)
    }
}


export async function addAdress(req, res) {
    try{
        const _id = req.session?.user?.id;
        if (req.session?.user?.id) {
            await userModel.updateOne({ _id }, {
                $push: {
                    adress: {
                        ...req.body,
                        id: uniqid()
                    }
                }
            })
            res.redirect('/userProfile')
        }
    }catch(err){
        console.log(err)
    }
}

export async function getEditAddress(req, res) {
    try {
        const id = req.params.id
        let { adress } = await userModel.findOne({ "adress.id": req.params.id }, { _id: 0, adress: { $elemMatch: { id: req.params.id } } }).lean()
        // let { address } = await userModel.findOne({ 'adress.id': id }, { _id: 0, address: { $elemMatch: { id } } })
        res.render('user/editAdress', { adress: adress[0] })
    } catch (err) {
        console.log(err)
    }
}

export async function editAddress(req, res) {
    try{

        await userModel.updateOne(
            { _id: req.session.user.id, adress: { $elemMatch: { id: req.params.id } } },
            {
                $set: {
                    "adress.$": req.body,
                },
            }
        );
        res.redirect("/userProfile",);
    }catch(err){
        console.log(err)
    }
}

export async function deleteAddress(req, res) {
    try{
        await userModel.updateOne({ _id: req.session.user.id, adress: { $elemMatch: { id: req.params.id } } }, {
            $pull: { adress: { id: req.params.id } }
        })
        res.redirect('/userProfile')
    }catch(err){
        console.log(err)
    }
}

export async function getCart(req, res) {
    try {
        const { cart } = await userModel.findOne({ _id: req.session.user.id }, { cart: 1 })
        let cartQuantity = {}
        const cartItems = cart.map(item => {
            cartQuantity[item.productId] = item.quantiy
            return item.productId
        })
        const product = await productModel.find({ _id: { $in: cartItems } }).lean()
        let totalAmount = 0
        let total = product.map((item, index) => {
            product[index].cartQuantity = cartQuantity[item._id]
            product[index].totalPrice = cartQuantity[item._id] * item.productPrice
            totalAmount += item.productPrice * cartQuantity[item._id]
            return item.productPrice
        })
        res.render('user/cart', { product, totalAmount })
    } catch (err) {

    }
}

export async function addToCart(req, res) {
    try{

        const _id = req.params.id;
        await userModel.updateOne({ _id: req.session.user.id }, {
            $addToSet: {
                cart: {
                    productId: _id,
                    quantiy: 1
                }
            }
        })
        res.redirect('/cart')
    }catch (err) {
        console.log(err)
    }
}

export async function removeFromCart(req, res) {
    try{

        await userModel.updateOne({ _id: req.session.user.id }, { $pull: { cart: { productId: req.params.id } } })
        res.redirect('/cart')
    }catch (err) {
        console.log(err)
    }
}
export async function addCartQuantity(req, res) {
    try{

        const cartProduct = await userModel.findOne({ _id: req.session.user.id }, { cart: 1, _id: 0 })
        let data = cartProduct.cart.find(e => e.productId == req.params.id)
        if (data.quantiy < 10) {
            await userModel.updateOne({ _id: req.session.user.id, cart: { $elemMatch: { productId: req.params.id } } }, {
                $inc: {
                    "cart.$.quantiy": 1
                }
            })
            res.json({ success: true })
        } else {
            res.json({ success: false })
        }
    }catch (err) {
        console.log(err)
    }

}

export async function minusCartQuantity(req, res) {
    try{

        const cartProduct = await userModel.findOne({ _id: req.session.user.id }, { cart: 1, _id: 0 })
        let data = cartProduct.cart.find(e => e.productId == req.params.id)
        if (data.quantiy <= 1) {
            return res.json({ success: false })
        } else {
    
            await userModel.updateOne({ _id: req.session.user.id, cart: { $elemMatch: { productId: req.params.id } } }, {
                $inc: {
                    "cart.$.quantiy": -1
                }
            })
            res.json({ success: true })
        }
    }catch (err) {
        console.log(err)
    }
}

export async function addToWishlist(req, res) {
    try{

        const id = req.params.id;
        await userModel.updateOne({ _id: req.session.user.id }, {
            $addToSet: {
                wishlist: id,
            }
        })
        const product = await userModel.find({ _id: req.session.user.id }, { wishlist: 1 })
        res.redirect('/wishlist')
    }catch (err) {

    }
}

export async function removeFromWhishlist(req, res) {
    try{

        const proId = req.params.id
        const wishlist = await userModel.updateOne({ _id: req.session.user.id }, { $pull: { wishlist: proId } })
        res.redirect("/wishlist")
    }catch (err) {
        console.log(err)
    }
}

export async function getWishlist(req, res) {
    try{

        const { wishlist } = await userModel.findOne({ _id: req.session.user.id }, { wishlist: 1 })
        const products = await productModel.find({ _id: { $in: wishlist } }).lean()
        res.render('user/whishlist', { products })
    }catch (err) {
        console.log(err)
    }
}

export async function showWhishlist(req, res) {
    try{

        const user = await userModel.findOne({ _id: req.session.user.id })
        if (user) {
            const proId = user.whishlist
            const prod = await productModel.findOne({ _id: proId })
    
            res.json({ whishlist: user.whishlist })
        }
        else {
            res.render('user/whishlist', { message: "please login" })
        }
    }catch (err) {
        console.log(err)
    }
}

export async function productCategory(req, res) {
    try{

        const products = await productModel.find({ category: req.params.id }).lean()
        res.render('user/category', { products })
    }catch (err) {
        console.log(err)
    }
}

//shop
export async function shopPage(req, res) {
    try{
        let search=req.query.search ?? ''
        let sort=req.query.filter ?? ''
        let category=req.query.category ?? ''
        let page=Number(req.query.page ?? 0)
        let categoryFilter=[];
        let findConditions={}
        if (category) {
             findConditions = {
                list: false,
                category: { $in: category},
                productName: new RegExp(search, "i"),
              };
          } else {
            findConditions = {
                list: false,
                productName: new RegExp(search, "i"),
              };
            }
            let categories = await categoryModel.find({list: false,}).lean();
           
        const products = await productModel.find(findConditions).sort({productPrice:sort}).skip(page*8).limit(8).lean()
        
        const productCount = await productModel.find({findConditions}).count().lean()
        let pageCount = Math.ceil(productCount / 8);
        let pagination = [];
        for (let i = 1; i <= pageCount; i++) {
            pagination.push(i);
        }
        console.log('pages',productCount);
        page=productCount/8
        res.render('user/shop', { products,categories,sort,category,search,pagination,page })
    }catch (err) {
        console.log(err)
    }
}




 
    // if (category) {
    //   let [{ name }] = await categoryModel.find(
    //     { _id: category,list:true},
    //     { name: 1, _id: 0 }
    //   );
    //    categoryName = name;
    // }
    
    // console.log(categoryFilter, "category");
    // let categoryArray = categoryFilter.map((category) => category._id);
  
    // const findConditions = {
    //   list: true,
    //   category: { $in: categoryArray },
    //   title: new RegExp(search, "i"),
    // };
    // const productData = await productModel
    //   .find(findConditions)
    //   .sort(sort == "0" ? { uploadedAt: 1 } : { price: sort })
    //   .skip(page * 9)
    //   .limit(9)
    //   .lean();
    // const productCount = await productModel.find(findConditions).lean().count();
    // console.log(sort,'sort');
    // let categoryData = await categoryModel.find({ list: true }).lean();
    // let pageCount = Math.ceil(productCount / 9);
    // let pagesCount = [];
    // for (let i = 0; i < pageCount; i++) {
    // pagesCount.push(i);
    // }
    // res.render("user/shopnew", {
    //   // user,
    //   productData,
    //   categoryData,
    //   categoryName,
    //   category,
    //   search,
    //   sort,
    //   page,
    //   pagesCount,
    //   isLoggedIn,
    // });






export async function orderPlaced(req, res) {
    try{

        res.render('user/orderCompleated')
    }catch (err) {
        console.log(err)
    }
}

export async function userProfile(req, res) {
    try{
        const _id = req.session.user.id
        const user = await userModel.findOne({ _id }).lean()
        res.render('user/profile', { user })
    }catch (err) {
        console.log(err)
    }
}

export async function editProfile(req, res) {
    try{

        const _id = req.session.user.id
        const { email, name, adress } = req.body
        const user = await userModel.updateOne({ _id }, {
            $set: {
                email, name, adress
            }
        }
        )
        res.json({ user })
    }catch (err) {
        console.log(err)
    }
}

export async function applyCoupon(req, res) {
    try{

        return new Promise((resolve, reject) => {
            couponModel.findOne({ code: req.params.coupon }).lean().then((coupon) => {
                if (new Date(coupon?.expiry ?? null).getTime() >= new Date().getTime() && parseInt(req.params.purchaseAmount) >= coupon.minAmount) {
                    let discountedAmount=Number(req.session.totalAmount)-Number(coupon.cashback??0)
                    res.json({ success: true, cashback: coupon.cashback,discountedAmount:discountedAmount })
                } else {
                    res.json({ success: false,discountedAmount:req.session.totalAmount })
                }
            });
        });
    }catch (err) {
        console.log(err)
    }
}

export async function checkout(req, res) {
    const { cart } = await userModel.findOne({ _id: req.session.user.id }, { cart: 1 })
    const couponCode = req.body
    try {
        if (cart[0].productId) {
            const proId = cart.map(item => {
                return item.productId
            })
            const product = await productModel.find({ _id: { $in: proId } }).lean()
            let totalAmount = 0
            let total = product.map((item, index) => {
                product[index].cartQuantity = cart[index].quantiy
                product[index].totalPrice = cart[index].quantiy * item.productPrice
                totalAmount += item.productPrice * cart[index].quantiy
                return item.productPrice
            })
            const { adress } = await userModel.findOne({ _id: req.session.user.id }, { adress: 1 }, { _id: 0 })
            req.session.totalAmount=totalAmount
            res.render('user/checkout', { cart, adress, totalAmount, product })
        }
    } catch (err) {
        res.redirect('/cart')
    }


}

export async function postCheckout(req, res) {
    try {
        let userId = req.session.user.id
        console.log('user=',userId);
        const { address:addressId, payment,totalAmount } = req.body;
        console.log(addressId)
        let user = await userModel.findOne(
            { "adress.id": addressId },
            { _id: 0, adress: { $elemMatch: { id: addressId } }, cart: 1 }
            );
            const address = user.adress[0];
        const cart = user.cart;
        console.log(cart);
        let orders = [];
        let cartQuantity = {}
        let cartIds = cart.map(item => {
            cartQuantity[item.productId] = item.quantiy
            return item.productId
        })
        console.log(req.body);
        let products = await productModel.find({ _id: { $in: cartIds } }).lean()
            for (let item of products) {
                orders.push({
                    product: item,
                    paymentType: payment,
                    paymentStatus: 'not paid',
                    userId: req.session.user.id,
                    quantity: cartQuantity[item._id],
                    total: item.productPrice * cartQuantity[item._id],
                    address
                })
            }
            req.session.orders = orders


        if (payment == 'online') {
            for (let item of products) {
                orders.push({
                    product: item,
                    paymentType: payment,
                    paymentStatus: 'paid',
                    userId: req.session.user.id,
                    quantity: cartQuantity[item.id],
                    total:totalAmount,
                    address
                })
            }
            req.session.orders = orders
            let orderId = "order_" + createId();
            const options = {
                method: "POST",
                url: "https://sandbox.cashfree.com/pg/orders",
                headers: {
                    accept: "application/json",
                    "x-api-version": "2022-09-01",
                    "x-client-id": '323734f6b2fa2e40f2311d7694437323',
                    "x-client-secret": 'e0f749895361310d9e283d2fbf9e290c4d3afe68',
                    "content-type": "application/json",
                },
                data: {
                    order_id: orderId,
                    order_amount: req.body.totalAmount,
                    order_currency: "INR",
                    customer_details: {
                        customer_id: userId,
                        customer_email: 'sanoojc65@gmail.com',
                        customer_phone: '8589812098',
                    },
                    order_meta: {
                        return_url: "http://localhost:8000/verifyPayment?order_id={order_id}",
                    },
                },
            };

            await axios
                .request(options)
                .then(function (response) {

                    return res.render("user/paymentTemp", {
                        orderId,
                        sessionId: response.data.payment_session_id,
                    });
                })
                .catch(function (error) {
                    console.error(error);
                });

        } else {
            await orderModel.create(orders);
           for (let item of cart){
            await productModel.updateOne({_id:item.productId},{$inc:{quantity:-1*item.quantiy}})
           }
            await userModel.updateOne({ _id: req.session.user.id }, { $set: { cart: [] } })

            res.redirect("/orderPlaced")
        }
    } catch (err) {

       console.log(err);
    }
}

export async function getUserPayment(req, res) {
    try{

        const userId = req.session.user.id;
        const order_id = req.query.order_id;
        const options = {
            method: "GET",
            url: "https://sandbox.cashfree.com/pg/orders/" + order_id,
            headers: {
                accept: "application/json",
                "x-api-version": "2022-09-01",
                "x-client-id": '323734f6b2fa2e40f2311d7694437323',
                "x-client-secret": 'e0f749895361310d9e283d2fbf9e290c4d3afe68',
                "content-type": "application/json",
            },
        }
    
        const response = await axios.request(options);
        if (response.data.order_status == "PAID") {
            await orderModel.create(req.session.orders)
            await userModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
            res.redirect('/orderPlaced')
        }
    }catch (err) {
        console.log(err)
    }
}
export async function getResetPassword(req, res) {
    try{

        res.render('user/emailVerification')
    }catch (err) {
        console.log(err)
    }
}
export async function resetPassword(req, res) {
    try{
        const {email} = req.body
        const user = await userModel.findOne({ email })
        if (user) {
            const number = Math.floor(Math.random() * 100000)
            await sentOTP(email, number)
            req.session.tempUser = {
                otp: number,
                email: email
            }
            res.redirect('/enterOtp')
        } else {
            res.render('user/emailVerification',{error:true, message: "user not found" })
        }
    }catch(err){
        console.log(err);
        res.redirect('/back')
    }
}
export async function getEnterOtp(req,res){
    try{

        res.render('user/enterOtp')
    }catch (err) {
        console.log(err)
    }
}

export async function enterOtp(req, res) {
    try{

        const { otp } = req.body
        console.log(otp);
        if (otp == req.session.tempUser.otp) {
            res.redirect('/setPassword',)
    
        } else {
    
            res.render('user/enterOtp',{error:true, message: "incorrect otp" })
        }
    }catch (err) {
        console.log(err)
    }
}
export async function getSetPassword(req,res){
    try{

        res.render('user/setPassword')
    }catch (err) {
        console.log(err)
    }
}

export async function resetPass(req, res) {
    try{

        const { password, confPassword } = req.body
        if (password == confPassword) {
            await userModel.updateOne({ email: req.session.tempUser.email }, { $set: { password } })
            res.redirect('/login')
        } else {
            res.render('user/setPassword',{error:true, message: 'incorrect password' })
        }
    }catch (err) {
        console.log(err)
    }
}

//orders

export async function myOrders(req, res) {
    try{

        const userId = req.session.user.id
        const orders = await orderModel.find({ userId }).lean()
    
        const products = orders.map((item => {
            return item.product._id
        }))
        res.render('user/myOrders', { orders })
    }catch (err) {
        console.log(err)
    }
}

export async function viewOrder(req, res) {
try{

    const order = await orderModel.findOne({ _id: req.params.id }).lean()
    res.render('user/viewOrder', { order })
}catch (err) {
    console.log(err)
}
}

export async function cancelOrder(req, res) {
    try{
        const _id = req.params.id
        const order = await orderModel.findOne({ _id })

        if (order.orderStatus != 'returned') {
            await orderModel.findByIdAndUpdate(_id, {
                $set: {
                    orderStatus: 'cancelled'
                }
            })
            
            const proId=order.product._id
            await productModel.updateOne({_id:proId},{$inc:{quantity:order.quantity}})
            res.redirect('/orders')
        } else {
            res.redirect('/orders')
        }
    }catch (err) {
        console.log(err)
    }
}

export async function logout(req, res) {
    try{

        req.session.user = null
        res.redirect('/')
    }catch (err) {
        console.log(err)
    }
}


