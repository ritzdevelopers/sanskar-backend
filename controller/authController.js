import path from "node:path"
import mongoose from "mongoose"
import User from "../modal/UserSchema.js"
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import { BLOG_UPLOAD_RELATIVE_DIR, RESUME_UPLOAD_RELATIVE_DIR } from "../middleware/multer.js"
import enquireFormDataModal from "../modal/enquire-now-data.js"
import footerEmailModal from "../modal/footerEmailModal.js"
import contactUsPage from "../modal/contact-us.js"
import carrerPage from "../modal/carrerpage.js"
import careerPageJob from "../modal/careerPageJob.js"
import nriFormDataModal from "../modal/nri-form-data.js"
import Blog from "../modal/blogSchema.js"
import { normalizeBlogFaqsInput } from "../modal/blogFaqSchema.js"
import nodemailer from "nodemailer"
import { projectDropdownBrachureModal } from "../modal/projectDropdownBrachureModal.js"

function jwtSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error("JWT_SECRET is not set")
  return s
}

function signUserToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    jwtSecret(),
    { expiresIn: "7d" }
  )
}

const COOKIE_OPTS = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  path: "/",
  secure: true // process.env.NODE_ENV === "production", 
}


function stripPassword(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc }
  delete o.password
  delete o.sessionToken
  return o
}

