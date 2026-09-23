/* ── ActiveCampaign ── */
const AC_BASE   = process.env.ACTIVE_CAMPAIGN_BASE_URL;
const AC_KEY    = process.env.ACTIVE_CAMPAIGN_API_KEY;
const AC_LIST   = process.env.ACTIVE_CAMPAIGN_LIST_ID;
const AC_TAG    = process.env.ACTIVE_CAMPAIGN_TAG_NAME;
const AC_TAGDSC = process.env.ACTIVE_CAMPAIGN_TAG_DESCRIPTION || '';

const AC_LIST_B   = process.env.ACTIVE_CAMPAIGN_LIST_ID_B;
const AC_TAG_B    = process.env.ACTIVE_CAMPAIGN_TAG_NAME_B;
const AC_TAGDSC_B = process.env.ACTIVE_CAMPAIGN_TAG_DESCRIPTION_B || '';

/* ── Ploomes ── */
const PL_KEY      = process.env.PLOOMES_USER_KEY;
const PL_PIPELINE = process.env.PLOOMES_PIPELINE_ID;
const PL_BASE     = 'https://api2.ploomes.com';
const PL_TITLE    = 'Palestra RH do Futuro - GEPOS';

/* ── Supabase ── */
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const SB_TABLE = 'GEPOS  - RH do Futuro';

// ---------------------------------------------------------------------------
// ActiveCampaign helpers
// ---------------------------------------------------------------------------

async function acFetch(path, options = {}) {
  const res = await fetch(`${AC_BASE}/api/3${path}`, {
    ...options,
    headers: {
      'Api-Token': AC_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`AC ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function acSyncContact({ email, firstName, lastName, phone, empresa, cargo }) {
  const data = await acFetch('/contact/sync', {
    method: 'POST',
    body: JSON.stringify({
      contact: {
        email,
        firstName,
        lastName,
        phone,
        orgname: empresa || undefined,
        fieldValues: cargo ? [{ field: 'cargo', value: cargo }] : [],
      },
    }),
  });
  return data.contact.id;
}

async function acAddToList(contactId, listId) {
  await acFetch('/contactLists', {
    method: 'POST',
    body: JSON.stringify({
      contactList: { list: listId, contact: contactId, status: 1 },
    }),
  });
}

async function acResolveTag(tagName, tagDescription) {
  const data = await acFetch(`/tags?search=${encodeURIComponent(tagName)}`);
  const existing = data.tags?.find((t) => t.tag === tagName);
  if (existing) return existing.id;
  const created = await acFetch('/tags', {
    method: 'POST',
    body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact', description: tagDescription } }),
  });
  return created.tag.id;
}

async function acAddTag(contactId, tagId) {
  await acFetch('/contactTags', {
    method: 'POST',
    body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } }),
  });
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

async function sbInsertLead({ nome, email, telefone, empresa, cargo, cidade, graduacao, mba, utm_source, utm_medium, utm_campaign, utm_term, utm_content }) {
  const res = await fetch(`${SB_URL}/rest/v1/${encodeURIComponent(SB_TABLE)}`, {
    method: 'POST',
    headers: {
      apikey:          SB_KEY,
      Authorization:   `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      Prefer:          'return=minimal',
    },
    body: JSON.stringify({ nome, email, telefone, empresa, cargo, cidade, graduacao, mba, utm_source, utm_medium, utm_campaign, utm_term, utm_content }),
  });
  if (!res.ok) throw new Error(`Supabase insert → ${res.status}: ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Ploomes helpers
// ---------------------------------------------------------------------------

async function plFetch(path, options = {}) {
  const res = await fetch(`${PL_BASE}${path}`, {
    ...options,
    headers: {
      'User-Key': PL_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Ploomes ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function plFindContact(email) {
  const data = await plFetch(`/Contacts?$filter=Email eq '${encodeURIComponent(email)}'&$top=1`);
  return data.value?.[0]?.Id || null;
}

async function plCreateContact({ name, email, phone, empresa, cidade }) {
  const data = await plFetch('/Contacts', {
    method: 'POST',
    body: JSON.stringify({
      Name:    name,
      Email:   email,
      City:    cidade || undefined,
      Company: empresa || undefined,
      Phones:  phone ? [{ PhoneNumber: phone }] : undefined,
    }),
  });
  return data.value?.[0]?.Id;
}

const MBA_LABEL = {
  sim_agora:  'Sim, imediatamente',
  sim_depois: 'Sim, mas não agora',
  nao:        'Não',
};

async function plCreateDeal(contactId) {
  const data = await plFetch('/Deals', {
    method: 'POST',
    body: JSON.stringify({
      Title:         PL_TITLE,
      PipelineId:    Number(PL_PIPELINE),
      ContactsDeals: [{ ContactId: contactId }],
    }),
  });
  return data.value?.[0]?.Id || null;
}

async function plAddNote(dealId, text) {
  await plFetch('/Notes', {
    method: 'POST',
    body: JSON.stringify({
      Content: text,
      DealId:  dealId,
    }),
  });
}

async function syncPloomes({ name, email, phone, empresa, cidade, mba }) {
  let contactId = await plFindContact(email);
  if (!contactId) {
    contactId = await plCreateContact({ name, email, phone, empresa, cidade });
  }
  const dealId = await plCreateDeal(contactId);

  if (dealId && mba) {
    const mbaLabel = MBA_LABEL[mba] || mba;
    await plAddNote(dealId, `Pretende fazer MBA/Pós-graduação: ${mbaLabel}`);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, telefone, empresa, cargo, cidade, graduacao, mba, variant,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'name e email são obrigatórios' });
  }

  const [firstName, ...rest] = name.trim().split(' ');
  const lastName = rest.join(' ');

  const isVariantB   = variant === 'b';
  const listId       = isVariantB ? AC_LIST_B   : AC_LIST;
  const tagName      = isVariantB ? AC_TAG_B    : AC_TAG;
  const tagDescription = isVariantB ? AC_TAGDSC_B : AC_TAGDSC;

  // Supabase — todos os leads (não bloqueia o fluxo se falhar)
  try {
    await sbInsertLead({ nome: name.trim(), email, telefone, empresa, cargo, cidade, graduacao, mba,
                         utm_source, utm_medium, utm_campaign, utm_term, utm_content });
  } catch (err) {
    console.error('[lead] Supabase error:', err.message);
  }

  // ActiveCampaign — todos os leads
  try {
    const contactId = await acSyncContact({ email, firstName, lastName, phone: telefone, empresa, cargo });
    const [tagId]   = await Promise.all([acResolveTag(tagName, tagDescription), acAddToList(contactId, listId)]);
    await acAddTag(contactId, tagId);
  } catch (err) {
    console.error('[lead] ActiveCampaign error:', err.message);
    return res.status(500).json({ error: 'Erro ao registrar inscrição. Tente novamente.' });
  }

  // Ploomes — só se tem graduação E quer fazer MBA imediatamente
  const temGraduacao = graduacao === 'sim_completo' || graduacao === 'em_andamento';
  const querMbaAgora = mba === 'sim_agora';

  if (temGraduacao && querMbaAgora) {
    try {
      await syncPloomes({ name: name.trim(), email, phone: telefone, empresa, cidade, mba });
    } catch (err) {
      // Não bloqueia o fluxo — o lead já foi salvo no ActiveCampaign
      console.error('[lead] Ploomes error:', err.message);
    }
  }

  return res.status(200).json({ success: true });
}
