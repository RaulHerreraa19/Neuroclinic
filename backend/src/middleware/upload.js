const fs = require('fs');
const path = require('path');
const multer = require('multer');

const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

// La extensión del archivo guardado sale de esta lista, nunca de `originalname` (el cliente la
// controla y podría spoofear un `.svg`/`.html` con Content-Type de imagen — XSS almacenado si
// se sirve tal cual desde /uploads).
const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = EXTENSION_BY_MIME_TYPE[file.mimetype];
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!EXTENSION_BY_MIME_TYPE[file.mimetype]) {
    const err = new Error('Formato de imagen no soportado. Usa JPG, PNG o WEBP.');
    err.status = 400;
    return cb(err);
  }
  cb(null, true);
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

module.exports = { uploadAvatar, AVATARS_DIR };
