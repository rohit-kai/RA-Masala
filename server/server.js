import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';

// Import Models
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Ticket from './models/Ticket.js';
import OrderItem from './models/OrderItem.js';
import Cart from './models/Cart.js';
import Payment from './models/Payment.js';
import Review from './models/Review.js';
import Discount from './models/Discount.js';
import Shipping from './models/Shipping.js';
import InventoryLog from './models/InventoryLog.js';
import Wishlist from './models/Wishlist.js';
import SystemConfig from './models/SystemConfig.js';
import SecurityLog from './models/SecurityLog.js';

dotenv.config({ override: true });

// SMTP mailer for password reset emails. Configure SMTP_HOST/SMTP_USER/SMTP_PASS in .env
function getMailer() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
    // Some office/college networks intercept TLS with a self-signed cert.
    // Set SMTP_REJECT_UNAUTHORIZED=false in .env only if your network does this.
    tls: { rejectUnauthorized: (process.env.SMTP_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false' }
  });
}

async function sendResetEmail(toEmail, resetLink) {
  const mailer = getMailer();
  if (!mailer) throw new Error('SMTP is not configured. Set SMTP_HOST in server/.env');
  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'RA Masala <no-reply@ramasala.com>',
    to: toEmail,
    subject: 'RA Masala - Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #aa1a31; color: #fff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">RA Masala</h2>
        </div>
        <div style="padding: 24px;">
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background: #aa1a31; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">Reset Password</a>
          </p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">Customer Care: 7518166686 | ramasale@ymail.com</p>
        </div>
      </div>
    `
  });
}

// Helper to get active payment configurations (database config overrides .env config)
async function getPaymentConfig() {
  const config = await SystemConfig.findOne({ key: 'payment_settings' });
  if (config && config.value) {
    return {
      merchantUpi: config.value.merchantUpi || 'ramasala@upi',
      merchantName: config.value.merchantName || 'RA Masala',
      gatewayKeyId: config.value.gatewayKeyId || process.env.GATEWAY_KEY_ID || '',
      gatewayKeySecret: config.value.gatewayKeySecret || process.env.GATEWAY_KEY_SECRET || ''
    };
  }
  return {
    merchantUpi: 'ramasala@upi',
    merchantName: 'RA Masala',
    gatewayKeyId: process.env.GATEWAY_KEY_ID || '',
    gatewayKeySecret: process.env.GATEWAY_KEY_SECRET || ''
  };
}

// Function to instantiate Razorpay dynamically with configuration settings
async function getRazorpayClient() {
  const cfg = await getPaymentConfig();
  return new Razorpay({
    key_id: cfg.gatewayKeyId || 'rzp_test_mock_id',
    key_secret: cfg.gatewayKeySecret || 'rzp_test_mock_secret'
  });
}

const app = express();
const PORT = process.env.PORT || 5000;
let isMaintenanceMode = false;

app.use(cors());
// Capture the RAW body for the payment webhook so signatures are verified over the exact bytes sent.
app.use('/api/payments/webhook', express.raw({ type: '*/*' }));
app.use(express.json());

// True only when real (non-placeholder) Razorpay credentials are configured.
function isRealGateway(cfg) {
  return !!cfg &&
    !!cfg.gatewayKeyId && !!cfg.gatewayKeySecret &&
    !cfg.gatewayKeyId.includes('xxxx') && !cfg.gatewayKeyId.includes('mock') &&
    !cfg.gatewayKeySecret.includes('xxxx') && !cfg.gatewayKeySecret.includes('mock');
}

// Idempotent helper to mark a payment + order as paid (safe to call multiple times).
async function markOrderPaid(payment, transactionId) {
  const wasPending = payment.status !== 'Completed';
  payment.status = 'Completed';
  payment.transactionId = transactionId || payment.transactionId || 'TXN-' + Math.floor(100000 + Math.random() * 900000);
  await payment.save();

  const order = await Order.findOne({ id: payment.orderId });
  if (order && order.status === 'Pending') {
    order.status = 'Processing';
    await order.save();
  }
  return wasPending;
}

// ---------- Auth Helpers ----------
const isHashed = (pw) => pw && /^\$2[aby]\$/.test(pw);

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function toSafeUser(user) {
  const obj = user && user.toObject ? user.toObject() : (user || {});
  const { password, token, ...safe } = obj;
  if (safe._id) {
    safe.id = safe._id.toString();
  }
  return safe;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ message: 'Invalid or expired session' });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying session' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ message: 'Invalid or expired session' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error verifying session' });
  }
}

async function verifyPassword(user, password) {
  // Returns true + handles auto-migration of legacy plaintext passwords to bcrypt hashes.
  try {
    if (isHashed(user.password)) {
      return await bcrypt.compare(password, user.password);
    }
    const ok = password === user.password;
    if (ok) {
      user.password = password; // pre-save hook hashes it
      await user.save();
    }
    return ok;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Seeder function
async function seedDatabase() {
  try {
    // 1. Seed Products if empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const initialProducts = [
        { name: "Onion Garlic Masala", price: 80, stock: 50, category: "Masale", unit: "250g", description: "Traditional savory spice blend of onions, garlic, and handpicked hot spices.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Authentic Garam Masala", price: 120, stock: 45, category: "Masale", unit: "200g", description: "Generations-old recipe blending 12 aromatic and premium spices.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Kashmiri Red Chili", price: 95, stock: 60, category: "Masale", unit: "250g", description: "Mild heat with a rich, vibrant red color for premium culinary dishes.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Premium Turmeric Powder", price: 65, stock: 80, category: "Spice Home", unit: "250g", description: "Pure, high-curcumin turmeric powder with authentic color and flavor.", image: "/images/ra_waa.png", brand: "spicehome" },
        { name: "Kolhapuri Ghati Masala", price: 90, stock: 35, category: "Masale", unit: "250g", description: "Spicy and bold traditional blend capturing the authentic flavors of Kolhapur.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Traditional Goda Masala", price: 110, stock: 40, category: "Masale", unit: "200g", description: "Aromatic Maharashtrian blend featuring roasted coconut, sesame, and spices.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Coriander Powder", price: 55, stock: 90, category: "Spice Home", unit: "250g", description: "Finely ground from premium coriander seeds, yielding a sweet aromatic scent.", image: "/images/ra_waa.png", brand: "spicehome" },
        { name: "Shahi Biryani Masala", price: 150, stock: 25, category: "Masale", unit: "100g", description: "A royal blend of spices to create perfectly aromatic and flavorful biryani.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Special Pav Bhaji Masala", price: 75, stock: 55, category: "Masale", unit: "100g", description: "The perfect spice blend for making delicious, Mumbai-style street pav bhaji.", image: "/images/ra_waa.png", brand: "masale" },
        { name: "Spicy Potato Chips", price: 40, stock: 100, category: "Namkeen", unit: "150g", description: "Crispy fried golden potato chips seasoned with our special spice blend.", image: "/images/ra_waa.png", brand: "namkeen" },
        { name: "Traditional Sev Bhujia", price: 50, stock: 80, category: "Namkeen", unit: "200g", description: "Crispy and savory chickpea flour noodles infused with traditional spices.", image: "/images/ra_waa.png", brand: "namkeen" },
        { name: "Royal Masala Chai Blend", price: 180, stock: 40, category: "Chaha", unit: "250g", description: "Rich premium black tea leaves blended with cardamom, ginger, and cinnamon.", image: "/images/ra_waa.png", brand: "chaha" },
        { name: "Premium Green Tea", price: 220, stock: 35, category: "Chaha", unit: "150g", description: "Handpicked whole green tea leaves rich in antioxidants and refreshing flavor.", image: "/images/ra_waa.png", brand: "chaha" },
        { name: "Organic Wheat Flour", price: 90, stock: 50, category: "Agro", unit: "1kg", description: "100% organic, stone-ground whole wheat flour packed with fiber and nutrients.", image: "/images/ra_waa.png", brand: "agro" },
        { name: "Pure Agro Mustard Oil", price: 210, stock: 30, category: "Agro", unit: "1L", description: "Cold-pressed pure mustard oil extracted from high-quality yellow mustard seeds.", image: "/images/ra_waa.png", brand: "agro" }
      ];
      await Product.insertMany(initialProducts);
      console.log('Default products seeded');
    }

    // 2. Seed Users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const initialUsers = [
        { name: 'Ramesh Patel', email: 'ramesh@gmail.com', role: 'customer', phone: '9876543210', address: '123, Spice Bazaar', city: 'Mumbai', zip: '400001', password: 'user123' },
        { name: 'Sunita Deshmukh', email: 'sunita@gmail.com', role: 'customer', phone: '9822334455', address: '45, Ghati Lane', city: 'Pune', zip: '411002', password: 'user123' },
        { name: 'RA Masala Admin', email: 'admin@ramasala.com', role: 'admin', password: 'admin123' }
      ];
      // Use create() so the bcrypt pre-save hook hashes the passwords
      for (const user of initialUsers) {
        await User.create(user);
      }
      console.log('Default users seeded');
    }

    // 3. Seed Discounts if empty
    const discountCount = await Discount.countDocuments();
    if (discountCount === 0) {
      const initialDiscounts = [
        { code: 'WELCOMERA', discountType: 'percentage', value: 15, minPurchase: 500, active: true },
        { code: 'FESTIVE50', discountType: 'flat', value: 50, minPurchase: 300, active: true },
        { code: 'SPICE10', discountType: 'percentage', value: 10, minPurchase: 0, active: true }
      ];
      await Discount.insertMany(initialDiscounts);
      console.log('Default discounts seeded');
    }

    // 4. Seed Reviews if empty
    const reviewCount = await Review.countDocuments();
    if (reviewCount === 0) {
      const initialReviews = [
        { productId: 'mock1', productName: 'Onion Garlic Masala', customerName: 'Ramesh Patel', customerEmail: 'ramesh@gmail.com', rating: 5, comment: 'Very delicious and fresh! Authentic Maharashtrian flavor.' },
        { productId: 'mock2', productName: 'Authentic Garam Masala', customerName: 'Sunita Deshmukh', customerEmail: 'sunita@gmail.com', rating: 4, comment: 'Great blend of spices. Perfect for curries.' }
      ];
      await Review.insertMany(initialReviews);
      console.log('Default reviews seeded');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
}

// --- API ROUTES ---

// 1. Users API
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map(toSafeUser));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching users' });
  }
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').toLowerCase();
  const enteredPassword = password || '';

  // Encrypted Default Admin Credentials check
  const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  const passwordHash = crypto.createHash('sha256').update(enteredPassword).digest('hex');

  const adminEmailHash = process.env.ADMIN_EMAIL_HASH;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const adminName = process.env.ADMIN_NAME || 'Kai Super Admin';

  if (adminEmailHash && adminPasswordHash &&
      emailHash === adminEmailHash &&
      passwordHash === adminPasswordHash) {
    let adminUser = await User.findOne({ email: normalizedEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: adminName,
        email: normalizedEmail,
        role: 'admin',
        password: enteredPassword
      });
    }
    adminUser.token = generateToken();
    await adminUser.save();
    return res.json({ ...toSafeUser(adminUser), token: adminUser.token });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
  }

  if (isMaintenanceMode && user.role !== 'admin') {
    return res.status(403).json({ message: 'Note: There is issue in login pls try after some time' });
  }

  const isCorrectPassword = await verifyPassword(user, enteredPassword);
  if (!isCorrectPassword) {
    if (user.role === 'admin') {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 3) {
        user.isActive = false;
        user.failedLoginAttempts = 0; // Reset counter after locking
        await user.save();

        // Create Security Log entry
        await SecurityLog.create({
          adminName: 'System Security',
          adminEmail: 'system@ramasala.com',
          targetName: user.name,
          targetEmail: user.email,
          action: 'system_lockout',
          details: `Admin account locked out after 3 failed login attempts.`
        });

        // Print email alert to Super Admin in log
        console.log(`\n==================================================`);
        console.log(`[SECURITY ALERT - EMAIL SIMULATION]`);
        console.log(`To: Kai Super Admin (superadmin@ramasala.com)`);
        console.log(`Subject: Admin Blocked Alert - ${user.name}`);
        console.log(`Body: Admin account ${user.email} has been deactivated/blocked due to 3 consecutive failed login attempts. Please review the customer management board to activate this account.`);
        console.log(`==================================================\n`);

        return res.status(403).json({ message: 'Account blocked due to 3 failed login attempts.' });
      }
      await user.save();
    }
    return res.status(401).json({ message: 'Invalid password credentials' });
  }

  // Reset counter on successful login
  if (user.failedLoginAttempts > 0) {
    user.failedLoginAttempts = 0;
  }

  user.token = generateToken();
  await user.save();
  res.json({ ...toSafeUser(user), token: user.token });
});

app.post('/api/users/logout', requireAuth, async (req, res) => {
  try {
    req.user.token = null;
    await req.user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error logging out' });
  }
});

app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const newUser = await User.create({ name, email: email.toLowerCase(), password });
    newUser.token = generateToken();
    await newUser.save();
    res.status(201).json({ ...toSafeUser(newUser), token: newUser.token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Error creating user account' });
  }
});

app.put('/api/users/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone, address, city, zip } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.user._id, { name, phone, address, city, zip }, { new: true });
    res.json(toSafeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating profile' });
  }
});

app.put('/api/users/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check current password
    const isCorrect = await verifyPassword(user, currentPassword || '');
    if (!isCorrect) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: error.message || 'Error updating password' });
  }
});

// Forgot password: generate reset token + email reset link
app.post('/api/users/forgot-password', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ message: 'Please provide your email address' });

    const user = await User.findOne({ email });
    // Always return generic success to avoid revealing which emails are registered
    if (!user) {
      return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    try {
      await sendResetEmail(email, resetLink);
    } catch (mailErr) {
      console.error('Error sending reset email:', mailErr);
      return res.status(503).json({ message: 'Could not send the reset email right now. Please try again later.' });
    }

    console.log(`[Password Reset] Reset link generated for ${email}`);
    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: error.message || 'Error processing request' });
  }
});

// Reset password with the emailed token
app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ message: 'Reset token is missing or invalid' });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetToken: tokenHash,
      resetTokenExpires: { $gt: new Date() }
    });
    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.token = null; // invalidate existing sessions
    user.failedLoginAttempts = 0;
    await user.save();

    console.log(`[Password Reset] Password updated for ${user.email}`);
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: error.message || 'Error resetting password' });
  }
});

// Update User Active/Inactive Status
app.put('/api/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isActive, adminName, adminEmail } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.params.id, {
      isActive,
      failedLoginAttempts: 0
    }, { new: true });

    if (updatedUser) {
      await SecurityLog.create({
        adminName: adminName || 'System Administrator',
        adminEmail: adminEmail || 'admin@ramasala.com',
        targetName: updatedUser.name,
        targetEmail: updatedUser.email,
        action: isActive ? 'activated' : 'deactivated',
        details: `Account was manually ${isActive ? 'activated' : 'deactivated'} by ${adminName || 'System Administrator'}.`
      });
    }

    res.json(toSafeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating user status' });
  }
});

// Security Logs API
app.get('/api/security-logs', requireAdmin, async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching security logs' });
  }
});

// 2. Products API
app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  // Map Mongo _id to numeric id for Frontend compatibility if needed (we'll just use a virtual or custom mapper in FE)
  res.json(products);
});

app.get('/api/products/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching product' });
  }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  const newProduct = await Product.create(req.body);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const { _id, id, ...update } = req.body;
  const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(updated);
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// 3. Orders API
app.get('/api/orders', requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

// A customer's own orders (for My Account page)
app.get('/api/my/orders', requireAuth, async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id.toString() }).sort({ createdAt: -1 });
  res.json(orders);
});

// Single order lookup by its custom ORD- id (needed for the invoice page, including guests)
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching order' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    const method = String(orderData.paymentMethod || '').toUpperCase();
    const allowedMethods = ['COD', 'UPI', 'CARD', 'NETBANKING'];
    const digitalMethod = method === 'UPI' || method === 'CARD' || method === 'NETBANKING';

    if (items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!allowedMethods.includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Digital payments require a real payment gateway - no test/simulation mode.
    const cfg = await getPaymentConfig();
    if (digitalMethod && !isRealGateway(cfg)) {
      return res.status(400).json({
        message: 'Online payment is not available right now. Please choose Cash on Delivery or contact support.'
      });
    }

    // Recompute totals server-side from real product prices to prevent tampering
    let subtotal = 0;
    const verifiedItems = [];
    for (const item of items) {
      const name = (item.name || '').toString();
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const p = await Product.findOne({ name });
      if (!p) return res.status(400).json({ message: `Product not found: ${name}` });
      if (p.stock < qty) return res.status(409).json({ message: `Insufficient stock for ${p.name}` });
      subtotal += p.price * qty;
      verifiedItems.push({ product: p, qty, image: item.image });
    }

    const tax = Math.round(subtotal * 0.05); // 5% GST matches the UI
    const clientShipping = Number(orderData.shipping);
    const shipping = !isNaN(clientShipping) && clientShipping >= 0 ? clientShipping : 40;
    const clientDiscount = Math.max(0, Number(orderData.discount) || 0);
    const discount = Math.min(clientDiscount, subtotal);
    const total = subtotal + tax + shipping - discount;

    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const newOrder = await Order.create({
      ...orderData,
      paymentMethod: method,
      id: orderId,
      subtotal,
      tax,
      shipping,
      total,
      items: verifiedItems.map(({ product: p, qty, image }) => ({
        id: String(p._id),
        name: p.name,
        price: p.price,
        quantity: qty,
        image
      }))
    });

    let gatewayOrderId = '';
    if (digitalMethod) {
      try {
        const rzp = await getRazorpayClient();
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(total * 100), // amount in paisa
          currency: 'INR',
          receipt: orderId
        });
        gatewayOrderId = rzpOrder.id;
        console.log(`[Razorpay Order Created] RZP Order ID: ${gatewayOrderId}`);
      } catch (err) {
        console.error('Error creating Razorpay Order via SDK:', err);
        // Payment gateway failed - do not leave an unpayable order behind
        await Order.findByIdAndUpdate(newOrder._id, { status: 'Cancelled' });
        return res.status(502).json({ message: 'Payment gateway error. Please try again.' });
      }
    }

    // 1. Create Payment record (COD and digital orders start as Pending until paid)
    await Payment.create({
      orderId,
      amount: total,
      method,
      status: 'Pending',
      transactionId: gatewayOrderId || ''
    });

    // 2. Create Shipping record
    await Shipping.create({
      orderId,
      carrier: 'RA Logistics',
      status: 'Order Placed'
    });

    // 3. Update product inventory stock & create OrderItem and InventoryLog records
    for (const { product: p, qty } of verifiedItems) {
      await OrderItem.create({
        orderId,
        productId: String(p._id),
        name: p.name,
        price: p.price,
        quantity: qty,
        image: p.image
      });

      p.stock = Math.max(0, p.stock - qty);
      await p.save();

      await InventoryLog.create({
        productId: String(p._id),
        productName: p.name,
        changeType: 'sale',
        quantityChanged: -qty,
        newStock: p.stock
      });
    }

    res.status(201).json({ ...newOrder.toObject(), transactionId: gatewayOrderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message || 'Error placing order' });
  }
});

app.put('/api/orders/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const updated = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  res.json(updated);
});

// 4. Tickets API
app.get('/api/tickets', requireAdmin, async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

// A user's own support tickets (for My Account page)
app.get('/api/my/tickets', requireAuth, async (req, res) => {
  const tickets = await Ticket.find({ customerEmail: req.user.email }).sort({ createdAt: -1 });
  res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
  const ticket = await Ticket.create(req.body);
  res.status(201).json(ticket);
});

app.put('/api/tickets/:id/resolve', requireAdmin, async (req, res) => {
  const resolved = await Ticket.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
  res.json(resolved);
});

// 5. Payments API
app.get('/api/payments', requireAdmin, async (req, res) => {
  const payments = await Payment.find().sort({ createdAt: -1 });
  res.json(payments);
});

app.get('/api/payments/status/:orderId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });
    res.json({ status: payment.status });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error checking payment status' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    // req.body is the raw Buffer (captured before express.json)
    const rawBody = req.body;
    const rawText = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
    let parsed = {};
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      parsed = req.body && typeof req.body === 'object' ? req.body : {};
    }
    console.log(`[Webhook Received] ${rawText.substring(0, 300)}`);

    const cfg = await getPaymentConfig();
    const gatewaySecret = cfg.gatewayKeySecret || '';
    const realGateway = isRealGateway(cfg);
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-gateway-signature'];

    // Official Razorpay webhooks must always carry a valid signature.
    if (realGateway) {
      if (!signature) {
        console.error('[Signature Error] Missing signature header.');
        return res.status(401).json({ message: 'Unauthorized: missing signature' });
      }
      const digest = crypto.createHmac('sha256', gatewaySecret).update(rawText).digest('hex');
      if (digest !== signature) {
        console.error('[Signature Error] Webhook signature mismatch.');
        return res.status(401).json({ message: 'Unauthorized signature' });
      }
      console.log('[Signature OK] Validated official Razorpay Webhook signature.');
    } else {
      console.log('[Reconciliation Engine] Test mode: signature not enforced (no real gateway configured).');
    }

    // Determine order id, amount (in paisa) and success/failure from the payload.
    // Supports both official Razorpay events (payment.captured / payment.failed) and
    // the legacy custom { orderId, status, amount, utr } format.
    let orderId = parsed.orderId;
    let event = parsed.event;
    let amountPaisa = parsed.amount != null ? Number(parsed.amount) : null;
    let txnId = parsed.utr || parsed.razorpay_payment_id || '';

    const entity = parsed.payload && parsed.payload.payment && parsed.payload.payment.entity;
    if (entity) {
      orderId = entity.receipt || orderId; // receipt is our ORD-xxxxx id
      amountPaisa = entity.amount != null ? Number(entity.amount) : amountPaisa;
      txnId = entity.id || txnId;
    }

    if (!orderId) return res.status(400).json({ message: 'Missing order id' });

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Amount tamper check (gateway amounts are in paisa)
    if (amountPaisa != null && Math.round(payment.amount * 100) !== amountPaisa) {
      console.error(`[Amount Mismatch] Expected ${Math.round(payment.amount * 100)} paisa, got ${amountPaisa}.`);
      return res.status(400).json({ message: 'Amount mismatch' });
    }

    const isSuccess = !event
      ? parsed.status === 'SUCCESS'
      : (event === 'payment.captured' || event === 'order.paid');

    if (isSuccess) {
      await markOrderPaid(payment, txnId);
      console.log(`[Webhook Success] Order ${orderId} marked as PAID / Processing.`);
      return res.json({ status: 'reconciliation_complete' });
    }

    // Payment failed / authorization declined
    if (event === 'payment.failed' || parsed.status === 'FAILED') {
      if (payment.status === 'Pending') {
        payment.status = 'Failed';
        await payment.save();
        console.log(`[Webhook Failed] Order ${orderId} marked as Failed.`);
      }
      return res.json({ status: 'reconciliation_failed' });
    }

    res.status(400).json({ status: 'unhandled_event' });
  } catch (error) {
    console.error('[Webhook Error]', error);
    res.status(500).json({ message: error.message || 'Error processing webhook' });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;
    if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }
    console.log(`[Payment Verification] Verifying order: ${orderId}, Payment ID: ${razorpay_payment_id}`);

    const cfg = await getPaymentConfig();
    const gatewaySecret = cfg.gatewayKeySecret || '';

    // Signature verification is mandatory for real gateways.
    if (isRealGateway(cfg)) {
      const generated_signature = crypto
        .createHmac('sha256', gatewaySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        console.error('[Verification Error] Signature validation failed.');
        return res.status(400).json({ message: 'Payment verification failed' });
      }
      console.log('[Verification Success] Validated signature successfully.');
    } else {
      return res.status(403).json({ message: 'Payment gateway is not configured. Use test-mode payment instead.' });
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) return res.status(404).json({ message: 'Payment record not found' });

    // Prevent attaching a payment that belongs to a different Razorpay order.
    if (payment.transactionId && razorpay_order_id !== payment.transactionId) {
      console.error(`[Verification Error] Order mismatch. Expected ${payment.transactionId}, got ${razorpay_order_id}.`);
      return res.status(400).json({ message: 'Razorpay order does not match this payment' });
    }

    await markOrderPaid(payment, razorpay_payment_id);
    return res.json({ success: true, message: 'Payment verified and saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error verifying payment' });
  }
});

app.put('/api/payments/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const updated = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(updated);
});

// 6. Shipping API
app.get('/api/shipping', requireAdmin, async (req, res) => {
  const shipping = await Shipping.find().sort({ createdAt: -1 });
  res.json(shipping);
});

app.put('/api/shipping/:id', requireAdmin, async (req, res) => {
  const { carrier, trackingNumber, status } = req.body;
  const updated = await Shipping.findByIdAndUpdate(req.params.id, { carrier, trackingNumber, status }, { new: true });
  res.json(updated);
});

// 7. Discounts & Coupons API
app.get('/api/discounts', requireAdmin, async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: -1 });
  res.json(discounts);
});

app.post('/api/discounts', requireAdmin, async (req, res) => {
  const newDiscount = await Discount.create(req.body);
  res.status(201).json(newDiscount);
});

app.put('/api/discounts/:id', requireAdmin, async (req, res) => {
  const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/discounts/:id', requireAdmin, async (req, res) => {
  await Discount.findByIdAndDelete(req.params.id);
  res.json({ message: 'Discount deleted' });
});

app.post('/api/discounts/validate', async (req, res) => {
  const { code, amount } = req.body;
  const discount = await Discount.findOne({ code: code.toUpperCase(), active: true });
  if (!discount) return res.status(404).json({ message: 'Invalid or inactive coupon code' });
  if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
    return res.status(400).json({ message: 'Coupon code has expired' });
  }
  if (amount < discount.minPurchase) {
    return res.status(400).json({ message: `Minimum purchase of ₹${discount.minPurchase} required` });
  }
  res.json(discount);
});

// 8. Reviews API
app.get('/api/reviews', async (req, res) => {
  const reviews = await Review.find().sort({ createdAt: -1 });
  res.json(reviews);
});

app.post('/api/reviews', requireAuth, async (req, res) => {
  const newReview = await Review.create({ ...req.body, customerEmail: req.user.email, customerName: req.body.customerName || req.user.name });
  res.status(201).json(newReview);
});

app.delete('/api/reviews/:id', requireAdmin, async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Review deleted' });
});

// 9. Inventory Logs API
app.get('/api/inventory-logs', requireAdmin, async (req, res) => {
  const logs = await InventoryLog.find().sort({ createdAt: -1 });
  res.json(logs);
});

// 10. Wishlist API
app.get('/api/wishlist/:userId', requireAuth, async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.params.userId });
  res.json(wishlist || { userId: req.params.userId, items: [] });
});

app.post('/api/wishlist/:userId/add', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const item = req.body; // { productId, name, price, image }
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId, items: [item] });
  } else {
    const exists = wishlist.items.some(i => i.productId === item.productId);
    if (!exists) {
      wishlist.items.push(item);
      await wishlist.save();
    }
  }
  res.json(wishlist);
});

app.delete('/api/wishlist/:userId/remove/:productId', requireAuth, async (req, res) => {
  const { userId, productId } = req.params;
  const wishlist = await Wishlist.findOne({ userId });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(i => i.productId !== productId);
    await wishlist.save();
  }
  res.json(wishlist || { userId, items: [] });
});

// 11. Cart API
app.get('/api/cart/:userId', requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId });
  res.json(cart || { userId: req.params.userId, items: [] });
});

app.post('/api/cart/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params;
  const { items } = req.body;
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items });
  } else {
    cart.items = items;
    await cart.save();
  }
  res.json(cart);
});

// 12. Maintenance Mode API
app.get('/api/maintenance/status', (req, res) => {
  res.json({ isMaintenanceMode });
});

app.post('/api/maintenance/toggle', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (typeof status === 'boolean') {
    isMaintenanceMode = status;
  } else {
    isMaintenanceMode = !isMaintenanceMode;
  }
  res.json({ success: true, isMaintenanceMode });
});

// 13. System Configurations API
app.get('/api/config/payment/public', async (req, res) => {
  try {
    const cfg = await getPaymentConfig();
    res.json({
      merchantUpi: cfg.merchantUpi,
      merchantName: cfg.merchantName,
      gatewayKeyId: cfg.gatewayKeyId,
      isLive: isRealGateway(cfg)
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting public configuration' });
  }
});

app.get('/api/config/payment/admin', requireAdmin, async (req, res) => {
  try {
    const cfg = await getPaymentConfig();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting admin configuration' });
  }
});

app.post('/api/config/payment', requireAdmin, async (req, res) => {
  try {
    const { merchantUpi, merchantName, gatewayKeyId, gatewayKeySecret } = req.body;
    let config = await SystemConfig.findOne({ key: 'payment_settings' });
    if (!config) {
      config = new SystemConfig({ key: 'payment_settings' });
    }
    config.value = {
      merchantUpi,
      merchantName,
      gatewayKeyId,
      gatewayKeySecret
    };
    await config.save();
    console.log('[SystemConfig Updated] Payment configuration settings successfully updated by Admin.');
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error saving configuration' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
