const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const { connection } = require("../services/queue");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const minio = require("../config/minio");

sharp.cache(false);

// Models
require("../models/galleryModel");
require("../models/userModel");
require("../models/productModel");
require("../models/bannerModel");

const BUCKET = process.env.MINIO_BUCKET_NAME;

const worker = new Worker(
  "media-processing",
  async (job) => {
    const {
      fileId,
      filePath,
      mimeType,
      outputDir,
      modelName,
      fieldName,
      operation,
    } = job.data;

    console.log(`\n[Worker] 🟢 JOB START`);
    console.log(`[Worker] Model: ${modelName}`);
    console.log(`[Worker] File ID: ${fileId}`);
    console.log(`[Worker] File Path: ${filePath}`);
    console.log(`[Worker] Output Dir: ${outputDir}`);
    console.log(`[Worker] Bucket: ${BUCKET}`);

    // ---------- STEP 1: Resolve input ----------
    let absoluteInputPath = path.resolve(filePath);

    if (!fs.existsSync(absoluteInputPath)) {
      const fallback = path.join(process.cwd(), "Backend", filePath);
      if (fs.existsSync(fallback)) absoluteInputPath = fallback;
    }

    console.log(`[Worker][STEP 1] Input resolved to: ${absoluteInputPath}`);

    if (!fs.existsSync(absoluteInputPath)) {
      throw new Error(`Input file missing: ${absoluteInputPath}`);
    }

    // ---------- STEP 2: Prepare temp dir ----------
    const tempDir = path.resolve(outputDir);
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`[Worker][STEP 2] Temp dir ready: ${tempDir}`);

    const timestamp = Date.now();
    const finalFilename = `${modelName.toLowerCase()}-${fileId}-${timestamp}.webp`;
    const tempOutput = path.join(tempDir, finalFilename);

    try {
      // ---------- STEP 3: Sharp processing ----------
      console.log(`[Worker][STEP 3] Sharp start`);

      let pipeline = sharp(absoluteInputPath);

      if (modelName === "User") {
        pipeline = pipeline.resize(500, 500, { fit: "cover" });
      } else if (modelName === "Product") {
        pipeline = pipeline.resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        });
      } else if (modelName === "Gallery") {
        pipeline = pipeline.resize(1920, 1080, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      await pipeline.webp({ quality: 80 }).toFile(tempOutput);

      console.log(`[Worker][STEP 3] Sharp done → ${tempOutput}`);

      if (!fs.existsSync(tempOutput) || fs.statSync(tempOutput).size === 0) {
        throw new Error("Sharp output invalid");
      }

      // ---------- STEP 4: Upload to MinIO ----------
      const objectKey = `${modelName.toLowerCase()}/${finalFilename}`;
      console.log(`[Worker][STEP 4] Uploading to MinIO`);
      console.log(`[Worker][STEP 4] Object Key: ${objectKey}`);

      await minio.fPutObject(BUCKET, objectKey, tempOutput, {
        "Content-Type": "image/webp",
      });

      console.log(`[Worker][STEP 4] MinIO upload DONE`);

      // ---------- STEP 5: DB update ----------
      const storedPath = `/uploads/${objectKey}`;
      console.log(`[Worker][STEP 5] Stored path: ${storedPath}`);

      const Model = mongoose.model(modelName);

      if (operation === "push") {
        console.log(`[Worker][STEP 5] Mongo push update`);
        await Model.findByIdAndUpdate(fileId, {
          $push: { [fieldName]: storedPath },
        });
      } else {
        console.log(`[Worker][STEP 5] Mongo replace update`);

        const doc = await Model.findById(fileId);

        if (doc && doc[fieldName]) {
          const oldPath = doc[fieldName];
          if (oldPath.startsWith("/")) {
            const oldKey = oldPath.slice(1);
            try {
              console.log(
                `[Worker][STEP 5] Deleting old MinIO object: ${oldKey}`
              );
              await minio.removeObject(BUCKET, oldKey);
            } catch (e) {
              console.warn(`[Worker] Old object delete failed (ignored)`);
            }
          }
        }

        const update = { [fieldName]: storedPath };
        if (modelName === "Gallery") update.status = "completed";
        await Model.findByIdAndUpdate(fileId, update);
      }

      // ---------- STEP 6: Cleanup ----------
      console.log(`[Worker][STEP 6] Cleanup start`);
      fs.unlinkSync(tempOutput);
      fs.unlinkSync(absoluteInputPath);

      console.log(`[Worker] 🎉 JOB COMPLETED SUCCESSFULLY`);
      console.log(`[Worker] Final Path: ${storedPath}\n`);

      return storedPath;
    } catch (err) {
      console.error(`[Worker ❌ ERROR] ${err.message}`);

      if (fs.existsSync(tempOutput)) {
        try {
          fs.unlinkSync(tempOutput);
        } catch {}
      }

      throw err;
    }
  },
  {
    connection,
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  }
);

console.log("🧵 Media Worker started (MinIO + DEBUG)");
