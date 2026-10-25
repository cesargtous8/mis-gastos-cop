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
  let editingId = null;
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

  function shortDate(d) {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(d);
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

  function monthDistance(from, to) {
    return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
  }

  function cycleList(all) {
    const current = cycleStart(todayISO());
    const dataCycles = all.map(x => cycleStart(x.fecha));
    const firstData = dataCycles.length ? new Date(Math.min(...dataCycles)) : current;
    const first = firstData < current ? firstData : current;
    const lastData = dataCycles.length ? new Date(Math.max(...dataCycles)) : current;
    const last = lastData > current ? lastData : current;
    return Array.from({ length: monthDistance(first, last) + 1 }, (_, i) => addCycles(first, i));
  }

  function periodNumber(start, firstWithExpense) {
    return Math.max(1, monthDistance(firstWithExpense, start) + 1);
  }

  function render() {
    const all = normalizedExpenses();
    const cycles = cycleList(all);
    const firstWithExpense = all.length
      ? all.map(x => cycleStart(x.fecha)).sort((a, b) => a - b)[0]
      : cycles[0];
    if (!cycles.some(cycle => isoDate(cycle) === isoDate(selectedCycle))) selectedCycle = cycles[cycles.length - 1];
    const nextStart = addCycles(selectedCycle, 1);
    const cutExpenses = all.filter(x => {
      const d = parseISO(x.fecha);
      return d >= selectedCycle && d < nextStart;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha) || Number(b.id) - Number(a.id));

    document.querySelector('#period-range').textContent = `Del ${dateLabel(selectedCycle)} al ${dateLabel(new Date(nextStart.getFullYear(), nextStart.getMonth(), 14))}`;
    const periodSelect = document.querySelector('#cycle-select');
    periodSelect.replaceChildren();
    cycles.forEach(cycle => {
      const cycleEnd = new Date(addCycles(cycle, 1).getFullYear(), addCycles(cycle, 1).getMonth(), 14);
      const option = document.createElement('option');
      option.value = isoDate(cycle);
      option.textContent = `Mes ${periodNumber(cycle, firstWithExpense)} · ${shortDate(cycle)}–${shortDate(cycleEnd)}`;
      periodSelect.append(option);
    });
    periodSelect.value = isoDate(selectedCycle);
    document.querySelector('#previous-cycle').disabled = selectedCycle <= cycles[0];
    document.querySelector('#next-cycle').disabled = selectedCycle >= cycles[cycles.length - 1];
    document.querySelector('#total').textContent = money(cutExpenses.reduce((sum, x) => sum + (Number(x.valor) || 0), 0));
    document.querySelector('#grand-total').textContent = money(all.reduce((sum, x) => sum + (Number(x.valor) || 0), 0));
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
      description.textContent = x.descripcion || 'Gasto';
      const amount = document.createElement('div');
      amount.className = 'row-amount';
      amount.textContent = money(x.valor);
      const meta = document.createElement('div');
      meta.className = 'row-meta';
      meta.textContent = dateLabel(parseISO(x.fecha));
      const id = document.createElement('div');
      id.className = 'row-id';
      id.textContent = `#${x.id}`;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'edit-button';
      edit.textContent = 'Editar';
      edit.setAttribute('aria-label', `Editar gasto #${x.id}`);
      edit.addEventListener('click', () => openEditor(x));
      row.append(description, amount, meta, id, edit);
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
      showStatus(`Gasto #${item.id} guardado en el corte de hoy.`, 'ok');
      input.value = '';
      input.focus();
    } catch (error) { showStatus(error.message, 'error'); }
  });

  const editDialog = document.querySelector('#edit-dialog');
  const editForm = document.querySelector('#edit-form');
  const editAmount = document.querySelector('#edit-amount');
  const editDescription = document.querySelector('#edit-description');
  const editLockNote = document.querySelector('#edit-lock-note');

  function openEditor(item) {
    editingId = item.id;
    const editable = isoDate(cycleStart(item.fecha)) === isoDate(cycleStart(todayISO()));
    editAmount.value = String(item.valor);
    editAmount.readOnly = !editable;
    editAmount.setAttribute('aria-readonly', String(!editable));
    editDescription.value = item.descripcion || '';
    editLockNote.hidden = editable;
    document.querySelector('#edit-title').textContent = `Editar gasto #${item.id}`;
    editDialog.hidden = false;
    editAmount.focus();
  }

  function closeEditor() { editDialog.hidden = true; editingId = null; }
  document.querySelector('#cancel-edit').addEventListener('click', closeEditor);
  editDialog.addEventListener('click', event => { if (event.target === editDialog) closeEditor(); });
  editForm.addEventListener('submit', event => {
    event.preventDefault();
    const index = expenses.findIndex(x => String(x.id) === String(editingId));
    if (index < 0) { closeEditor(); render(); return; }
    const previous = expenses[index];
    const updated = { ...previous };
    const editable = isoDate(cycleStart(previous.fecha)) === isoDate(cycleStart(todayISO()));
    const amountText = editAmount.value.trim().replace(/[.,\s$]/g, '');
    if (editable && (!/^\d+$/.test(amountText) || !Number.isSafeInteger(Number(amountText)) || Number(amountText) <= 0)) {
      showStatus('El valor debe ser un número entero mayor que cero.', 'error'); editAmount.focus(); return;
    }
    const description = editDescription.value.trim();
    if (!description) { showStatus('La descripción no puede quedar vacía.', 'error'); editDescription.focus(); return; }
    if (editable) updated.valor = Number(amountText);
    updated.descripcion = description;
    expenses[index] = updated;
    if (!persist()) { expenses[index] = previous; return; }
    closeEditor(); render(); showStatus(`Gasto #${updated.id} actualizado.`, 'ok');
  });

  document.querySelector('#previous-cycle').addEventListener('click', () => {
    selectedCycle = addCycles(selectedCycle, -1);
    render();
  });
  document.querySelector('#next-cycle').addEventListener('click', () => {
    selectedCycle = addCycles(selectedCycle, 1);
    render();
  });
  document.querySelector('#cycle-select').addEventListener('change', event => {
    const chosen = parseISO(event.target.value);
    if (chosen) { selectedCycle = chosen; render(); }
  });

  document.querySelector('#export-cut').addEventListener('click', () => {
    const records = normalizedExpenses().filter(x => {
      const d = parseISO(x.fecha);
      return d >= selectedCycle && d < addCycles(selectedCycle, 1);
    }).sort((a, b) => a.fecha.localeCompare(b.fecha) || Number(a.id) - Number(b.id));
    const all = normalizedExpenses();
    const first = all.length ? all.map(x => cycleStart(x.fecha)).sort((a, b) => a - b)[0] : cycleList(all)[0];
    const number = periodNumber(selectedCycle, first);
    const total = records.reduce((sum, x) => sum + (Number(x.valor) || 0), 0);
    const expenseRows = [['ID', 'Valor (COP)', 'Descripción', 'Fecha', 'Corte'],
      ...records.map(x => [Number(x.id), Number(x.valor), x.descripcion, x.fecha, `Mes ${periodNumber(cycleStart(x.fecha), first)}`])];
    const summaryRows = [
      ['RESUMEN DEL CORTE'],
      ['Periodo', `Mes ${number}`],
      ['Desde', isoDate(selectedCycle)],
      ['Hasta', isoDate(new Date(addCycles(selectedCycle, 1).getFullYear(), addCycles(selectedCycle, 1).getMonth(), 14))],
      ['Movimientos', records.length],
      ['Total del corte (COP)', total]
    ];
    downloadWorkbook(`gastos_Mes_${number}_${isoDate(selectedCycle)}.xlsx`, [
      { name: 'Gastos', rows: expenseRows, widths: [10, 18, 48, 16, 14], filter: true },
      { name: 'Resumen', rows: summaryRows, widths: [26, 28], filter: false }
    ]);
    showStatus(`Descargaste Mes ${number}: ${records.length} gastos por ${money(total)}.`, 'ok');
  });

  document.querySelector('#export-all').addEventListener('click', () => {
    const records = normalizedExpenses().sort((a, b) => a.fecha.localeCompare(b.fecha) || Number(a.id) - Number(b.id));
    const cycles = cycleList(records);
    const first = records.length ? records.map(x => cycleStart(x.fecha)).sort((a, b) => a - b)[0] : cycles[0];
    const expenseRows = [['ID', 'Valor (COP)', 'Descripción', 'Fecha', 'Corte'],
      ...records.map(x => [Number(x.id), Number(x.valor), x.descripcion, x.fecha, `Mes ${periodNumber(cycleStart(x.fecha), first)}`])];
    const summaryRows = [['Corte', 'Desde', 'Hasta', 'Movimientos', 'Total (COP)']];
    for (const cycle of cycles) {
      const until = addCycles(cycle, 1);
      const inCycle = records.filter(x => {
        const d = parseISO(x.fecha);
        return d >= cycle && d < until;
      });
      summaryRows.push([
        `Mes ${periodNumber(cycle, first)}`,
        isoDate(cycle),
        isoDate(new Date(until.getFullYear(), until.getMonth(), 14)),
        inCycle.length,
        inCycle.reduce((sum, x) => sum + (Number(x.valor) || 0), 0)
      ]);
    }
    summaryRows.push(['TOTAL HISTORIAL', '', '', records.length, records.reduce((sum, x) => sum + (Number(x.valor) || 0), 0)]);
    downloadWorkbook(`gastos_historial_${todayISO()}.xlsx`, [
      { name: 'Gastos', rows: expenseRows, widths: [10, 18, 48, 16, 14], filter: true },
      { name: 'Resumen por corte', rows: summaryRows, widths: [20, 16, 16, 16, 20], filter: false }
    ]);
    showStatus(`Descargaste el historial completo: ${records.length} gastos por ${money(records.reduce((sum, x) => sum + (Number(x.valor) || 0), 0))}.`, 'ok');
  });

  function worksheetXml(rows, widths, useFilter) {
    const maxColumns = Math.max(1, ...rows.map(row => row.length));
    const columns = widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('');
    const body = rows.map((row, ri) => `<row r="${ri + 1}">${Array.from({ length: maxColumns }, (_, ci) => {
      const value = row[ci] ?? '';
      const ref = col(ci + 1) + (ri + 1);
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${ri === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
    }).join('')}</row>`).join('');
    const filter = useFilter && rows.length > 1 ? `<autoFilter ref="A1:${col(maxColumns)}${rows.length}"/>` : '';
    return `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>${columns}</cols><sheetData>${body}</sheetData>${filter}</worksheet>`;
  }

  function downloadWorkbook(filename, sheets) {
    const contentSheets = sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const workbookSheets = sheets.map((sheet, i) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('');
    const relationships = sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('');
    const files = [
      ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${contentSheets}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`],
      ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F4E78"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    ];
    sheets.forEach((sheet, i) => files.push([`xl/worksheets/sheet${i + 1}.xml`, worksheetXml(sheet.rows, sheet.widths, sheet.filter)]));
    const url = URL.createObjectURL(zip(files));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
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
