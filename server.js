const express = require("express");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// ── Admin API ──────────────────────────────
function getAdminSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

// Admin auth middleware
app.use('/admin-api', (req, res, next) => {
  const pass = req.headers['x-admin-password'];
  if (!pass || pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// Get waitlist
app.get('/admin-api/waitlist', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from('waitlist').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete waitlist entry
app.delete('/admin-api/waitlist/:id', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from('waitlist').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get all verification data (requests joined with profiles)
app.get('/admin-api/verifications', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*, profile:profiles(id, display_name, avatar_url, relationship_style, created_at)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get verification stats (count of profiles with/without requests)
app.get('/admin-api/verification-stats', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { data: requests } = await supabase.from('verification_requests').select('status');
    const { count: totalProfiles } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    const pending = (requests || []).filter(r => r.status === 'pending').length;
    const approved = (requests || []).filter(r => r.status === 'approved').length;
    const rejected = (requests || []).filter(r => r.status === 'rejected').length;
    const noRequest = (totalProfiles || 0) - (requests || []).length;
    res.json({ pending, approved, rejected, noRequest });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Approve verification
app.post('/admin-api/verify/:userId', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { error: reqErr } = await supabase
      .from('verification_requests')
      .update({ status: 'approved' })
      .eq('user_id', req.params.userId);
    if (reqErr) throw reqErr;
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', req.params.userId);
    if (profErr) throw profErr;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reject verification
app.post('/admin-api/reject/:userId', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { error: reqErr } = await supabase
      .from('verification_requests')
      .update({ status: 'rejected' })
      .eq('user_id', req.params.userId);
    if (reqErr) throw reqErr;
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', req.params.userId);
    if (profErr) throw profErr;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reset verification back to pending
app.post('/admin-api/reset-verify/:userId', async (req, res) => {
  try {
    const supabase = getAdminSupabase();
    const { error: reqErr } = await supabase
      .from('verification_requests')
      .update({ status: 'pending' })
      .eq('user_id', req.params.userId);
    if (reqErr) throw reqErr;
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ is_verified: false })
      .eq('id', req.params.userId);
    if (profErr) throw profErr;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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
