import { Cart } from "../models/cartModel.js"; 
import { Product } from "../models/productsModel.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: null,
      });
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [
          {
            productId,
            quantity: 1,
            price: product.productPrice,
          },
        ],
        totalPrice: product.productPrice,
      });
    } else {
      const itemsIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId.toString()
      );

      if (itemsIndex !== -1) {
        cart.items[itemsIndex].quantity += 1;
      } else {
        cart.items.push({
          productId,
          quantity: 1,
          price: product.productPrice,
        });
      }

      // ✅ THIS WAS MISSING (ROOT CAUSE)
      cart.totalPrice = cart.items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate(
      "items.productId"
    );

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      cart: populatedCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const updateQuantity = async (req, res) => {
  try {
    const userId = req.user.id; // ✅ FIX
    const { productId, type } = req.body;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }

    // ✅ quantity logic
    if (type === "increase") {
      cart.items[itemIndex].quantity += 1;
    } else if (type === "decrease") {
      if (cart.items[itemIndex].quantity > 1) {
        cart.items[itemIndex].quantity -= 1;
      } else {
        // remove item if quantity becomes 0
        cart.items.splice(itemIndex, 1);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid update type",
      });
    }

    // ✅ recalculate total price
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.productId");

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ userId });

    // अगर cart ही नहीं है
    if (!cart) {
      return res.json({
        success: true,
        cart: { items: [], totalPrice: 0 },
      });
    }

    // product remove
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    // अगर cart खाली हो गया
    if (cart.items.length === 0) {
      await Cart.findByIdAndDelete(cart._id);

      return res.json({
        success: true,
        cart: { items: [], totalPrice: 0 },
      });
    }

    // total recalc
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    await cart.save();
    await cart.populate("items.productId");

    res.json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


