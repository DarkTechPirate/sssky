const userRepository = require("../repositories/userRepository");
const generateTokenAndSetCookie = require("../utils/generateToken");

/**
 * Admin Login
 * POST /api/auth/admin/login
 */
exports.adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        // Admin login uses email format: admin@checklist-central.com
        // But accepts username "admin" for convenience
        const adminEmail = username.includes("@") ? username : "admin@checklist-central.com";
        const admin = await userRepository.findAdminByEmail(adminEmail);

        if (!admin) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        // Verify password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }

        // Generate token and set cookie
        const token = generateTokenAndSetCookie(res, admin._id);

        res.json({
            success: true,
            admin: {
                id: admin._id,
                username: admin.email.split("@")[0],
                name: admin.name,
                role: admin.role,
            },
            token,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

/**
 * Employee Login
 * POST /api/auth/employee/login
 */
exports.employeeLogin = async (req, res) => {
    try {
        const { email, password, companyId } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find employee by email
        const employee = await userRepository.findEmployeeByEmail(email);

        if (!employee) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await employee.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify company if provided
        if (companyId && employee.companyId !== companyId) {
            return res.status(401).json({ error: "Invalid company selection" });
        }

        // Generate token and set cookie
        const token = generateTokenAndSetCookie(res, employee._id);

        res.json({
            success: true,
            employee: {
                id: employee._id,
                email: employee.email,
                name: employee.name,
                employeeId: employee.employeeId,
                companyId: employee.companyId,
                role: employee.role,
            },
            token,
        });
    } catch (error) {
        console.error("Employee login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

/**
 * Logout
 * GET /api/auth/logout
 */
exports.logout = (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
    });

    res.status(200).json({ message: "Logged out successfully" });
};

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
exports.me = async (req, res) => {
    try {
        const user = await userRepository.findById(req.user._id);

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Me error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
};

/**
 * Seed admin user (called on server startup)
 */
exports.seedAdmin = async () => {
    return userRepository.seedAdmin();
};
