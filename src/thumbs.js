import atlas from '../assets/kanto-atlas.webp';
document.documentElement.style.setProperty('--kanto-atlas','url('+atlas+')');
export function portrait(el,id){el.style.backgroundPosition=((id-1)%16)*100/15+'% '+Math.floor((id-1)/16)*100/9+'%';}
