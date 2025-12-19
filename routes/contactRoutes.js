const express = require("express");
const Contact = require("../models/Contact");

const router = express.Router();

// Get all contact submissions
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact messages" });
  }
});

// Submit a contact form
router.post("/", async (req, res) => {
  try {
    const { fullName, email, mobile, city } = req.body;

    if (!fullName || !email || !mobile || !city) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const contact = await Contact.create({
      fullName,
      email,
      mobile,
      city,
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error("CONTACT ERROR:", error.message);
    res.status(500).json({ message: "Failed to submit contact form" });
  }
});

module.exports = router;
