const translations = {
  ru: {
    docs: "Документация API",
    schema: "Схема OpenAPI (JSON)",
    home: "На главную",
    language: "Язык",
    theme: "Тема",
    system: "Система",
    light: "Светлая",
    dark: "Тёмная",
    checkFromRussia: "Проверка из России",
    lead: "Введите IP-адрес или домен, чтобы проверить доступность с хостинга",
    location: "(Москва, Россия).",
    server: "Сервер",
    placeholder: "example.com или 8.8.8.8",
    hint: "Можно указать URL",
    submit: "Проверить",
    pending: "Проверяем…",
    history: "История проверок",
    historyEmpty: "Здесь появятся результаты новых проверок в этом браузере.",
    resultUnavailable: "Результат проверки не сохранён",
    dnsFailed: "Ошибка DNS",
    dnsNoAddress: "Не удалось определить IP-адрес.",
    dnsLatency: "Время разрешения",
    request: "Цель проверки",
    tcpConnected: "TCP-соединение установлено",
    tcpFailed: "Ошибка TCP-подключения",
    portConnected: "Соединение установлено",
    portFailed: "Подключение не удалось",
    port: "Порт",
    openPorts: "Доступные по TCP порты",
    webRequest: "Веб-запрос",
    webSkipped: "Проверка веб-ответа пропущена. Для проверки укажите полный URL.",
    httpRequest: (protocol) => `${protocol}-запрос`,
    httpReply: (protocol) => `Получен ответ на ${protocol}-запрос`,
    httpStatusError: "Сервер вернул ошибку",
    httpAuthRequired: "Сервер доступен. Для доступа нужна авторизация.",
    httpNoReply: (protocol) => `Нет ответа на ${protocol}-запрос`,
    timeout: "Время ожидания истекло",
    response: "Ответ",
    noResponse: "HTTP-ответ не получен",
    contentType: "Тип ответа",
    bodyError: "Не удалось прочитать тело ответа",
    tlsCertificate: "Ошибка проверки сертификата TLS",
    tlsError: "Ошибка TLS",
    tlsTimeout: "Истекло время ожидания защищённого соединения (тайм-аут TLS-рукопожатия).",
    connectionError: "Ошибка соединения",
    elapsed: "Время запроса",
    milliseconds: "мс",
    bodyBytes: (bytes) => `Прочитано ${bytes} Б`,
    details: "Технические подробности",
    probeFrom: "Проверено с хостинга",
    error: "Ошибка",
    checkFailed: "Не удалось выполнить проверку",
    invalidTarget: "Укажите корректный домен, IP-адрес или URL",
    requiredTarget: "Укажите сервер",
    docsIntro: "API проверяет DNS, соединение с TCP-портами и HTTP-ответ с сервера в России.",
    docsTarget: "Обязательный параметр target принимает домен, IP-адрес или HTTP(S)-URL.",
    docsSuccess: "При валидном запросе API возвращает 200 и результаты проверок. Поле reachable показывает, удалось ли подтвердить доступность.",
    docsHttp: "Поле http может быть null. Если сервер ответил по HTTP, поле http.ok равно true даже при статусе 4xx или 5xx.",
    docsError: "Если цель не указана или невалидна, API возвращает 400 и объект с полем error.",
  },
  en: {
    docs: "API documentation",
    schema: "OpenAPI schema (JSON)",
    home: "Back to checker",
    language: "Language",
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    checkFromRussia: "Check from Russia",
    lead: "Enter an IP address or domain to check reachability from",
    location: "(Moscow, Russia).",
    server: "Server",
    placeholder: "example.com or 8.8.8.8",
    hint: "You can also enter a URL",
    submit: "Check",
    pending: "Checking…",
    history: "Check history",
    historyEmpty: "New checks from this browser will appear here.",
    resultUnavailable: "No saved result for this check",
    dnsFailed: "DNS lookup failed",
    dnsNoAddress: "Could not resolve the IP address.",
    dnsLatency: "DNS latency",
    request: "Target",
    tcpConnected: "TCP connection established",
    tcpFailed: "TCP connection failed",
    portConnected: "Connection established",
    portFailed: "Connection failed",
    port: "Port",
    openPorts: "Reachable TCP ports",
    webRequest: "Web request",
    webSkipped: "The web check was skipped. Enter a full URL to check the web response.",
    httpRequest: (protocol) => `${protocol} request`,
    httpReply: (protocol) => `Received a response to the ${protocol} request`,
    httpStatusError: "Server returned an error",
    httpAuthRequired: "The server is reachable. Access requires authorization.",
    httpNoReply: (protocol) => `No response to the ${protocol} request`,
    timeout: "Timed out",
    response: "Response",
    noResponse: "No HTTP response was received",
    contentType: "Content type",
    bodyError: "Could not read the response body",
    tlsCertificate: "TLS certificate verification failed",
    tlsError: "TLS error",
    tlsTimeout: "Timed out while establishing a secure connection (TLS handshake timeout).",
    connectionError: "Connection failed",
    elapsed: "Request time",
    milliseconds: "ms",
    bodyBytes: (bytes) => `Read ${bytes} B`,
    details: "Technical details",
    probeFrom: "Checked from",
    error: "Error",
    checkFailed: "The check could not be completed",
    invalidTarget: "Enter a valid domain, IP address, or URL",
    requiredTarget: "Enter a server to check",
    docsIntro: "The API checks DNS, TCP connections, and the HTTP response from a server in Russia.",
    docsTarget: "The required target parameter accepts a domain, IP address, or HTTP(S) URL.",
    docsSuccess: "A valid request returns 200 with the check results. The reachable field indicates whether the server could be reached.",
    docsHttp: "The http field can be null. If the server sends an HTTP response, http.ok is true even for a 4xx or 5xx status.",
    docsError: "A missing or invalid target returns 400 and an object with an error field.",
  },
};

