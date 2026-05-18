const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const EARLY_ACCESS_FILE = path.join(DATA_DIR, 'early-access.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

[DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
[EARLY_ACCESS_FILE, CONTACTS_FILE].forEach(file => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([], null, 2));
});

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

// Resend HTTP API — no SMTP, no nodemailer, works everywhere
const RESEND_API_KEY = process.env.EMAIL_PASS || '';
const NOTIFY_TO = process.env.NOTIFY_TO || '';
const FROM_ADDR = 'Fihrist <onboarding@resend.dev>';

async function sendMail({ to, subject, html, replyTo }) {
  if (!RESEND_API_KEY) { console.log('Email skipped: no API key'); return; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDR,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok) { console.error('Resend error:', JSON.stringify(data)); }
    else { console.log('Email sent OK:', data.id); }
  } catch (e) {
    console.error('Mail error:', e.message);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e)); }
function sanitize(s, max = 500) { return typeof s === 'string' ? s.trim().slice(0, max) : ''; }

app.post('/api/early-access', async (req, res) => {
  const { name, email, organisation, role, programme_type,
          applicants_per_cycle, interested_tier, pain_point, source } = req.body;

  if (!name || !email || !organisation || !role || !programme_type)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!validateEmail(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  const existing = readJSON(EARLY_ACCESS_FILE);
  if (existing.some(r => r.email?.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ error: 'This email is already on the list.' });

  const record = appendRecord(EARLY_ACCESS_FILE, {
    name: sanitize(name), email: sanitize(email).toLowerCase(),
    organisation: sanitize(organisation), role: sanitize(role),
    programme_type: sanitize(programme_type),
    applicants_per_cycle: sanitize(applicants_per_cycle || ''),
    interested_tier: sanitize(interested_tier || ''),
    pain_point: sanitize(pain_point || '', 2000),
    source: sanitize(source || ''),
  });

  if (NOTIFY_TO) {
    await sendMail({
      to: NOTIFY_TO,
      subject: `🎉 New Early Access — ${record.name} (${record.organisation})`,
      html: `<h2 style="font-family:Georgia,serif">New Early Access Request</h2>
        <table style="font-size:14px;font-family:Arial,sans-serif">
          <tr><td style="color:#999;padding:4px 12px">Name</td><td style="padding:4px 12px"><b>${record.name}</b></td></tr>
          <tr><td style="color:#999;padding:4px 12px">Email</td><td style="padding:4px 12px">${record.email}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Organisation</td><td style="padding:4px 12px">${record.organisation}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Role</td><td style="padding:4px 12px">${record.role}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Programme type</td><td style="padding:4px 12px">${record.programme_type}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Volume</td><td style="padding:4px 12px">${record.applicants_per_cycle || '—'}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Tier interest</td><td style="padding:4px 12px">${record.interested_tier || '—'}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Source</td><td style="padding:4px 12px">${record.source || '—'}</td></tr>
          <tr><td style="color:#999;padding:4px 12px;vertical-align:top">Pain point</td><td style="padding:4px 12px">${record.pain_point || '—'}</td></tr>
        </table>
        <p style="font-size:12px;color:#999;margin-top:20px">Submitted ${record.created_at} · Total: ${existing.length + 1}</p>`,
    });
  }

  await sendMail({
    to: record.email,
    subject: `You're on the Fihrist early access list`,
    html: `<div style="font-family:Georgia,serif;max-width:500px;color:#1C1814">
      <h1 style="font-size:26px;font-weight:400">You're on the list, ${record.name.split(' ')[0]}.</h1>
      <p style="font-style:italic;color:#B84032;font-size:17px">We'll be in touch personally.</p>
      <p style="font-size:15px;line-height:1.7;color:#5A5248">We read every submission ourselves. Within 48 hours, someone from the Fihrist team will reach out to learn more about ${record.organisation}.</p>
      <p style="font-size:13px;color:#999;margin-top:32px">— The Fihrist team · fihrist.ai</p>
    </div>`,
  });

  return res.status(201).json({ success: true, message: "You're on the list!", id: record.id });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, organisation, subject, message } = req.body;

  if (!name || !email || !subject || !message)
    return res.status(400).json({ error: 'Missing required fields.' });
  if (!validateEmail(email))
    return res.status(400).json({ error: 'Invalid email address.' });

  const record = appendRecord(CONTACTS_FILE, {
    name: sanitize(name), email: sanitize(email).toLowerCase(),
    organisation: sanitize(organisation || ''),
    subject: sanitize(subject), message: sanitize(message, 3000),
  });

  if (NOTIFY_TO) {
    await sendMail({
      to: NOTIFY_TO, replyTo: record.email,
      subject: `💬 Message from ${record.name} — ${record.subject}`,
      html: `<h2 style="font-family:Georgia,serif">New Contact Message</h2>
        <table style="font-size:14px;font-family:Arial,sans-serif">
          <tr><td style="color:#999;padding:4px 12px">From</td><td style="padding:4px 12px"><b>${record.name}</b> &lt;${record.email}&gt;</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Org</td><td style="padding:4px 12px">${record.organisation || '—'}</td></tr>
          <tr><td style="color:#999;padding:4px 12px">Subject</td><td style="padding:4px 12px">${record.subject}</td></tr>
          <tr><td style="color:#999;padding:4px 12px;vertical-align:top">Message</td><td style="padding:4px 12px;white-space:pre-wrap">${record.message}</td></tr>
        </table>`,
    });
  }

  await sendMail({
    to: record.email,
    subject: `Got your message — Fihrist`,
    html: `<div style="font-family:Georgia,serif;max-width:500px;color:#1C1814">
      <h1 style="font-size:24px;font-weight:400">Message received, ${record.name.split(' ')[0]}.</h1>
      <p style="font-style:italic;color:#B84032">We read every message ourselves.</p>
      <p style="font-size:15px;color:#5A5248">You'll hear back within 24 hours — usually less.</p>
      <p style="font-size:13px;color:#999;margin-top:32px">— The Fihrist team · fihrist.ai</p>
    </div>`,
  });

  return res.status(201).json({ success: true, message: "Message received!", id: record.id });
});

app.get('/api/admin/submissions', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.query.secret !== secret)
    return res.status(401).json({ error: 'Unauthorized.' });
  res.json({ early_access: readJSON(EARLY_ACCESS_FILE), contacts: readJSON(CONTACTS_FILE) });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ✦ Fihrist running on http://localhost:${PORT}`);
  console.log(`  ✦ Resend API: ${RESEND_API_KEY ? '✓ configured' : '✗ missing — add EMAIL_PASS'}`);
  console.log(`  ✦ Notify to: ${NOTIFY_TO || '✗ missing — add NOTIFY_TO'}\n`);
});
