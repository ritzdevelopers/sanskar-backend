import jwt from "jsonwebtoken"


export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token

  console.log("Token:", token)

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token" })
  }

  try {
    console.log("Before Decode")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log("After Decode")

    console.log("Decoded:", decoded)

    req.user = decoded // 👈 yahi use hoga getMe me
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}