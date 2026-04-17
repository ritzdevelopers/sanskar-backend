import mongoose from "mongoose"

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["superadmin", "admin", "editor"],
      default: "editor",
    },
    /** Register par default `false` (pehle empty array ki jagah) */
    permissions: {
      type: Boolean,
      default: false,
    },
    /** Login / register-staff ke JWT ko DB mein (latest session) */
    sessionToken: {
      type: String,
      default: null,
    },
    /** Password reset / verify — stored until used or expired */
    otp: {
      type: String,
      default: null,
    },
    otpExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export default mongoose.model("User", UserSchema)
