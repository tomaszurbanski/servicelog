import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { ServiceNote } from '../types';
import { STATUS_LABELS } from './helpers';

const toBase64 = async (uri: string): Promise<string> => {
  try {
    const b64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return '';
  }
};

export const exportToPDF = async (note: ServiceNote): Promise<void> => {
  const photoHtmlParts = await Promise.all(
    note.photos.map(async (p, i) => {
      const src = await toBase64(p.uri);
      if (!src) return '';
      return `
        <div class="photo-item">
          <img src="${src}" />
          ${p.caption ? `<p class="caption">${p.caption}</p>` : ''}
        </div>`;
    })
  );
  const photosSection = note.photos.length > 0 ? `
    <div class="section">
      <div class="section-title">ZDJĘCIA</div>
      <div class="photos-grid">${photoHtmlParts.join('')}</div>
    </div>` : '';

  const field = (label: string, value: string) => value ? `
    <div class="section">
      <div class="section-title">${label}</div>
      <div class="section-content">${value.replace(/\n/g, '<br/>')}</div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: Arial, sans-serif; color: #1E293B; padding: 32px; font-size: 13px; }
h1 { font-size: 22px; font-weight: 700; color: #1D4ED8; margin-bottom: 4px; }
.gen { font-size: 10px; color: #94A3B8; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; }
.header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #E2E8F0; }
.hrow { display: flex; flex-direction: column; gap: 2px; }
.label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; }
.value { font-size: 13px; color: #1E293B; font-weight: 500; }
.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
.section { margin-bottom: 20px; }
.section-title { font-size: 10px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 8px; }
.section-content { line-height: 1.7; white-space: pre-wrap; }
.photos-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.photo-item img { width: 100%; border-radius: 6px; border: 1px solid #E2E8F0; }
.caption { font-size: 10px; color: #64748B; margin-top: 4px; }
.footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
</style>
</head>
<body>
<h1>Raport Serwisowy</h1>
<div class="gen">ServiceLog · ${new Date().toLocaleString('pl-PL')}</div>

<div class="header-grid">
  <div class="hrow"><span class="label">Klient</span><span class="value">${note.client || '–'}</span></div>
  <div class="hrow"><span class="label">Status</span><span class="value">${STATUS_LABELS[note.status]}</span></div>
  <div class="hrow"><span class="label">Lokalizacja</span><span class="value">${note.location || '–'}</span></div>
  <div class="hrow"><span class="label">Data</span><span class="value">${note.date || '–'}</span></div>
  <div class="hrow"><span class="label">Maszyna</span><span class="value">${note.machine || '–'}</span></div>
  <div class="hrow"><span class="label">Czas pracy</span><span class="value">${note.startTime && note.endTime ? `${note.startTime} – ${note.endTime}` : note.startTime || '–'}</span></div>
  ${note.machineNumber ? `<div class="hrow"><span class="label">Nr maszyny</span><span class="value">${note.machineNumber}</span></div>` : ''}
</div>

${field('Opis usterki', note.problem)}
${field('Wykonane prace', note.workDone)}
${field('Części do wymiany', note.parts)}
${field('Uwagi / Zalecenia', note.notes)}
${photosSection}

<div class="footer">Raport wygenerowany przez ServiceLog</div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Raport – ${note.client || 'ServiceLog'}`,
    UTI: 'com.adobe.pdf',
  });
};
