const LINK_PREFIX = "date-joke:";

function doGet(e) {
  const action = String((e.parameter && e.parameter.action) || "");
  const callback = safeCallback_((e.parameter && e.parameter.callback) || "callback");

  if (action !== "get") {
    return jsonp_(callback, { ok: false, error: "Unsupported action." });
  }

  const token = normalizeToken_((e.parameter && e.parameter.token) || "");
  if (!token) {
    return jsonp_(callback, { ok: false, error: "Invalid link." });
  }

  const raw = PropertiesService.getScriptProperties().getProperty(LINK_PREFIX + token);
  if (!raw) {
    return jsonp_(callback, { ok: false, error: "Link not found." });
  }

  const record = JSON.parse(raw);

  return jsonp_(callback, {
    ok: true,
    recipientName: record.recipientName
  });
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || "");

  try {
    if (action === "create") return createLink_(p);
    if (action === "respond") return recordResponse_(p);

    return json_({ ok: false, error: "Unsupported action." });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: "Server error." });
  }
}

function createLink_(p) {
  const token = normalizeToken_(p.token || "");
  const senderName = cleanText_(p.senderName, 100);
  const senderEmail = String(p.senderEmail || "").trim().toLowerCase();
  const recipientName = cleanText_(p.recipientName, 100);

  if (!token || !senderName || !recipientName || !isValidEmail_(senderEmail)) {
    return json_({ ok: false, error: "Invalid input." });
  }

  const props = PropertiesService.getScriptProperties();
  const key = LINK_PREFIX + token;

  if (props.getProperty(key)) {
    return json_({ ok: false, error: "Token already exists." });
  }

  props.setProperty(key, JSON.stringify({
    senderName,
    senderEmail,
    recipientName,
    createdAt: new Date().toISOString()
  }));

  return json_({ ok: true });
}

function recordResponse_(p) {
  const token = normalizeToken_(p.token || "");
  const selectedDateTime = cleanText_(p.selectedDateTime, 200);
  const selectedDateTimeRaw = cleanText_(p.selectedDateTimeRaw, 100);
  const favoriteFood = cleanText_(p.favoriteFood, 300);

  if (!token || !selectedDateTime || !favoriteFood) {
    return json_({ ok: false, error: "Missing response." });
  }

  const props = PropertiesService.getScriptProperties();
  const key = LINK_PREFIX + token;
  const raw = props.getProperty(key);

  if (!raw) {
    return json_({ ok: false, error: "Link not found." });
  }

  const record = JSON.parse(raw);

  const subject = record.recipientName + " picked a date 💘";
  const textBody =
    record.recipientName + " said yes!\n\n" +
    "Pickup time: " + selectedDateTime + "\n" +
    "Favorite restaurant / food: " + favoriteFood + "\n\n" +
    "Created by: " + record.senderName;

  const htmlBody =
    "<div style=\"font-family:Arial,sans-serif;line-height:1.55;color:#2d1b24\">" +
      "<h2 style=\"margin-bottom:12px\">" + escapeHtml_(record.recipientName) + " said yes! 🎉</h2>" +
      "<p><strong>Pickup time:</strong><br>" + escapeHtml_(selectedDateTime) + "</p>" +
      "<p><strong>Favorite restaurant / food:</strong><br>" + escapeHtml_(favoriteFood) + "</p>" +
      "<p style=\"color:#7b5d6b;font-size:13px\">Date link created by " + escapeHtml_(record.senderName) + ".</p>" +
    "</div>";

  MailApp.sendEmail({
    to: record.senderEmail,
    subject,
    body: textBody,
    htmlBody
  });

  record.lastResponse = {
    selectedDateTime,
    selectedDateTimeRaw,
    favoriteFood,
    respondedAt: new Date().toISOString()
  };
  props.setProperty(key, JSON.stringify(record));

  return json_({ ok: true });
}

function normalizeToken_(value) {
  const token = String(value || "").trim();
  return /^[A-Za-z0-9]{16,64}$/.test(token) ? token : "";
}

function cleanText_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength || 200);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeCallback_(name) {
  const candidate = String(name || "callback");
  return /^[A-Za-z_$][A-Za-z0-9_$\.]*$/.test(candidate) ? candidate : "callback";
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonp_(callback, payload) {
  return ContentService
    .createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
