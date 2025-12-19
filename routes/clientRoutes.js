const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Client = require("../models/Client");

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
   GET ALL CLIENTS
-------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error("FETCH CLIENTS ERROR:", error.message);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

/* -------------------------------------------------
   CREATE CLIENT (IMAGE UPLOAD + SHARP)
-------------------------------------------------- */
router.post("/", upload.single("image"), async (req, res) => {
  let processedImagePath = null;

  try {
    const { name, description, designation } = req.body;

    if (!name || !description || !designation || !req.file) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        message: "Name, description, designation, and image are required",
      });
    }

    const finalImageName = `client-${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    processedImagePath = path.join("uploads", finalImageName);

    await sharp(req.file.path)
      .resize(300, 300, { fit: "cover" })
      .toFile(processedImagePath);

    // Delete temp upload safely (async)
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Temp delete failed:", err.message);
    });

    const client = await Client.create({
      name,
      description,
      designation,
      image: processedImagePath,
    });

    res.status(201).json(client);
  } catch (error) {
    console.error("CREATE CLIENT ERROR:", error.message);

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
      message: "Failed to create client",
    });
  }
});

module.exports = router;
