const CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbw68bxs8mW01H6O-1kWUNGfIX0kheiZ1gB0khoLnW0p6TxpnYOMD11dMNyyDmN2nErScw/exec",
  pixKey: "(44) 99966-5209",
  capacity: 9,
  localStorageKey: "reconecte_registrations_demo",
};

const STATUS = {
  pending: "Aguardando pagamento",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  waitlist: "Lista de Espera",
};

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatWhatsApp(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value) {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

function setMessage(element, text, type = "") {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`.trim();
}

function setLoading(button, loading, label) {
  if (!button) return;
  button.disabled = loading;
  if (loading) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = label;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
  }
}

function getLocalRows() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.localStorageKey)) || [];
  } catch {
    return [];
  }
}

function saveLocalRows(rows) {
  localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(rows));
}

function localSummary() {
  const rows = getLocalRows();
  return {
    rows,
    confirmedCount: rows.filter((row) => row.status === STATUS.confirmed).length,
  };
}

async function apiRequest(action, payload = {}) {
  if (!CONFIG.apiUrl) {
    return localApi(action, payload);
  }

  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await response.json();
  if (!data.ok) throw new Error(data.message || "Não foi possível concluir.");
  return data;
}

async function localApi(action, payload) {
  const rows = getLocalRows();
  const now = new Date();

  if (action === "status") {
    return { ok: true, ...localSummary(), capacity: CONFIG.capacity };
  }

  if (action === "create") {
    const confirmedCount = rows.filter((row) => row.status === STATUS.confirmed).length;
    const shouldWaitlist = confirmedCount >= CONFIG.capacity || payload.origin === "Lista de Espera";
    const row = {
      id: crypto.randomUUID(),
      date: now.toLocaleDateString("pt-BR"),
      time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      name: payload.name,
      whatsapp: payload.whatsapp,
      status: shouldWaitlist ? STATUS.waitlist : STATUS.pending,
      origin: shouldWaitlist ? "Lista de Espera" : "Landing Page",
      notes: "",
    };
    rows.push(row);
    saveLocalRows(rows);
    return {
      ok: true,
      message: shouldWaitlist
        ? "Você entrou na lista de espera."
        : "Inscrição enviada. Agora escolha a forma de pagamento.",
      row,
    };
  }

  throw new Error("Ação local não disponível.");
}

function bindPhoneMasks(scope = document) {
  scope.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatWhatsApp(input.value);
    });
  });
}

function getFormData(form) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const whatsapp = formatWhatsApp(formData.get("whatsapp"));
  return { name, whatsapp };
}

function validateSignup(data) {
  if (data.name.length < 3) return "Informe seu nome completo.";
  if (!isValidPhone(data.whatsapp)) return "Informe um WhatsApp válido.";
  return "";
}

async function refreshLandingStatus() {
  const activeSignup = document.getElementById("activeSignup");
  const waitlistSignup = document.getElementById("waitlistSignup");
  if (!activeSignup || !waitlistSignup) return;

  try {
    const data = await apiRequest("status");
    const isFull = Number(data.confirmedCount || 0) >= CONFIG.capacity;
    activeSignup.classList.toggle("hidden", isFull);
    waitlistSignup.classList.toggle("hidden", !isFull);
  } catch {
    activeSignup.classList.remove("hidden");
    waitlistSignup.classList.add("hidden");
  }
}

function initLanding() {
  bindPhoneMasks();
  refreshLandingStatus();

  const copyPix = document.getElementById("copyPix");
  copyPix?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(CONFIG.pixKey);
    copyPix.textContent = "PIX copiado";
    window.setTimeout(() => {
      copyPix.textContent = "Copiar chave PIX";
    }, 1800);
  });

  const signupForm = document.getElementById("signupForm");
  const signupMessage = document.getElementById("signupMessage");
  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = signupForm.querySelector("button");
    const data = getFormData(signupForm);
    const error = validateSignup(data);
    if (error) return setMessage(signupMessage, error, "error");

    try {
      setLoading(button, true, "Enviando...");
      const response = await apiRequest("create", data);
      setMessage(signupMessage, response.message, "success");
      signupForm.reset();
      await refreshLandingStatus();
    } catch (errorMessage) {
      setMessage(signupMessage, errorMessage.message, "error");
    } finally {
      setLoading(button, false);
    }
  });

  const waitlistForm = document.getElementById("waitlistForm");
  const waitlistMessage = document.getElementById("waitlistMessage");
  waitlistForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = waitlistForm.querySelector("button");
    const data = getFormData(waitlistForm);
    const error = validateSignup(data);
    if (error) return setMessage(waitlistMessage, error, "error");

    try {
      setLoading(button, true, "Enviando...");
      const response = await apiRequest("create", { ...data, origin: "Lista de Espera" });
      setMessage(waitlistMessage, response.message, "success");
      waitlistForm.reset();
    } catch (errorMessage) {
      setMessage(waitlistMessage, errorMessage.message, "error");
    } finally {
      setLoading(button, false);
    }
  });
}

if (document.body.dataset.page === "landing") {
  initLanding();
}
