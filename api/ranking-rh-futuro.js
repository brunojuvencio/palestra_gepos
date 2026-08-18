import { timingSafeEqual } from 'crypto';

const RANKING_USER     = process.env.RANKING_USER;
const RANKING_PASSWORD = process.env.RANKING_PASSWORD;

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(req) {
  if (!RANKING_USER || !RANKING_PASSWORD) return false;

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return false;

  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  if (sep === -1) return false;

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  return safeEqual(user, RANKING_USER) && safeEqual(pass, RANKING_PASSWORD);
}

const HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ranking de leads | O RH do Futuro</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Lora:ital,wght@1,400;1,600&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --yellow:      #F5B800;
            --yellow-dark: #D9A300;
            --yellow-faint:#FFF8E1;
            --ink:         #0D0D0D;
            --ink-mid:     #4A4A4A;
            --ink-light:   #9A9A9A;
            --paper:       #F6F5F0;
            --white:       #FFFFFF;
            --border:      #E0DFD8;
            --whats:       #25D366;
            --whats-dark:  #1dbe5c;
        }

        html { font-size: 16px; }

        body {
            font-family: 'Barlow', sans-serif;
            background: var(--paper);
            color: var(--ink);
            min-height: 100vh;
        }

        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image: radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px);
            background-size: 28px 28px;
            pointer-events: none;
            z-index: 0;
        }

        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── HEADER ─── */
        .header {
            position: relative;
            z-index: 1;
            padding: 20px 64px;
            border-bottom: 1px solid var(--border);
            background: rgba(246,245,240,0.85);
            backdrop-filter: blur(8px);
        }

        .header img { height: 40px; width: auto; display: block; }

        /* ─── PAGE ─── */
        .page {
            position: relative;
            z-index: 1;
            max-width: 1100px;
            margin: 0 auto;
            padding: 40px 24px 80px;
            animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }

        .headline { margin-bottom: 28px; }

        .headline-eyebrow {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 2.5px;
            text-transform: uppercase;
            color: var(--ink-light);
            margin-bottom: 8px;
        }

        .headline-primary {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 900;
            font-size: clamp(28px, 3.5vw, 40px);
            line-height: 1;
            text-transform: uppercase;
            letter-spacing: -1px;
            color: var(--ink);
        }

        .headline-accent {
            background: linear-gradient(90deg, var(--yellow), var(--yellow-dark));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* ─── TOOLBAR ─── */
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            min-width: 220px;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--white);
            font-family: 'Barlow', sans-serif;
            font-size: 14px;
            color: var(--ink);
        }
        .search-input:focus { outline: none; border-color: var(--yellow); }

        .btn-refresh {
            padding: 12px 20px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--white);
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 14px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--ink);
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease;
            white-space: nowrap;
        }
        .btn-refresh:hover { background: var(--yellow-faint); border-color: var(--yellow); }
        .btn-refresh:disabled { opacity: 0.5; cursor: default; }

        /* ─── SUMMARY ─── */
        .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 24px;
        }

        .summary-card {
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px 22px;
            min-width: 140px;
        }

        .summary-value {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 900;
            font-size: 28px;
            color: var(--ink);
            line-height: 1;
        }

        .summary-label {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: var(--ink-light);
            margin-top: 6px;
        }

        /* ─── TABLE ─── */
        .table-wrap {
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            animation: fadeUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }

        table { width: 100%; border-collapse: collapse; }

        thead th {
            text-align: left;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 12px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            color: var(--ink-light);
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            background: var(--yellow-faint);
        }

        tbody td {
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
            vertical-align: middle;
        }

        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover { background: rgba(245,184,0,0.06); }

        .col-email { font-weight: 600; color: var(--ink); word-break: break-all; }

        .pct-wrap { display: flex; align-items: center; gap: 10px; min-width: 160px; }

        .pct-bar {
            flex: 1;
            height: 8px;
            border-radius: 999px;
            background: var(--border);
            overflow: hidden;
        }

        .pct-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, var(--yellow), var(--yellow-dark));
        }

        .pct-num {
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 14px;
            color: var(--ink);
            width: 40px;
            text-align: right;
        }

        .whats-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--whats);
            color: #fff;
            padding: 8px 16px;
            border-radius: 50px;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 800;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            text-decoration: none;
            white-space: nowrap;
            transition: background 0.15s ease;
        }
        .whats-link:hover { background: var(--whats-dark); }
        .whats-link svg { flex-shrink: 0; }

        .btn-find-phone {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--ink-mid);
            padding: 8px 14px;
            border-radius: 50px;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
            transition: border-color 0.15s ease, color 0.15s ease;
        }
        .btn-find-phone:hover { border-color: var(--yellow-dark); color: var(--ink); }
        .btn-find-phone:disabled { opacity: 0.5; cursor: default; }

        .empty-phone { color: var(--ink-light); font-size: 13px; }

        .state-msg {
            padding: 48px 20px;
            text-align: center;
            color: var(--ink-light);
            font-size: 14px;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 640px) {
            .header { padding: 16px 20px; }
            .header img { height: 32px; }
            .page { padding: 24px 16px 56px; }
            .table-wrap { overflow-x: auto; }
            table { min-width: 620px; }
        }
    </style>