/** Shared list pagination from query: page (default 1), limit (default 10, max 100) */
function parseListPagination(req) {
  const rawPage = Number.parseInt(String(req.query.page ?? "1"), 10)
  const rawLimit = Number.parseInt(String(req.query.limit ?? "10"), 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 10
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

async function persistSession(res, userId, token) {
  await User.findByIdAndUpdate(userId, { sessionToken: token })
  res.cookie("token", token, COOKIE_OPTS)
}


export const registerStaff = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" })
    }

    const r = String(role || "admin")
      .trim()
      .toLowerCase()
    if (!["admin", "editor"].includes(r)) {
      return res.status(400).json({ message: 'role "admin" ya "editor" hona chahiye' })
    }

    const em = email.trim().toLowerCase()
    if (await User.findOne({ email: em })) {
      return res.status(400).json({ message: "Email already registered" })
    }

    const hashedPassword = await argon2.hash(password)

    const user = await User.create({
      name: name.trim(),
      email: em,
      password: hashedPassword,
      role: r,
      permissions: false,
    })

    const token = signUserToken(user)
    await persistSession(res, user._id, token)
    const fresh = await User.findById(user._id)
    res.status(201).json({
      message: "Staff user created — ab login karo",
      user: stripPassword(fresh),
      token,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}


export const loginStaff = async (req, res) => {
  try {
    jwtSecret()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: "email, password required" })
    }
    const em = email.trim().toLowerCase()
    const user = await User.findOne({ email: em })
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const isPasswordValid = await argon2.verify(user.password, password)
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = signUserToken(user)
    await persistSession(res, user._id, token)
    const fresh = await User.findById(user._id)
    res.status(200).json({
      message: "Login successful",
      user: stripPassword(fresh),
      token,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteAccessUser=async (req, res) => {
  try {
    const {id}=req.params
    const user=await User.findByIdAndDelete(id)
    if(!user){
      return res.status(404).json({ message: "User not found" })
    }
    return res.status(200).json({message:"User Deleted Successfully ",user})
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

function getJwtPayloadFromCookie(req) {
  const token = req.cookies?.token

  console.log("Token from cookie:", token) // 👈 yaha log hoga

  if (!token || typeof token !== "string") return null

  try {
    const decoded = jwt.verify(token, jwtSecret())

    console.log("Decoded payload:", decoded) // 👈 payload bhi dekh sakte ho

    return decoded
  } catch (err) {
    console.log("JWT Error:", err.message) // 👈 error log

    return null
  }
}
export const logoutStaff = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
    return res.status(200).json({ message: "Signed out successfully" })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req, res) => {
  try {
    jwtSecret()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }

  try {
    const token = req.cookies?.token // 👈 cookie se token
    const payload = getJwtPayloadFromCookie(req)

    if (!payload?.id) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const user = await User.findById(payload.id)
      .select("-password -sessionToken")
      .lean()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json({
      user,
      token, // 👈 token bhi bhej diya
    })

  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
export const updateStaffPermissions = async (req, res) => {
  try {
    jwtSecret()
  } catch (e) {
    return res.status(500).json({ message: e.message })
  }
  try {
    const payload = getJwtPayloadFromCookie(req)
    if (!payload?.id) {
      return res.status(401).json({ message: "Not authenticated" })
    }
    const { id } = req.params
    const { permissions } = req.body ?? {}
    if (typeof permissions !== "boolean") {
      return res
        .status(400)
        .json({ message: "Body field permissions (boolean) is required" })
    }
    const existing = await User.findById(id)
    if (!existing) {
      return res.status(404).json({ message: "User not found" })
    }
    if (existing.role === "superadmin") {
      return res.status(400).json({
        message: "Cannot change permissions for superadmin accounts",
      })
    }
    const user = await User.findByIdAndUpdate(
      id,
      { permissions },
      { new: true },
    )
      .select("-password -sessionToken")
      .lean()
    return res.status(200).json({
      message: "Permissions updated successfully",
      user,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}


export const getEnquiryDetails = async (req, res) => {
  try {
    const body = req.body ?? {};
    const email = String(body.email ?? "").trim();
    const mobile = String(body.mobile ?? "").replace(/\D/g, "");

    const fullNameRaw = String(body.fullName ?? "").trim();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const fullName =
      fullNameRaw ||
      [firstName, lastName].filter(Boolean).join(" ").trim();

    if (!fullName || !email || !mobile) {
      const missing = [
        !fullName ? "fullName" : "",
        !email ? "email" : "",
        !mobile ? "mobile" : "",
      ]
        .filter(Boolean)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: `${missing} required`,
      });
    }

    const savedEnquiry = await enquireFormDataModal.create({
      fullName,
      email,
      mobile,
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry details saved successfully",
      data: savedEnquiry
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getEnquireNowData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req)

    const [list, totalItems] = await Promise.all([
      enquireFormDataModal
        .find()
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      enquireFormDataModal.countDocuments(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "Enquiry records fetched successfully",
      data: list,
      users: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    })
  } catch (error) {
    console.error("Error in getEnquireNowData", error)
    return res.status(500).json({ message: error.message })
  }
}

/** Staff jo `register-staff` (User collection) se bante hain — password/session nahi bhejte */
export const getAllStaffUsers = async (req, res) => {
  try {
    const rawPage = Number.parseInt(String(req.query.page ?? "1"), 10)
    const rawLimit = Number.parseInt(String(req.query.limit ?? "10"), 10)
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 10
    const skip = (page - 1) * limit

    const [list, totalItems, totalAdmin, totalEditor, totalAccess] =
      await Promise.all([
        User.find()
          .select("-password -sessionToken")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "editor" }),
        User.countDocuments({ permissions: true }),
      ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "Staff users fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      summary: {
        totalStaff: totalItems,
        totalAdmin,
        totalEditor,
        totalAccess,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const footerEmail=async (req,res)=>{
  try {
   const {email}=req.body
   if(!email){
    return res.status(400).json({message:"Email is required"})
   }

   const savedEmail=await footerEmailModal.create({email})
   return res.status(200).json({message:"Email saved successfully",savedEmail})
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

export const getFooterEmailData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req)

    const [list, totalItems] = await Promise.all([
      footerEmailModal.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      footerEmailModal.countDocuments(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "Footer email records fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

// contactuspage
export const SendContactUsData=async(req,res)=>{
  try {
      const {name,email,mobile,message}=req.body
      if(!name || !email || !mobile || !message){
        return res.status(400).json({message:"All fields are required"})
      }
      const saveData=await contactUsPage.create({name,email,mobile,message})
      return res.status(200).json({message:"Data saved successfully",saveData})
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }

}

export const getContactUsData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req)

    const [list, totalItems] = await Promise.all([
      contactUsPage.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      contactUsPage.countDocuments(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "Contact form data fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};


//carrer page
export const SendCarrerData = async (req, res) => {
  try {
    const { name, email, mobile, message, designation } = req.body;

    if (!name || !email || !mobile || !designation || !message || !req.file) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const resumeRelativePath = path.posix.join(
      RESUME_UPLOAD_RELATIVE_DIR,
      req.file.filename,
    )

    const saveData = await carrerPage.create({
      name,
      email,
      mobile,
      message,
      designation,
      resume: resumeRelativePath,
    })

    return res.status(201).json({
      message: "Data saved successfully",
      data: saveData
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCarrerFormData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req)

    const [list, totalItems] = await Promise.all([
      carrerPage.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      carrerPage.countDocuments(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "Career form data fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// career page job (profile + description)
export const sendCareerPageJobData = async (req, res) => {
  try {
    const profile = String(req.body?.profile ?? "").trim();
    const description = String(req.body?.description ?? "").trim();

    if (!profile || !description) {
      return res.status(400).json({ message: "profile and description are required" });
    }

    const saved = await careerPageJob.create({ profile, description });
    return res.status(201).json({
      message: "Career page job data saved successfully",
      data: saved,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getCareerPageJobData = async (req, res) => {
  try {
    // console.log("getCareerPageJobData called");
    const { page, limit, skip } = parseListPagination(req);
    const [list, totalItems] = await Promise.all([
      careerPageJob.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      careerPageJob.countDocuments(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return res.status(200).json({
      message: "Career page job data fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

function isValidNriEmail(email) {
  const e = String(email ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e);
}

function nriMobileDigitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidNriMobileDigits(digits) {
  return digits.length >= 10 && digits.length <= 15;
}

// Nri page
export const sendNriFormData = async (req, res) => {
  const trim = (v) => (v == null ? "" : String(v).trim());
  try {
    const b = req.body || {};
    const name = trim(b.name ?? b.fullName);
    const email = trim(b.email);
    const mobileRaw = trim(b.mobile ?? b.phone);
    const message = trim(b.message ?? b.note ?? b.details);

    if (!name || !email || !mobileRaw || !message) {
      return res.status(400).json({
        message:
          "All fields are required (name or fullName, email, mobile or phone, message).",
      });
    }

    if (!isValidNriEmail(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const mobileDigits = nriMobileDigitsOnly(mobileRaw);
    if (!isValidNriMobileDigits(mobileDigits)) {
      return res.status(400).json({
        message: "Enter a valid mobile number (10–15 digits).",
      });
    }

    const saveData = await nriFormDataModal.create({
      name,
      email,
      mobile: mobileDigits,
      message,
    });

    return res.status(201).json({
      message: "NRI form data saved successfully",
      data: saveData,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getNriFormData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req)

    const [list, totalItems] = await Promise.all([
      nriFormDataModal.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      nriFormDataModal.countDocuments(),
    ])

    const totalPages = Math.max(1, Math.ceil(totalItems / limit))

    return res.status(200).json({
      message: "NRI form data fetched successfully",
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};



// blog — files saved under uploads/blog/; DB stores uploads/blog/<filename>

function readMultipartText(body, key) {
  if (!body || typeof body !== "object") return "";
  const v = body[key];
  if (v == null) return "";
  if (Array.isArray(v)) return String(v[0] ?? "").trim();
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(v)) {
    return v.toString("utf8").trim();
  }
  return String(v).trim();
}

export const sendBlogData = async (req, res) => {
  try {
    const title = readMultipartText(req.body, "title");
    const description = readMultipartText(req.body, "description");
    const metaDescription = readMultipartText(req.body, "metaDescription");
    const metaKeywords = readMultipartText(req.body, "metaKeywords");

    let faqs = [];
    if (req.body.faqs != null && req.body.faqs !== "") {
      try {
        faqs = normalizeBlogFaqsInput(req.body.faqs);
      } catch (e) {
        const code = e?.code;
        const hint =
          'Send form field "faqs" as text: JSON array like [{"question":"Q?","answer":"A"}]';
        return res.status(400).json({
          message: code === "INVALID_FAQ_SHAPE" ? String(e.message) : "Invalid faqs JSON",
          hint,
        });
      }
    }

    if (!title || !description) {
      return res.status(400).json({
        message: "title and description are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: 'image file is required (form-data key: "image")',
      });
    }

    const imagePath = path.posix.join(BLOG_UPLOAD_RELATIVE_DIR, req.file.filename);

    const blog = await Blog.create({
      title,
      description,
      image: imagePath,
      metaDescription,
      metaKeywords,
      faqs, // ✅ added
    });

    return res.status(201).json({
      message: "Blog data saved successfully",
      blog,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getBlogData=async(req,res)=>{
  try {
    const {page,limit,skip}=parseListPagination(req)
    const [list,totalItems]=await Promise.all([
      Blog.find().sort({_id:-1}).skip(skip).limit(limit).lean(),
      Blog.countDocuments(),
    ])
    const totalPages=Math.max(1,Math.ceil(totalItems/limit))
    return res.status(200).json({message:"Blog data fetched successfully",data:list,pagination:{
      page,limit,totalItems,totalPages,hasPrevPage:page>1,hasNextPage:page<totalPages,
    }})
  } catch (error) {
    return res.status(500).json({message:error.message})
  }
}

export const getRecentBlogs=async(req,res)=>{
  try {
    const blogs = await Blog.find()
    .sort({ uploadDate: -1 }) // latest first
    .limit(3); // only 3 blogs

  res.status(200).json({
    message: "Recent blogs fetched successfully",
    data: blogs,
  });
  } catch (error) {
    return res.status(500).json({message:error.message})
  }
}

/** Single blog + chronologically adjacent posts (by `_id`) for prev/next links. */
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid blog id" });
    }
    const blog = await Blog.findById(id).lean();
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const oid = blog._id;
    const [prev, next] = await Promise.all([
      Blog.findOne({ _id: { $lt: oid } })
        .sort({ _id: -1 })
        .select("title _id")
        .lean(),
      Blog.findOne({ _id: { $gt: oid } })
        .sort({ _id: 1 })
        .select("title _id")
        .lean(),
    ]);
    return res.status(200).json({
      message: "Blog fetched successfully",
      data: blog,
      prev: prev
        ? { _id: String(prev._id), title: String(prev.title ?? "") }
        : null,
      next: next
        ? { _id: String(next._id), title: String(next.title ?? "") }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const deleteBlogData=async(req,res)=>{
  try {
    const {id}=req.params
    const blog=await Blog.findByIdAndDelete(id)
    if(!blog){
      return res.status(404).json({message:"Blog not found"})
    }
    return res.status(200).json({message:"Blog deleted successfully",blog})
  } catch (error) {
    return res.status(500).json({message:error.message})
  }
}

export const updateBlogData = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};

    const title = readMultipartText(body, "title");
    const description = readMultipartText(body, "description");
    const metaDescription = readMultipartText(body, "metaDescription");
    const metaKeywords = readMultipartText(body, "metaKeywords");

    let faqsNormalized;
    const faqsFieldPresent = Object.prototype.hasOwnProperty.call(body, "faqs");
    if (faqsFieldPresent) {
      try {
        faqsNormalized = normalizeBlogFaqsInput(body.faqs);
      } catch (e) {
        const code = e?.code;
        const hint =
          'Send form field "faqs" as text: JSON array like [{"question":"Q?","answer":"A"}] or [] to clear';
        return res.status(400).json({
          message: code === "INVALID_FAQ_SHAPE" ? String(e.message) : "Invalid faqs JSON",
          hint,
        });
      }
    }

    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (metaDescription) updateData.metaDescription = metaDescription;
    if (metaKeywords) updateData.metaKeywords = metaKeywords;
    if (faqsFieldPresent) updateData.faqs = faqsNormalized;

    if (req.file) {
      updateData.image = path.posix.join(BLOG_UPLOAD_RELATIVE_DIR, req.file.filename);
    }

    if (!title && !description && !req.file && !faqsFieldPresent) {
      return res.status(400).json({
        message: "Send at least one field (title, description, faqs, image)",
      });
    }

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json({
      message: "Blog updated successfully",
      data: blog,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const em = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: em });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: String(process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, ""),
      },
    });

    const message = `
      <h3>Your OTP Code</h3>
      <p>Your OTP is: <b>${otp}</b></p>
      <p>This OTP will expire in 2 minutes.</p>
    `;

    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset OTP",
      html: message,
    });

    res.status(200).json({ message: "OTP sent to email" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || otp == null || otp === "") {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    const em = String(email).trim().toLowerCase();
    const otpStr = String(otp).trim();

    const user = await User.findOne({
      email: em,
      otp: otpStr,
      otpExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.status(200).json({ message: "OTP verified" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || otp == null || otp === "" || !password) {
      return res.status(400).json({ message: "Email, OTP, and password are required" });
    }
    const em = String(email).trim().toLowerCase();
    const otpStr = String(otp).trim();

    const user = await User.findOne({
      email: em,
      otp: otpStr,
      otpExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await argon2.hash(password);
    user.password = hashedPassword;

    // clear OTP
    user.otp = undefined;
    user.otpExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//project-dropdown-brachure-api
export const sendProjectDropdownBrachureData = async (req, res) => {
  try {
    const { name, email, mobile, project } = req.body;

    // validation
    if (!name || !email || !mobile || !project) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const saveData=await projectDropdownBrachureModal.create({name,email,mobile,project})
    return res.status(200).json({message:"Data saved successfully",saveData})
  
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}

export const getProjectDropdownBrachureData = async (req, res) => {
  try {
    const { page, limit, skip } = parseListPagination(req);
    const [list, totalItems] = await Promise.all([
      projectDropdownBrachureModal.find().sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      projectDropdownBrachureModal.countDocuments(),
    ])
    const totalPages=Math.max(1,Math.ceil(totalItems/limit))
    return res.status(200).json({message:"Data fetched successfully",data:list,pagination:{
      page,limit,totalItems,totalPages,hasPrevPage:page>1,hasNextPage:page<totalPages,
    }})
  }
  catch (error) {
    return res.status(500).json({ message: error.message })
  }
} 

