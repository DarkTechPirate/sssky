const router = require("express").Router();
const productController = require("../../controllers/productController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../public/uploads/temp");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "prod-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Allow up to 5 visual variants
const fields = [0, 1, 2, 3, 4].map((i) => ({
  name: `images_${i}`,
  maxCount: 10,
}));

router.post("/", upload.fields(fields), productController.createProduct);
router.put("/:id", upload.fields(fields), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.get("/", productController.getAllAdminProducts);
router.get("/:id", productController.getProductById);

module.exports = router;
