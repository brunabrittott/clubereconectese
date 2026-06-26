const ADMIN_CONFIG = {
  password: "reconecte2026",
  sessionKey: "reconecte_admin_session",
};

let adminRows = [];

function normalizeStatus(status) {
  return String(status || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

async function adminApi(action, payload = {}) {
  if (!CONFIG.apiUrl) {
    return localAdminApi(action, payload);
  }
  return apiRequest(action, { ...payload, password: ADMIN_CONFIG.password });
}

async function localAdminApi(action, payload = {}) {
  const rows = getLocalRows();

  if (action === "adminList") {
    return { ok: true, rows };
  }

  if (action === "updateStatus") {
    const row = rows.find((item) => item.id === payload.id);
    if (!row) throw new Error("Inscrição não encontrada.");
    const confirmedCount = rows.filter(
      (item) => item.status === STATUS.confirmed && item.id !== payload.id,
    ).length;
    if (payload.status === STATUS.confirmed && confirmedCount >= CONFIG.capacity) {
      throw new Error("O limite de vagas confirmadas já foi atingido.");
    }
    row.status = payload.status;
    saveLocalRows(rows);
    return { ok: true, row };
  }

  if (action === "delete") {
    saveLocalRows(rows.filter((item) => item.id !== payload.id));
    return { ok: true };
  }

  throw new Error("Ação não disponível.");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isLoggedIn() {
  return sessionStorage.getItem(ADMIN_CONFIG.sessionKey) === "true";
}

function showDashboard() {
  document.getElementById("loginView")?.classList.add("hidden");
  document.getElementById("dashboardView")?.classList.remove("hidden");
  loadRows();
}

function updateStats(rows) {
  const count = (status) => rows.filter((row) => row.status === status).length;
  document.getElementById("statConfirmed").textContent = count(STATUS.confirmed);
  document.getElementById("statPending").textContent = count(STATUS.pending);
  document.getElementById("statWaitlist").textContent = count(STATUS.waitlist);
  document.getElementById("statCancelled").textContent = count(STATUS.cancelled);
  document.getElementById("statTotal").textContent = rows.length;
}

function filteredRows() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  return adminRows.filter((row) => {
    const matchesSearch =
      row.name.toLowerCase().includes(search) || onlyDigits(row.whatsapp).includes(onlyDigits(search));
    const matchesStatus = !status || row.status === status;
    return matchesSearch && matchesStatus;
  });
}

function renderRows() {
  const tbody = document.getElementById("registrationsTable");
  const rows = filteredRows();
  updateStats(adminRows);

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6">Nenhuma inscrição encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(row.whatsapp)}</td>
        <td>${escapeHtml(row.date || "")} ${escapeHtml(row.time || "")}</td>
        <td><span class="status-pill status-${normalizeStatus(row.status)}">${escapeHtml(row.status)}</span></td>
        <td>${escapeHtml(row.origin || "")}</td>
        <td>
          <div class="row-actions">
            <button class="button small" data-action="updateStatus" data-id="${row.id}" data-status="${STATUS.confirmed}">Confirmar</button>
            <button class="button small" data-action="updateStatus" data-id="${row.id}" data-status="${STATUS.cancelled}">Cancelar</button>
            <button class="button small" data-action="updateStatus" data-id="${row.id}" data-status="${STATUS.waitlist}">Lista</button>
            <button class="button small" data-action="updateStatus" data-id="${row.id}" data-status="${STATUS.pending}">Reabrir</button>
            <a class="button small" href="https://wa.me/55${onlyDigits(row.whatsapp)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <button class="button small danger" data-action="delete" data-id="${row.id}">Excluir</button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");
}

async function loadRows() {
  const message = document.getElementById("adminMessage");
  try {
    setMessage(message, "Carregando inscrições...");
    const data = await adminApi("adminList");
    adminRows = data.rows || [];
    renderRows();
    setMessage(message, "");
  } catch (error) {
    setMessage(message, error.message, "error");
  }
}

async function handleTableAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  const message = document.getElementById("adminMessage");

  if (action === "delete" && !confirm("Deseja excluir esta inscrição?")) return;

  try {
    setLoading(button, true, "...");
    if (action === "updateStatus") {
      await adminApi("updateStatus", { id, status: button.dataset.status });
    }
    if (action === "delete") {
      await adminApi("delete", { id });
    }
    await loadRows();
    setMessage(message, "Planilha atualizada.", "success");
  } catch (error) {
    setMessage(message, error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

function initAdmin() {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  if (isLoggedIn()) showDashboard();

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = new FormData(loginForm).get("password");
    if (password !== ADMIN_CONFIG.password) {
      setMessage(loginMessage, "Senha incorreta.", "error");
      return;
    }
    sessionStorage.setItem(ADMIN_CONFIG.sessionKey, "true");
    showDashboard();
  });

  document.getElementById("logoutButton")?.addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
    location.reload();
  });

  document.getElementById("refreshButton")?.addEventListener("click", loadRows);
  document.getElementById("searchInput")?.addEventListener("input", renderRows);
  document.getElementById("statusFilter")?.addEventListener("change", renderRows);
  document.getElementById("registrationsTable")?.addEventListener("click", handleTableAction);
}

initAdmin();
