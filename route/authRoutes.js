import express from "express"
import { deleteAccessUser, getEnquiryDetails, sendOtp,verifyOtp, resetPassword,getBlogData, getBlogById, loginStaff, sendBlogData, registerStaff, getEnquireNowData, getAllStaffUsers,footerEmail,getFooterEmailData,SendContactUsData ,getContactUsData,SendCarrerData,getCarrerFormData, sendNriFormData, getNriFormData, getMe, updateStaffPermissions, logoutStaff,getRecentBlogs, deleteBlogData, updateBlogData} from "../controller/authController.js"
import { upload, uploadBlog } from "../middleware/multer.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/register-staff", registerStaff)

router.post("/login-staff", loginStaff)



router.post("/logout-staff",authMiddleware, logoutStaff)
router.get("/get-all-staff-users",authMiddleware, getAllStaffUsers)
router.get("/me",authMiddleware, getMe);

//access-staff-api
router.patch("/staff-permissions/:id",authMiddleware, updateStaffPermissions)

// enquire-form-data
router.post("/get-Enquire-now-Data",getEnquiryDetails)
router.get("/get-all-users",authMiddleware,getEnquireNowData)

//delete-user-api
router.delete("/delete-access-user/:id",authMiddleware,deleteAccessUser)

//footer-form-api
router.get("/get-footer-email-data", authMiddleware,getFooterEmailData)
router.post("/footer-Email",footerEmail)

// contact-us-page-api
router.post("/contact-us-page",SendContactUsData)
router.get("/get-contact-us-data",authMiddleware,getContactUsData)

// carrer page
router.post("/send-carrer-data", upload.single("resume"), SendCarrerData);
router.get("/get-carrer-form-data",authMiddleware, getCarrerFormData);

//Nri form page
router.post("/nri-form-data", sendNriFormData);
router.get("/get-nri-form-data",authMiddleware, getNriFormData);

// Blog — images in uploads/blog/
router.post("/send-blog-data", uploadBlog.single("image"),authMiddleware, sendBlogData);
router.get("/get-blog-data", getBlogData);
router.get("/blog/:id",getBlogById);
router.get("/recent-blogs", getRecentBlogs);
router.delete("/delete-blog-data/:id",authMiddleware, deleteBlogData);
router.put("/update-blog-data/:id",authMiddleware, uploadBlog.single("image"), updateBlogData);


// forget-password-api
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);


export default router
