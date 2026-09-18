const sharp = require('sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const files = [
  ['img/my_photo.jpg', 'portrait', true],
  ['img/content_page/about_me.png', 'about', true],
  ['img/content_page/skils.jpeg', 'skills', true],
  ['img/content_page/web1.png', 'work-1', false],
  ['img/content_page/web2.png', 'work-2', false],
  ['img/content_page/web3.png', 'work-3', false],
];
(async () => {
  for (const [input, output, crop] of files) {
    let image = sharp(path.join(root, input)).rotate();
    image = crop ? image.resize(480, 640, { fit: 'cover' }) : image.resize({ width: 700, withoutEnlargement: true });
    const info = await image.webp({ quality: 82 }).toFile(path.join(root, 'img/optimized', `${output}.webp`));
    console.log(`${output}: ${info.width}x${info.height}, ${info.size} bytes`);
  }
})();
