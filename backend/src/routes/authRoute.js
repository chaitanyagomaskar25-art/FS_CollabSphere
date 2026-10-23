import { Router } from "express";
import { getme, login, logout, register, updateUserProfile } from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

export const authRouter = Router()

authRouter.post("/register", register)
authRouter.post("/login", login)
authRouter.put("/profile",protect, updateUserProfile)

authRouter.post("/logout", logout)

authRouter.get("/profile", getme)


