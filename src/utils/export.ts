import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { ServiceNote } from '../types';
import { STATUS_LABELS, calcTotalMinutes, formatDuration } from './helpers';
import { getTechnician } from './technicianStorage';

const toBase64 = async (uri: string): Promise<string> => {
  try {
    const b64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return '';
  }
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const row = (label: string, value: string, highlight = false) => `
  <tr>
    <td class="td-label">${label}</td>
    <td class="td-value${highlight ? ' highlight' : ''}">${value}</td>
  </tr>`;

const section = (title: string, content: string) => content.trim() ? `
  <div class="section">
    <div class="sec-title">${title}</div>
    <div class="sec-body">${esc(content).replace(/\n/g, '<br/>')}</div>
  </div>` : '';

export const exportToPDF = async (note: ServiceNote): Promise<void> => {
  const technician = await getTechnician();
  const photoHtmlParts = await Promise.all(
    note.photos.map(async p => {
      const src = await toBase64(p.uri);
      if (!src) return '';
      return `<div class="photo-wrap">
        <img src="${src}" class="photo-img"/>
        ${p.caption ? `<div class="photo-cap">${esc(p.caption)}</div>` : ''}
      </div>`;
    })
  );

  const totalMin = calcTotalMinutes(note.sessions);
  const totalStr = formatDuration(totalMin);

  const sessionsStr = note.sessions
    .filter(s => s.start || s.end)
    .map((s, i) => `<span class="session-chip">${i + 1}. ${s.start || '?'} – ${s.end || '?'}</span>`)
    .join(' ');

  const locationFull = [note.location, note.kraj].filter(Boolean).join(', ') || '—';
  const genDate = new Date().toLocaleString('pl-PL');

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; background:#fff; color:#1E293B; font-size:12px; }

/* HEADER */
.hdr { background:#0F172A; color:#fff; padding:28px 36px 24px; }
.hdr-top { display:flex; justify-content:space-between; align-items:flex-start; }
.hdr-brand { font-size:11px; font-weight:700; letter-spacing:2px; color:#94A3B8; text-transform:uppercase; margin-bottom:10px; }
.hdr-client { font-size:26px; font-weight:700; color:#fff; line-height:1.2; }
.hdr-meta { text-align:right; }
.hdr-date { font-size:11px; color:#94A3B8; }
.hdr-status { display:inline-block; margin-top:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:700; }

/* INFO TABLE */
.info-wrap { margin:24px 36px 0; }
table { width:100%; border-collapse:collapse; }
.td-label { padding:9px 14px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.6px; color:#64748B; background:#F8FAFC; border:1px solid #E2E8F0; width:35%; }
.td-value { padding:9px 14px; font-size:13px; color:#1E293B; border:1px solid #E2E8F0; }
.td-value.highlight { font-size:16px; font-weight:700; color:#1D4ED8; }
.session-chip { display:inline-block; background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; border-radius:6px; padding:2px 8px; margin:2px 3px 2px 0; font-size:11px; font-weight:600; }

/* DIVIDER */
.divider { margin:24px 36px 0; border:none; border-top:2px solid #E2E8F0; }

/* SECTIONS */
.sections { margin:0 36px; }
.section { margin-top:20px; }
.sec-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#64748B; padding-bottom:6px; border-bottom:2px solid #E2E8F0; margin-bottom:10px; }
.sec-body { font-size:13px; line-height:1.9; color:#334155; white-space:pre-wrap; }

/* PHOTOS */
.photos-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:10px; }
.photo-wrap {}
.photo-img { width:100%; border-radius:8px; border:1px solid #E2E8F0; display:block; }
.photo-cap { font-size:10px; color:#64748B; margin-top:5px; font-style:italic; }

/* FOOTER */
.footer { margin-top:32px; background:#F8FAFC; border-top:1px solid #E2E8F0; padding:12px 36px; display:flex; justify-content:space-between; align-items:center; }
.footer-left { font-size:10px; color:#94A3B8; }
.footer-right { font-size:10px; color:#94A3B8; }
</style>
</head>
<body>

<div class="hdr">
  <div class="hdr-brand">ServiceLog &middot; Raport Serwisowy</div>
  <div class="hdr-top">
    <div class="hdr-client">${esc(note.client || 'Raport Serwisowy')}</div>
    <div class="hdr-meta">
      <div class="hdr-date">${esc(genDate)}</div>
      <div class="hdr-status" style="background:${statusBg(note.status)};color:${statusColor(note.status)};">${STATUS_LABELS[note.status]}</div>
    </div>
  </div>
</div>

<div class="info-wrap">
  <table>
    ${row('Klient', esc(note.client || '—'))}
    ${row('Lokalizacja', esc(locationFull))}
    ${row('Maszyna', esc(note.machine || '—'))}
    ${note.machineNumber ? row('Nr maszyny', esc(note.machineNumber)) : ''}
    ${row('Data', esc(note.date || '—'))}
    ${row('Sesje pracy', sessionsStr || '—')}
    ${row('Łączny czas pracy', esc(totalStr), true)}
  </table>
</div>

<hr class="divider"/>

<div class="sections">
  ${section('Opis usterki', note.problem)}
  ${section('Wykonane prace', note.workDone)}
  ${section('Części / materiały', note.parts)}
  ${section('Uwagi i zalecenia', note.notes)}
  ${note.photos.length > 0 ? `
  <div class="section">
    <div class="sec-title">Zdjęcia (${note.photos.length})</div>
    <div class="photos-grid">${photoHtmlParts.join('')}</div>
  </div>` : ''}
</div>

<div class="footer">
  <div class="footer-left">
    ${technician.name ? `<strong>${esc(technician.name)}</strong>${technician.company ? ` · ${esc(technician.company)}` : ''}${technician.phone ? ` · ${esc(technician.phone)}` : ''}` : 'ServiceLog'}
  </div>
  <div class="footer-right">${new Date().toLocaleDateString('pl-PL', { year:'numeric', month:'long', day:'numeric' })}</div>
</div>

</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Raport – ${note.client || 'ServiceLog'}`,
    UTI: 'com.adobe.pdf',
  });
};

function statusBg(status: ServiceNote['status']): string {
  return { open:'#EFF6FF', in_progress:'#FEF3C7', done:'#F0FDF4', waiting_parts:'#FFF7ED' }[status];
}
function statusColor(status: ServiceNote['status']): string {
  return { open:'#1D4ED8', in_progress:'#D97706', done:'#15803D', waiting_parts:'#EA580C' }[status];
}
