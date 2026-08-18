import React from 'react'

export const SocialsNetworks = ({addClass = ''} : {addClass? : string}) => {

    return <div className="d-flex gap-3 header-socials">
        <a href="https://www.facebook.com/RAMASALEpvtltd/" target="_blank" rel="noopener noreferrer"><i className={'bi bi-facebook fd-hover-color-primary ' + addClass}></i></a>
        <a href="https://www.instagram.com/ramasalepvt.ltd/?hl=en" target="_blank" rel="noopener noreferrer"><i className={'bi bi-instagram fd-hover-color-primary ' + addClass}></i></a>
        <a href="https://www.youtube.com/@RAWAAHKITCHEN/videos" target="_blank" rel="noopener noreferrer"><i className={'bi bi-youtube fd-hover-color-primary ' + addClass}></i></a>
    </div>
}