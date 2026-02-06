
import razorpayInstance from "../config/razorpay.js"
import { Cart } from "../models/cartModel.js"
import { Order } from "../models/orderModel.js"
import { Product } from "../models/productsModel.js"
import { User } from "../models/userModels.js"




export const createOrder = async (req, res) => {
  try {
    const { products, amount, tax, shipping, currency } = req.body

    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`
    }

    const razorpayOrder = await razorpayInstance.orders.create(options)

    // save order in DB
    const newOrder = new Order({
      user: req.user._id,
      products,
      amount,
      tax,
      shipping,
      currency: currency || "INR",
      status: "Pending",
      razorpayOrderId: razorpayOrder.id,
    })

    await newOrder.save()

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      dbOrder: newOrder,
    })
  } catch (error) {
    console.error("Error in create order:", error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentFailed
    } = req.body

    if (paymentFailed) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: "Failed" },
        { new: true }
      )

      return res.status(400).json({
        success: false,
        message: "payment failed",
        order
      })
    }

    const sign = razorpay_order_id + "" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET) // ✅ typo fix
      .update(sign.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "Paid",
          razorpayPaymentId: razorpay_payment_id // ✅ fixed
        },
        { new: true }
      )

      return res.status(200).json({
        success: true,
        order
      })
    }

    return res.status(400).json({
      success: false,
      message: "Invalid signature"
    })

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }
}


export const getMyOrder = async (req, res) => {
  try {


    console.log("USER:", req.user);

    const userId = req.user._id;   

    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg"
      })
      .populate("user", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.log("Error fetching user orders:", error);
    res.status(500).json({ message: error.message });
  }
};




//Admin Only

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ auth se user

    const orders = await Order.find({ user: userId })
      .populate({
        path: "products.productId",
        select: "productName productPrice productImg"
      })
      .populate("user", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.log("Error fetching user order:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrderAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 }) 
      .populate("user", "firstName lastName email") 
      .populate("products.productId", "productName productPrice"); 

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "failed to fetch all orders",
      error: error.message
    });
  }
};

export const getSalesData = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProduct = await Product.countDocuments({});
    const totalOrders = await Order.countDocuments({ status: "Paid" });

    //  Total sales amount
    const totalSaleAgg = await Order.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalSales = totalSaleAgg[0]?.total || 0;

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDate = await Order.aggregate([
      {
        $match: {
          status: "Paid",
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedSales = salesByDate.map(item => ({
      date: item._id,
      amount: item.amount
    }));

    res.status(200).json({
      success: true,
      totalUsers,
      totalProduct,
      totalOrders,
      totalSales,
      sales: formattedSales
    });

  } catch (error) {
    console.error("Error fetching sales data:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

