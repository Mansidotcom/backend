import mongoose from "mongoose";

const productsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, //  Types (plural)
      ref: "User",
    },

    productName: { type: String, required: true },
    productDesc: { type: String, required: true },

    productimg: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    productPrice: { type: Number, required: true }, //  Nummber → ✅ Number
    category: { type: String },
    brand: { type: String },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productsSchema);
