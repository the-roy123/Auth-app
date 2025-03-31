import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { generateCookieAndSetToken } from '../utils/generateCookieAndSetToken.js';
import { sendVerificationEmail,sendWelcomeEmail,sendPasswordResetEmail,sendResetSuccessEmail } from '../mailtrap/emails.js';

const router = express.Router();

export const signup = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    // ✅ Validate required fields
    if (!name || !password || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Generate verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry

    // ✅ Create new user
    const user = new User({
      email,
      password: hashedPassword,
      isVerified: false,
      name,
      verificationToken,
      verificationTokenExpiresAt
    });

    // ✅ Save user to database
    await user.save();

    // ✅ Set authentication cookie
    generateCookieAndSetToken(res, user._id);
    await sendVerificationEmail(user.email,verificationToken);

    // ✅ Respond with success
    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        ...user._doc,
        password: null // Hide password in response
      }
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const verifyEmail=async(req,res)=>
{
    const {code}=req.body;

    try {
        const user=await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt : Date.now()}
        })
        if(!user)
        {
            res.status(400).json({sucess: "false" ,message: "verification token expires"})
        }
        user.isVerified=true;
        user.verificationToken=undefined
        user.verificationTokenExpiresAt=undefined
        await user.save();
        sendWelcomeEmail(user.email,user.name)
        res.status(200).json({success: true, message: false,user:
            {
                ...user._doc,
                password: undefined
            }
        })

        
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Internal server error" });
        
    }
}

// Login route placeholder
export const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}
		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid credentials" });
		}

	generateCookieAndSetToken(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

// Logout route placeholder
export const logout = async (req, res) => {
    res.clearCookie("token")
    res.status(200).json({sucess: "true",message:"logged out sucessfully"})
};
export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `http://localhost:3000/reset-password/${resetToken}`);
    console.log("sent");

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};
export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		// update password
		const hashedPassword = await bcrypt.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};
export const checkAuth = async (req, res) => {
    console.log("Controller: checkAuth - Received User ID:", req.userId); // Debugging

    if (!req.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: No userId found" });
    }

    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found in DB" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Error in checkAuth:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export default router;