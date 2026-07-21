import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../includes/Header';
import Banner from '../../components/Banner';
import Footer from '../includes/Footer';
import { getAssetPath } from '../../Utils/imageHelper';
import RoutePaths from '../../config';
import Swal from 'sweetalert2';

const BreakfastRecipes: React.FC = () => {
  const recipes = [
    {
      id: "b1",
      title: "Classic Garam Masala Poha",
      description: "Soft flattened rice flakes tempered with mustard seeds, curry leaves, and a dash of RA Garam Masala.",
      image: getAssetPath('images/recipes1.png'),
      youtubeUrl: "https://www.youtube.com/shorts/cp4iX7nOelo?si=8eiR3zP3P8qq_6wP",
      recipeDetails: "GGGGGGGGGGGGGGGGGGG"
    },
    {
      id: "b2",
      title: "Masala Upma",
      description: "A nutritious, savory semolina porridge loaded with fresh garden vegetables and aromatic spices.",
      image: getAssetPath('images/recipes2.png'),
      youtubeUrl: "https://www.youtube.com/shorts/BsrDQbTbapM",
      recipeDetails: "GGGGGGGGGGGGGGGGGGG"
    }
  ];

  const handleShowRecipeDetails = (title: string, details: string) => {
    Swal.fire({
      title: `<span style="font-family: serif; color: #4A1525; font-weight: bold;">${title}</span>`,
      html: `
        <div style="text-align: left; padding: 15px; font-family: sans-serif; white-space: pre-line; color: #333; font-size: 1.1rem;">
          ${details}
        </div>
      `,
      confirmButtonText: 'Close',
      confirmButtonColor: '#4A1525',
      customClass: {
        popup: 'rounded-4 border-3',
      }
    });
  };

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Banner page="Breakfast Recipes" path={["Home", "Recipes", "Breakfast"]} />

      <div className="container py-5 flex-grow-1">
        <div className="mb-4">
          <Link to={RoutePaths.recipes} className="btn text-white fw-bold btn-sm shadow-sm" style={{ backgroundColor: '#4A1525' }}>
            <i className="bi bi-arrow-left-short me-1 fs-5"></i> Back to Recipes
          </Link>
        </div>

        <div className="row g-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="col-lg-4 col-md-6 col-12">
              <div className="recipe-item-card border shadow-sm rounded-4 overflow-hidden bg-white h-100 d-flex flex-column">
                <div className="recipe-item-image-wrapper overflow-hidden position-relative">
                  <img 
                    src={recipe.image} 
                    alt={recipe.title} 
                    className="w-100 h-100 object-fit-cover transition-transform" 
                    style={{ height: '260px' }}
                  />
                  <div className="recipe-play-overlay d-flex align-items-center justify-content-center">
                    <a href={recipe.youtubeUrl} target="_blank" rel="noopener noreferrer" className="recipe-play-btn shadow-lg">
                      <i className="bi bi-play-fill text-white fs-2"></i>
                    </a>
                  </div>
                </div>
                <div className="p-4 d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold mb-2 text-dark" style={{ fontFamily: 'serif' }}>{recipe.title}</h5>
                  <p className="text-muted small mb-4 flex-grow-1">{recipe.description}</p>
                  <button 
                    onClick={() => handleShowRecipeDetails(recipe.title, recipe.recipeDetails)}
                    className="btn btn-outline-danger fw-bold w-100 py-2 rounded-3 mb-2 d-flex align-items-center justify-content-center gap-2"
                    style={{ borderColor: '#aa1a31', color: '#aa1a31' }}
                  >
                    <i className="bi bi-receipt"></i> View Recipe Details
                  </button>
                  <a 
                    href={recipe.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn text-white fw-bold w-100 py-2 rounded-3 mt-auto d-flex align-items-center justify-content-center gap-2"
                    style={{ backgroundColor: '#aa1a31' }}
                  >
                    <i className="bi bi-youtube"></i> Watch Video Tutorial
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      <style>{`
        .recipe-item-image-wrapper {
          position: relative;
        }
        .recipe-item-image-wrapper img {
          transition: transform 0.5s ease;
        }
        .recipe-item-card:hover img {
          transform: scale(1.06);
        }
        .recipe-play-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .recipe-item-card:hover .recipe-play-overlay {
          opacity: 1;
        }
        .recipe-play-btn {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #aa1a31;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, background 0.2s ease;
          padding-left: 3px;
        }
        .recipe-play-btn:hover {
          transform: scale(1.15);
          background: #E3000E;
        }
        .recipe-item-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .recipe-item-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 25px rgba(0,0,0,0.12) !important;
        }
      `}</style>
    </div>
  );
};

export default BreakfastRecipes;
