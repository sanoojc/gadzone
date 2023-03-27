import mongoose from "mongoose"
const orderSchema=mongoose.Schema({
    product:{
        type:Object
    },
    paymentType:{
        type:String
    },
    paymentStatus:{
        type:String,
        default:'not paid'
    },
    orderStatus:{
        type:String,
        default:"pending"
    },
    userId:String,
    quantity:Number,
    dispatch:{
        type:Date,
        default: new Date(new Date().setDate(new Date().getDate()))
    },
    address:{
        type:Object
    },
    total:{
        type:Number,
        default:0
    }
})
const orderModel=mongoose.model('orders',orderSchema)
export default orderModel