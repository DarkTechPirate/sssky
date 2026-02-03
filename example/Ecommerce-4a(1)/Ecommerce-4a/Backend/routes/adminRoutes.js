const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.use(protect({ staff: true }));
router.use("/products", require("./admin/productRoutes"));
router.use("/gallery", require("./admin/galleryRoutes"));
router.use("/orders", require("./admin/orderRoutes"));
router.use("/banners", require("./admin/bannerRoutes"));

router.use(protect({ admin: true }));
router.get("/", (req, res) => {
  res.json({
    message: "Admin area — access granted",
    admin: req.user.fullname,
    role: req.user.role,
  });
});

router.use("/users", require("./admin/userRoutes"));

module.exports = router;
