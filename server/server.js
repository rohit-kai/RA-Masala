import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import net from 'net';
import tls from 'tls';

// Hardcoded super admin credentials (SHA-256 hashes from your .env) — always work, no env needed
const DEFAULT_ADMIN_EMAIL_HASH = '345d9d944dcab91ee58fc1e567c26b490a9a683d50d2ca3d7da37817c0748150'; // ujumakikai8975@gmail.com
const DEFAULT_ADMIN_PASSWORD_HASH = 'c846010c231cd5b9b865e88ce754c529c4abc5d95b109a899782946cd4d9277c'; // your password
const DEFAULT_ADMIN_NAME = 'Kai Super Admin';
const DEFAULT_ADMIN_EMAIL = 'ujumakikai8975@gmail.com';

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

// Load local .env only when the platform has not already provided values.
// Do NOT use override:true — it would replace Render/Vercel secrets with a stale file.
dotenv.config();

// SMTP mailer for password reset emails. Configure SMTP_HOST/SMTP_USER/SMTP_PASS in .env
// IMPORTANT: reuse ONE pooled transport. Creating a fresh connection per email makes
// Gmail throttle rapid connects (intermittent "Connection timeout" failures in prod).
let sharedMailer = null;
function getMailer() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  if (sharedMailer) return sharedMailer;
  sharedMailer = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
    pool: true,
    maxConnections: 1,
    maxMessages: 20,
    // Fail fast in production instead of hanging the request for minutes.
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT) || 15000,
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT) || 10000,
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT) || 20000,
    // Some office/college networks intercept TLS with a self-signed cert.
    // Set SMTP_REJECT_UNAUTHORIZED=false in .env only if your network does this.
    tls: { rejectUnauthorized: (process.env.SMTP_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false' }
  });
  return sharedMailer;
}

// Gmail rejects a From address that is not the authenticated account.
// Prefer SMTP_FROM only when it matches SMTP_USER (or host is not Gmail).
function getFromAddress() {
  const configured = process.env.SMTP_FROM;
  const user = process.env.SMTP_USER;
  const host = (process.env.SMTP_HOST || '').toLowerCase();
  if (configured && user && configured.includes(user)) return configured;
  if (configured && user && !host.includes('gmail')) return configured;
  if (user) return `RA Masala <${user}>`;
  return configured || 'RA Masala <no-reply@ramasala.com>';
}

