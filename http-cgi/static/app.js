const form = document.getElementById("check-form");
const targetInput = document.getElementById("target");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");
const probeFromEl = document.getElementById("probe-from");

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMs(value) {
  return value == null ? "—" : `${value} ms`;
}

function line(ok, label, detail) {
  return `<p class="${ok ? "ok-line" : "bad-line"}">${label}: ${detail}</p>`;
}

function renderResult(data) {
  const badgeClass = data.reachable ? "ok" : "bad";
  const badgeText = data.reachable ? "Доступен из РФ" : "Недоступен из РФ";

  const dnsLines = [
    line(data.dns.ok, "DNS", data.dns.ok ? data.dns.addresses.join(", ") : (data.dns.error || "fail")),
    `<p>DNS latency: ${fmtMs(data.dns.latency_ms)}</p>`,
  ].join("");

  const portLines = (data.ports || []).map((port) =>
    line(
      port.ok,
      `TCP ${port.port}`,
      port.ok ? fmtMs(port.latency_ms) : (port.error || "timeout"),
    ),
  ).join("");

  let httpLines = "";
  if (data.http) {
    const summary = data.http.response_summary
      || (data.http.status_code != null
        ? `code ${data.http.status_code}`
        : (data.http.error || "нет ответа"));
    httpLines = [
      line(data.http.ok, "HTTP", escapeText(summary)),
      data.http.url ? `<p>URL: <code>${escapeText(data.http.url)}</code></p>` : "",
      data.http.content_type ? `<p>Content-Type: ${escapeText(data.http.content_type)}</p>` : "",
      `<p>Время: ${fmtMs(data.http.latency_ms)}, ${data.http.bytes_read || 0} B</p>`,
    ].join("");
  }

  resultEl.innerHTML = `
    <div class="status-badge ${badgeClass}">${badgeText}</div>
    <div class="grid">
      <div class="card">
        <h3>${data.host}</h3>
        <p>Запрос: ${data.input}</p>
        <p>Итог: ${data.summary}</p>
      </div>
      <div class="card">
        <h3>DNS</h3>
        ${dnsLines}
      </div>
      <div class="card">
        <h3>TCP</h3>
        ${portLines || "<p>—</p>"}
      </div>
      ${httpLines ? `<div class="card"><h3>Ответ сервера</h3>${httpLines}</div>` : ""}
    </div>
  `;

  probeFromEl.textContent = `Probe from: ${data.probe_from}`;
  resultEl.classList.remove("hidden");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const target = targetInput.value.trim();
  if (!target) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Проверяем…";
  resultEl.classList.add("hidden");

  try {
    const params = new URLSearchParams({ target });
    const response = await fetch(`/check.cgi?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "check failed");
    }
    renderResult(data);
  } catch (error) {
    resultEl.innerHTML = `<div class="status-badge bad">Ошибка: ${error.message}</div>`;
    resultEl.classList.remove("hidden");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Проверить";
  }
});
