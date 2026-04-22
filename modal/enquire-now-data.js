import mongoose from "mongoose"

const enquireFormDataSchema = new mongoose.Schema(
  {
   fullName: {
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
  },
  { timestamps: true },
)

const enquireFormDataModal = mongoose.model("enquireFormData", enquireFormDataSchema)
export default enquireFormDataModal
