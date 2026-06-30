import React from 'react'
import { getAssetPath } from '../Utils/imageHelper';

const Banner = ({page, path} : {page : string, path : string[]}) => {

  return (
    <div className='d-flex flex-column flex-md-row justify-content-between p-4 p-md-5 align-items-center gap-3' style={{ minHeight : '150px', backgroundImage : `url(${getAssetPath('images/h1.png')})`, backgroundSize: "cover", backgroundPosition: "center"}}>
        <h2 className='fw-bold mb-0 text-center text-md-start'>{page}</h2>
        <h5 className='fw-bold mb-0 text-center text-md-end'>{path.join(" > ")}</h5>
    </div>
  )

}

export default Banner;