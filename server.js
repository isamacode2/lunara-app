const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

const noCacheHeaders = {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
};

// Serve existing static pages (privacy, safety, delete-account, admin)
const staticPages = ['privacy.html', 'safety.html', 'delete-account.html', 'lunara_admin.html'];
staticPages.forEach(page => {
  const route = '/' + page.replace('.html', '');
  app.get(route, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, page));
  });
  // Also serve with .html extension
  app.get('/' + page, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.join(__dirname, page));
  });
});

// Serve React build from /dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, noCacheHeaders));
}

// SPA fallback — serve React app's index.html for all other routes
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const reactIndex = path.join(distPath, 'index.html');
  if (fs.existsSync(reactIndex)) {
    res.sendFile(reactIndex);
  } else {
    // Fallback to old index.html if dist not built yet
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Lunara server running on port ${PORT}`);
});
