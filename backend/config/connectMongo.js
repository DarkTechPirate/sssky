const mongoose = require("mongoose");

const connectMongo = async () => {
  try {
    const uri = process.env.MONGO_DB?.trim() || "mongodb://127.0.0.1:27017/checklist_central";

    if (!process.env.MONGO_DB) {
      console.warn("⚠️  MONGO_DB not set — using fallback mongodb://127.0.0.1:27017/checklist_central");
    }

    // Instrument query exec to log slow queries (>100ms)
    const origExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = async function (...args) {
      const start = Date.now();
      try {
        const res = await origExec.apply(this, args);
        const duration = Date.now() - start;
        if (duration > 100) {
          console.warn(
            `🐢 Slow query: ${this.model.collection.name}.${this.op} ${JSON.stringify(this.getQuery())} took ${duration}ms`
          );
        }
        return res;
      } catch (err) {
        throw err;
      }
    };

    await mongoose.connect(uri, {
      family: 4, // Force IPv4
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      writeConcern: { w: "majority" },
    });

    console.log("✅ MongoDB connected & pool ready");

    mongoose.connection.on("connected", () => console.log("ℹ️ MongoDB connection established"));
    mongoose.connection.on("reconnected", () => console.log("♻️ MongoDB reconnected"));
    mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));
    mongoose.connection.on("close", () => console.warn("⚠️ MongoDB connection closed"));
    mongoose.connection.on("error", (err) => console.error("❌ MongoDB connection error:", err));
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message || err);
    process.exit(1);
  }
};

module.exports = connectMongo;
