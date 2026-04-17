import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  metaDescription: {
    type: String,
    default: "",
  },
  metaKeywords: {
    type: String,
    default: "",
  },
  uploadDate: {
    type: Date,
    default: Date.now, // ✅ auto date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;