const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Data directory setup ──────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const EARLY_ACCESS_FILE = path.join(DATA_DIR, 'early-access.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

[DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
[EARLY_ACCESS_FILE, CONTACTS_FILE].forEach(file => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([], null, 2));
});

// ── Helpers ───────────────────────────────────────────────
function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function appendRecord(file, record) {
  const arr = readJSON(file);
  arr.push({ ...record, id: Date.now(), created_at: new Date().toISOString() });
  writeJSON(file, arr);
  return arr[arr.length - 1];
}

// ── Email transporter (configure via env vars) ────────────
// Set these environment variables before running:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
//   NOTIFY_TO  (where to forward notifications)
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

const NOTIFY_TO = process.env.NOTIFY_TO || process.env.EMAIL_USER || '';
//const FROM_ADDR = `"Fihrist" <${process.env.EMAIL_USER || 'hello@fihrist.ai'}>`;
const FROM_ADDR = `"Fihrist" <onboarding@resend.dev>`;
async function sendMail(opts) {
  if (!process.env.EMAIL_USER) return; // skip if not configured
  try { await transporter.sendMail({ from: FROM_ADDR, ...opts }); }
  catch (e) { console.error('Mail error:', e.message); }
}

// ── Middleware ────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Basic request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Validation helpers ────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}
function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen);
}

