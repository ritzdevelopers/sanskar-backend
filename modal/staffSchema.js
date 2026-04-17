import mongoose from "mongoose"

/** Alag staff table (optional) — `users` User model se alag */
const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "admin" },
    permission: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model("Staff", staffSchema, "staffs")
