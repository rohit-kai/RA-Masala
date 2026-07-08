import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Models
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Ticket from './models/Ticket.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
        { name: "Onion Garlic Masala", price: 80, stock: 50, category: "Masale", unit: "250g", description: "Traditional savory spice blend of onions, garlic, and handpicked hot spices.", image: "/images/ra_waa.png" },
        { name: "Authentic Garam Masala", price: 120, stock: 45, category: "Masale", unit: "200g", description: "Generations-old recipe blending 12 aromatic and premium spices.", image: "/images/ra_waa.png" },
        { name: "Kashmiri Red Chili", price: 95, stock: 60, category: "Masale", unit: "250g", description: "Mild heat with a rich, vibrant red color for premium culinary dishes.", image: "/images/ra_waa.png" },
        { name: "Premium Turmeric Powder", price: 65, stock: 80, category: "Spice Home", unit: "250g", description: "Pure, high-curcumin turmeric powder with authentic color and flavor.", image: "/images/ra_waa.png" },
        { name: "Kolhapuri Ghati Masala", price: 90, stock: 35, category: "Masale", unit: "250g", description: "Spicy and bold traditional blend capturing the authentic flavors of Kolhapur.", image: "/images/ra_waa.png" },
        { name: "Traditional Goda Masala", price: 110, stock: 40, category: "Masale", unit: "200g", description: "Aromatic Maharashtrian blend featuring roasted coconut, sesame, and spices.", image: "/images/ra_waa.png" },
        { name: "Coriander Powder", price: 55, stock: 90, category: "Spice Home", unit: "250g", description: "Finely ground from premium coriander seeds, yielding a sweet aromatic scent.", image: "/images/ra_waa.png" },
        { name: "Shahi Biryani Masala", price: 150, stock: 25, category: "Masale", unit: "100g", description: "A royal blend of spices to create perfectly aromatic and flavorful biryani.", image: "/images/ra_waa.png" },
        { name: "Special Pav Bhaji Masala", price: 75, stock: 55, category: "Masale", unit: "100g", description: "The perfect spice blend for making delicious, Mumbai-style street pav bhaji.", image: "/images/ra_waa.png" }
      ];
      await Product.insertMany(initialProducts);
      console.log('Default products seeded');
    }

    // 2. Seed Users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const initialUsers = [
        { name: 'Ramesh Patel', email: 'ramesh@gmail.com', role: 'customer', phone: '9876543210', address: '123, Spice Bazaar', city: 'Mumbai', zip: '400001' },
        { name: 'Sunita Deshmukh', email: 'sunita@gmail.com', role: 'customer', phone: '9822334455', address: '45, Ghati Lane', city: 'Pune', zip: '411002' },
        { name: 'RA Masala Admin', email: 'admin@ramasala.com', role: 'admin' }
      ];
      await User.insertMany(initialUsers);
      console.log('Default users seeded');
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
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'admin' && password !== 'admin123') {
    return res.status(401).json({ message: 'Invalid Admin Password' });
  }
  res.json(user);
});

app.post('/api/users/signup', async (req, res) => {
  const { name, email } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(400).json({ message: 'Email already registered' });
  const newUser = await User.create({ name, email: email.toLowerCase() });
  res.status(201).json(newUser);
});

app.put('/api/users/profile', async (req, res) => {
  const { id, name, phone, address, city, zip } = req.body;
  const updatedUser = await User.findByIdAndUpdate(id, { name, phone, address, city, zip }, { new: true });
  res.json(updatedUser);
});

// 2. Products API
app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  // Map Mongo _id to numeric id for Frontend compatibility if needed (we'll just use a virtual or custom mapper in FE)
  res.json(products);
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

  // Update product inventory stock
  for (const item of orderData.items) {
    // If rate items have DB MongoDB ID we can locate, else locate by name match
    const p = await Product.findOne({ name: item.name });
    if (p) {
      p.stock = Math.max(0, p.stock - item.quantity);
      await p.save();
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
