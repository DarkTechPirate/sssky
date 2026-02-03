require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const passport = require("passport");
const path = require("path");

require("./config/passport")(passport);
const connectMongo = require("./config/connectMongo");

const { createServer } = require("http");
const app = express();
const server = createServer(app);

// -----------------
// FEATURE TOGGLE
// -----------------
const USE_MINIO = process.env.USE_MINIO === "true";

// -----------------
// CONDITIONAL MINIO LOAD
// -----------------
let minioClient, BUCKET_NAME;
if (USE_MINIO) {
  const minio = require("./config/minio");
  minioClient = minio;
  BUCKET_NAME = process.env.MINIO_BUCKET_NAME;
}

// -----------------
// MIDDLEWARE
// -----------------
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());

// ------------------------------------------------
// FILE SERVING — MINIO PROXY (LIKE YOUR EXAMPLE)
// ------------------------------------------------
app.get(/^\/uploads\/(.+)$/, async (req, res) => {
  if (!USE_MINIO || !minioClient) {
    return res.status(404).send("Storage provider not enabled");
  }

  const objectName = req.params[0]; // product/abc.webp

  try {
    // Ensure object exists
    await minioClient.statObject(BUCKET_NAME, objectName);

    // Stream from MinIO
    const stream = await minioClient.getObject(BUCKET_NAME, objectName);

    // Basic headers (can be improved later)
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Content-Type", "image/webp");

    stream.pipe(res);
  } catch (err) {
    console.error(`[MinIO Proxy] File not found: ${objectName}`);
    res.status(404).send("File not found");
  }
});

// -----------------
// BOOTSTRAP
// -----------------
const port = process.env.PORT || 3000;

(async () => {
  try {
    await connectMongo();

    app.use("/api", require("./routes/index"));

    server.listen(port, "0.0.0.0", () => {
      console.log(`☑️ Server running on port ${port}`);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
})();

// -----------------
// GRACEFUL SHUTDOWN
// -----------------
const mongoose = require("mongoose");
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});
