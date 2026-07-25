import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';
import { Product } from '../../config/products';
import { getAssetPath } from '../../Utils/imageHelper';

const AdminProducts = () => {
  const { user, products, addProduct, updateProduct, deleteProduct } = useAuth();
  const navigate = useNavigate();

  // Route security
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You do not have administrative privileges.',
        confirmButtonColor: '#aa1a31'
      });
      navigate(RoutePaths.home);
    }
  }, [user, navigate]);

  // Modal / Form States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'priceAsc' | 'priceDesc' | 'stockAsc'>('name');

  // New Product States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState('Masale');
  const [brand, setBrand] = useState('masale');
  const [subCategory, setSubCategory] = useState('');
  const [unit, setUnit] = useState('250g');
  const [image, setImage] = useState('/images/ra_waa.png');

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice(0);
    setStock(0);
    setCategory('Masale');
    setBrand('masale');
    setSubCategory('');
    setUnit('250g');
    setImage('/images/ra_waa.png');
    setIsAdding(false);
    setEditingProduct(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || price <= 0 || stock < 0) {
      Swal.fire('Error', 'Please fill in valid details', 'error');
      return;
    }
    addProduct({
      name,
      description,
      price,
      stock,
      category,
      unit,
      image: image || '/images/ra_waa.png',
      brand,
      subCategory
    });
    Swal.fire('Success', 'Product added successfully!', 'success');
    resetForm();
  };

  const handleEditInit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setDescription(prod.description);
    setPrice(prod.price);
    setStock(prod.stock);
    setCategory(prod.category);
    setUnit(prod.unit);
    setImage(prod.image || '/images/ra_waa.png');
    setBrand(prod.brand || 'masale');
    setSubCategory(prod.subCategory || '');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct({
      ...editingProduct,
      name,
      description,
      price,
      stock,
      category,
      unit,
      image,
      brand,
      subCategory
    });
    Swal.fire('Success', 'Product updated successfully!', 'success');
    resetForm();
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#aa1a31',
      cancelButtonColor: '#secondary',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProduct(id);
        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      }
    });
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    if (sortBy === 'stockAsc') return a.stock - b.stock;
    return 0;
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        
        {/* Admin Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom border-2" style={{ borderColor: '#FFB300' }}>
          <div>
            <h2 className="mb-1" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>
              Inventory Management
            </h2>
            <p className="text-secondary mb-0">Total Products: <strong>{products.length}</strong> items • Filtered: <strong>{filteredProducts.length}</strong></p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-sm-0">
            <button className="btn btn-danger fw-bold" onClick={() => { resetForm(); setIsAdding(true); }}>
              <i className="bi bi-plus-circle me-1"></i> Add Product
            </button>
            <Link to={RoutePaths.admin} className="btn btn-sm text-white fw-bold d-flex align-items-center" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }}>Back to Dashboard</Link>
          </div>
        </div>

        {/* Add or Edit Form Container */}
        {(isAdding || editingProduct) && (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-top border-5 border-danger animate__animated animate__fadeIn">
            <h4 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#4A1525' }}>
              {isAdding ? 'Add New Product' : `Edit Product: ${editingProduct?.name}`}
            </h4>
            <form onSubmit={isAdding ? handleAdd : handleUpdate}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">Product Name</label>
                  <input type="text" className="form-control" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Category</label>
                  <select className="form-select" value={category} onChange={(e) => {
                    const cat = e.target.value;
                    setCategory(cat);
                    if (cat === 'Masale') setBrand('masale');
                    else if (cat === 'Namkeen') setBrand('namkeen');
                    else if (cat === 'Spice Home') setBrand('spicehome');
                    else if (cat === 'Chaha') setBrand('chaha');
                    else if (cat === 'Agro') setBrand('agro');
                  }}>
                    <option value="Masale">Masale</option>
                    <option value="Namkeen">Namkeen</option>
                    <option value="Spice Home">Spice Home</option>
                    <option value="Chaha">Tea/Chaha</option>
                    <option value="Agro">Agro</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Associated Brand</label>
                  <select className="form-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
                    <option value="masale">RA Masale</option>
                    <option value="namkeen">RA Namkeen</option>
                    <option value="spicehome">RA Spice Home</option>
                    <option value="chaha">RA Chaha</option>
                    <option value="agro">RA Agro</option>
                  </select>
                </div>
                {brand === 'spicehome' && (
                  <div className="col-md-3">
                    <label className="form-label text-muted fw-semibold">Spice Subcategory</label>
                    <select className="form-select" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                      <option value="">None</option>
                      <option value="Ground Spices">Ground Spices</option>
                      <option value="Pickles & Papad">Pickles & Papad</option>
                      <option value="Ready Mix Spices">Ready Mix Spices</option>
                      <option value="Seasonal Range">Seasonal Range</option>
                      <option value="Chutneys">Chutneys</option>
                      <option value="Kitchen Favourites">Kitchen Favourites</option>
                      <option value="Premium Range">Premium Range</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>
                )}
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Unit Size</label>
                  <input type="text" className="form-control" placeholder="250g, 100g, etc." required value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Price (INR)</label>
                  <input type="number" className="form-control" required value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Stock Quantity</label>
                  <input type="number" className="form-control" required value={stock} onChange={(e) => setStock(Number(e.target.value))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted fw-semibold">Product Image</label>
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {image && (
                      <span className="input-group-text bg-light p-1" style={{ width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={getAssetPath(image)} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-md-12">
                  <label className="form-label text-muted fw-semibold">Description</label>
                  <input type="text" className="form-control" required value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 d-flex gap-2">
                <button type="submit" className="btn text-white fw-bold px-4" style={{ backgroundColor: '#aa1a31' }}>
                  {isAdding ? 'Save Product' : 'Update Details'}
                </button>
                <button type="button" className="btn text-white px-4" style={{ backgroundColor: '#6c757d', border: '1px solid #5a6268' }} onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control bg-light border-start-0" 
                  placeholder="Search products by name or description..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select bg-light" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Masale">Masale</option>
                <option value="Namkeen">Namkeen</option>
                <option value="Spice Home">Spice Home</option>
                <option value="Chaha">Tea/Chaha</option>
                <option value="Agro">Agro</option>
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select bg-light" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="name">Sort by Name</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="stockAsc">Stock: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-5 text-muted">No products match your filters.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr className="table-light text-secondary" style={{ fontSize: '0.85rem' }}>
                    <th>ID</th>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => (
                    <tr key={prod.id}>
                      <td>#{prod.id}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="p-1 bg-light rounded-2 me-3" style={{ width: '40px', height: '40px', overflow: 'hidden' }}>
                            <img src={getAssetPath(prod.image)} alt={prod.name} className="w-100 h-100 object-fit-contain" />
                          </div>
                          <div>
                            <strong className="text-dark d-block">{prod.name}</strong>
                            <small className="text-muted">{prod.unit} • Brand: <strong className="text-capitalize">{prod.brand || 'masale'}</strong> • {prod.description.substring(0, 50)}...</small>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge bg-light text-dark border">{prod.category}</span></td>
                      <td className="fw-semibold">₹{prod.price}</td>
                      <td>
                        <span className={`fw-bold ${prod.stock < 10 ? 'text-danger' : 'text-success'}`}>
                          {prod.stock} units
                        </span>
                        {prod.stock < 10 && <small className="text-danger d-block text-xs">Low Stock!</small>}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                           <button className="btn btn-sm text-white" style={{ backgroundColor: '#4A1525', border: '1px solid #FFB300' }} onClick={() => handleEditInit(prod)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm text-white bg-danger" onClick={() => handleDelete(prod.id)}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default AdminProducts;
