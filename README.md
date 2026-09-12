# Corporate Seva Kendra — Website + Blog CMS

A complete Node.js website for Corporate Seva Kendra with a built-in admin
panel so you can publish blog posts (with cover images) without touching any
code.

## What's included

- **Public site**: Home, About, Services overview + 7 individual service
  pages (Incorporation, Compliance, Trademark & IP, GST, Income Tax, Payroll,
  Licenses), Blog listing + detail pages, Contact page with a working
  enquiry form.
- **Admin panel** (`/admin/login`): create, edit and delete blog posts,
  upload a cover image for each post, and view every contact-form enquiry.
- Fully responsive design, works on mobile.
- No external database required — content is stored in simple JSON files
  under `/data`, so there's nothing extra to install or configure.

## 1. Install & run locally

Requires [Node.js](https://nodejs.org) version 18 or later.

```bash
cd csk-website
npm install
npm start
```

The site will be available at **http://localhost:3000**
The admin panel is at **http://localhost:3000/admin/login**

Default admin login:
- **Username:** `admin`
- **Password:** `CSK@Admin2026`

⚠️ **Change this password before you put the site online** — see step 3 below.

## 2. Using the blog admin panel

1. Go to `/admin/login` and log in.
2. Click **"+ New Post"** to write a new blog post — fill in the title,
   category, date, a short excerpt (shown on the blog listing cards), an
   optional cover image, and the main content.
3. The content box supports simple Markdown formatting:
   - `## Heading text` for a sub-heading
   - Leave a blank line between paragraphs
   - `- item` for a bullet list
   - `**bold text**` for bold
4. Click **Save Post** — it goes live immediately on `/blog`.
5. From the dashboard you can also **Edit** or **Delete** any post, and see
   every enquiry submitted through the Contact page.

## 3. Before going live (important)

Open `server.js` and change these two lines (or better, set them as
environment variables on your hosting provider instead of editing the file):

```js
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'CSK@Admin2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';
```

Set your own strong password and a random session secret.

Also update your real business details in `server.js` under the `SITE`
object near the top (phone, email, address, social links) if anything has
changed since this was built.

## 4. Deploying

This is a standard Express app, so it runs on any Node.js hosting:

- **Render / Railway / Vercel (Node) / DigitalOcean App Platform**: connect
  your Git repo, set the start command to `npm start`, and add the
  environment variables from step 3.
- **A VPS / shared hosting with Node support** (e.g. Hostinger, GoDaddy VPS):
  upload the folder, run `npm install`, then keep it running with a process
  manager like `pm2`:
  ```bash
  npm install -g pm2
  pm2 start server.js --name csk-website
  pm2 save
  ```
- Put the app behind Nginx/Apache as a reverse proxy with a free SSL
  certificate (Let's Encrypt / Certbot) for HTTPS.

## 5. Where everything lives

```
csk-website/
├── server.js              # Express app + admin/blog routes
├── data/
│   ├── services.json      # Editable content for the 7 service pages
│   ├── blogs.json          # All blog posts (edited via admin panel)
│   └── leads.json          # Contact form submissions
├── views/                  # EJS page templates
│   └── admin/               # Admin login/dashboard/editor templates
└── public/
    ├── css/style.css        # All site styling
    ├── js/main.js            # Mobile menu behaviour
    └── uploads/              # Blog cover images land here
```

To edit the service page content (e.g. add a new sub-service or change
wording), open `data/services.json` — no code changes needed.

## 6. Contact form

Submissions are currently saved to `data/leads.json` and shown in the admin
dashboard. If you'd like an email or WhatsApp notification sent the moment
someone submits the form, that can be added with an email service like
SendGrid/Resend, or a WhatsApp Business API integration — let me know and
I can wire that in.

## Notes on content

All copy, layout and design in this project were written fresh for this
build — nothing was copied from any other company's website. Replace the
placeholder stats (client counts, years of experience, etc. in `index.ejs`
and `about.ejs`) with your real figures whenever you're ready.
