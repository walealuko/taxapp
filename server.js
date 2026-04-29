require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const helmet = require("helmet");
const { z } = require("zod");

const app = express();
app.set('trust proxy', 1);

// ============ SECURITY MIDDLEWARE ============

// Helmet security headers
app.use(helmet());

// CORS - configurable allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
const app = express();

// Validate ALLOWED_ORIGINS is configured in production
if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
  console.warn('WARNING: ALLOWED_ORIGINS not set - CORS will block all requests');
}
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ maxLength: "10kb" })); // Limit body size

// ============ RATE LIMITING ============

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { error: "Too many registration attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset attempts, please try again in an hour" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ============ VALIDATION SCHEMAS ============

const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  customerType: z.enum(['individual', 'sme', 'company']).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const payeSchema = z.object({
  grossIncome: z.number().positive("Gross income must be positive").max(1_000_000_000_000, "Income exceeds maximum allowed"),
  frequency: z.enum(["monthly", "annual"]).default("annual"),
  expenses: z.number().min(0, "Expenses cannot be negative").max(1_000_000_000_000).default(0),
});

const vatSchema = z.object({
  revenue: z.number().positive("Revenue must be positive").max(1_000_000_000_000),
  rate: z.number().min(0).max(1).default(0.075),
});

const whtSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1_000_000_000_000),
  category: z.enum(["contractor", "dividend", "rent", "interest", "royalty", "professional", "director"]).default("contractor"),
});

const cgtSchema = z.object({
  disposalProceeds: z.number().positive("Disposal proceeds must be positive").max(1_000_000_000_000),
  costBase: z.number().min(0).max(1_000_000_000_000).default(0),
  expenses: z.number().min(0).max(1_000_000_000_000).default(0),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

// Validation helper
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    return res.status(400).json({ error: "Validation failed" });
  }
};

// ============ MONGOOSE SETUP ============

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI environment variable is not set");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("FATAL: MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ============ SCHEMAS ============

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  customerType: { type: String, enum: ['individual', 'sme', 'company'], default: 'individual' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

const taxCalculationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taxType: { type: String, required: true },
  input: mongoose.Schema.Types.Mixed,
  result: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const TaxCalculation = mongoose.model("TaxCalculation", taxCalculationSchema);

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

// ============ CONSTANTS ============

const TAX_TYPES = { PAYE: "paye", VAT: "vat", WHT: "wht", CGT: "cgt" };

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

const WHT_RATES = {
  contractor: 0.05, dividend: 0.10, rent: 0.10, interest: 0.10,
  royalty: 0.15, professional: 0.05, director: 0.10
};

// ============ AUTH MIDDLEWARE ============

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
  process.exit(1);
}

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const generateTokens = (userId, email) => {
  const accessToken = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: "15m" });
  const refreshTokenValue = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return { accessToken, refreshToken: refreshTokenValue, refreshExpiresAt: expiresAt };
};

// Token cleanup
setInterval(async () => {
  try {
    const deleted = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
    if (deleted.deletedCount > 0) console.log(`Cleaned ${deleted.deletedCount} expired refresh tokens`);
  } catch (err) {
    console.error("Refresh token cleanup error:", err);
  }
}, 24 * 60 * 60 * 1000);

// ============ TAX CALCULATIONS ============

const calculatePAYE = (annualIncome) => {
  for (const bracket of PAYE_BRACKETS) {
    if (annualIncome >= bracket.min && annualIncome <= bracket.max) {
      return (annualIncome - bracket.min) * bracket.rate + bracket.fixed;
    }
  }
  return 0;
};

// ============ HEALTH CHECK ============

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "TaxApp API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Backward compat health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// ============ AUTH ROUTES ============

app.post("/api/v1/auth/register", registerLimiter, async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { email, password, firstName, lastName, customerType } = validation.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, firstName, lastName, customerType });
    await user.save();

    res.json({ msg: "Registration successful", userId: user._id });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/v1/auth/login", authLimiter, async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { email, password } = validation.data;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Invalid credentials" });

    const { accessToken, refreshToken, refreshExpiresAt } = generateTokens(user._id, user.email);
    await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: refreshExpiresAt });

    res.json({
      accessToken, refreshToken, expiresIn: 900,
      user: { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/v1/auth/refresh", authLimiter, async (req, res) => {
  try {
    const validation = refreshSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { refreshToken } = validation.data;
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) return res.status(401).json({ error: "Invalid refresh token" });
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ error: "Refresh token expired" });
    }

    const user = await User.findById(storedToken.userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    await RefreshToken.deleteOne({ _id: storedToken._id });
    const { accessToken, refreshToken: newRefreshToken, refreshExpiresAt } = generateTokens(user._id, user.email);
    await RefreshToken.create({ token: newRefreshToken, userId: user._id, expiresAt: refreshExpiresAt });

    res.json({ accessToken, refreshToken: newRefreshToken, expiresIn: 900 });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

app.post("/api/v1/auth/logout", authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken, userId: req.user.id });
    }
    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
});

app.get("/api/v1/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Password reset request
app.post("/api/v1/auth/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ msg: "If the email exists, a reset link has been sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // In production, send email with reset link:
    // const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    // TODO: Implement email sending (e.g., via SendGrid, Resend, etc.)
    // console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({ msg: "If the email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Request failed" });
  }
});

