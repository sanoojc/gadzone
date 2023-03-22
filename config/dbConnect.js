import mongoose from "mongoose"

export default function connectDb(){
    console.log(process.env.DBCONFIG)
    mongoose.set('strictQuery',false)
    mongoose.connect(process.env.DBCONFIG)
    .then((res)=>{
        console.log('db connected')
    }).catch((err)=>{
        console.log(err)
    })
}