const languageSelect = document.getElementById("language");
const themeSelect = document.getElementById("theme");
const form = document.getElementById("check-form");
const targetInput = document.getElementById("target");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");
const probeFromEl = document.getElementById("probe-from");
const historyList = document.getElementById("history-list");
const historyEmptyEl = document.getElementById("history-empty");
const historyPrefix = "rf-reachability-check-";
const historyLimit = 50;

let labels = translations.en;
let checks = form ? readHistory().slice(0, historyLimit) : [];
let selectedCheck = checks[0];
let pendingCheck;

function isCheckResult(data) {
  return typeof data?.input === "string"
    && typeof data.host === "string"
    && typeof data.probe_from === "string"
    && Array.isArray(data.dns?.addresses)
    && (data.dns.latency_ms == null || Number.isFinite(data.dns.latency_ms))
    && Array.isArray(data.ports)
    && data.ports.every((port) => Number.isInteger(port?.port)
      && (port.latency_ms == null || Number.isFinite(port.latency_ms)))
    && (data.http == null || (typeof data.http.url === "string"
      && (data.http.latency_ms == null || Number.isFinite(data.http.latency_ms))
      && (data.http.status_code == null || (Number.isInteger(data.http.status_code)
        && Number.isInteger(data.http.bytes_read)))));
}

function readHistory() {
  try {
    const storage = window.localStorage;
    return Object.keys(storage)
      .filter((key) => key.startsWith(historyPrefix))
      .map((key) => readCheck(storage, key))
      .filter(Boolean)
      .sort(newestFirst);
  } catch {
    return [];
  }
}

function readCheck(storage, key) {
  try {
    const check = JSON.parse(storage.getItem(key));
    if (typeof check?.id === "string"
      && key === historyPrefix + check.id
      && typeof check.target === "string"
      && typeof check.startedAt === "number"
      && Number.isFinite(new Date(check.startedAt).getTime())
      && (check.result === undefined || isCheckResult(check.result))
      && (check.error === undefined || typeof check.error === "string")) {
      return check;
    }
  } catch {
    // Ignore an individual unreadable record.
  }
}

function newestFirst(a, b) {
  return b.startedAt - a.startedAt || b.id.localeCompare(a.id);
}

function saveCheck(check) {
  try {
    window.localStorage.setItem(historyPrefix + check.id, JSON.stringify(check));
  } catch {
    // History remains available until the current page is closed.
  }

  const savedChecks = readHistory();
  const byId = new Map(checks.map((entry) => [entry.id, entry]));
  for (const saved of savedChecks.slice(0, historyLimit)) {
    if (!byId.has(saved.id) || saved.result || saved.error !== undefined) {
      byId.set(saved.id, saved);
    }
  }
  byId.set(check.id, check);
  checks = [...byId.values()].sort(newestFirst).slice(0, historyLimit);

  try {
    for (const expired of savedChecks.slice(historyLimit)) {
      window.localStorage.removeItem(historyPrefix + expired.id);
    }
  } catch {
    // The page still shows only the latest checks.
  }
}

function restorePreference(select) {
  try {
    const saved = window.localStorage.getItem(`rf-reachability-${select.id}`);
    if ([...select.options].some((option) => option.value === saved)) {
      select.value = saved;
    }
  } catch {
    // Keep the defaults if local storage is unavailable.
  }
}

function savePreference(select) {
  try {
    window.localStorage.setItem(`rf-reachability-${select.id}`, select.value);
  } catch {
    // Preferences still apply to the current page.
  }
}