app.post("/api/v1/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

// ============ TAX ROUTES ============

app.get("/api/v1/tax/history", authMiddleware, async (req, res) => {
  try {
    const history = await TaxCalculation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.post("/api/v1/tax/paye", authMiddleware, async (req, res) => {
  try {
    const validation = payeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { grossIncome, frequency, expenses } = validation.data;
    const annualIncome = frequency === "monthly" ? grossIncome * 12 : grossIncome;
    const annualExpenses = frequency === "monthly" ? expenses * 12 : expenses;
    const taxableIncome = Math.max(0, annualIncome - annualExpenses);
    const annualTax = calculatePAYE(taxableIncome);
    const monthlyTax = annualTax / 12;

    const result = {
      taxType: TAX_TYPES.PAYE,
      grossIncome,
      frequency,
      expenses: annualExpenses,
      annualIncome,
      taxableIncome,
      annualTax,
      monthlyTax: Math.round(monthlyTax * 100) / 100
    };

    await TaxCalculation.create({ userId: req.user.id, taxType: TAX_TYPES.PAYE, input: { grossIncome, frequency, expenses: annualExpenses }, result });
    res.json(result);
  } catch (err) {
    console.error("PAYE error:", err);
    res.status(500).json({ error: "PAYE calculation failed" });
  }
});

app.post("/api/v1/tax/vat", authMiddleware, async (req, res) => {
  try {
    const validation = vatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { revenue, rate } = validation.data;
    const vatAmount = revenue * rate;

    const result = {
      taxType: TAX_TYPES.VAT,
      revenue,
      vatRate: rate,
      vatAmount: Math.round(vatAmount * 100) / 100,
      netAmount: Math.round((revenue - vatAmount) * 100) / 100
    };

    await TaxCalculation.create({ userId: req.user.id, taxType: TAX_TYPES.VAT, input: { revenue, rate }, result });
    res.json(result);
  } catch (err) {
    console.error("VAT error:", err);
    res.status(500).json({ error: "VAT calculation failed" });
  }
});

app.post("/api/v1/tax/wht", authMiddleware, async (req, res) => {
  try {
    const validation = whtSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { amount, category } = validation.data;
    const rate = WHT_RATES[category] || 0.05;
    const withholdingTax = amount * rate;

    const result = {
      taxType: TAX_TYPES.WHT,
      grossAmount: amount,
      category,
      whtRate: rate,
      withholdingTax: Math.round(withholdingTax * 100) / 100,
      netPayment: Math.round((amount - withholdingTax) * 100) / 100
    };

    await TaxCalculation.create({ userId: req.user.id, taxType: TAX_TYPES.WHT, input: { amount, category }, result });
    res.json(result);
  } catch (err) {
    console.error("WHT error:", err);
    res.status(500).json({ error: "WHT calculation failed" });
  }
});

app.post("/api/v1/tax/cgt", authMiddleware, async (req, res) => {
  try {
    const validation = cgtSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { disposalProceeds, costBase, expenses } = validation.data;
    const gain = disposalProceeds - costBase - expenses;
    const cgt = gain > 0 ? gain * 0.10 : 0;

    const result = {
      taxType: TAX_TYPES.CGT,
      disposalProceeds,
      costBase,
      allowableExpenses: expenses,
      chargeableGain: Math.max(0, gain),
      cgtRate: 0.10,
      capitalGainsTax: Math.round(cgt * 100) / 100
    };

    await TaxCalculation.create({ userId: req.user.id, taxType: TAX_TYPES.CGT, input: { disposalProceeds, costBase, expenses }, result });
    res.json(result);
  } catch (err) {
    console.error("CGT error:", err);
    res.status(500).json({ error: "CGT calculation failed" });
  }
});

app.post("/api/v1/tax/summary", authMiddleware, async (req, res) => {
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

// Tax news (public)
const TAX_NEWS = [
  {
    id: '1', title: 'New PAYE Thresholds for 2024',
    body: 'The Federal Inland Revenue Service (fIRS) has announced updated personal income tax brackets effective January 2024. The minimum tax-free threshold has been increased to ₦300,000 annually, with progressive rates ranging from 7% to 24%.',
    date: '2024-03-15', category: 'PAYE Update',
  },
  {
    id: '2', title: 'VAT Rate Increased to 7.5%',
    body: 'Following the VAT (Amendment) Act 2022, the standard VAT rate in Nigeria has increased from 5% to 7.5%. This change applies to all taxable supplies of goods and services unless specifically exempted or zero-rated.',
    date: '2024-02-28', category: 'VAT Change',
  },
  {
    id: '3', title: 'Q2 2026 Tax Filing Deadline',
    body: 'The fIRS has announced the Q2 2026 tax filing deadline. All PAYE, VAT, and Withholding Tax filings must be submitted by July 31, 2026. Taxpayers who require additional time should submit a formal application for an extension.',
    date: '2026-01-15', category: 'Deadline',
  },
  {
    id: '4', title: 'fIRS Launches Enhanced e-Filing Portal',
    body: 'The Federal Inland Revenue Service has launched an upgraded e-filing portal with enhanced features for faster processing of tax returns. The new portal includes automated PAYE calculations and real-time VAT updates.',
    date: '2025-11-20', category: 'fIRS Announcement',
  },
];

app.get("/api/v1/tax/news", (req, res) => {
  res.json(TAX_NEWS);
});

// Backward compatibility - redirect old paths to v1
app.use("/api/tax/news", (req, res) => res.redirect("/api/v1/tax/news"));
app.use("/api/tax/history", (req, res) => res.redirect("/api/v1/tax/history"));

// ============ START SERVER ============

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Tax API v1 running on ${HOST}:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
});
