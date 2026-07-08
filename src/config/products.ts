import { getAssetPath } from '../Utils/imageHelper';

export interface Product {
  id: number;
  _id?: string;
  name: string;
  image: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Onion Garlic Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "Traditional savory spice blend of onions, garlic, and handpicked hot spices.",
    price: 80,
    stock: 50,
    category: "Masale",
    unit: "250g"
  },
  {
    id: 2,
    name: "Authentic Garam Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "Generations-old recipe blending 12 aromatic and premium spices.",
    price: 120,
    stock: 45,
    category: "Masale",
    unit: "200g"
  },
  {
    id: 3,
    name: "Kashmiri Red Chili",
    image: getAssetPath('images/ra_waa.png'),
    description: "Mild heat with a rich, vibrant red color for premium culinary dishes.",
    price: 95,
    stock: 60,
    category: "Masale",
    unit: "250g"
  },
  {
    id: 4,
    name: "Premium Turmeric Powder",
    image: getAssetPath('images/ra_waa.png'),
    description: "Pure, high-curcumin turmeric powder with authentic color and flavor.",
    price: 65,
    stock: 80,
    category: "Spice Home",
    unit: "250g"
  },
  {
    id: 5,
    name: "Kolhapuri Ghati Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "Spicy and bold traditional blend capturing the authentic flavors of Kolhapur.",
    price: 90,
    stock: 35,
    category: "Masale",
    unit: "250g"
  },
  {
    id: 6,
    name: "Traditional Goda Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "Aromatic Maharashtrian blend featuring roasted coconut, sesame, and spices.",
    price: 110,
    stock: 40,
    category: "Masale",
    unit: "200g"
  },
  {
    id: 7,
    name: "Coriander Powder",
    image: getAssetPath('images/ra_waa.png'),
    description: "Finely ground from premium coriander seeds, yielding a sweet aromatic scent.",
    price: 55,
    stock: 90,
    category: "Spice Home",
    unit: "250g"
  },
  {
    id: 8,
    name: "Shahi Biryani Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "A royal blend of spices to create perfectly aromatic and flavorful biryani.",
    price: 150,
    stock: 25,
    category: "Masale",
    unit: "100g"
  },
  {
    id: 9,
    name: "Special Pav Bhaji Masala",
    image: getAssetPath('images/ra_waa.png'),
    description: "The perfect spice blend for making delicious, Mumbai-style street pav bhaji.",
    price: 75,
    stock: 55,
    category: "Masale",
    unit: "100g"
  }
];
