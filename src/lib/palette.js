/**
 * 64-colour sRGB palette. The scene is quantised to these values after an
 * 8x8 ordered dither, which is what gives the miniature its printed, pixel-art
 * finish. Keep the length at exactly 64: the shader declares vec3[64].
 */
export const PALETTE_HEX = [
  // paper, plaster, limestone, deck stone
  '#ffffff', '#f3bdd2', '#f3eddf', '#d484ab', '#e1d7c5',
  '#d6cbb8', '#c9bda9', '#baae9a', '#a85c8c', '#80559b',
  // concrete, shadow, steel darks
  '#8b9195', '#bc94d0', '#867ac0', '#5e656a', '#51575c',
  '#44365c', '#383e43', '#2c3237',
  // water and glazed tile ramps
  '#d8f2ef', '#bce9e4', '#6da6d8', '#80cecf', '#67bfc4',
  '#4a77b0', '#429da7', '#338b98', '#287888', '#206577',
  '#375280', '#164456', '#88bb81', '#b9d7a4', '#538f79',
  '#4a9aa5',
  // skin
  '#f4d5b8', '#eac09d', '#dfab82', '#d0966b', '#b97d55',
  '#9c6440', '#71452e',
  // hair
  '#2c231e', '#463128', '#62452f', '#539760', '#9bc659',
  // swimwear, inflatables, drink, accents
  '#ef6a52', '#d9503c', '#ffcb28', '#f39e17', '#3aa39a',
  '#267e78', '#fff199', '#66638c', '#efe7d6', '#ee8036',
  '#be592c', '#c7d3d8',
  // metals
  '#b9c5c9', '#9ba7ab', '#41695b', '#606b70', '#3b4449',
  '#20282c',
];

export const PALETTE_RGB = PALETTE_HEX.map((hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
});