</head>
<body>

<header class="header">
    <img src="/Logo Fundace-USP-FEARP-PRETO.png" alt="Fundace USP FEARP">
</header>

<div class="page">

    <div class="headline">
        <p class="headline-eyebrow">Palestra · O RH do Futuro</p>
        <h1 class="headline-primary">Ranking de <span class="headline-accent">leads</span></h1>
    </div>

    <div class="summary" id="summary"></div>

    <div class="toolbar">
        <input type="text" id="searchInput" class="search-input" placeholder="Buscar por e-mail...">
        <button type="button" id="refreshBtn" class="btn-refresh">Atualizar</button>
    </div>

    <div class="table-wrap">
        <table id="rankingTable">
            <thead>
                <tr>
                    <th>E-mail</th>
                    <th>% assistido</th>
                    <th>WhatsApp</th>
                </tr>
            </thead>
            <tbody id="rankingBody">
                <tr><td colspan="3"><div class="state-msg">Carregando...</div></td></tr>
            </tbody>
        </table>
    </div>

</div>

<script>
    const SB_URL   = 'https://hasptpxcyavfdzxtwpws.supabase.co';
    const SB_ANON  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhhc3B0cHhjeWF2ZmR6eHR3cHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDA2MTYsImV4cCI6MjA5MTY3NjYxNn0.5TTFlqGtVl9AqWDzPTylquWRB1QdP1YXxPQRGfu5B68';
    const SB_TABLE = 'Base GEPOS';

    let leads = [];       // dados agregados por e-mail
    let filtered = [];

    function normalizePhone(raw) {
        if (!raw) return null;
        const digits = String(raw).replace(/\\D/g, '');
        if (!digits) return null;
        if (digits.startsWith('55') && digits.length >= 12) return digits;
        if (digits.length >= 10) return '55' + digits;
        return digits;
    }

    function whatsappSvg() {
        return '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
    }

    async function loadLeads() {
        const body = document.getElementById('rankingBody');
        body.innerHTML = '<tr><td colspan="3"><div class="state-msg">Carregando...</div></td></tr>';

        const url = SB_URL + '/rest/v1/' + encodeURIComponent(SB_TABLE)
            + '?select=lead_email,percent_watched,telefone&limit=5000';

        let rows;
        try {
            const res = await fetch(url, {
                headers: {
                    apikey:        SB_ANON,
                    Authorization: 'Bearer ' + SB_ANON,
                },
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            rows = await res.json();
        } catch (err) {
            body.innerHTML = '<tr><td colspan="3"><div class="state-msg">Erro ao carregar dados: ' + err.message + '</div></td></tr>';
            return;
        }

        const map = new Map();
        rows.forEach(function (r) {
            if (!r.lead_email) return;
            const key = r.lead_email.trim().toLowerCase();
            if (!map.has(key)) {
                map.set(key, { email: r.lead_email.trim(), percent: 0, telefone: null });
            }
            const entry = map.get(key);
            if ((r.percent_watched || 0) > entry.percent) entry.percent = r.percent_watched;
            if (r.telefone && !entry.telefone) entry.telefone = normalizePhone(r.telefone);
        });

        leads = Array.from(map.values()).sort(function (a, b) { return b.percent - a.percent; });
        applyFilter();
        renderSummary();
    }

    function renderSummary() {
        const total = leads.length;
        const withPhone = leads.filter(function (l) { return l.telefone; }).length;
        const avg = total ? Math.round(leads.reduce(function (s, l) { return s + l.percent; }, 0) / total) : 0;

        document.getElementById('summary').innerHTML =
            '<div class="summary-card"><div class="summary-value">' + total + '</div><div class="summary-label">Leads</div></div>' +
            '<div class="summary-card"><div class="summary-value">' + avg + '%</div><div class="summary-label">Média assistida</div></div>' +
            '<div class="summary-card"><div class="summary-value">' + withPhone + '</div><div class="summary-label">Com telefone</div></div>';
    }

    function applyFilter() {
        const term = document.getElementById('searchInput').value.trim().toLowerCase();
        filtered = term ? leads.filter(function (l) { return l.email.toLowerCase().includes(term); }) : leads;
        renderTable();
    }

    function renderTable() {
        const body = document.getElementById('rankingBody');

        if (!filtered.length) {
            body.innerHTML = '<tr><td colspan="3"><div class="state-msg">Nenhum lead encontrado.</div></td></tr>';
            return;
        }

        body.innerHTML = filtered.map(function (l, i) {
            const waCell = l.telefone
                ? '<a class="whats-link" target="_blank" href="https://wa.me/' + l.telefone + '">' + whatsappSvg() + ' Chamar</a>'
                : '<button type="button" class="btn-find-phone" data-email="' + encodeURIComponent(l.email) + '">Buscar telefone</button>';

            return '<tr data-row="' + i + '">' +
                '<td class="col-email">' + l.email + '</td>' +
                '<td><div class="pct-wrap"><div class="pct-bar"><div class="pct-fill" style="width:' + l.percent + '%"></div></div><span class="pct-num">' + l.percent + '%</span></div></td>' +
                '<td>' + waCell + '</td>' +
                '</tr>';
        }).join('');

        body.querySelectorAll('.btn-find-phone').forEach(function (btn) {
            btn.addEventListener('click', onFindPhoneClick);
        });
    }

    async function onFindPhoneClick(e) {
        const btn = e.currentTarget;
        const email = decodeURIComponent(btn.dataset.email);
        btn.disabled = true;
        btn.textContent = 'Buscando...';

        try {
            const res = await fetch('/api/sync-phone', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email }),
            });
            const data = await res.json();
            if (data.telefone) {
                const entry = leads.find(function (l) { return l.email === email; });
                if (entry) entry.telefone = data.telefone;
                applyFilter();
                renderSummary();
            } else {
                btn.disabled = false;
                btn.textContent = 'Não encontrado';
                setTimeout(function () { btn.textContent = 'Buscar telefone'; }, 2000);
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Erro, tentar de novo';
        }
    }

    document.getElementById('searchInput').addEventListener('input', applyFilter);
    document.getElementById('refreshBtn').addEventListener('click', loadLeads);

    loadLeads();
</script>

</body>
</html>
`;

export default async function handler(req, res) {
  if (!isAuthorized(req)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Ranking GEPOS", charset="UTF-8"');
    res.status(401).send('Autenticação necessária.');
    return;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(HTML);
}
