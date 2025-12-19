const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Project = require("../models/Project");

const router = express.Router();

/* -------------------------------------------------
   Ensure uploads directory exists
-------------------------------------------------- */
const ensureUploadsDir = () => {
  const dir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/* -------------------------------------------------
   Multer storage config
-------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureUploadsDir());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `temp-${Date.now()}${ext}`);
  },
});

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Unsupported image type. Use JPG, PNG, or WEBP only.")
      );
    }
  },
});

/* -------------------------------------------------
   GET ALL PROJECTS
-------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("FETCH PROJECTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

/* -------------------------------------------------
   CREATE PROJECT (IMAGE UPLOAD + SHARP)
-------------------------------------------------- */
router.post("/", upload.single("image"), async (req, res) => {
  let processedImagePath = null;

  try {
    const { name, description } = req.body;

    if (!name || !description || !req.file) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        message: "Name, description, and image are required",
      });
    }

    const finalImageName = `project-${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    processedImagePath = path.join("uploads", finalImageName);

    await sharp(req.file.path)
      .resize(450, 350, { fit: "cover" })
      .toFile(processedImagePath);

    // Delete temp upload safely (async)
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Temp delete failed:", err.message);
    });

    const project = await Project.create({
      name,
      description,
      image: processedImagePath,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error.message);

    // Cleanup processed image if created
    if (processedImagePath && fs.existsSync(processedImagePath)) {
      fs.unlink(processedImagePath, (err) => {
        if (err) console.error("Cleanup failed:", err.message);
      });
    }

    // Cleanup temp file if exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Cleanup failed:", err.message);
      });
    }

    res.status(500).json({
      message: "Failed to create project",
    });
  }
});

module.exports = router;
