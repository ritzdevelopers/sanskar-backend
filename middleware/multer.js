import fs from "node:fs";
import multer from "multer";
import path from "path";

/** Career resumes — on disk: `uploads/resume/<file>` */
export const RESUME_UPLOAD_RELATIVE_DIR = "uploads/resume";

/** Blog images — on disk: `uploads/blog/<file>` */
export const BLOG_UPLOAD_RELATIVE_DIR = "uploads/blog";

function ensureDirSync(relativeDir) {
  const dir = path.join(process.cwd(), relativeDir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const resumeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      cb(null, ensureDirSync(RESUME_UPLOAD_RELATIVE_DIR));
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname || "");
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage: resumeStorage });

const blogStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      cb(null, ensureDirSync(BLOG_UPLOAD_RELATIVE_DIR));
    } catch (e) {
      cb(e);
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname || "");
    cb(null, uniqueName);
  },
});

export const uploadBlog = multer({
  storage: blogStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});
