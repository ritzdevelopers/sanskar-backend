import mongoose from "mongoose"

const carrerPageSchema=new mongoose.Schema({
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
    designation:{
        type:String,
        required:true
    },
    message:{
        type:String,
        required:true
    },
    resume:{
        type:String,
        required:true
    }
}, { timestamps: true })
const carrerPage=mongoose.model("carrerPage",carrerPageSchema)
export default carrerPage