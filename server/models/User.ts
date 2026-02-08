import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser {
  _id: string;
  email: string;
  password?: string; // Optional for Google users
  displayName: string;
  avatarUrl?: string;
  googleId?: string; // Added for Google Login
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // Changed to false for Google users
      minlength: 6,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
    },
    googleId: {
      // Added for Google OAuth identification
      type: String,
      unique: true,
      sparse: true, // Allows multiple nulls for tradition users
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving - Only if password exists
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
