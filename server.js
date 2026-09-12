const express = require('express');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const slugify = require('slugify');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Config ----------
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'CSK@Admin2026'; // change this before going live
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';

const BLOGS_FILE = path.join(__dirname, 'data', 'blogs.json');
const SERVICES_FILE = path.join(__dirname, 'data', 'services.json');
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

const SITE = {
  name: 'Corporate Seva Kendra',
  phone: '+919990949449',
  phoneDisplay: '+91 99909 49449',
  email: 'corporatesevakendra@gmail.com',
  whatsapp: 'https://api.whatsapp.com/send?phone=919990949449',
  address: '312A, 3rd Floor, Metroplex East Mall, Radhu Palace, Near Nirman Vihar Metro Station, Delhi-110092',
  social: {
    facebook: 'https://www.facebook.com/Corporate-Sewa-Kendra-105803188262793/',
    twitter: 'https://twitter.com/CorporateSeva',
    linkedin: 'https://www.linkedin.com/in/corporate-seva-kendra-943217213/',
    instagram: 'https://www.instagram.com/corporatesevakendra/'
  }
};

// ---------- Helpers: simple JSON file "database" ----------
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    return [];
  }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ---------- View engine & static ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// Make site-wide data available to every view
app.use((req, res, next) => {
  res.locals.SITE = SITE;
  res.locals.currentPath = req.path;
  next();
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

// ---------- File uploads (blog cover images) ----------
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  }
});

// =========================================================
// PUBLIC ROUTES
// =========================================================

app.get('/', (req, res) => {
  const services = readJSON(SERVICES_FILE);
  const blogs = readJSON(BLOGS_FILE).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  res.render('index', { services, blogs });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/services', (req, res) => {
  const services = readJSON(SERVICES_FILE);
  res.render('services', { services });
});

app.get('/services/:slug', (req, res) => {
  const services = readJSON(SERVICES_FILE);
  const service = services.find(s => s.slug === req.params.slug);
  if (!service) return res.status(404).render('404');
  res.render('service-detail', { service, services });
});

app.get('/blog', (req, res) => {
  const blogs = readJSON(BLOGS_FILE).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('blog', { blogs });
});

app.get('/blog/:slug', (req, res) => {
  const blogs = readJSON(BLOGS_FILE);
  const post = blogs.find(b => b.slug === req.params.slug);
  if (!post) return res.status(404).render('404');
  const html = marked.parse(post.content || '');
  const related = blogs.filter(b => b.slug !== post.slug).slice(0, 3);
  res.render('blog-detail', { post, html, related });
});

app.get('/contact', (req, res) => {
  res.render('contact', { submitted: false });
});

app.post('/contact', (req, res) => {
  const { name, email, phone, state, serviceRequired, message } = req.body;
  const leads = readJSON(LEADS_FILE);
  leads.push({
    id: Date.now().toString(),
    name, email, phone, state, serviceRequired, message,
    date: new Date().toISOString()
  });
  writeJSON(LEADS_FILE, leads);
  res.render('contact', { submitted: true });
});

// =========================================================
// ADMIN ROUTES (Blog CMS)
// =========================================================

app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: 'Invalid username or password' });
});

app.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

app.get('/admin/dashboard', requireAdmin, (req, res) => {
  const blogs = readJSON(BLOGS_FILE).sort((a, b) => new Date(b.date) - new Date(a.date));
  const leads = readJSON(LEADS_FILE).sort((a, b) => new Date(b.date) - new Date(a.date));
  res.render('admin/dashboard', { blogs, leads });
});

app.get('/admin/blog/new', requireAdmin, (req, res) => {
  res.render('admin/edit', { post: null });
});

app.get('/admin/blog/edit/:id', requireAdmin, (req, res) => {
  const blogs = readJSON(BLOGS_FILE);
  const post = blogs.find(b => b.id === req.params.id);
  if (!post) return res.redirect('/admin/dashboard');
  res.render('admin/edit', { post });
});

app.post('/admin/blog/save', requireAdmin, upload.single('cover'), (req, res) => {
  const { id, title, category, date, author, excerpt, content, existingCover } = req.body;
  const blogs = readJSON(BLOGS_FILE);
  const cover = req.file ? '/uploads/' + req.file.filename : (existingCover || '');

  if (id) {
    // Update existing
    const idx = blogs.findIndex(b => b.id === id);
    if (idx !== -1) {
      const slug = slugify(title, { lower: true, strict: true });
      blogs[idx] = { ...blogs[idx], title, slug, category, date, author, excerpt, content, cover };
    }
  } else {
    // Create new
    const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now().toString().slice(-5);
    blogs.push({
      id: Date.now().toString(),
      title, slug, category, date: date || new Date().toISOString().slice(0, 10),
      author: author || 'Admin', excerpt, content, cover
    });
  }
  writeJSON(BLOGS_FILE, blogs);
  res.redirect('/admin/dashboard');
});

app.post('/admin/blog/delete/:id', requireAdmin, (req, res) => {
  let blogs = readJSON(BLOGS_FILE);
  blogs = blogs.filter(b => b.id !== req.params.id);
  writeJSON(BLOGS_FILE, blogs);
  res.redirect('/admin/dashboard');
});

app.post('/admin/lead/delete/:id', requireAdmin, (req, res) => {
  let leads = readJSON(LEADS_FILE);
  leads = leads.filter(l => l.id !== req.params.id);
  writeJSON(LEADS_FILE, leads);
  res.redirect('/admin/dashboard');
});

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Corporate Seva Kendra website running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/login (user: ${ADMIN_USER})`);
});
