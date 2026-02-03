const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserDetailsAdmin,
} = require("../../controllers/userControllers");

router.get("/inspect/:id", getUserDetailsAdmin);
router.get("/all", getAllUsers);
router.put("/role/:id", updateUserRole);
router.delete("/:id", deleteUser);

module.exports = router;
