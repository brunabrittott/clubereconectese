const SETTINGS = {
  SHEET_NAME: 'Inscrições',
  CAPACITY: 9,
  ADMIN_PASSWORD: 'reconecte2026',
  HEADERS: ['Data', 'Hora', 'Nome', 'WhatsApp', 'Status', 'Origem', 'Observações', 'ID'],
};

const STATUS = {
  PENDING: 'Aguardando pagamento',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  WAITLIST: 'Lista de Espera',
};

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const action = payload.action;

    if (action === 'status') return jsonResponse(getStatus());
    if (action === 'create') return jsonResponse(createRegistration(payload));

    requireAdmin(payload.password);

    if (action === 'adminList') return jsonResponse({ ok: true, rows: listRows() });
    if (action === 'updateStatus') return jsonResponse(updateStatus(payload.id, payload.status));
    if (action === 'delete') return jsonResponse(deleteRegistration(payload.id));

    throw new Error('Ação inválida.');
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message });
  }
}

function doGet() {
  return jsonResponse(getStatus());
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SETTINGS.SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS.SHEET_NAME);

  const currentHeaders = sheet.getRange(1, 1, 1, SETTINGS.HEADERS.length).getValues()[0];
  const needsHeaders = SETTINGS.HEADERS.some((header, index) => currentHeaders[index] !== header);
  if (needsHeaders) {
    sheet.getRange(1, 1, 1, SETTINGS.HEADERS.length).setValues([SETTINGS.HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function listRows() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, SETTINGS.HEADERS.length).getValues();
  return values.map((row, index) => ({
    rowNumber: index + 2,
    date: formatDate(row[0]),
    time: row[1],
    name: row[2],
    whatsapp: row[3],
    status: row[4],
    origin: row[5],
    notes: row[6],
    id: row[7],
  }));
}

function getStatus() {
  const rows = listRows();
  const confirmedCount = rows.filter((row) => row.status === STATUS.CONFIRMED).length;
  return { ok: true, confirmedCount, capacity: SETTINGS.CAPACITY };
}

function createRegistration(payload) {
  const name = String(payload.name || '').trim();
  const whatsapp = String(payload.whatsapp || '').trim();
  const origin = payload.origin === STATUS.WAITLIST ? STATUS.WAITLIST : 'Landing Page';

  if (name.length < 3) throw new Error('Informe o nome completo.');
  if (!isValidPhone(whatsapp)) throw new Error('Informe um WhatsApp válido.');

  const sheet = getSheet();
  const now = new Date();
  const confirmedCount = getStatus().confirmedCount;
  const isWaitlist = confirmedCount >= SETTINGS.CAPACITY || origin === STATUS.WAITLIST;
  const id = Utilities.getUuid();

  sheet.appendRow([
    now,
    Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm'),
    name,
    whatsapp,
    isWaitlist ? STATUS.WAITLIST : STATUS.PENDING,
    isWaitlist ? STATUS.WAITLIST : 'Landing Page',
    '',
    id,
  ]);

  return {
    ok: true,
    message: isWaitlist
      ? 'Você entrou na lista de espera.'
      : 'Inscrição enviada. Agora escolha a forma de pagamento.',
    id,
  };
}

function updateStatus(id, status) {
  if (!Object.keys(STATUS).map((key) => STATUS[key]).includes(status)) {
    throw new Error('Status inválido.');
  }

  const sheet = getSheet();
  const rowNumber = findRowById(id);
  if (status === STATUS.CONFIRMED) {
    const confirmedCount = listRows().filter((row) => row.status === STATUS.CONFIRMED && row.id !== id).length;
    if (confirmedCount >= SETTINGS.CAPACITY) {
      throw new Error('O limite de vagas confirmadas já foi atingido.');
    }
  }
  sheet.getRange(rowNumber, 5).setValue(status);
  return { ok: true };
}

function deleteRegistration(id) {
  const sheet = getSheet();
  const rowNumber = findRowById(id);
  sheet.deleteRow(rowNumber);
  return { ok: true };
}

function findRowById(id) {
  const rows = listRows();
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error('Inscrição não encontrada.');
  return row.rowNumber;
}

function requireAdmin(password) {
  if (password !== SETTINGS.ADMIN_PASSWORD) {
    throw new Error('Acesso não autorizado.');
  }
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

function formatDate(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return value;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
