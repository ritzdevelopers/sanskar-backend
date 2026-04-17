import mongoose from "mongoose"

const footerSubscribeSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    }
})
const footerEmailModal=mongoose.model("footerSubscribe",footerSubscribeSchema)
export default footerEmailModal