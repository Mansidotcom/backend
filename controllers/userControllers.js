import cloudinary, { uploadToCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyEmail } from "../emailVerify/verifyEmail.js";
import { Session } from "../models/sessionModel.js";
import { sendOTPEMail } from "../emailVerify/sendOTPMail.js";




export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: "user already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    newUser.token = token
    await newUser.save()

    setTimeout(() => {
      verifyEmail(token, email);
    }, 0);


    return res.status(201).json({
      success: true,
      message: "user registered successfully",
      user: newUser
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verify = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    user.token = null;
    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const reVerify = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found"
      })
    }


    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "user already verified",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,   // ✅ FIXED
      { expiresIn: "10m" }
    );

    user.token = token
    await user.save()

    verifyEmail(token, email);

    return res.status(200).json({
      success: true,
      message: "verification email sent again successfully",

    })
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not exists",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Verify your account then login",
      });
    }

    const accessToken = jwt.sign(
      {
        id: existingUser._id,
        role: existingUser.role   // 
      },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );


    const refreshToken = jwt.sign(
      { id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "10d" }
    );

    existingUser.isLoggedIn = true;
    await existingUser.save();

    const existingSession = await Session.findOne({
      userId: existingUser._id,
    });
    if (existingSession) {
      await Session.deleteOne({ userId: existingUser._id });
    }

    await Session.create({ userId: existingUser._id });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${existingUser.firstname}`,
      user: existingUser,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    await Session.deleteOne({ userId });

    await User.findByIdAndUpdate(userId, {
      isLoggedIn: false,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 min

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendOTPEMail(otp, email);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const otpVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.otp || user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user._id;   // ✅ FIX

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const allUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpiry");

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -otp -otpExpiry -token")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found"
      })
    }
    res.status(200).json({
      success: true,
      user,
    })
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })

  }
}


export const updateUser = async (req, res) => {
  try {

    const userIdToUpdate = req.params.id;
    const loggedInUser = req.user;

    const {
      firstname,
      lastname,
      address,
      city,
      zipCode,
      phoneNo,
    } = req.body;

    //Authorization check
    if (
  !loggedInUser ||
  (
    loggedInUser._id.toString() !== userIdToUpdate &&
    loggedInUser.role !== "admin"
  )
) {
  return res.status(403).json({
    success: false,
    message: "You are not allowed to update this profile",
  });
}


    const user = await User.findById(userIdToUpdate); // ✅ FIX
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profilePicUrl = user.profilePic;
    let profilePicPublicId = user.profilePicPublicId;

    //  Image upload
   if (req.file) {
  if (user.profilePicPublicId && typeof user.profilePicPublicId === "string") {
    await cloudinary.uploader.destroy(user.profilePicPublicId);
  }

  // upload new image
  const result = await uploadToCloudinary(req.file.buffer);

  profilePicUrl = result.secure_url;
  profilePicPublicId = result.public_id;
}



    //  Update fields
    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.address = address || user.address;
    user.city = city || user.city;
    user.zipCode = zipCode || user.zipCode;
    user.phoneNo = phoneNo || user.phoneNo;
    user.profilePic = profilePicUrl;
    user.profilePicPublicId = profilePicPublicId;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log("UPDATE USER ERROR 👉", error); 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};