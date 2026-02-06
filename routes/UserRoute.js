import express from 'express'
import { allUsers, changePassword, forgotPassword, getUserById, login, logout, otpVerify, register, reVerify, updateUser, verify } from '../controllers/userControllers.js'
import { isAdmin, isAuthenticated } from '../middleware/isAuthenticated.js'
import upload from '../middleware/multer.js'
import { getSalt } from 'bcryptjs'
import { singleUpload } from '../middleware/multer.js'



const router = express.Router() 

router.post('/register',register)

router.get('/verify/:token', verify)
router.post('/reverify',reVerify) 
router.post('/login',login)
router.post("/logout", isAuthenticated,logout)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", otpVerify);
router.post("/change-password", isAuthenticated, changePassword);
router.get("/all-users", isAuthenticated, isAdmin, allUsers);
router.get("/user/:userId", isAuthenticated, isAdmin, getUserById);
router.put("/update/:id", isAuthenticated, singleUpload, updateUser);



export default router;
