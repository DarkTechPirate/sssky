const User = require("../models/userModel");

/**
 * @desc    Get all addresses for logged-in user
 * @route   GET /api/users/addresses
 */
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sort so primary is always first (optional UI convenience)
    const sortedAddresses = user.addresses.sort(
      (a, b) => b.primary - a.primary
    );

    res.status(200).json({ success: true, addresses: sortedAddresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add a new address
 * @route   POST /api/users/addresses
 */
exports.addAddress = async (req, res) => {
  try {
    const {
      door,
      street,
      area,
      landmark,
      city,
      district,
      state,
      country,
      zip,
      location,
      primary,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // LOGIC: If it's the first address ever, force it to be primary.
    // Otherwise, use user input (default false).
    let isPrimary = primary === true;
    if (user.addresses.length === 0) {
      isPrimary = true;
    }

    // If new address is marked primary, unmark all existing ones
    if (isPrimary) {
      user.addresses.forEach((addr) => (addr.primary = false));
    }

    const newAddress = {
      door,
      street,
      area,
      landmark,
      city,
      district,
      state,
      country: country || "India",
      zip,
      location,
      primary: isPrimary,
    };

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update an existing address
 * @route   PUT /api/users/addresses/:addressId
 */
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Prevent changing 'primary' status via this generic update route
    // to keep logic clean. Use the dedicated setPrimary endpoint instead.
    if (updates.primary !== undefined) {
      delete updates.primary;
    }

    // Apply updates
    Object.keys(updates).forEach((key) => {
      address[key] = updates[key];
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Set specific address as Primary
 * @route   PUT /api/users/addresses/:addressId/primary
 */
exports.setPrimaryAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate the address exists
    const targetAddr = user.addresses.id(addressId);
    if (!targetAddr) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Set target to true, all others to false
    user.addresses.forEach((addr) => {
      // Compare ObjectIDs using toString()
      if (addr._id.toString() === addressId) {
        addr.primary = true;
      } else {
        addr.primary = false;
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Primary address updated",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete an address
 * @route   DELETE /api/users/addresses/:addressId
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    const addressToDelete = user.addresses.id(addressId);
    if (!addressToDelete) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Check if we are deleting the primary address
    const wasPrimary = addressToDelete.primary;

    // Remove the address
    user.addresses.pull(addressId);

    // If we deleted the primary address, make the first available address primary
    if (wasPrimary && user.addresses.length > 0) {
      user.addresses[0].primary = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      addresses: user.addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
