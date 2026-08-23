const SHEET_NAME = "Sheet1";
const SLOT_MINUTES = 30;
const OPEN_HOUR = 9;
const CLOSE_HOUR = 17;

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "health";

  if (action === "availability") {
    const date = e.parameter.date;
    if (!date) return json_({ success: false, error: "date_required" });
    return json_({ success: true, date: date, slots: getAvailableSlots_(date) });
  }

  return json_({ success: true, service: "NFC Voice Booking", status: "online" });
}

function doPost(e) {
  const data = e && e.parameter ? e.parameter : {};
  const sheet = getSheet_();

  sheet.appendRow([
    new Date(),
    data.name || "",
    data.phone || "",
    data.date || "",
    data.time || "",
    data.agent || "",
    data.service || ""
  ]);

  return json_({ success: true });
}

function getAvailableSlots_(dateString) {
  const booked = getBookedTimes_(dateString);
  const slots = [];
  const day = new Date(`${dateString}T00:00:00`);

  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      if (!booked.has(time)) slots.push(time);
    }
  }

  return slots;
}

function getBookedTimes_(dateString) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const booked = new Set();

  for (let i = 1; i < values.length; i++) {
    const rowDate = values[i][3];
    const rowTime = values[i][4];
    if (!rowDate || !rowTime) continue;

    const normalizedDate = rowDate instanceof Date
      ? Utilities.formatDate(rowDate, Session.getScriptTimeZone(), "yyyy-MM-dd")
      : String(rowDate).slice(0, 10);

    const normalizedTime = rowTime instanceof Date
      ? Utilities.formatDate(rowTime, Session.getScriptTimeZone(), "HH:mm")
      : String(rowTime).slice(0, 5);

    if (normalizedDate === dateString) booked.add(normalizedTime);
  }

  return booked;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