// ─────────────────────────────────────────────────────────
// POST /api/early-access
// Body: name, email, organisation, role, programme_type,
//       applicants_per_cycle, interested_tier, pain_point, source
// ─────────────────────────────────────────────────────────
app.post('/api/early-access', async (req, res) => {
  const { name, email, organisation, role, programme_type,
          applicants_per_cycle, interested_tier, pain_point, source } = req.body;

  // Validation
  if (!name || !email || !organisation || !role || !programme_type) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Duplicate check
  const existing = readJSON(EARLY_ACCESS_FILE);
  if (existing.some(r => r.email?.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'This email is already on the list.' });
  }

  const record = appendRecord(EARLY_ACCESS_FILE, {
    name:               sanitize(name),
    email:              sanitize(email).toLowerCase(),
    organisation:       sanitize(organisation),
    role:               sanitize(role),
    programme_type:     sanitize(programme_type),
    applicants_per_cycle: sanitize(applicants_per_cycle || ''),
    interested_tier:    sanitize(interested_tier || ''),
    pain_point:         sanitize(pain_point || '', 2000),
    source:             sanitize(source || ''),
  });

  // Notification email to founders
  await sendMail({
    to: NOTIFY_TO,
    subject: `🎉 New Early Access Request — ${record.name} (${record.organisation})`,
    html: `
      <h2 style="font-family:Georgia,serif;color:#1C1814">New Early Access Request</h2>
      <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 12px;color:#9A9088;white-space:nowrap">Name</td><td style="padding:6px 12px"><strong>${record.name}</strong></td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Email</td><td style="padding:6px 12px"><a href="mailto:${record.email}">${record.email}</a></td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Organisation</td><td style="padding:6px 12px">${record.organisation}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Role</td><td style="padding:6px 12px">${record.role}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Programme type</td><td style="padding:6px 12px">${record.programme_type}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Applicants/cycle</td><td style="padding:6px 12px">${record.applicants_per_cycle || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Interested tier</td><td style="padding:6px 12px">${record.interested_tier || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Source</td><td style="padding:6px 12px">${record.source || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088;vertical-align:top">Pain point</td><td style="padding:6px 12px">${record.pain_point || '—'}</td></tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#9A9088;margin-top:24px">Submitted ${record.created_at} · Total on list: ${existing.length + 1}</p>
    `
  });

  // Confirmation email to applicant
  await sendMail({
    to: record.email,
    subject: `You're on the Fihrist early access list`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1C1814">
        <h1 style="font-size:28px;font-weight:400;line-height:1.2;margin-bottom:8px">You're on the list, ${record.name.split(' ')[0]}.</h1>
        <p style="font-style:italic;color:#B84032;margin-bottom:24px;font-size:18px">We'll be in touch personally.</p>
        <p style="font-size:15px;line-height:1.7;color:#5A5248">We read every submission ourselves. Within 48 hours, someone from the Fihrist team will reach out to learn more about ${record.organisation} and make sure the platform actually fits your workflow before you commit to anything.</p>
        <p style="font-size:15px;line-height:1.7;color:#5A5248;margin-top:16px">In the meantime, if you have questions, just reply to this email — it goes straight to us.</p>
        <p style="margin-top:40px;font-size:13px;color:#9A9088">— The Fihrist team · <a href="https://fihrist.ai" style="color:#B84032">fihrist.ai</a></p>
      </div>
    `
  });

  return res.status(201).json({
    success: true,
    message: 'You\'re on the list. We\'ll be in touch within 48 hours.',
    id: record.id
  });
});

// ─────────────────────────────────────────────────────────
// POST /api/contact
// Body: name, email, organisation, subject, message
// ─────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, organisation, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const record = appendRecord(CONTACTS_FILE, {
    name:         sanitize(name),
    email:        sanitize(email).toLowerCase(),
    organisation: sanitize(organisation || ''),
    subject:      sanitize(subject),
    message:      sanitize(message, 3000),
  });

  // Notification email to founders
  await sendMail({
    to: NOTIFY_TO,
    replyTo: record.email,
    subject: `💬 New message from ${record.name} — ${record.subject}`,
    html: `
      <h2 style="font-family:Georgia,serif;color:#1C1814">New Contact Message</h2>
      <table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:6px 12px;color:#9A9088;white-space:nowrap">From</td><td style="padding:6px 12px"><strong>${record.name}</strong> &lt;<a href="mailto:${record.email}">${record.email}</a>&gt;</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Organisation</td><td style="padding:6px 12px">${record.organisation || '—'}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088">Subject</td><td style="padding:6px 12px">${record.subject}</td></tr>
        <tr><td style="padding:6px 12px;color:#9A9088;vertical-align:top">Message</td><td style="padding:6px 12px;white-space:pre-wrap">${record.message}</td></tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#9A9088;margin-top:24px">Received ${record.created_at}</p>
    `
  });

  // Auto-reply
  await sendMail({
    to: record.email,
    replyTo: process.env.NOTIFY_TO || 'hello@fihrist.ai',
    subject: `Got your message — Fihrist`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1C1814">
        <h1 style="font-size:26px;font-weight:400;line-height:1.2;margin-bottom:8px">Message received, ${record.name.split(' ')[0]}.</h1>
        <p style="font-style:italic;color:#B84032;font-size:17px;margin-bottom:24px">We read every message ourselves.</p>
        <p style="font-size:15px;line-height:1.7;color:#5A5248">You'll hear back within 24 hours — usually less. If it's urgent, just reply to this email.</p>
        <p style="margin-top:40px;font-size:13px;color:#9A9088">— The Fihrist team · <a href="https://fihrist.ai" style="color:#B84032">fihrist.ai</a></p>
      </div>
    `
  });

  return res.status(201).json({
    success: true,
    message: 'Message received. You\'ll hear back within 24 hours.',
    id: record.id
  });
});

// ─────────────────────────────────────────────────────────
// GET /api/admin/submissions  (simple password-protected view)
// Usage: GET /api/admin/submissions?secret=YOUR_ADMIN_SECRET
// ─────────────────────────────────────────────────────────
app.get('/api/admin/submissions', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  res.json({
    early_access: readJSON(EARLY_ACCESS_FILE),
    contacts:     readJSON(CONTACTS_FILE),
  });
});

// ── Catch-all: serve index.html for client-side routes ────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✦ Fihrist server running on http://localhost:${PORT}`);
  console.log(`  ✦ Email notifications: ${process.env.EMAIL_USER ? '✓ configured' : '✗ not configured (set EMAIL_USER/EMAIL_PASS)'}`);
  console.log(`  ✦ Admin endpoint: GET /api/admin/submissions?secret=YOUR_ADMIN_SECRET\n`);
});
