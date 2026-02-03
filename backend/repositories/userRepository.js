const User = require("../models/userModel");

/**
 * User Repository - Database operations for User/Employee/Admin
 */
class UserRepository {
    /**
     * Find user by ID
     */
    async findById(id) {
        return User.findById(id).select("-password");
    }

    /**
     * Find user by email
     */
    async findByEmail(email) {
        return User.findOne({ email: email.toLowerCase() });
    }

    /**
     * Find admin by email (for login)
     */
    async findAdminByEmail(email) {
        return User.findOne({ email: email.toLowerCase(), role: "admin" });
    }

    /**
     * Find employee by email
     */
    async findEmployeeByEmail(email) {
        return User.findOne({ email: email.toLowerCase(), role: "employee" });
    }

    /**
     * Find user by Google ID (for OAuth)
     */
    async findByGoogleId(googleId) {
        return User.findOne({ googleId });
    }

    /**
     * Find user by employee ID
     */
    async findByEmployeeId(employeeId) {
        return User.findOne({ employeeId });
    }

    /**
     * Check if user exists by email or employee ID
     */
    async exists(email, employeeId) {
        return User.findOne({
            $or: [
                { email: email?.toLowerCase() },
                { employeeId: employeeId }
            ].filter(Boolean)
        });
    }

    /**
     * Get all employees
     */
    async getAllEmployees() {
        return User.find({ role: "employee" })
            .select("-password")
            .sort({ createdAt: -1 });
    }

    /**
     * Create a new user
     */
    async create(userData) {
        const user = new User({
            ...userData,
            email: userData.email.toLowerCase()
        });
        return user.save();
    }

    /**
     * Update user by ID
     */
    async updateById(id, updates) {
        // Remove immutable fields
        delete updates._id;
        delete updates.id;
        delete updates.createdAt;

        return User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    }

    /**
     * Delete user by ID
     */
    async deleteById(id) {
        return User.findByIdAndDelete(id);
    }

    /**
     * Seed the fixed admin (only one admin)
     */
    async seedAdmin() {
        const ADMIN_EMAIL = "admin@checklist-central.com";
        const ADMIN_PASSWORD = "Admin@123";
        const ADMIN_NAME = "Super Admin";

        const existing = await this.findByEmail(ADMIN_EMAIL);
        if (!existing) {
            await this.create({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                name: ADMIN_NAME,
                role: "admin"
            });
            console.log(`✅ Seeded admin: ${ADMIN_EMAIL}`);
            return true;
        }
        console.log(`ℹ️ Admin already exists: ${ADMIN_EMAIL}`);
        return false;
    }
}

module.exports = new UserRepository();
