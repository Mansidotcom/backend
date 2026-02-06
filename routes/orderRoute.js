import express from "express"
import { isAdmin, isAuthenticated } from "../middleware/isAuthenticated.js"
import { createOrder, verifyPayment, getMyOrder, getAllOrderAdmin, getUserOrders, getSalesData } from "../controllers/orderController.js"

const router = express.Router()

router.post("/create-order", isAuthenticated, createOrder)
router.post("/verify-payment", isAuthenticated, verifyPayment)
router.get("/my-orders", isAuthenticated, getMyOrder)
router.get("/all", isAuthenticated, isAdmin,getAllOrderAdmin)
router.get("/user-order/:userId", isAuthenticated, isAdmin,getUserOrders)
router.get("/sales", isAuthenticated, isAdmin,getSalesData)

export default router