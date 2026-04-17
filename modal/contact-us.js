import mongoose from "mongoose"

const contactUsPageSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    }
}, { timestamps: true })
const contactUsPage=mongoose.model("contactUsPage",contactUsPageSchema)
export default contactUsPage