import mongoose from "mongoose"

const nriFormDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
}, { timestamps: true })

const nriFormDataModal = mongoose.model("nriFormData", nriFormDataSchema)
export default nriFormDataModal
