const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// const filePath = path.join(__dirname);
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// ----------------- MongoDB connect -----------------
mongoose
  .connect("mongodb://127.0.0.1:27017/foodDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ----------------- Food Schema -----------------
const foodSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
});
const Food = mongoose.model("Food", foodSchema);

// ----------------- User Schema -----------------
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// ----------------- Order Schema -----------------
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // logged-in user
  name: String,
  phone: String,
  address: String,
  items: [
    {
      name: String,
      description: String,
      price: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model("Order", orderSchema);

// ----------------- Routes -----------------

// Get all foods (optional, in case you want to load from DB)

// app.get("/", (req, res) => {
//   res.sendFile(filePath + "/index.html");
// });

app.get("/foods", async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Signup
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    const newUser = new User({ name, email, password });
    await newUser.save();

    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.password !== password)
      return res.status(401).json({ message: "Incorrect password" });

    res.json({ message: "✅ Login successful", userId: user._id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save order
app.post("/orders", async (req, res) => {
  try {
    const { userId, name, phone, address, items } = req.body;

    if (!userId || !name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ message: "Missing fields or empty cart" });
    }

    const order = new Order({ userId, name, phone, address, items });
    await order.save();

    res.json({ message: "✅ Order saved successfully", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all orders (for testing)
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("userId", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- Start Server -----------------
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
