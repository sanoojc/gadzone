import mongoose from "mongoose"
const categorySchema=mongoose.Schema({
    categoryName:{
        type:String,
        required:true
    },
    list:{
        type:Boolean,
        default:false
    }
})
const categoryModel=mongoose.model('categories',categorySchema)
export default categoryModel