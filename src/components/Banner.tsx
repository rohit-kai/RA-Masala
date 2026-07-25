import React from 'react'
import { getAssetPath } from '../Utils/imageHelper';

const Banner = ({ page, path }: { page: string, path: string[] }) => {

  return (
    <div className='d-flex flex-column flex-md-row justify-content-between p-4 p-md-5 align-items-center gap-3' style={{ 
      minHeight : '150px', 
      backgroundImage : `url(${getAssetPath('images/h1.png')})`, 
      backgroundSize: "cover", 
      backgroundPosition: "center",
      borderBottom: '2.5px solid #FFD700'
    }}>
        {/* High-legibility brand-colored badge for Page Title */}
        <div style={{
          background: 'rgba(74, 21, 37, 0.9)',
          padding: '10px 24px',
          borderRadius: '12px',
          border: '1.5px solid #FFD700',
          boxShadow: '0 4px 15px rgba(0,0,0,0.35)'
        }}>
            <h2 className='fw-bold mb-0 text-center text-md-start' style={{ color: '#FFD700', fontFamily: 'serif' }}>{page}</h2>
        </div>

        {/* High-legibility dark badge for Breadcrumbs */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '8px 18px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}>
            <h5 className='fw-bold mb-0 text-center text-md-end text-white' style={{ fontSize: '0.95rem' }}>{path.join(" > ")}</h5>
        </div>
    </div>
  )

}

export default Banner;