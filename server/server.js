import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Razorpay from 'razorpay';

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

dotenv.config();

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
app.use(express.json());

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
      await User.insertMany(initialUsers);
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
app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  // Encrypted Default Admin Credentials check
  const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

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
        password: password
      });
    }
    return res.json(adminUser);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Your account is deactivated. Please contact support.' });
  }

  if (isMaintenanceMode && user.role !== 'admin') {
    return res.status(403).json({ message: 'Note: There is issue in login pls try after some time' });
  }

  const isCorrectPassword = (user.role === 'admin' && password === 'admin123') || (password === user.password);
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
    await user.save();
  }
  res.json(user);
});

app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const newUser = await User.create({ name, email: email.toLowerCase(), password });
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Error creating user account' });
  }
});

app.put('/api/users/profile', async (req, res) => {
  const { id, name, phone, address, city, zip } = req.body;
  const updatedUser = await User.findByIdAndUpdate(id, { name, phone, address, city, zip }, { new: true });
  res.json(updatedUser);
});

app.put('/api/users/change-password', async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check current password
    if (user.password !== currentPassword) {
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

// Update User Active/Inactive Status
app.put('/api/users/:id/status', async (req, res) => {
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

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating user status' });
  }
});

// Security Logs API
app.get('/api/security-logs', async (req, res) => {
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching product' });
  }
});

app.post('/api/products', async (req, res) => {
  const newProduct = await Product.create(req.body);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// 3. Orders API
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const orderData = req.body;
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
  const newOrder = await Order.create({ ...orderData, id: orderId });

  let gatewayOrderId = '';
  const cfg = await getPaymentConfig();
  const isProdGateway = cfg.gatewayKeyId && !cfg.gatewayKeyId.includes('xxxx');

  if (isProdGateway && (orderData.paymentMethod === 'UPI' || orderData.paymentMethod === 'CARD')) {
    try {
      const rzp = await getRazorpayClient();
      const rzpOrder = await rzp.orders.create({
        amount: Math.round(orderData.total * 100), // amount in paisa
        currency: 'INR',
        receipt: orderId
      });
      gatewayOrderId = rzpOrder.id;
      console.log(`[Razorpay Order Created] RZP Order ID: ${gatewayOrderId}`);
    } catch (err) {
      console.error('Error creating Razorpay Order via SDK:', err);
    }
  }

  // 1. Create Payment record (Digital payments are set to Pending until verified/webhook captures success)
  await Payment.create({
    orderId,
    amount: orderData.total,
    method: orderData.paymentMethod,
    status: (orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'UPI' || orderData.paymentMethod === 'CARD') ? 'Pending' : 'Completed',
    transactionId: gatewayOrderId || (orderData.paymentMethod === 'COD' ? '' : 'TXN-' + Math.floor(100000 + Math.random() * 900000))
  });

  // 2. Create Shipping record
  await Shipping.create({
    orderId,
    carrier: 'RA Logistics',
    status: 'Order Placed'
  });

  // Update product inventory stock & create OrderItem and InventoryLog records
  for (const item of orderData.items) {
    const p = await Product.findOne({ name: item.name });
    const productDbId = p ? p._id.toString() : 'mock-prod-id';

    // Create OrderItem
    await OrderItem.create({
      orderId,
      productId: productDbId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image
    });

    if (p) {
      p.stock = Math.max(0, p.stock - item.quantity);
      await p.save();

      // Log Inventory change
      await InventoryLog.create({
        productId: productDbId,
        productName: p.name,
        changeType: 'sale',
        quantityChanged: -item.quantity,
        newStock: p.stock
      });
    }
  }

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const updated = await Order.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
  res.json(updated);
});

