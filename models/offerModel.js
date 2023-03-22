import mongoose from "mongoose"
const offerSchema =mongoose.Schema({
    name:String,
    url:String,
    image:Object,
    list:{
        type:Boolean,
        default:true
    }
})

const offerModel=mongoose.model('offer', offerSchema);
export default offerModel
