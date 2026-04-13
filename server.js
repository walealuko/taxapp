require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://simplynow48_db_user:x1kTJ3kbbn4pYlrs@cluster0.cp4zsze.mongodb.net/taxapp";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Tax Calculation History Schema
const taxCalculationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taxType: { type: String, required: true },
  input: mongoose.Schema.Types.Mixed,
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const TaxCalculation = mongoose.model("TaxCalculation", taxCalculationSchema);

const TAX_TYPES = {
  PAYE: "paye",
  VAT: "vat",
  WHT: "wht",
  CGT: "cgt"
};

// Nigeria PAYE Tax Brackets (Annual)
const PAYE_BRACKETS = [
  { min: 0, max: 300000, rate: 0, fixed: 0 },
  { min: 300001, max: 600000, rate: 0.07, fixed: 0 },
  { min: 600001, max: 1100000, rate: 0.11, fixed: 21000 },
  { min: 1100001, max: 1600000, rate: 0.15, fixed: 76000 },
  { min: 1600001, max: 2100000, rate: 0.19, fixed: 151000 },
  { min: 2100001, max: 2600000, rate: 0.21, fixed: 246000 },
  { min: 2600001, max: 3100000, rate: 0.24, fixed: 351000 },
  { min: 3100001, max: Infinity, rate: 0.24, fixed: 471000 }
];

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Calculate PAYE tax based on Nigeria tax brackets
const calculatePAYE = (annualIncome) => {
  for (const bracket of PAYE_BRACKETS) {
    if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
      return (annualIncome - bracket.min) * bracket.rate + bracket.fixed;
    }
  }
  return 0;
};

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, firstName, lastName });
    await user.save();

    res.json({ msg: "Registration successful", userId: user._id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "24h"
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's tax calculation history
app.get("/api/tax/history", authMiddleware, async (req, res) => {
  try {
    const history = await TaxCalculation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// PAYE Tax Calculation
app.post("/api/tax/paye", authMiddleware, async (req, res) => {
  try {
    const { grossIncome, frequency = "annual" } = req.body;
    if (!grossIncome || grossIncome <= 0) {
      return res.status(400).json({ error: "Valid gross income required" });
    }

    const annualIncome = frequency === "monthly" ? grossIncome * 12 : grossIncome;
    const annualTax = calculatePAYE(annualIncome);
    const monthlyTax = annualTax / 12;

    const result = {
      taxType: TAX_TYPES.PAYE,
      grossIncome,
      frequency,
      annualIncome,
      annualTax,
      monthlyTax: Math.round(monthlyTax * 100) / 100
    };

    // Save to history
    await TaxCalculation.create({
      userId: req.user.id,
      taxType: TAX_TYPES.PAYE,
      input: { grossIncome, frequency },
      result
    });

    res.json(result);
  } catch (err) {
    console.error("PAYE error:", err);
    res.status(500).json({ error: "PAYE calculation failed" });
  }
});

// VAT Calculation (Standard rate 7.5%)
app.post("/api/tax/vat", authMiddleware, async (req, res) => {
  try {
    const { revenue, rate = 0.075 } = req.body;
    if (!revenue || revenue <= 0) {
      return res.status(400).json({ error: "Valid revenue required" });
    }

    const vatAmount = revenue * rate;
    const netAmount = revenue - vatAmount;

    const result = {
      taxType: TAX_TYPES.VAT,
      revenue,
      vatRate: rate,
      vatAmount: Math.round(vatAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    };

    // Save to history
    await TaxCalculation.create({
      userId: req.user.id,
      taxType: TAX_TYPES.VAT,
      input: { revenue, rate },
      result
    });

    res.json(result);
  } catch (err) {
    console.error("VAT error:", err);
    res.status(500).json({ error: "VAT calculation failed" });
  }
});

// Withholding Tax Calculation
app.post("/api/tax/wht", authMiddleware, async (req, res) => {
  try {
    const { amount, category = "contractor" } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount required" });
    }

    const WHT_RATES = {
      contractor: 0.05,
      dividend: 0.10,
      rent: 0.10,
      interest: 0.10,
      royalty: 0.15
    };

    const rate = WHT_RATES[category] || 0.05;
    const withholdingTax = amount * rate;
    const netPayment = amount - withholdingTax;

    const result = {
      taxType: TAX_TYPES.WHT,
      grossAmount: amount,
      category,
      whtRate: rate,
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      netPayment: Math.round(netPayment * 100) / 100
    };

    // Save to history
    await TaxCalculation.create({
      userId: req.user.id,
      taxType: TAX_TYPES.WHT,
      input: { amount, category },
      result
    });

    res.json(result);
  } catch (err) {
    console.error("WHT error:", err);
    res.status(500).json({ error: "WHT calculation failed" });
  }
});

// Capital Gains Tax
app.post("/api/tax/cgt", authMiddleware, async (req, res) => {
  try {
    const { disposalProceeds, costBase, expenses = 0 } = req.body;
    if (!disposalProceeds || disposalProceeds <= 0) {
      return res.status(400).json({ error: "Valid disposal proceeds required" });
    }

    const cost = costBase || 0;
    const gain = disposalProceeds - cost - expenses;
    const cgt = gain > 0 ? gain * 0.10 : 0;

    const result = {
      taxType: TAX_TYPES.CGT,
      disposalProceeds,
      costBase: cost,
      allowableExpenses: expenses,
      chargeableGain: Math.max(0, gain),
      cgtRate: 0.10,
      capitalGainsTax: Math.round(cgt * 100) / 100
    };

    // Save to history
    await TaxCalculation.create({
      userId: req.user.id,
      taxType: TAX_TYPES.CGT,
      input: { disposalProceeds, costBase, expenses },
      result
    });

    res.json(result);
  } catch (err) {
    console.error("CGT error:", err);
    res.status(500).json({ error: "CGT calculation failed" });
  }
});

// Tax Summary (Combined view)
app.post("/api/tax/summary", authMiddleware, async (req, res) => {
  try {
    const { grossIncome, revenue, withholdingAmounts = {} } = req.body;
    const payeAnnual = grossIncome ? calculatePAYE(grossIncome) : 0;
    const vatAmount = revenue ? revenue * 0.075 : 0;
    const totalWht = Object.values(withholdingAmounts).reduce((sum, amt) => sum + (amt || 0), 0);

    res.json({
      income: { gross: grossIncome || 0, annualTax: payeAnnual },
      vat: { revenue: revenue || 0, vatAmount },
      totalWithholdingTax: totalWht,
      totalEstimatedTax: payeAnnual + vatAmount + totalWht,
      breakdown: {
        paye: Math.round(payeAnnual * 100) / 100,
        vat: Math.round(vatAmount * 100) / 100,
        wht: Math.round(totalWht * 100) / 100
      }
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ error: "Summary calculation failed" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Tax API running on port ${PORT}`));
