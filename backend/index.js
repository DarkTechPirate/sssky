require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Config
require("./config/passport")(passport);
const connectMongo = require("./config/connectMongo");

// Controllers for seeding
const { seedAdmin } = require("./controllers/authControllers");

const app = express();
const httpServer = createServer(app);

// Socket.IO configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3002",
    process.env.CLIENT_URL
].filter(Boolean);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
    path: "/api/socket",
});

// Middleware
app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked origin: ${origin}`);
                callback(null, true); // Allow anyway in development
            }
        },
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

// Attach io to req for controllers to emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.IO connection handling
io.on("connection", async (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Bootstrap
const port = process.env.PORT || 3001;

(async () => {
    try {
        // Connect to MongoDB (Atlas or local)
        await connectMongo();

        // Seed only the admin (no employees seeded - created by admin)
        await seedAdmin();

        // Mount API routes
        app.use("/api", require("./routes/index"));

        // Start server
        httpServer.listen(port, "0.0.0.0", () => {
            console.log(`☑️ Server running on port ${port}`);
            console.log(`📦 Database: ${process.env.MONGO_DB ? "MongoDB Atlas" : "Local MongoDB"}`);
        });
    } catch (err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
})();

// Graceful shutdown
const mongoose = require("mongoose");
process.on("SIGINT", async () => {
    console.log("Shutting down...");
    await mongoose.connection.close();
    process.exit(0);
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
});
