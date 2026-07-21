import mongoose from 'mongoose';

const WishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }
});

const WishlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [WishlistItemSchema]
}, { timestamps: true });

export default mongoose.model('Wishlist', WishlistSchema);
