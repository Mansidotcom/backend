import express from "express";
import "dotenv/config";
import connectDB from "./database/db.js";
import userRoute from "./routes/UserRoute.js";
import cors from "cors";
import productRoutes from "./routes/productsRout.js";
import cartRoute from "./routes/cartRoute.js";
import orderRoute from "./routes/orderRoute.js"

const app = express();


const PORT = process.env.PORT || 8000;


app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);



app.use("/api/v1/user", userRoute);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/orders", orderRoute);



app.listen(PORT, () => {
  connectDB();
  console.log(`server is listening at port:${PORT}`);
});
