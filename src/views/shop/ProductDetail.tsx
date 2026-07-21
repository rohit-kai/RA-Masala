import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../includes/Header';
import Footer from '../includes/Footer';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import Swal from 'sweetalert2';
import { getAssetPath } from '../../Utils/imageHelper';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const { products, user, reviews, addReview } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // Review Form States
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Find product from AuthContext (which polls every 5s)
  const product = products.find((p) => String(p._id || p.id) === id);

  // Scroll to top on mount or product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (!product) {
    return (
      <>
        <Header />
        <div className="d-flex flex-column align-items-center justify-content-center text-white" style={{ minHeight: '60vh', background: 'radial-gradient(circle, #5b1a2c 0%, #2c0b14 100%)' }}>
          <h2 className="mb-4" style={{ fontFamily: 'serif', color: '#FFD700' }}>Product Not Found</h2>
          <p className="text-light opacity-75 mb-4">The product you are looking for does not exist or has been removed.</p>
          <Link to="/home" className="btn px-4 py-2 text-white fw-bold" style={{ backgroundColor: '#aa1a31', borderRadius: '8px' }}>
            <i className="bi bi-arrow-left me-2"></i> Back to Home
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // Filter reviews for this product
  const productReviews = reviews.filter((r) => r.productId === id || r.productId === product._id || r.productId === String(product.id));

  // Get related products (same category, excluding current product)
  const relatedProducts = products
    .filter((p) => p.category === product.category && String(p._id || p.id) !== id)
    .slice(0, 4);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please login to write a review for this product.',
        confirmButtonColor: '#4A1525',
        showCancelButton: true,
        confirmButtonText: 'Login Now'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    if (!comment.trim()) {
      Swal.fire('Error', 'Please enter a comment.', 'error');
      return;
    }

    try {
      await addReview({
        productId: String(product._id || product.id),
        productName: product.name,
        customerName: user.name,
        customerEmail: user.email,
        rating,
        comment
      });
      Swal.fire({
        icon: 'success',
        title: 'Review Submitted',
        text: 'Thank you for your valuable feedback!',
        timer: 1500,
        showConfirmButton: false
      });
      setComment('');
      setRating(5);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to submit review.', 'error');
    }
  };

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      Swal.fire('Out of Stock', 'Sorry, this product is temporarily unavailable.', 'warning');
      return;
    }
    // Add multiple quantities if needed
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    Swal.fire({
      icon: 'success',
      title: 'Added to Cart',
      text: `${quantity} x ${product.name} added to your cart.`,
      timer: 1200,
      showConfirmButton: false
    });
  };

  return (
    <>
      <Header />
      <main 
        className="product-detail-page py-5"
        style={{
          backgroundImage: `url(${getAssetPath('images/sp2.png')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          position: 'relative'
        }}
      >
        {/* Dark rich red overlay */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(42, 6, 15, 0.7) 0%, rgba(20, 2, 6, 0.9) 100%)',
          zIndex: 1
        }}></div>

        <div className="container position-relative" style={{ zIndex: 2 }}>
          {/* Breadcrumb navigation */}
          <nav className="mb-4" aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link to="/home" className="text-warning text-decoration-none">Home</Link></li>
              <li className="breadcrumb-item text-light opacity-50" aria-current="page">{product.category}</li>
              <li className="breadcrumb-item active text-white" aria-current="page">{product.name}</li>
            </ol>
          </nav>

          {/* Product main block */}
          <div className="row g-5 mb-5 align-items-center">
            {/* Product Image Section */}
            <div className="col-lg-6">
              <div 
                className="position-relative p-4 rounded-4 shadow-lg d-flex justify-content-center align-items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '450px'
                }}
              >
                <img 
                  src={getAssetPath(product.image)} 
                  alt={product.name}
                  style={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                  }}
                />
                
                <span 
                  className="position-absolute top-0 start-0 m-3 px-3 py-1.5 rounded-pill fw-semibold text-uppercase text-white"
                  style={{
                    backgroundColor: '#4A1525',
                    border: '1.5px solid #FFD700',
                    fontSize: '0.8rem',
                    letterSpacing: '1px'
                  }}
                >
                  {product.category}
                </span>

                <button 
                  className="btn position-absolute top-0 end-0 m-3 rounded-circle bg-white shadow-sm d-flex align-items-center justify-content-center border-0"
                  style={{ width: '45px', height: '45px', zIndex: 10, transition: 'transform 0.2s' }}
                  onClick={() => {
                    const pId = product._id || product.id;
                    if (isInWishlist(pId)) {
                      removeFromWishlist(pId);
                      Swal.fire('Wishlist Removed', 'Product removed from wishlist', 'info');
                    } else {
                      addToWishlist(product);
                      Swal.fire('Wishlist Added', 'Product added to wishlist', 'success');
                    }
                  }}
                >
                  <i className={`bi ${isInWishlist(product._id || product.id) ? 'bi-heart-fill text-danger' : 'bi-heart text-muted'}`} style={{ fontSize: '1.5rem', marginTop: '3px' }}></i>
                </button>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="col-lg-6 text-white">
              <h1 className="display-5 fw-bold mb-2" style={{ fontFamily: 'serif', color: '#FFD700' }}>
                {product.name}
              </h1>

              {/* Average Rating info */}
              <div className="d-flex align-items-center mb-3">
                <div className="text-warning me-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const avg = productReviews.length > 0
                      ? productReviews.reduce((acc, curr) => acc + curr.rating, 0) / productReviews.length
                      : 5;
                    return (
                      <i key={star} className={`bi ${star <= Math.round(avg) ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                    );
                  })}
                </div>
                <span className="text-light opacity-75">
                  ({productReviews.length} Customer Reviews)
                </span>
              </div>

              {/* Price and Unit */}
              <div className="fs-2 fw-bold mb-4" style={{ color: '#FFD700' }}>
                ₹{product.price}
                <span className="text-light opacity-50 fs-5 fw-normal"> / {product.unit}</span>
              </div>

              {/* Description */}
              <p className="lead text-light opacity-90 mb-4 lh-lg">
                {product.description}
              </p>

              {/* Stock status indicator */}
              <div className="mb-4">
                <span className="fw-semibold">Availability: </span>
                {product.stock > 0 ? (
                  <span className="text-success badge bg-success bg-opacity-25 border border-success px-3 py-1.5 rounded-pill ms-2">
                    {product.stock} Units In Stock
                  </span>
                ) : (
                  <span className="text-danger badge bg-danger bg-opacity-25 border border-danger px-3 py-1.5 rounded-pill ms-2">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Quantity Select and Add to Cart */}
              {product.stock > 0 && (
                <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                  <div className="d-flex align-items-center bg-dark bg-opacity-50 rounded-3 border border-secondary">
                    <button 
                      className="btn text-white px-3 py-2 border-0" 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="px-3 fw-bold fs-5">{quantity}</span>
                    <button 
                      className="btn text-white px-3 py-2 border-0"
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>

                  <button 
                    className="btn btn-lg fw-bold text-white px-5 py-3 border-0 transition-transform"
                    style={{ backgroundColor: '#aa1a31', borderRadius: '8px', boxShadow: '0 4px 15px rgba(170, 26, 49, 0.4)' }}
                    onClick={handleAddToCart}
                  >
                    <i className="bi bi-cart-plus me-2"></i> Add to Cart
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-secondary my-5" />

          {/* Customer Reviews Section */}
          <div className="row g-5 text-white mb-5">
            {/* Reviews List */}
            <div className="col-lg-7">
              <h3 className="mb-4 fw-bold" style={{ fontFamily: 'serif', color: '#FFD700' }}>
                <i className="bi bi-chat-left-text me-2 text-warning"></i> Customer Reviews
              </h3>

              {productReviews.length === 0 ? (
                <div className="p-5 text-center rounded-3 bg-dark bg-opacity-20 border border-secondary">
                  <i className="bi bi-chat-square-quote display-4 text-muted mb-3 d-block"></i>
                  <p className="text-light opacity-50">No reviews yet for this product. Be the first to share your experience!</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {productReviews.map((review, idx) => (
                    <div 
                      key={review._id || idx}
                      className="p-4 rounded-3 shadow-sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0 fw-semibold text-warning">{review.customerName}</h5>
                        <div className="text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`bi ${star <= review.rating ? 'bi-star-fill' : 'bi-star'} me-1`}></i>
                          ))}
                        </div>
                      </div>
                      <p className="mb-0 text-light opacity-90 italic">
                        "{review.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Write Review Form */}
            <div className="col-lg-5">
              <div 
                className="p-4 rounded-4 shadow-lg"
                style={{
                  background: 'rgba(74, 21, 37, 0.3)',
                  border: '1.5px solid #FFD700',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <h4 className="mb-4 fw-bold text-center" style={{ fontFamily: 'serif', color: '#FFD700' }}>
                  Write a Review
                </h4>

                <form onSubmit={handleAddReview}>
                  {/* Star Rating Select */}
                  <div className="mb-3">
                    <label className="form-label d-block text-light opacity-75">Your Rating</label>
                    <div className="fs-3 text-warning">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i 
                          key={star} 
                          className={`bi ${star <= rating ? 'bi-star-fill' : 'bi-star'} cursor-pointer me-2`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setRating(star)}
                        ></i>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="mb-4">
                    <label className="form-label text-light opacity-75">Review Comments</label>
                    <textarea 
                      className="form-control bg-dark bg-opacity-50 text-white border-secondary"
                      rows={4}
                      placeholder="Share your culinary experience with this authentic blend..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn w-100 fw-bold text-white border-0 py-2.5 text-uppercase"
                    style={{ backgroundColor: '#FFD700', color: '#4A1525', borderRadius: '8px' }}
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Related Products Panel */}
          {relatedProducts.length > 0 && (
            <div className="related-products-section text-white mt-5">
              <h3 className="mb-4 text-center fw-bold" style={{ fontFamily: 'serif', color: '#FFD700' }}>
                Explore Related Spices
              </h3>
              <div className="row g-4">
                {relatedProducts.map((related) => (
                  <div key={related._id || related.id} className="col-md-6 col-lg-3">
                    <div 
                      className="p-3 rounded-3 text-center h-100 d-flex flex-column"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <div className="mb-3 overflow-hidden rounded" style={{ height: '180px' }}>
                        <img 
                          src={getAssetPath(related.image)} 
                          alt={related.name}
                          style={{ height: '100%', width: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <h5 className="fw-bold mb-1 text-truncate">{related.name}</h5>
                      <p className="text-warning fw-semibold mb-3">₹{related.price} / {related.unit}</p>
                      <Link 
                        to={`/product/${related._id || related.id}`}
                        className="btn btn-outline-warning w-100 mt-auto btn-sm fw-bold"
                        style={{ borderRadius: '6px' }}
                      >
                        View Spice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;
