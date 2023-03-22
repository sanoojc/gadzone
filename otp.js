import nodemailer from 'nodemailer'
import 'dotenv/config'

const sentOTP = (email, otp) => {
  return new Promise((resolve, reject) => {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // SMTP server address (usually mail.your-domain.com)
      port: 465, // Port for SMTP (usually 465)
      secure: true, // Usually true if connecting to port 465
      auth: {
        user:'sanoojc65@@gmail.com',
        pass:'vilbpiduirpkmfll',
      },
    });
    var mailOptions = {
      from: process.env.SITE_EMAIL,
      to: email,
      subject: " Email verification",
      html: `
              <h1>Verify Your Email For Gad Zone</h1>
                <h3>use this code to verify your email</h3>
                <h2>${otp}</h2>
              `,
    }

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(error)
      } else {
        resolve(otp)
      }
    });
  })
}

export default sentOTP




// payment
// export async function getPayment(req, res) {
//   const addressId = req.params.id;
//   const cart = req?.user?.cart ?? [];
//   const cartList = cart.map((item) => {
//     return item.id;
//   });
//   const products = await productModel
//     .find({ _id: { $in: cartList }, unlist: false }, { price: 1 })
//     .lean();
//   let totalPrice = 0;
//   products.forEach((item, index) => {
//     totalPrice = (totalPrice + item.price) * cart[index].quantity;
//   });
//   res.render("user/payment", {
//     key: "",
//     totalPrice,
//     couponPrice: 0,
//     error: false,
//     addressId,
//   });
// }


// export async function checkout(req, res) {
//   const { payment, address: addressId } = req.body;
//   if (!req.body?.address) {
//     let Address = req.user.address;
//     return res.render("user/checkout", {
//       key: "",
//       address:Address,
//       error: true,
//       message: "please choose address",
//     });
//   }
//   let { address } = await userModel.findOne(
//     { "address.id": addressId },
//     { _id: 0, address: { $elemMatch: { id: addressId } } }
//   );
//   if (payment != "cod") {
//     if (req.body.wallet) {
//       if (req.user.wallet < req.session.tempOrder.totalPrice) {
//         req.session.tempOrder = { ...req.session.tempOrder, addressId, wallet:req.body.wallet };
//         let orderId = "order_" + createId();
//         const options = {
//           method: "POST",
//           url: "https://sandbox.cashfree.com/pg/orders",
//           headers: {
//             accept: "application/json",
//             "x-api-version": "2022-09-01",
//             "x-client-id": process.env.CASHFREE_API_KEY,
//             "x-client-secret": process.env.CASHFREE_SECRET_KEY,
//             "content-type": "application/json",
//           },
//           data: {
//             order_id: orderId,
//             order_amount: req.session.tempOrder.totalPrice-req.user.wallet,
//             order_currency: "INR",
//             customer_details: {
//               customer_id: req.user._id,
//               customer_email: req.user.email,
//               customer_phone: address[0].mobile,
//             },
//             order_meta: {
//               return_url: process.env.SERVER_URL+"return?order_id={order_id}",
//             },
//           },
//         };
      
//         await axios
//           .request(options)
//           .then(function (response) {
//             return res.render("user/paymentScreen", {
//               orderId,
//               sessionId: response.data.payment_session_id,
//             });
//           })
//           .catch(function (error) {
//             console.error(error);
//           });
//           return 0;
//       }
//     } else {
//       req.session.tempOrder = { ...req.session.tempOrder, addressId };
//       return res.redirect("/payment/" + addressId);
//     }
//   }
//   // else{

//   const cart = req?.user?.cart ?? [];
//   let cartQuantities = {};
//   const cartList = cart.map((item) => {
//     cartQuantities[item.id] = item.quantity;
//     return item.id;
//   });
//   let products = await productModel
//     .find({ _id: { $in: cartList }, unlist: false })
//     .lean();
//   let orders = [];
//   let i=0;
//   for (let item of products) {
//     await productModel.updateOne(
//       { _id: item._id },
//       {
//         $inc: {
//           quantity: -1 * cartQuantities[item._id],
//         },
//       }
//     );
//     let orderCount=await orderModel.find().count()
//     orders.push({
//       address: address[0],
//       product: item,
//       userId: req.session.user.id,
//       quantity: cartQuantities[item._id],
//       total: cartQuantities[item._id] * item.price,
//       amountPayable: item.price,
//       orderId:orderCount+1000+i
//     });
//     i++;
//   }
//   if (req.body.wallet) {
//     let wallet = req.user.wallet;
//     let totalCash = req.session.tempOrder?.totalPrice;
//     if (wallet >= totalCash) {
//       await userModel.findByIdAndUpdate(req.session.user.id, {
//         $set: {
//           wallet: wallet - totalCash,
//         },
//       });
//       orders = [];
//       let i=0
//       for (let item of products) {
//         let orderCount=await orderModel.find().count()
//         orders.push({
//           address: address[0],
//           product: item,
//           userId: req.session.user.id,
//           quantity: cartQuantities[item._id],
//           total: cartQuantities[item._id] * item.price,
//           amountPayable: 0,
//           paid:true,
//           orderId:1000+orderCount+i
//         });
//         i++;
//       }
//     } else {
//       await userModel.findByIdAndUpdate(req.session.user.id, {
//         $set: {
//           wallet: 0,
//         },
//       });
//       totalCash = totalCash - wallet;
//       orders = [];
//       let i=0
//       for (let item of products) {
//         let amountPayable=0;
//         let paid=false
//         if(totalCash>0){
//           if((cartQuantities[item._id] *item.price)<=totalCash){
//             amountPayable=(cartQuantities[item._id] *item.price)
//             totalCash=totalCash-amountPayable;
//           }else{
//             amountPayable=totalCash;
//             totalCash=0;
//           }
//         }
//         if(amountPayable==0){paid=true}
//         let orderCount=await orderModel.find().count()
//         orders.push({
//           address: address[0],
//           product: item,
//           userId: req.session.user.id,
//           quantity: cartQuantities[item._id],
//           total: cartQuantities[item._id] * item.price,
//           amountPayable,
//           paid,
//           orderId:orderCount+1000+i
//         });
//         i++;
//       }
//     }
//   }


//   const order = await orderModel.create(orders);
//   req.session.tempOrder=null;
//   await userModel.findByIdAndUpdate(req.session.user.id, {
//     $set: { cart: [] },
//   });
//   res.redirect("order-placed");
// // }
// }