// Shared send: 20s hard deadline per attempt + one automatic retry on failure.
// Never closes the shared pooled transport.
async function deliverMail(message) {
  const mailer = getMailer();
  if (!mailer) throw new Error('SMTP is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS on the backend host (Render dashboard).');

  const timeoutMs = 20000;
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`SMTP send timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    try {
      const info = await Promise.race([mailer.sendMail(message), timeoutPromise]);
      return info;
    } catch (err) {
      lastErr = err;
      console.error(`[SMTP] Attempt ${attempt}/2 failed: ${err?.message || err}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

async function sendResetEmail(toEmail, resetLink) {
  await deliverMail({
    from: getFromAddress(),
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
          <p style="color: #888; font-size: 12px;">Customer Care: 7518166686 | <a href="mailto:ramasale.6686@gmail.com" style="color: #aa1a31;">ramasale.6686@gmail.com</a></p>
        </div>
      </div>
    `
  });
}

// Generic HTML mail helper (same fail-fast deadline + retry as sendResetEmail)
async function sendHtmlMail(toEmail, subject, html) {
  await deliverMail({ from: getFromAddress(), to: toEmail, subject, html });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function brandEmailShell(title, bodyHtml) {
  return `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #aa1a31; color: #fff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">RA Masala</h2>
          <p style="margin: 4px 0 0; font-size: 13px;">${escapeHtml(title)}</p>
        </div>
        <div style="padding: 24px; color: #333;">
          ${bodyHtml}
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">Customer Care: 7518166686 | <a href="mailto:ramasale.6686@gmail.com" style="color: #aa1a31;">ramasale.6686@gmail.com</a></p>
        </div>
      </div>
    `;
}

// --- Low stock alerts ---
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
// Products already alerted at/below threshold (cleared automatically on restock)
const lowStockAlerted = new Set();

function isLowStock(product) {
  return Number(product?.stock || 0) <= LOW_STOCK_THRESHOLD;
}

async function getAdminEmails() {
  try {
    const admins = await User.find({ role: 'admin', isActive: { $ne: false } }).select('email');
    const emails = admins.map(a => a.email).filter(Boolean);
    if (emails.length > 0) return [...new Set(emails)];
  } catch (e) {
    console.error('Error loading admin emails for alert:', e);
  }
  return [DEFAULT_ADMIN_EMAIL];
}

// Fire-and-forget digest email to all admins about low/out-of-stock products
async function sendLowStockAlertEmail(products) {
  if (!Array.isArray(products) || products.length === 0) return;
  const admins = await getAdminEmails();
  const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
  const rows = products.map(p => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(p.name)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; ${Number(p.stock) === 0 ? 'color:#c62828;font-weight:bold;' : 'color:#e65100;font-weight:bold;'}">${Number(p.stock)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(p.category || '-')}</td>
      </tr>`).join('');

  const html = brandEmailShell('Low Stock Alert', `
          <p>Hello Admin,</p>
          <p><strong>${products.length}</strong> product(s) are at or below the low-stock threshold of <strong>${LOW_STOCK_THRESHOLD}</strong>:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
            <thead>
              <tr style="background: #FDF6ED;">
                <th style="padding: 8px; text-align: left;">Product</th>
                <th style="padding: 8px; text-align: center;">Stock</th>
                <th style="padding: 8px; text-align: left;">Category</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${appUrl}/admin/products" style="background: #aa1a31; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">Manage Inventory</a>
          </p>
  `);

  for (const admin of admins) {
    try {
      await sendHtmlMail(admin, `RA Masala - Low Stock Alert (${products.length} product${products.length > 1 ? 's' : ''})`, html);
      console.log(`[Low Stock Alert] Sent to ${admin} for ${products.length} product(s)`);
    } catch (err) {
      console.error(`Error sending low stock alert to ${admin}:`, err?.message || err);
    }
  }
}

// Call after a stock change. Dedups per product until stock rises above threshold again.
// Returns true when a new alert email was queued for this product.
async function maybeAlertLowStock(product) {
  if (!product) return false;
  const id = String(product._id);
  if (!isLowStock(product)) {
    lowStockAlerted.delete(id); // restocked — allow future alerts
    return false;
  }
  if (lowStockAlerted.has(id)) return false;
  lowStockAlerted.add(id);
  // Non-blocking: never delay order placement / product saves on SMTP
  sendLowStockAlertEmail([{ name: product.name, stock: product.stock, category: product.category }]).catch(err => {
    console.error('Low stock alert failed:', err?.message || err);
  });
  return true;
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
app.use(express.json({ limit: '20mb' }));

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

const SUPER_ADMIN_TOKEN_PREFIX = 'superadmin:';

function createSuperAdminUser() {
  return {
    _id: 'superadmin',
    name: DEFAULT_ADMIN_NAME,
    email: 'ujumakikai8975@gmail.com',
    role: 'admin',
    isActive: true,
    token: null
  };
}

function isSuperAdminToken(token) {
  return token && token.startsWith(SUPER_ADMIN_TOKEN_PREFIX);
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    
    if (isSuperAdminToken(token)) {
      req.user = createSuperAdminUser();
      req.user.token = token;
      return next();
    }
    
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
    
    if (isSuperAdminToken(token)) {
      req.user = createSuperAdminUser();
      req.user.token = token;
      return next();
    }
    
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

  // Super admin credentials check (hardcoded SHA-256 hashes) — no DB, no env needed
  const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  const passwordHash = crypto.createHash('sha256').update(enteredPassword).digest('hex');

  if (emailHash === DEFAULT_ADMIN_EMAIL_HASH && passwordHash === DEFAULT_ADMIN_PASSWORD_HASH) {
    const superAdminToken = SUPER_ADMIN_TOKEN_PREFIX + generateToken();
    const superAdminUser = createSuperAdminUser();
    superAdminUser.token = superAdminToken;
    return res.json({ ...toSafeUser(superAdminUser), token: superAdminToken });
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
      return res.status(503).json({
        message: 'Could not send the reset email right now. Please try again later.',
        // Safe diagnostic detail for the operator (never includes the password)
        detail: mailErr?.message || 'SMTP error'
      });
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
  // Log initial stock as production inward so reports can track stock-in
  if (newProduct.stock > 0) {
    await InventoryLog.create({
      productId: String(newProduct._id),
      productName: newProduct.name,
      changeType: 'restock',
      quantityChanged: newProduct.stock,
      newStock: newProduct.stock
    });
  }
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const { _id, id, ...update } = req.body;
  const before = await Product.findById(req.params.id);
  const updated = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  // Stock increase = production inward — record it for inventory reports
  if (before && updated && typeof update.stock === 'number' && update.stock > before.stock) {
    await InventoryLog.create({
      productId: String(updated._id),
      productName: updated.name,
      changeType: 'restock',
      quantityChanged: update.stock - before.stock,
      newStock: updated.stock
    });
  }
  // Stock dropped to/below threshold via admin edit — alert admins (non-blocking)
  if (before && updated && typeof update.stock === 'number' && updated.stock < before.stock) {
    await maybeAlertLowStock(updated);
  }
  res.json(updated);
});

// Manual production inward (stock-in) for a product
app.post('/api/inventory-logs/restock', requireAdmin, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.floor(Number(quantity));
    if (!productId || !qty || qty <= 0) {
      return res.status(400).json({ message: 'Valid product and positive quantity required' });
    }
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    product.stock = (product.stock || 0) + qty;
    await product.save();

    const log = await InventoryLog.create({
      productId: String(product._id),
      productName: product.name,
      changeType: 'restock',
      quantityChanged: qty,
      newStock: product.stock
    });
    // Restock may clear the low-stock state so future drops alert again
    if (!isLowStock(product)) lowStockAlerted.delete(String(product._id));
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error inwarding stock' });
  }
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

app.post('/api/orders', requireAuth, async (req, res) => {
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
    const clientDiscount = Math.max(0, Number(orderData.discount) || 0);
    const discount = Math.min(clientDiscount, subtotal);
    const orderValue = subtotal - discount; // product value used for free-shipping threshold

    // Delivery rules (server-authoritative — do not trust client shipping):
    // • Free delivery on orders ≥ ₹499
    // • Flat ₹40 shipping below ₹499 (up to 1 kg)
    // • Prepaid (UPI/CARD/NETBANKING): free delivery always
    // • COD: +₹30 convenience fee
    const FREE_SHIPPING_THRESHOLD = 499;
    const FLAT_SHIPPING_FEE = 40;
    const COD_CONVENIENCE_FEE = 30;

    const isPrepaid = method === 'UPI' || method === 'CARD' || method === 'NETBANKING';
    let shipping = 0;
    if (!isPrepaid && orderValue > 0 && orderValue < FREE_SHIPPING_THRESHOLD) {
      shipping = FLAT_SHIPPING_FEE;
    }
    const codFee = method === 'COD' && orderValue > 0 ? COD_CONVENIENCE_FEE : 0;
    const total = subtotal + tax + shipping + codFee - discount;

    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const newOrder = await Order.create({
      ...orderData,
      paymentMethod: method,
      id: orderId,
      subtotal,
      tax,
      shipping,
      codFee,
      discount,
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
    const lowStockHits = [];
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

      // Track newly low/out-of-stock items for one digest email to admins
      const id = String(p._id);
      if (isLowStock(p) && !lowStockAlerted.has(id)) {
        lowStockAlerted.add(id);
        lowStockHits.push({ name: p.name, stock: p.stock, category: p.category });
      } else if (!isLowStock(p)) {
        lowStockAlerted.delete(id);
      }
    }

    // Non-blocking: one combined low-stock email after the order completes
    if (lowStockHits.length > 0) {
      sendLowStockAlertEmail(lowStockHits).catch(err => {
        console.error('Low stock alert failed:', err?.message || err);
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

// 14. Email / Alerts API (admin)
// SMTP connectivity diagnostics (returns reachability only — no secrets).
// Used to find which SMTP port works from this host (Render/Vercel).
app.get('/api/email/diag', async (req, res) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const testPort = (port, secure) => new Promise((resolve) => {
    const start = Date.now();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch (e) { /* ignore */ }
      resolve({ ok: result.ok, ms: Date.now() - start, error: result.error || null });
    };
    let socket;
    try {
      if (secure) {
        socket = tls.connect({ host, port, servername: host }, () => done({ ok: true }));
      } else {
        socket = net.connect({ host, port }, () => done({ ok: true }));
      }
      socket.setTimeout(8000, () => done({ ok: false, error: 'timeout (8s)' }));
      socket.on('error', (e) => done({ ok: false, error: e.code || e.message }));
    } catch (e) {
      done({ ok: false, error: e.code || e.message });
    }
  });

  try {
    const [p587, p465, p25] = await Promise.all([
      testPort(587, false),
      testPort(465, true),
      testPort(25, false)
    ]);
    res.json({
      host,
      configuredPort: Number(process.env.SMTP_PORT) || 587,
      smtpUserConfigured: Boolean(process.env.SMTP_USER),
      smtpPassConfigured: Boolean(process.env.SMTP_PASS),
      ports: { '587': p587, '465': p465, '25': p25 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Diagnostic failed' });
  }
});

// List products at/below the low-stock threshold
app.get('/api/email/low-stock', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1 });
    res.json({
      threshold: LOW_STOCK_THRESHOLD,
      products: products.map(p => ({
        id: String(p._id),
        name: p.name,
        stock: p.stock,
        category: p.category,
        alreadyAlerted: lowStockAlerted.has(String(p._id))
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching low stock products' });
  }
});

// Manually send the low-stock digest to admins right now
app.post('/api/email/low-stock-alert', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } }).sort({ stock: 1 });
    if (products.length === 0) {
      return res.json({ message: 'No low-stock products found', sent: 0, count: 0 });
    }
    const list = products.map(p => ({ name: p.name, stock: p.stock, category: p.category }));
    await sendLowStockAlertEmail(list);
    // mark all as alerted so automatic hooks do not duplicate this email
    products.forEach(p => lowStockAlerted.add(String(p._id)));
    res.json({
      message: `Low-stock alert sent for ${products.length} product(s)`,
      sent: 1,
      count: products.length,
      threshold: LOW_STOCK_THRESHOLD
    });
  } catch (error) {
    console.error('Manual low-stock alert error:', error);
    res.status(503).json({
      message: 'Could not send the low-stock alert right now.',
      detail: error?.message || 'SMTP error'
    });
  }
});

// Send a promotional "new offers" email to customers
app.post('/api/email/offers', requireAdmin, async (req, res) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const heading = String(req.body.heading || '').trim();
    const message = String(req.body.message || '').trim();
    const offerCode = String(req.body.offerCode || '').trim();
    const shopLink = String(req.body.shopLink || '').trim();
    const recipientsInput = req.body.recipients;

    if (!subject || subject.length > 150) {
      return res.status(400).json({ message: 'A subject (max 150 characters) is required' });
    }
    if (!message || message.length > 5000) {
      return res.status(400).json({ message: 'A message (max 5000 characters) is required' });
    }

    // Resolve recipients: explicit list, or all active customers
    let recipients = [];
    if (Array.isArray(recipientsInput) && recipientsInput.length > 0) {
      recipients = recipientsInput
        .map(e => String(e || '').trim().toLowerCase())
        .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
      recipients = [...new Set(recipients)];
    } else {
      const customers = await User.find({ role: 'customer', isActive: { $ne: false } }).select('email');
      recipients = [...new Set(customers.map(c => String(c.email || '').trim().toLowerCase()).filter(Boolean))];
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found (no active customers or invalid emails)' });
    }
    const MAX_RECIPIENTS = 200;
    if (recipients.length > MAX_RECIPIENTS) {
      return res.status(400).json({ message: `Too many recipients (${recipients.length}). Limit is ${MAX_RECIPIENTS} per send.` });
    }

    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const ctaUrl = shopLink ? escapeHtml(shopLink) : `${appUrl}/shop`;
    const bodyParagraphs = message
      .split(/\n{2,}/)
      .map(par => `<p style="margin: 0 0 12px;">${escapeHtml(par).replace(/\n/g, '<br />')}</p>`)
      .join('');
    const offerBlock = offerCode
      ? `<p style="text-align:center; margin: 20px 0;">
           <span style="display:inline-block; background:#FDF6ED; border:2px dashed #aa1a31; color:#4A1525; font-size:20px; font-weight:bold; letter-spacing:3px; padding:10px 24px; border-radius:8px;">${escapeHtml(offerCode)}</span>
         </p>
         <p style="text-align:center; color:#888; font-size:13px; margin-top:-8px;">Use this code at checkout</p>`
      : '';

    const html = brandEmailShell(heading || 'Special Offer', `
          <p>Hello,</p>
          ${bodyParagraphs}
          ${offerBlock}
          <p style="text-align: center; margin: 28px 0;">
            <a href="${ctaUrl}" style="background: #aa1a31; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; display: inline-block;">Shop Now</a>
          </p>
    `);

    let sent = 0;
    const failed = [];
    const errors = [];
    for (const email of recipients) {
      try {
        await sendHtmlMail(email, subject, html);
        sent += 1;
      } catch (err) {
        failed.push(email);
        errors.push({ email, error: err?.message || String(err) });
        console.error(`Offer email failed for ${email}:`, err?.message || err);
      }
    }

    console.log(`[Offers Email] "${subject}" — sent ${sent}/${recipients.length} by admin ${req.user?.email || ''}`);
    res.json({
      message: `Offer email sent to ${sent} of ${recipients.length} customer(s)`,
      sent,
      failed: failed.length,
      failedEmails: failed.slice(0, 20),
      errors: errors.slice(0, 5),
      total: recipients.length
    });
  } catch (error) {
    console.error('Offers email error:', error);
    res.status(500).json({ message: error.message || 'Error sending offer emails' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
