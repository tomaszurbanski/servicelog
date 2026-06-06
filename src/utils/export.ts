import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { ServiceNote } from '../types';
import { STATUS_LABELS, calcTotalMinutes, formatDuration } from './helpers';

const toBase64 = async (uri: string): Promise<string> => {
  try {
    const b64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return '';
  }
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const field = (label: string, value: string) => value.trim() ? `
  <div class="section">
    <div class="section-title">${label}</div>
    <div class="section-content">${esc(value).replace(/\n/g, '<br/>')}</div>
  </div>` : '';

export const exportToPDF = async (note: ServiceNote): Promise<void> => {
  const photoHtmlParts = await Promise.all(
    note.photos.map(async p => {
      const src = await toBase64(p.uri);
      if (!src) return '';
      return `
        <div class="photo-item">
          <img src="${src}" />
          ${p.caption ? `<p class="caption">${esc(p.caption)}</p>` : ''}
        </div>`;
    })
  );

  const photosSection = note.photos.length > 0 ? `
    <div class="section">
      <div class="section-title">ZDJĘCIA</div>
      <div class="photos-grid">${photoHtmlParts.join('')}</div>
    </div>` : '';

  const totalMin = calcTotalMinutes(note.sessions);
  const totalStr = formatDuration(totalMin);

  const sessionsStr = note.sessions
    .filter(s => s.start || s.end)
    .map(s => `${s.start || '?'}–${s.end || '?'}`)
    .join(', ') || '—';

  const locationFull = [note.location, note.kraj].filter(Boolean).join(', ') || '—';

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; color: #1E293B; font-size: 13px; }
.header { background: #1D4ED8; color: white; padding: 24px 32px 20px; }
.header h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
.header .subtitle { font-size: 11px; opacity: 0.75; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
.body { padding: 24px 32px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
.info-cell { padding: 12px 16px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; }
.info-cell:nth-child(even) { border-right: none; }
.info-cell:nth-last-child(-n+2) { border-bottom: none; }
.info-label { font-size: 9px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
.info-value { font-size: 13px; color: #1E293B; font-weight: 500; }
.badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
.total-bar { background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
.total-bar-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; }
.total-bar-value { font-size: 20px; font-weight: 700; color: #1D4ED8; }
.section { margin-bottom: 20px; }
.section-title { font-size: 10px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 10px; }
.section-content { line-height: 1.8; white-space: pre-wrap; color: #334155; }
.photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.photo-item img { width: 100%; border-radius: 6px; border: 1px solid #E2E8F0; }
.caption { font-size: 10px; color: #64748B; margin-top: 5px; font-style: italic; }
.footer { margin-top: 32px; padding: 12px 32px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8; }
</style>
</head>
<body>

<div class="header">
  <div class="subtitle">Raport serwisowy · ServiceLog · ${new Date().toLocaleString('pl-PL')}</div>
  <h1>${esc(note.client || 'Raport Serwisowy')}</h1>
</div>

<div class="body">

<div class="info-grid">
  <div class="info-cell">
    <div class="info-label">Klient</div>
    <div class="info-value">${esc(note.client || '—')}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Status</div>
    <div class="info-value">${STATUS_LABELS[note.status]}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Lokalizacja</div>
    <div class="info-value">${esc(locationFull)}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Data</div>
    <div class="info-value">${esc(note.date || '—')}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Maszyna</div>
    <div class="info-value">${esc(note.machine || '—')}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Nr maszyny</div>
    <div class="info-value">${esc(note.machineNumber || '—')}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Sesje pracy</div>
    <div class="info-value">${esc(sessionsStr)}</div>
  </div>
  <div class="info-cell">
    <div class="info-label">Łączny czas pracy</div>
    <div class="info-value" style="font-weight:700; color:#1D4ED8;">${esc(totalStr)}</div>
  </div>
</div>

${field('Opis usterki', note.problem)}
${field('Wykonane prace', note.workDone)}
${field('Części / materiały', note.parts)}
${field('Uwagi / Zalecenia', note.notes)}
${photosSection}

</div>

<div class="footer">
  <span>Wygenerowano przez ServiceLog</span>
  <span>${new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
