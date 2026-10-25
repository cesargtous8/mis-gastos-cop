(() => {
  'use strict';

  const KEY = 'gastos-cop-v1';
  const form = document.querySelector('#form');
  const input = document.querySelector('#note');
  const statusEl = document.querySelector('#status');
  const money = n => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(Number(n) || 0);

  let expenses = [];
  let selectedCycle = cycleStart(todayISO());
  let pendingImport = [];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(saved)) expenses = saved.filter(x => x && typeof x === 'object');
  } catch { expenses = []; }

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function parseISO(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
  }

  function cycleStart(iso) {
    const d = parseISO(iso) || new Date();
    return d.getDate() >= 15
      ? new Date(d.getFullYear(), d.getMonth(), 15)
      : new Date(d.getFullYear(), d.getMonth() - 1, 15);
  }

  function addCycles(start, amount) {
    return new Date(start.getFullYear(), start.getMonth() + amount, 15);
  }

  function isoDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function dateLabel(d) {
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(expenses));
      return true;
    } catch {
      showStatus('No hay espacio disponible para guardar. Descarga un Excel como respaldo.', 'error');
      return false;
    }
  }

  function showStatus(message, type = '') {
    statusEl.className = `status ${type}`.trim();
    statusEl.textContent = message;
  }

  function parseExpense(text) {
    const match = text.match(/(?<!\w)\$?\s*(\d[\d.,]*)/);
    if (!match) throw Error('Escribe un valor, por ejemplo: Gasté 10.000 en un shampoo.');
    const digits = match[1].replace(/[.,]/g, '');
    if (!/^\d+$/.test(digits) || Number(digits) < 1) throw Error('El valor debe ser mayor que cero.');
    const description = (text.slice(0, match.index) + ' ' + text.slice(match.index + match[0].length))
      .replace(/\s+/g, ' ').trim().replace(/^[-,:;.\s]+|[-,:;.\s]+$/g, '');
    if (!description) throw Error('Agrega una descripción además del valor.');
    return { valor: Number(digits), descripcion: description };
  }

  function normalizedExpenses() {
    return expenses.map(x => ({ ...x, fecha: validDate(x.fecha) ? x.fecha : todayISO() }));
  }

  function validDate(value) { return Boolean(parseISO(value)); }

  function render() {
    const all = normalizedExpenses();
    const firstStart = all.length
      ? all.map(x => cycleStart(x.fecha)).sort((a, b) => a - b)[0]
      : selectedCycle;
    const currentCycle = cycleStart(todayISO());
    const monthNumber = Math.max(1, (selectedCycle.getFullYear() - firstStart.getFullYear()) * 12
      + selectedCycle.getMonth() - firstStart.getMonth() + 1);
    const nextStart = addCycles(selectedCycle, 1);
    const cutExpenses = all.filter(x => {
      const d = parseISO(x.fecha);
      return d >= selectedCycle && d < nextStart;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha) || Number(b.id) - Number(a.id));

    document.querySelector('#period-label').textContent = `Mes ${monthNumber}`;
    document.querySelector('#period-range').textContent = `Del ${dateLabel(selectedCycle)} al ${dateLabel(new Date(nextStart.getFullYear(), nextStart.getMonth(), 14))}`;
    document.querySelector('#previous-cycle').disabled = all.length === 0 || selectedCycle <= firstStart;
    document.querySelector('#next-cycle').disabled = selectedCycle >= currentCycle;
    document.querySelector('#total').textContent = money(cutExpenses.reduce((sum, x) => sum + (Number(x.valor) || 0), 0));
    document.querySelector('#count').textContent = String(cutExpenses.length);
    document.querySelector('#count-label').textContent = `${cutExpenses.length} ${cutExpenses.length === 1 ? 'registro' : 'registros'}`;

    const rows = document.querySelector('#rows');
    rows.replaceChildren();
    if (!cutExpenses.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'No hay gastos en este corte. Puedes registrar uno arriba.';
      rows.append(empty);
      return;
    }
    cutExpenses.forEach(x => {
      const row = document.createElement('div');
      row.className = 'row';
      const description = document.createElement('div');
      description.className = 'row-description';
      description.textContent = x.descripcion || 'Gasto importado';
      const amount = document.createElement('div');
      amount.className = 'row-amount';
      amount.textContent = money(x.valor);
      const meta = document.createElement('div');
      meta.className = 'row-meta';
      meta.textContent = dateLabel(parseISO(x.fecha));
      const id = document.createElement('div');
      id.className = 'row-id';
      id.textContent = `#${x.id}`;
      row.append(description, amount, meta, id);
      rows.append(row);
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const item = parseExpense(input.value);
      item.id = expenses.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
      item.fecha = todayISO();
      expenses.push(item);
      if (!persist()) { expenses.pop(); return; }
      selectedCycle = cycleStart(item.fecha);
      render();
      showStatus(`Gasto #${item.id} guardado en Mes ${document.querySelector('#period-label').textContent.slice(4)}.`, 'ok');
      input.value = '';
      input.focus();
    } catch (error) { showStatus(error.message, 'error'); }
  });

  document.querySelector('#previous-cycle').addEventListener('click', () => {
    selectedCycle = addCycles(selectedCycle, -1);
    render();
  });
  document.querySelector('#next-cycle').addEventListener('click', () => {
    const current = cycleStart(todayISO());
    if (selectedCycle < current) selectedCycle = addCycles(selectedCycle, 1);
    render();
  });

  // XLSX reader for ordinary Excel workbooks (stored or DEFLATE ZIP entries).
  async function unzipXlsx(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let p = bytes.length - 22, min = Math.max(0, bytes.length - 65558); p >= min; p--) {
      if (view.getUint32(p, true) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) throw Error('El archivo no parece ser un Excel .xlsx válido.');
    const entries = view.getUint16(eocd + 10, true);
    let cursor = view.getUint32(eocd + 16, true);
    const files = new Map();
    const decoder = new TextDecoder();
    for (let i = 0; i < entries; i++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) throw Error('No se pudo leer la estructura del Excel.');
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      let data;
      if (method === 0) data = compressed;
      else if (method === 8 && 'DecompressionStream' in window) {
        try {
          const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          data = new Uint8Array(await new Response(stream).arrayBuffer());
        } catch { throw Error('Este navegador no puede abrir este Excel. Prueba con Chrome actualizado o impórtalo en formato CSV.'); }
      } else throw Error('Formato de compresión no compatible. Prueba con Chrome actualizado o guarda el libro como CSV.');
      files.set(name, decoder.decode(data));
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  function xmlDoc(source) {
    const doc = new DOMParser().parseFromString(source, 'application/xml');
    if (doc.querySelector('parsererror')) throw Error('El Excel contiene XML inválido.');
    return doc;
  }

  function excelSerialDate(value) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 1) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86400000);
    return isoDate(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  async function parseXlsx(file) {
    const files = await unzipXlsx(file);
    const sheetXml = files.get('xl/worksheets/sheet1.xml');
    if (!sheetXml) throw Error('No encontré una hoja de gastos en el archivo.');
    const strings = [];
    if (files.has('xl/sharedStrings.xml')) {
      const doc = xmlDoc(files.get('xl/sharedStrings.xml'));
      doc.querySelectorAll('si').forEach(si => strings.push([...si.querySelectorAll('t')].map(t => t.textContent).join('')));
    }
    const doc = xmlDoc(sheetXml);
    const rowNodes = [...doc.querySelectorAll('sheetData > row')];
    if (!rowNodes.length) throw Error('La hoja de Excel está vacía.');
    const getColumn = ref => {
      const letters = String(ref).match(/^[A-Z]+/i)?.[0]?.toUpperCase() || '';
      return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
    };
    const matrix = rowNodes.map(row => {
      const values = [];
      row.querySelectorAll(':scope > c').forEach(cell => {
        const col = getColumn(cell.getAttribute('r'));
        const type = cell.getAttribute('t');
        const v = cell.querySelector('v')?.textContent ?? '';
        let value = v;
        if (type === 's') value = strings[Number(v)] ?? '';
        else if (type === 'inlineStr') value = [...cell.querySelectorAll('is t')].map(t => t.textContent).join('');
        else if (type === 'b') value = v === '1';
        values[col] = value;
      });
      return values;
    });
    const header = (matrix[0] || []).map(v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
    const findCol = fn => header.findIndex(fn);
    const idCol = findCol(v => v === 'id');
    const amountCol = findCol(v => /^(valor|monto)( \(cop\))?$/.test(v) || v.includes('valor') || v.includes('monto'));
    const descriptionCol = findCol(v => v.includes('descripcion') || v.includes('concepto'));
    const dateCol = findCol(v => v.includes('fecha'));
    if (amountCol < 0 || descriptionCol < 0) throw Error('No reconozco las columnas. Necesito “Valor (COP)” y “Descripción”.');
    const rows = [];
    for (let i = 1; i < matrix.length; i++) {
      const row = matrix[i];
      const amount = Number(String(row[amountCol] ?? '').replace(/[.,\s]/g, ''));
      const description = String(row[descriptionCol] ?? '').trim();
      if (!Number.isSafeInteger(amount) || amount <= 0 || !description) continue;
      let fecha = null;
      if (dateCol >= 0 && row[dateCol] !== undefined && row[dateCol] !== '') {
        const raw = String(row[dateCol]).trim();
        if (/^\d{4,6}(\.\d+)?$/.test(raw)) fecha = excelSerialDate(raw);
        else if (/^\d{4}-\d{2}-\d{2}/.test(raw)) fecha = raw.slice(0, 10);
        else {
          const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
          if (dmy) fecha = isoDate(new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
        }
        if (!validDate(fecha)) fecha = null;
      }
      const oldId = idCol >= 0 && row[idCol] !== undefined ? String(row[idCol]).trim() : String(i + 1);
      rows.push({ valor: amount, descripcion: description, fecha, importKey: `legacy:${oldId}:${amount}:${description.toLocaleLowerCase('es')}` });
    }
    return rows;
  }

  const importInput = document.querySelector('#import-file');
  document.querySelector('#import-button').addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    importInput.value = '';
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith('.xlsx')) throw Error('Selecciona el archivo .xlsx de gastos.');
      pendingImport = await parseXlsx(file);
      if (!pendingImport.length) throw Error('No encontré filas de gastos válidas en ese Excel.');
      const existingKeys = new Set(expenses.map(x => x.importKey).filter(Boolean));
      const newRows = pendingImport.filter(x => !existingKeys.has(x.importKey));
      if (!newRows.length) {
        showStatus('Ese Excel ya fue importado; no agregué filas duplicadas.', 'ok');
        pendingImport = [];
        return;
      }
      const missingDates = newRows.filter(x => !x.fecha).length;
      document.querySelector('#import-count').textContent = `${newRows.length} gastos nuevos${missingDates ? ` · ${missingDates} sin fecha` : ''}`;
      document.querySelector('#missing-date-wrap').hidden = missingDates === 0;
      document.querySelector('#legacy-date').value = todayISO();
      document.querySelector('#import-panel').hidden = false;
      document.querySelector('#import-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      showStatus(missingDates ? 'El Excel antiguo no guarda fechas. Elige qué fecha asignar a esas filas antes de importar.' : 'Revisa el resumen y confirma la importación.', '');
    } catch (error) { showStatus(error.message || 'No pude leer el Excel.', 'error'); }
  });

  document.querySelector('#cancel-import').addEventListener('click', cancelImport);
  document.querySelector('#confirm-import').addEventListener('click', () => {
    const existingKeys = new Set(expenses.map(x => x.importKey).filter(Boolean));
    const missingDates = pendingImport.filter(x => !x.fecha);
    const assignedDate = document.querySelector('#legacy-date').value;
    if (missingDates.length && !validDate(assignedDate)) {
      showStatus('Elige una fecha válida para los gastos que no tienen fecha.', 'error');
      return;
    }
    const nextId = expenses.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
    const additions = pendingImport.filter(x => !existingKeys.has(x.importKey)).map((x, i) => ({
      id: nextId + i,
      valor: x.valor,
      descripcion: x.descripcion,
      fecha: x.fecha || assignedDate,
      importKey: x.importKey
    }));
    expenses.push(...additions);
    if (!persist()) { expenses.splice(expenses.length - additions.length, additions.length); return; }
    selectedCycle = cycleStart(additions.map(x => x.fecha).sort()[0]);
    cancelImport();
    render();
    showStatus(`Importación completa: ${additions.length} gastos agregados.`, 'ok');
  });

  function cancelImport() {
    pendingImport = [];
    document.querySelector('#import-panel').hidden = true;
  }

  document.querySelector('#export').addEventListener('click', () => {
    if (!expenses.length) { showStatus('Agrega o importa un gasto antes de crear el Excel.', 'error'); return; }
    const records = normalizedExpenses();
    const all = [['ID', 'Valor (COP)', 'Descripción', 'Fecha', 'Corte'], ...records.map(x => [x.id, x.valor, x.descripcion, x.fecha, `Mes ${periodIndex(x.fecha)}`])];
    const sheet = '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="18" customWidth="1"/><col min="3" max="3" width="48" customWidth="1"/><col min="4" max="5" width="16" customWidth="1"/></cols><sheetData>' + all.map((row, ri) => '<row r="' + (ri + 1) + '">' + row.map((v, ci) => {
      const ref = col(ci + 1) + (ri + 1);
      if (ri === 0) return '<c r="' + ref + '" t="inlineStr" s="1"><is><t>' + xmlEscape(v) + '</t></is></c>';
      if (ci < 2) return '<c r="' + ref + '"><v>' + Number(v) + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"><is><t>' + xmlEscape(v) + '</t></is></c>';
    }).join('') + '</row>').join('') + '</sheetData><autoFilter ref="A1:E' + all.length + '"/></worksheet>';
    const files = [
      ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Gastos" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'],
      ['xl/worksheets/sheet1.xml', '<?xml version="1.0" encoding="UTF-8"?>' + sheet]
    ];
    const url = URL.createObjectURL(zip(files));
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos_${todayISO()}.xlsx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    showStatus('Excel descargado con los cortes y sus totales. Búscalo en Archivos o Descargas.', 'ok');
  });

  function periodIndex(iso) {
    const first = expenses.length ? expenses.map(x => cycleStart(validDate(x.fecha) ? x.fecha : todayISO())).sort((a, b) => a - b)[0] : selectedCycle;
    const current = cycleStart(iso);
    return Math.max(1, (current.getFullYear() - first.getFullYear()) * 12 + current.getMonth() - first.getMonth() + 1);
  }

  const encoder = new TextEncoder();
  function crc32(bytes) { let c = ~0; for (const b of bytes) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0); } return (~c) >>> 0; }
  function u16(n) { return [n & 255, (n >>> 8) & 255]; }
  function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
  function zip(files) {
    const locals = [], central = [];
    let offset = 0;
    for (const [name, content] of files) {
      const nb = encoder.encode(name), data = encoder.encode(content), crc = crc32(data);
      locals.push(new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(33), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...nb, ...data]));
      central.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(33), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...nb]));
      offset += locals.at(-1).length;
    }
    const centralSize = central.reduce((n, x) => n + x.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
    return new Blob([...locals, ...central, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
  function col(n) { let s = ''; while (n) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }

  render();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
})();
