import mongoose from "mongoose"
const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required:true
    },
    mainImage: {
        type: Object,
        required: true
    },
    sideImages:{
        type:Array,
        required:true 
    },
    review: {
        type: String
    },
    list:{
        type:Boolean,
        default:false
    },
    mrp:{
        type:String,
        reuquired:true
    },
    offer:{
        type:Boolean,
        default:false
    }
    })
    
const productModel = mongoose.model('products', productSchema)
export default productModel