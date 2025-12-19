const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

/* ---------- CORS FIX (IMPORTANT) ---------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://landing-page-application.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* ---------- MIDDLEWARE ---------- */
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------- TEST ROUTE ---------- */
app.get("/", (req, res) => {
  res.send("Backend API running 🚀");
});

/* ---------- ROUTES ---------- */
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/subscribers", require("./routes/subscriberRoutes"));

/* ---------- SERVER ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
