
import dotenv from "dotenv"
import dns from "node:dns"
import path from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import argon2 from "argon2"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, ".env") })

if (process.env.MONGO_URI?.startsWith("mongodb+srv://")) {
  dns.setServers(["1.1.1.1", "8.8.8.8"])
}

/** User model — isi script ke liye (alag files par depend nahi) */
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["superadmin", "admin", "editor"],
      default: "editor",
    },
    permissions: { type: Boolean, default: false },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true }
)
const User =
  mongoose.models.User || mongoose.model("User", userSchema)
  

/**
 * Har run par NAYA superadmin — sirf email unique honi chahiye.
 * Kitne bhi superadmin ho sakte hain, alag-alag email se script dubara chalao.
 */

const SUPERADMIN_NAME = "Super Admin"
const SUPERADMIN_PASSWORD = "SuperAdmin"
const SUPERADMIN_EMAIL = "superadmin1@gmail.com"

async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri || typeof uri !== "string") {
    console.error("MONGO_URI missing — backend/.env mein set karo.")
    process.exit(1)
  }
  console.log("Connecting to database...")
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
  console.log("Database connected successfully")
}

async function main() {
  try {
    await connectDB()

    const em = SUPERADMIN_EMAIL.trim().toLowerCase()
    const existing = await User.findOne({ email: em })

    if (existing) {
      console.error(
        "Ye email pehle se DB mein hai. Alag SUPERADMIN_EMAIL set karke dubara chalao."
      )
      await mongoose.disconnect()
      process.exit(1)
    }

    const hashedPassword = await argon2.hash(SUPERADMIN_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })

    await User.create({
      name: SUPERADMIN_NAME,
      email: em,
      password: hashedPassword,
      role: "superadmin",
      permissions: true,
      sessionToken: null,
    })

    console.log("SuperAdmin created successfully Email:", em)
    console.log("SuperAdmin created successfully Name:", SUPERADMIN_NAME)

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error(err)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  }
}

main()
