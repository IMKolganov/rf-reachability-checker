const translations = {
  ru: {
    docs: "Документация API",
    schema: "Схема OpenAPI (JSON)",
    home: "На главную",
    language: "Язык",
    theme: "Тема",
    system: "Как в системе",
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
    system: "System default",
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

let labels = translations.en;
let resultData;
let resultError;

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
    if (resultData) renderResult(resultData);
    if (resultError) renderError(resultError);
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

function getStatus(data, protocol) {
  const code = data.http?.status_code;
  if (code != null) {
    const title = code >= 400 ? labels.httpStatusError : labels.httpReply(protocol);
    return { tone: code >= 400 ? "warn" : "ok", title: `${title} · HTTP ${code}` };
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
  const protocol = data.http?.url.startsWith("http:") ? "HTTP" : "HTTPS";
  const status = getStatus(data, protocol);
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
      ${renderHttp(data.http, protocol, data.input)}
    </div>
  `;

  probeFromEl.textContent = `${labels.probeFrom}: ${data.probe_from}`;
  resultEl.classList.remove("hidden");
}

function renderError(error) {
  const errors = new Map([
    ["target is required", labels.requiredTarget],
    ["target query param is required", labels.requiredTarget],
    ["empty target", labels.requiredTarget],
    ["invalid host or URL", labels.invalidTarget],
    ["target must be a string", labels.invalidTarget],
  ]);
  const message = errors.get(error.message) || error.message || labels.checkFailed;
  resultEl.innerHTML = `<div class="status-badge bad">${labels.error}: ${escapeText(message)}</div>`;
  resultEl.classList.remove("hidden");
}

async function submitCheck(event) {
  event.preventDefault();
  const target = targetInput.value.trim();
  if (!target) return;

  resultData = undefined;
  resultError = undefined;
  submitBtn.disabled = true;
  submitBtn.textContent = labels.pending;
  resultEl.classList.add("hidden");
  probeFromEl.textContent = "";

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
    if (!response.ok) {
      throw new Error(data.error);
    }
    renderResult(data);
    resultData = data;
  } catch (error) {
    resultError = error;
    renderError(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = labels.submit;
  }
}

restorePreference(languageSelect);
restorePreference(themeSelect);
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