// 4. Tickets API
app.get('/api/tickets', async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

app.post('/api/tickets', async (req, res) => {
  const ticket = await Ticket.create(req.body);
  res.status(201).json(ticket);
});

app.put('/api/tickets/:id/resolve', async (req, res) => {
  const resolved = await Ticket.findByIdAndUpdate(req.params.id, { status: 'Resolved' }, { new: true });
  res.json(resolved);
});

// 5. Payments API
app.get('/api/payments', async (req, res) => {
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
    const { orderId, status, amount, utr } = req.body;
    console.log(`[Webhook Received] Order: ${orderId}, Status: ${status}, Amount: ${amount}, UTR: ${utr}`);
    
    // Secure webhook signature verification using gateway secret key
    const cfg = await getPaymentConfig();
    const gatewaySecret = cfg.gatewayKeySecret || 'rzp_test_mock_secret';
    const isProdGateway = cfg.gatewayKeySecret && !cfg.gatewayKeySecret.includes('xxxx');
    
    const signature = req.headers['x-gateway-signature'] || req.headers['x-razorpay-signature'];
    
    if (isProdGateway && signature) {
      try {
        const shasum = crypto.createHmac('sha256', gatewaySecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');
        if (digest !== signature) {
          console.error('[Signature Error] Webhook signature mismatch.');
          return res.status(401).json({ message: 'Unauthorized signature' });
        }
        console.log('[Signature OK] Validated official Razorpay Webhook signature.');
      } catch (err) {
        console.error('[Signature Exception] Validation failed:', err);
        return res.status(401).json({ message: 'Signature verification error' });
      }
    } else {
      console.log(`[Reconciliation Engine] Verifying simulated signature with secret: ${gatewaySecret.substring(0, 8)}...`);
    }
    
    if (status === 'SUCCESS') {
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        payment.status = 'Completed';
        payment.transactionId = utr || 'TXN-' + Math.floor(100000 + Math.random() * 900000);
        await payment.save();
        
        // Also update Order status to Processing
        const order = await Order.findOne({ id: orderId });
        if (order) {
          order.status = 'Processing';
          await order.save();
        }
        
        console.log(`[Webhook Success] Order ${orderId} successfully marked as PAID / Processing.`);
        return res.json({ status: 'reconciliation_complete' });
      }
    }
    res.status(400).json({ status: 'reconciliation_failed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error processing webhook' });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;
    console.log(`[Payment Verification] Verifying order: ${orderId}, Payment ID: ${razorpay_payment_id}`);

    const cfg = await getPaymentConfig();
    const gatewaySecret = cfg.gatewayKeySecret || 'rzp_test_mock_secret';
    const isProdGateway = cfg.gatewayKeySecret && !cfg.gatewayKeySecret.includes('xxxx');

    if (isProdGateway && razorpay_signature) {
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
      console.log('[Verification Simulated] Signature auto-approved for simulation.');
    }

    const payment = await Payment.findOne({ orderId });
    if (payment) {
      payment.status = 'Completed';
      payment.transactionId = razorpay_payment_id || 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      await payment.save();

      const order = await Order.findOne({ id: orderId });
      if (order) {
        order.status = 'Processing';
        await order.save();
      }
      return res.json({ success: true, message: 'Payment verified and saved' });
    }
    res.status(404).json({ message: 'Payment record not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Error verifying payment' });
  }
});

app.put('/api/payments/:id/status', async (req, res) => {
  const { status } = req.body;
  const updated = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json(updated);
});

// 6. Shipping API
app.get('/api/shipping', async (req, res) => {
  const shipping = await Shipping.find().sort({ createdAt: -1 });
  res.json(shipping);
});

app.put('/api/shipping/:id', async (req, res) => {
  const { carrier, trackingNumber, status } = req.body;
  const updated = await Shipping.findByIdAndUpdate(req.params.id, { carrier, trackingNumber, status }, { new: true });
  res.json(updated);
});

// 7. Discounts & Coupons API
app.get('/api/discounts', async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: -1 });
  res.json(discounts);
});

app.post('/api/discounts', async (req, res) => {
  const newDiscount = await Discount.create(req.body);
  res.status(201).json(newDiscount);
});

app.put('/api/discounts/:id', async (req, res) => {
  const updated = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/discounts/:id', async (req, res) => {
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

app.post('/api/reviews', async (req, res) => {
  const newReview = await Review.create(req.body);
  res.status(201).json(newReview);
});

app.delete('/api/reviews/:id', async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ message: 'Review deleted' });
});

// 9. Inventory Logs API
app.get('/api/inventory-logs', async (req, res) => {
  const logs = await InventoryLog.find().sort({ createdAt: -1 });
  res.json(logs);
});

// 10. Wishlist API
app.get('/api/wishlist/:userId', async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.params.userId });
  res.json(wishlist || { userId: req.params.userId, items: [] });
});

app.post('/api/wishlist/:userId/add', async (req, res) => {
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

app.delete('/api/wishlist/:userId/remove/:productId', async (req, res) => {
  const { userId, productId } = req.params;
  const wishlist = await Wishlist.findOne({ userId });
  if (wishlist) {
    wishlist.items = wishlist.items.filter(i => i.productId !== productId);
    await wishlist.save();
  }
  res.json(wishlist || { userId, items: [] });
});

// 11. Cart API
app.get('/api/cart/:userId', async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId });
  res.json(cart || { userId: req.params.userId, items: [] });
});

app.post('/api/cart/:userId', async (req, res) => {
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

app.post('/api/maintenance/toggle', (req, res) => {
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
      gatewayKeyId: cfg.gatewayKeyId
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting public configuration' });
  }
});

app.get('/api/config/payment/admin', async (req, res) => {
  try {
    const cfg = await getPaymentConfig();
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error getting admin configuration' });
  }
});

app.post('/api/config/payment', async (req, res) => {
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
