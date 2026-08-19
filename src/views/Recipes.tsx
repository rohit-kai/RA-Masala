import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './includes/Header';
import Banner from '../components/Banner';
import Footer from './includes/Footer';
import { getAssetPath } from '../Utils/imageHelper';
import RoutePaths from '../config';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
}

const Recipes: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Route security
  useEffect(() => {
    const isSuperAdmin = user?.role === 'admin' && user?.email !== 'admin@ramasala.com';
    if (!isSuperAdmin) {
      Swal.fire({
        icon: 'error',
        title: t('rcp_access_denied'),
        text: t('rcp_access_denied_message'),
        confirmButtonColor: '#aa1a31'
      });
      navigate(RoutePaths.home);
    }
  }, [user, navigate]);
  const recipesData: Record<string, Recipe> = {
    breakfast: {
      title: "Garam Masala Poha (Breakfast)",
      ingredients: [
        "2 cups Beaten Rice (Poha)",
        "1 medium Onion, finely chopped",
        "1-2 Green Chilies, slit",
        "1/2 tsp Mustard Seeds",
        "5-6 Curry Leaves",
        "1/2 tsp Turmeric Powder",
        "1/2 tsp RA Garam Masala",
        "1 tbsp Lemon Juice",
        "Fresh Coriander & Roasted Peanuts for garnish",
        "2 tbsp Cooking Oil & Salt to taste"
      ],
      instructions: [
        "Wash the poha gently under running water, drain completely, and keep aside for 10 minutes to soften.",
        "Heat oil in a pan, add mustard seeds, peanuts, and curry leaves. Let them crackle.",
        "Add chopped onions and green chilies. Sauté until onions become translucent.",
        "Stir in the salt, turmeric powder, and RA Garam Masala.",
        "Add the softened poha, mix gently, cover and steam on low heat for 3-5 minutes.",
        "Turn off the heat, add lemon juice, and garnish with fresh coriander. Serve hot."
      ]
    },
    dessert: {
      title: "Shahi Cardamom Kheer (Dessert)",
      ingredients: [
        "1 liter Full Fat Milk",
        "1/4 cup Basmati Rice (washed and soaked for 30 mins)",
        "1/2 cup Sugar",
        "1/2 tsp Cardamom Powder",
        "10-12 Almonds & Cashews, chopped",
        "A pinch of Saffron strands (soaked in 2 tbsp warm milk)"
      ],
      instructions: [
        "Boil milk in a heavy-bottomed pan. Once boiled, lower the flame and add the soaked rice.",
        "Cook on low flame, stirring occasionally, until the milk reduces to half and rice is completely cooked and mashed.",
        "Add sugar and saffron milk, mix well, and simmer for another 5 minutes.",
        "Stir in Cardamom powder and chopped nuts.",
        "Turn off the flame. Serve warm or refrigerate to serve chilled."
      ]
    },
    dinner: {
      title: "Shahi Dum Biryani (Dinner)",
      ingredients: [
        "500g Rice (long-grain Basmati)",
        "500g Mixed Vegetables or Paneer/Mutton",
        "1 cup Thick Curd (Yogurt)",
        "3 tbsp RA Shahi Biryani Masala",
        "2 Large Onions, thinly sliced & golden fried",
        "3 tbsp Ghee or Butter",
        "Mint & Coriander leaves, chopped"
      ],
      instructions: [
        "Cook basmati rice in salted water until 70% done. Drain and set aside.",
        "Marinate vegetables/paneer with yogurt, ginger-garlic paste, salt, and RA Shahi Biryani Masala for 30 mins.",
        "In a deep pot, cook the marinated mixture for 10 minutes.",
        "Layer the parboiled rice on top of the cooked base, sprinkle fried onions, mint, coriander, and ghee.",
        "Seal the pot with dough or foil and cover with a heavy lid.",
        "Cook on low heat (Dum) for 20-25 minutes. Fluff gently and serve with raita."
      ]
    },
    festive: {
      title: "Traditional Festive Puran Poli (Festive)",
      ingredients: [
        "1 cup Chana Dal (Bengal Gram)",
        "1 cup Jaggery, grated",
        "1 tsp Cardamom & Nutmeg Powder",
        "1.5 cups Wheat Flour or Maida",
        "Ghee for roasting"
      ],
      instructions: [
        "Boil chana dal until soft, drain water completely, and mash it.",
        "Cook the mashed dal with jaggery in a pan until thick. Stir in cardamom and nutmeg powder. Let it cool (Puran).",
        "Knead wheat flour with oil, salt, and water to make a soft dough.",
        "Take a small ball of dough, stuff it with Puran, seal the edges, and roll out into a thin flatbread.",
        "Roast on a hot griddle (tawa) using ghee until golden brown spots appear on both sides. Serve hot with ghee."
      ]
    },
    lunch: {
      title: "Kolhapuri Misal Pav (Lunch)",
      ingredients: [
        "2 cups Sprouted Moth Beans (Matki)",
        "1 large Onion & 1 Tomato, chopped",
        "2 tbsp RA Kolhapuri Ghati Masala (or Misal Masala)",
        "1 tbsp Ginger-Garlic paste",
        "2 cups Farsan/Namkeen mix",
        "Lemon slices, chopped coriander, and buttered Pav"
      ],
      instructions: [
        "Pressure cook sprouted moth beans with salt and turmeric until soft.",
        "Heat oil in a pan, sauté onions, tomatoes, and ginger-garlic paste until oil separates.",
        "Add RA Kolhapuri Masala and sauté for a minute. Add cooked moth beans and 3 cups of water.",
        "Simmer on medium flame to get a thin, fiery red gravy with a layer of oil on top (Kat/Tari).",
        "To assemble, ladle moth beans in a bowl, add spicy gravy, top with lots of farsan, fresh onions, and coriander.",
        "Serve hot with lemon wedges and toasted pav."
      ]
    },
    readymix: {
      title: "Instant Special Pav Bhaji (Ready Mix)",
      ingredients: [
        "2 cups Boiled & Mashed mixed vegetables (Potatoes, Green Peas, Cauliflower)",
        "1 Onion & 1 Tomato, finely chopped",
        "2.5 tbsp RA Special Pav Bhaji Masala",
        "3 tbsp Butter",
        "Lemon juice & fresh coriander"
      ],
      instructions: [
        "Melt 2 tbsp butter in a flat pan, sauté onions until translucent, then add tomatoes and cook until soft.",
        "Add RA Special Pav Bhaji Masala and salt. Sauté for 30 seconds.",
        "Add the mashed vegetables along with a cup of water. Mix and mash everything together with a potato masher.",
        "Simmer for 10 minutes on low heat. Stir in lemon juice and coriander.",
        "Top with remaining butter and serve piping hot with buttery pav."
      ]
    }
  };

  const handleRecipeClick = (key: string) => {
    const recipe = recipesData[key];
    if (!recipe) return;

    Swal.fire({
      title: `<span style="font-family: serif; color: #4A1525; font-weight: bold;">${recipe.title}</span>`,
      html: `
        <div style="text-align: left; max-height: 60vh; overflow-y: auto; padding: 5px 15px; font-family: sans-serif;">
          <h6 style="font-weight: bold; color: #aa1a31; border-bottom: 2px dashed #FFB300; padding-bottom: 5px;">${t('rcp_ingredients')}</h6>
          <ul style="padding-left: 20px; line-height: 1.6; color: #333;">
            ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
          </ul>
          <h6 style="font-weight: bold; color: #aa1a31; border-bottom: 2px dashed #FFB300; padding-bottom: 5px; margin-top: 20px;">${t('rcp_instructions')}</h6>
          <ol style="padding-left: 20px; line-height: 1.6; color: #555;">
            ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>
      `,
      confirmButtonText: t('rcp_close'),
      confirmButtonColor: '#4A1525',
      customClass: {
        popup: 'rounded-4 border-3',
      }
    });
  };

  const categoryList = [
    { key: 'breakfast', label: t('rcp_cat_breakfast'), sub: t('rcp_title'), path: RoutePaths.breakfastRecipes },
    { key: 'dessert', label: t('rcp_cat_dessert'), sub: t('rcp_title'), path: RoutePaths.dessertRecipes },
    { key: 'dinner', label: t('rcp_cat_dinner'), sub: t('rcp_title'), path: RoutePaths.dinnerRecipes },
    { key: 'festive', label: t('rcp_cat_festive'), sub: t('rcp_title'), path: RoutePaths.festiveRecipes },
    { key: 'lunch', label: t('rcp_cat_lunch'), sub: t('rcp_title'), path: RoutePaths.lunchRecipes },
    { key: 'readymix', label: t('rcp_cat_ready_mix'), sub: t('rcp_title'), path: RoutePaths.readyMixRecipes }
  ];

  return (
    <div style={{ backgroundColor: '#FDF6ED', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Banner page={t('rcp_title')} path={[t('nav_home'), t('rcp_title')]} />

      <div className="container py-5 flex-grow-1">

        {/* Banner Images Section with Hyperlinks */}
        <div className="row g-4 mb-5 justify-content-center">
          <div className="col-lg-4 col-md-6">
            <div
              className="recipe-banner-link"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('a')) {
                  window.location.hash = '/home';
                }
              }}
            >
              <div className="recipe-banner-card shadow-sm border rounded-4 overflow-hidden position-relative">
                <img
                  src={getAssetPath('images/recipes1.png')}
                  alt={t('rcp_banner_ad1_alt')}
                  className="w-100 h-100 object-fit-cover transition-transform"
                />
                <div className="recipe-banner-overlay">
                  <a
                    href="https://www.youtube.com/shorts/cp4iX7nOelo?si=8eiR3zP3P8qq_6wP"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="btn btn-warning btn-sm fw-bold">{t('rcp_explore_recipes')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div
              className="recipe-banner-link"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('a')) {
                  window.location.hash = '/home';
                }
              }}
            >
              <div className="recipe-banner-card shadow-sm border rounded-4 overflow-hidden position-relative">
                <img
                  src={getAssetPath('images/recipes2.png')}
                  alt={t('rcp_banner_ad2_alt')}
                  className="w-100 h-100 object-fit-cover transition-transform"
                />
                <div className="recipe-banner-overlay">
                  <a
                    href="https://www.youtube.com/shorts/BsrDQbTbapM"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="btn btn-warning btn-sm fw-bold">{t('rcp_explore_recipes')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-6">
            <div
              className="recipe-banner-link"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                if (!(e.target as HTMLElement).closest('a')) {
                  window.location.hash = '/home';
                }
              }}
            >
              <div className="recipe-banner-card shadow-sm border rounded-4 overflow-hidden position-relative">
                <img
                  src={getAssetPath('images/recipes3.png')}
                  alt={t('rcp_banner_ad3_alt')}
                  className="w-100 h-100 object-fit-cover transition-transform"
                />
                <div className="recipe-banner-overlay">
                  <a
                    href="https://www.youtube.com/shorts/ygH3GRb4W7s?si=b2-jnV-fOXVvSvh8"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="btn btn-warning btn-sm fw-bold">{t('rcp_explore_recipes')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Divider */}
        <div className="text-center mb-5">
          <div style={{ width: '60px', height: '3px', backgroundColor: '#FFB300', margin: '0 auto 15px' }}></div>
          <h2 style={{ fontFamily: 'serif', color: '#4A1525', fontWeight: 'bold' }}>{t('rcp_categories_title')}</h2>
          <p className="text-muted">{t('rcp_categories_subtitle')}</p>
        </div>

        {/* Recipe Categories Grid */}
        <div className="row g-4 justify-content-center">
          {categoryList.map((cat) => (
            <div key={cat.key} className="col-xl-4 col-md-6 col-sm-12">
              <Link 
                to={cat.path}
                className="text-decoration-none"
              >
                <div className="recipe-category-card">
                  <div className="recipe-category-text">
                    <h3 className="category-label">{cat.label}</h3>
                    <h4 className="category-sub">{cat.sub}</h4>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

      </div>

      <Footer />

      {/* Styled JSX for Premium Page Aesthetics */}
      <style>{`
        .recipe-banner-card {
          height: 380px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .recipe-banner-card img {
          transition: transform 0.5s ease;
        }
        .recipe-banner-card:hover img {
          transform: scale(1.05);
        }
        .recipe-banner-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .recipe-banner-card:hover .recipe-banner-overlay {
          opacity: 1;
        }
        
        /* Yellow-to-orange gradient recipe category card matching the user's uploaded reference */
        .recipe-category-card {
          background: linear-gradient(180deg, #FFD043 0%, #FFA800 100%);
          border: 3px solid #FFF1C5;
          outline: 2px solid #FFA800;
          border-radius: 20px;
          min-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 8px 20px rgba(255, 168, 0, 0.25);
        }
        
        .recipe-category-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(255, 168, 0, 0.4);
          outline-color: #aa1a31;
        }
        
        .recipe-category-text {
          font-family: 'serif';
        }
        
        .category-label {
          color: #E3000E;
          font-weight: 900;
          font-size: 2.2rem;
          margin-bottom: 2px;
          text-shadow: 1px 1px 0px #FFEBB0, 2px 2px 0px rgba(0, 0, 0, 0.15);
        }
        
        .category-sub {
          color: #E3000E;
          font-weight: 800;
          font-size: 1.8rem;
          margin: 0;
          text-shadow: 1px 1px 0px #FFEBB0, 2px 2px 0px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default Recipes;
