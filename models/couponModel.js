import mongoose from "mongoose";
const couponSchema=mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    code:{

        type:String,
        requred:true
    },
    minAmount:{
        type:Number,
        required:true
    },
    cashback:{
        type:Number,
        required:true
    },
    expiry:{
        type:Date,
        required:true
    },
    unlist:{
        type:Boolean,
        default:false
    }
})
const couponModel=mongoose.model('coupon',couponSchema)
export default couponModel