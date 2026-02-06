import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  firstname: {
    type: String, required: true
  },
  lastname: {
    type: String, required: true
  },
  profilePic: { type: String, default: "" },//cloundnary imgage url
  profilePicPublicId: { type: String, default: "" }, //cloudnary public_id
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },

  token: { type: String, default: "null" },
  isVerified: { type: Boolean, default: "false" },
  isLoggedIn: { type: Boolean, default: "false" },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  address: { type: String },
  city: { type: String },
  zipCode: { type: String },
  phoneNo: { type: String },
},{ timestamps: true })

export const User = mongoose.model("user", userSchema);