import mongoose from "mongoose"
 const userSchema=mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    password:{
        type:String, 
        required:true
    },
    ban:{
        type:Boolean,
        default:false
    },
    adress:{
        type:Array
    },
    cart:{
        type:Array
    },
    wishlist:{
        type:Array
    },
    acccountDetails:{
       type: Array 
    }
 })
 const userModel=mongoose.model('user',userSchema)
 export default userModel