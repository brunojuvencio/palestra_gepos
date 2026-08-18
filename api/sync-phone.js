/* ── Ploomes ── */
const PL_KEY  = process.env.PLOOMES_USER_KEY;
const PL_BASE = 'https://api2.ploomes.com';

/* ── Supabase ── */
const SB_URL   = process.env.SUPABASE_URL;
const SB_KEY   = process.env.SUPABASE_SERVICE_KEY;
const SB_TABLE = 'Base GEPOS';

async function plFetch(path) {
  const res = await fetch(`${PL_BASE}${path}`, {
    headers: {
      'User-Key':     PL_KEY,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Ploomes ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length >= 10) return '55' + digits;
  return digits;
}

async function findPhoneByEmail(email) {
  const data = await plFetch(`/Contacts?$filter=Email eq '${encodeURIComponent(email)}'&$top=1&$expand=Phones`);
  const contact = data.value?.[0];
  return normalizePhone(contact?.Phones?.[0]?.PhoneNumber);
}

async function saveTelefone(email, telefone) {
  const url = `${SB_URL}/rest/v1/${encodeURIComponent(SB_TABLE)}?lead_email=eq.${encodeURIComponent(email)}&telefone=is.null`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: {
      apikey:         SB_KEY,
      Authorization:  `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      Prefer:         'return=minimal',
    },
    body: JSON.stringify({ telefone }),
  });
  if (!res.ok) throw new Error(`Supabase update → ${res.status}: ${await res.text()}`);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email é obrigatório' });

  try {
    const telefone = await findPhoneByEmail(email);
    if (telefone) await saveTelefone(email, telefone);
    return res.status(200).json({ telefone: telefone || null });
  } catch (err) {
    console.error('[sync-phone] error:', err.message);
    return res.status(200).json({ telefone: null, error: err.message });
  }
}
