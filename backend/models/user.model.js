import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    lastlogin: { type:Date, required: true, default: Date.now},
    email: {type:String, required: true},
    isVerified: {type:Boolean, required: false},
  
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  verificationToken: String,
  verificationTokenExpiresAt:Date
}
  ,{timestamps: true});
  export const User= mongoose.model("User",userSchema);