const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
  primary: { type: Boolean, default: false },
  door: { type: String },
  street: { type: String },
  area: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  district: { type: String },
  state: { type: String, required: true },
  country: { type: String, default: "India" },
  zip: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
  },
});

const UserSchema = new Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    username: { type: String },
    fullname: { type: String },

    age: Number,
    gender: { type: String, enum: ["Male", "Female", "Other"] },

    email: { type: String, required: true },
    password: { type: String },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid 10-digit Indian mobile number!`,
      },
    },
    addresses: [AddressSchema],
    createdAt: { type: Date, default: Date.now },
    profilePicture: String,
    role: { type: String, default: "user", enum: ["admin", "user", "staff"] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
