import express from "express"
import { deleteAccessUser, getEnquiryDetails, sendOtp,verifyOtp, resetPassword,getBlogData, getBlogById, loginStaff, sendBlogData, registerStaff, getEnquireNowData, getAllStaffUsers,footerEmail,getFooterEmailData,SendContactUsData ,getContactUsData,SendCarrerData,getCarrerFormData, sendNriFormData, getNriFormData, getMe, updateStaffPermissions, logoutStaff,getRecentBlogs, deleteBlogData, updateBlogData} from "../controller/authController.js"
import { upload, uploadBlog } from "../middleware/multer.js"
import { authMiddleware } from "../middleware/authMiddleware.js"

const router = express.Router()

router.post("/register-staff", registerStaff)

router.post("/login-staff", loginStaff)


router.use(authMiddleware);
router.post("/logout-staff", logoutStaff)
router.get("/get-all-staff-users", getAllStaffUsers)
router.get("/me", getMe);

//access-staff-api
router.patch("/staff-permissions/:id", updateStaffPermissions)

// enquire-form-data
router.post("/get-Enquire-now-Data",getEnquiryDetails)
router.get("/get-all-users",getEnquireNowData)

//delete-user-api
router.delete("/delete-access-user/:id",deleteAccessUser)

//footer-form-api
router.get("/get-footer-email-data", getFooterEmailData)
router.post("/footer-Email",footerEmail)

// contact-us-page-api
router.post("/contact-us-page",SendContactUsData)
router.get("/get-contact-us-data",getContactUsData)

// carrer page
router.post("/send-carrer-data", upload.single("resume"), SendCarrerData);
router.get("/get-carrer-form-data", getCarrerFormData);

//Nri form page
router.post("/nri-form-data", sendNriFormData);
router.get("/get-nri-form-data", getNriFormData);

// Blog — images in uploads/blog/
router.post("/send-blog-data", uploadBlog.single("image"), sendBlogData);
router.get("/get-blog-data", getBlogData);
router.get("/blog/:id", getBlogById);
router.get("/recent-blogs", getRecentBlogs);
router.delete("/delete-blog-data/:id", deleteBlogData);
router.put("/update-blog-data/:id", uploadBlog.single("image"), updateBlogData);


// forget-password-api
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);


export default router