function systemLanguage() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  return languages
    .map((locale) => locale.toLowerCase().split("-")[0])
    .find((language) => language === "ru" || language === "en") || "en";
}

function applyLanguage() {
  const language = languageSelect.value === "system" ? systemLanguage() : languageSelect.value;
  document.documentElement.lang = language;
  labels = translations[language];

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = labels[element.dataset.i18n];
  });

  if (form) {
    targetInput.placeholder = labels.placeholder;
    submitBtn.textContent = submitBtn.disabled ? labels.pending : labels.submit;
    renderSelectedCheck();
    renderHistory();
  }
}

function applyTheme() {
  document.documentElement.dataset.theme = themeSelect.value;
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtMs(value) {
  return `${value.toLocaleString(document.documentElement.lang)} ${labels.milliseconds}`;
}

function line(ok, message) {
  return `<p class="${ok ? "ok-line" : "bad-line"}">${escapeText(message)}</p>`;
}

function technicalDetails(error) {
  if (!error) return "";
  return `<details><summary>${labels.details}</summary><p><code>${escapeText(error)}</code></p></details>`;
}

function httpProtocol(data) {
  return data.http?.url.startsWith("http:") ? "HTTP" : "HTTPS";
}

function getStatus(data) {
  const protocol = httpProtocol(data);
  const code = data.http?.status_code;
  if (code != null) {
    const authRequired = code === 401;
    const showError = code >= 400 && !authRequired;
    const title = showError ? labels.httpStatusError : labels.httpReply(protocol);
    return {
      tone: showError ? "warn" : "ok",
      title: `${title} · HTTP ${code}`,
      note: authRequired ? labels.httpAuthRequired : null,
    };
  }

  const openPorts = data.ports.filter((port) => port.ok).map((port) => port.port);
  if (!data.dns.ok && !openPorts.length) {
    return { tone: "bad", title: labels.dnsFailed };
  }
  if (data.http) {
    return {
      tone: openPorts.length ? "warn" : "bad",
      title: labels.httpNoReply(protocol),
      note: openPorts.length ? `${labels.openPorts} — ${openPorts.join(", ")}.` : null,
    };
  }
  if (openPorts.length) {
    return { tone: "ok", title: labels.tcpConnected };
  }
  return { tone: "bad", title: labels.tcpFailed };
}

function renderHttp(http, protocol, input) {
  if (!http) {
    return `<div class="card"><h3>${labels.webRequest}</h3><p>${labels.webSkipped}</p></div>`;
  }

  const failures = new Map([
    ["tls_certificate", labels.tlsCertificate],
    ["tls_error", labels.tlsError],
    ["tls_timeout", labels.tlsTimeout],
    ["timeout", labels.timeout],
    ["connection_error", labels.connectionError],
  ]);
  let responseLines;
  if (http.status_code == null) {
    responseLines = line(false, failures.get(http.error_kind) || labels.noResponse)
      + technicalDetails(http.error);
  } else {
    responseLines = [
      http.latency_ms != null ? `<p>${labels.elapsed} — ${fmtMs(http.latency_ms)}</p>` : "",
      http.content_type ? `<p>${labels.contentType} — ${escapeText(http.content_type)}</p>` : "",
      http.body_error ? line(false, labels.bodyError) + technicalDetails(http.body_error)
        : `<p>${labels.bodyBytes(http.bytes_read.toLocaleString(document.documentElement.lang))}</p>`,
      http.body_preview ? `<p>${escapeText(http.body_preview)}</p>` : "",
    ].join("");
  }

  return `
    <div class="card">
      <h3>${labels.httpRequest(protocol)}</h3>
      ${http.url && http.url !== input ? `<p>URL — <code>${escapeText(http.url)}</code></p>` : ""}
      ${responseLines}
    </div>
  `;
}

function renderResult(data) {
  const status = getStatus(data);
  const dnsLines = data.dns.ok
    ? line(true, `IP — ${data.dns.addresses.join(", ")}`)
      + (data.dns.latency_ms != null ? `<p>${labels.dnsLatency} — ${fmtMs(data.dns.latency_ms)}</p>` : "")
    : line(false, labels.dnsNoAddress) + technicalDetails(data.dns.error);
  const portLines = data.ports.map((port) => {
    const message = port.ok ? labels.portConnected : labels.portFailed;
    const elapsed = port.latency_ms != null ? ` · ${fmtMs(port.latency_ms)}` : "";
    return line(port.ok, `${labels.port} ${port.port} · ${message}${elapsed}`) + technicalDetails(port.error);
  }).join("");

  resultEl.innerHTML = `
    <div class="status-badge ${status.tone}">${escapeText(status.title)}</div>
    ${status.note ? `<p class="status-note">${escapeText(status.note)}</p>` : ""}
    <div class="grid">
      <div class="card">
        <h3>${escapeText(data.host)}</h3>
        <p>${labels.request} — <code>${escapeText(data.input)}</code></p>
      </div>
      <div class="card">
        <h3>DNS</h3>
        ${dnsLines}
      </div>
      <div class="card">
        <h3>TCP</h3>
        ${portLines}
      </div>
      ${renderHttp(data.http, httpProtocol(data), data.input)}
    </div>
  `;

  probeFromEl.textContent = `${labels.probeFrom}: ${data.probe_from}`;
  resultEl.classList.remove("hidden");
}

function renderError(errorMessage) {
  const errors = new Map([
    ["target is required", labels.requiredTarget],
    ["target query param is required", labels.requiredTarget],
    ["empty target", labels.requiredTarget],
    ["invalid host or URL", labels.invalidTarget],
    ["target must be a string", labels.invalidTarget],
  ]);
  const message = errors.get(errorMessage) || errorMessage || labels.checkFailed;
  resultEl.innerHTML = `<div class="status-badge bad">${labels.error}: ${escapeText(message)}</div>`;
  resultEl.classList.remove("hidden");
}

function renderSelectedCheck() {
  probeFromEl.textContent = "";
  if (!selectedCheck || selectedCheck === pendingCheck) {
    resultEl.classList.add("hidden");
  } else if (selectedCheck.result) {
    renderResult(selectedCheck.result);
  } else if (selectedCheck.error !== undefined) {
    renderError(selectedCheck.error);
  } else {
    resultEl.textContent = labels.resultUnavailable;
    resultEl.classList.remove("hidden");
  }
}

function historyStatus(check) {
  if (check.result) return getStatus(check.result);
  if (check.error !== undefined) return { tone: "bad", title: labels.checkFailed };
  return { title: check === pendingCheck ? labels.pending : labels.resultUnavailable };
}

function renderHistory() {
  if (historyEmptyEl) historyEmptyEl.hidden = checks.length > 0;
  if (!historyList) return;
  const dateFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const focusedId = historyList.contains(document.activeElement) ? document.activeElement.dataset.checkId : null;
  let focusedButton;
  historyList.replaceChildren(...checks.map((check) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.checkId = check.id;
    button.disabled = check === pendingCheck;
    if (check.id === selectedCheck?.id) button.setAttribute("aria-current", "true");
    if (check.id === focusedId) focusedButton = button;

    const target = document.createElement("span");
    target.textContent = check.target;

    const time = document.createElement("time");
    const startedAt = new Date(check.startedAt);
    time.dateTime = startedAt.toISOString();
    time.textContent = dateFormat.format(startedAt);

    const status = historyStatus(check);
    const summary = document.createElement("span");
    summary.className = "history-status";
    if (status.tone) summary.classList.add(status.tone);
    summary.textContent = status.title;

    button.append(target, time, summary);
    button.addEventListener("click", () => {
      selectedCheck = check;
      targetInput.value = check.target;
      renderSelectedCheck();
      resultEl.focus();
      renderHistory();
    });
    item.append(button);
    return item;
  }));
  focusedButton?.focus({ preventScroll: true });
}

