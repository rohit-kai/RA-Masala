import { useLocation } from 'react-router-dom'

const active = "d-block p-3 fd-nav-active"; // WHERE MENU IS ACTIVE CLASS 
const inactive = "d-block p-3 text-black"; // WHERE MENU IS NOT ACTIVE CLASS

export const toggleLinkClass = (path : string, activeClass : string = active, inactiveClass : string = inactive) => {
    const currentLink = useLocation().pathname;
    return currentLink === path ? activeClass : inactiveClass
}

export const getItem = (keymane : string) => {
    return localStorage.getItem(keymane)
}

export const setItem = (keyname : string, value : any) => {
    return localStorage.setItem(keyname, JSON.stringify(value));
}

export const removeItem = (keyname : string) => {
    return localStorage.removeItem(keyname);
}

export const link = (url : string) : string => 'https://ramasala.com/storage/' + url;