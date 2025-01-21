import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    sessionToken: {
      type: String,
    },
    department: { type: String },
    role: {
      type: String,
      enum: [
        "ClaimantAdmin",
        "Staff",
        "Arbitrator",
        "Respondent",
        "ODRSuperAdmin",
        "ODRAdmin",
        "ODRVendor",
        "ODRVendorStaff",
      ],
      required: true,
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    loginAt:{
        type: Date,
    }
  },
  { timestamps: true }
);

userSchema.methods.isLocked = function () {
    return this.lockUntil && this.lockUntil > Date.now();
  };


const User = mongoose.model("User", userSchema);

export default User;