async function submitCheck(event) {
  event.preventDefault();
  const target = targetInput.value.trim();
  if (!target || pendingCheck) return;

  const check = {
    id: window.crypto.getRandomValues(new Uint32Array(4)).join("-"),
    target,
    startedAt: Date.now(),
  };
  selectedCheck = check;
  pendingCheck = check;
  submitBtn.disabled = true;
  submitBtn.textContent = labels.pending;
  saveCheck(check);
  renderSelectedCheck();
  renderHistory();

  try {
    const url = new URL(form.action);
    const options = {};
    if (form.method === "post") {
      options.method = "POST";
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify({ target });
    } else {
      url.searchParams.set("target", target);
    }
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || !isCheckResult(data)) {
      throw new Error(data?.error);
    }
    check.result = data;
  } catch (error) {
    check.error = error.message || "";
  } finally {
    pendingCheck = undefined;
    submitBtn.disabled = false;
    submitBtn.textContent = labels.submit;
    saveCheck(check);
    if (selectedCheck === check) renderSelectedCheck();
    renderHistory();
  }
}

restorePreference(languageSelect);
restorePreference(themeSelect);
if (selectedCheck) targetInput.value = selectedCheck.target;
applyTheme();
applyLanguage();

languageSelect.addEventListener("change", () => {
  savePreference(languageSelect);
  applyLanguage();
});
themeSelect.addEventListener("change", () => {
  savePreference(themeSelect);
  applyTheme();
});
window.addEventListener("languagechange", applyLanguage);

form?.addEventListener("submit", submitCheck);
