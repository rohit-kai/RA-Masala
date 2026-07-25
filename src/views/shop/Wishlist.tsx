import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import RoutePaths from '../../config';
import { getAssetPath } from '../../Utils/imageHelper';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (item: any) => {
    // Map wish list item structure to Product interface structure expected by addToCart
    const productData = {
      id: isNaN(Number(item.productId)) ? item.productId : Number(item.productId),
      _id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      description: 'Indian blend',
      stock: 50,
      category: 'Masale',
      unit: '250g'
    };
    addToCart(productData, 1);
    removeFromWishlist(item.productId);
  };

  return (
    <div style={{
      backgroundImage: "linear-gradient(rgba(253, 246, 237, 0.85), rgba(253, 246, 237, 0.85)), url('/images/sp2.png')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header />
      <div className="container py-5 flex-grow-1">
        <h2 className="mb-4 text-start" style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold', borderBottom: '3px solid #FFB300', paddingBottom: '10px' }}>
          My Wishlist
        </h2>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 shadow-sm border border-light">
            <i className="bi bi-heart fs-1 text-muted"></i>
            <h4 className="mt-3" style={{ color: '#4A1525', fontFamily: 'serif' }}>Your wishlist is empty</h4>
            <p className="text-secondary">Save your favorite premium spices here to purchase them later!</p>
            <Link to={RoutePaths.home} className="btn text-white mt-2 px-4 py-2 fw-semibold" style={{ backgroundColor: '#aa1a31' }}>
              Explore Spices
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {wishlistItems.map((item) => (
              <div key={item.productId} className="col-md-6 col-lg-4 col-xl-3 animate__animated animate__fadeIn">
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white text-center p-3">
                  <div className="position-relative">
                    <button
                      className="btn btn-sm btn-light rounded-circle shadow-sm position-absolute top-0 end-0 m-2 text-danger border-0"
                      onClick={() => removeFromWishlist(item.productId)}
                      style={{ zIndex: 5 }}
                    >
                      <i className="bi bi-trash fs-5"></i>
                    </button>
                    <div className="p-3 bg-light rounded-4 mb-3" style={{ height: '180px', overflow: 'hidden' }}>
                      <img src={getAssetPath(item.image)} alt={item.name} className="w-100 h-100 object-fit-contain" />
                    </div>
                  </div>
                  <div className="card-body p-1 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1" style={{ color: '#4A1525' }}>{item.name}</h6>
                      <p className="text-secondary fw-semibold mb-3">₹{item.price}</p>
                    </div>
                    <button
                      className="btn w-100 text-white fw-bold py-2 rounded-3 shadow-sm border-0"
                      style={{ background: 'linear-gradient(90deg, #800c1e 0%, #aa1a31 100%)' }}
                      onClick={() => handleMoveToCart(item)}
                    >
                      <i className="bi bi-cart-plus me-2"></i> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
