import jwt from "jsonwebtoken";
import { User } from "../model/userModel.js";
import bcrypt from "bcrypt";
import { RefreshToken } from "../model/refreshToken.js";

export const register = async (req, res) => {
  try {
    const { name, email, password, avatar, bio, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(409).json({
        message: "User with this email already exists.",
      });
    }
    const user = User({
      name,
      email,
      password,
      role,
      bio,
      avatar,
    });

    await user.save();

    res.status(201).json({
      message: "User is resgistered.",
      data: user,
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: error.message || "Registration failed.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: "Email and password is required.",
      });
    }

    const userExist = await User.findOne({ email }).select("+password");

    if (!userExist) {
      return res.status(401).json({
        message: "User does not exist.",
      });
    }

    const matchPassword = await bcrypt.compare(password, userExist.password);

    if (!matchPassword) {
      return res.status(401).json({
        message: "User email or password does not match",
      });
    }
    const access_token = jwt.sign(
      {
        userId: userExist._id,
        email: userExist.email,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: "15m" },
    );

    const refresh_token = jwt.sign(
      {
        userExistId: userExist._id,
        email: userExist.email,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: "7d" },
    );

    await RefreshToken.create({
      user: userExist._id,
      token: refresh_token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: userExist._id,
        name: userExist.name,
        email: userExist.email,
        bio: userExist.bio,
        avatar: userExist.avatar,
        role: userExist.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getme = async (req, res) => {
  try {
    let accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;

    const cookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    };

    let decoded;

    if (accessToken) {
      try {
        decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
      } catch {
        decoded = null;
      }
    }

    if (!decoded) {
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: "Please log in again",
        });
      }

      let refreshDecoded;

      try {
        refreshDecoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
      } catch {
        return res.status(401).json({
          success: false,
          message: "Refresh token is invalid or expired. Please log in again.",
        });
      }

      const existingToken = await RefreshToken.findOne({
        token: refreshToken,
        user: refreshDecoded.userId,
      });

      if (!existingToken || existingToken.expiresAt <= new Date()) {
        return res.status(401).json({
          success: false,
          message: "Refresh token not found or expired. Please log in again.",
        });
      }

      accessToken = jwt.sign(
        { userId: refreshDecoded.userId },
        process.env.ACCESS_TOKEN,
        { expiresIn: "15m" },
      );

      res.cookie("access_token", accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
      });

      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User found",
      user,
    });
  } catch (error) {
    console.error("getme error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { revoked: true },
      );
    }

    res.clearCookie("refresh_token");
    res.clearCookie("access_token");

    res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, bio, avatar, currentPassword, newPassword } = req.body;

    if (typeof name === "string") user.name = name.trim();
    if (typeof bio === "string") user.bio = bio.trim();
    if (typeof avatar === "string") user.avatar = avatar.trim();

    if (newPassword !== undefined && newPassword !== "") {
      if (typeof newPassword !== "string") {
        return res.status(400).json({
          success: false,
          message: "New password must be a string",
        });
      }
      if (typeof currentPassword !== "string" || !currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set a new password",
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is not correct",
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }
      user.password = newPassword;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error updating profile",
    });
  }
};
