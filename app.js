const API_URL = "https://script.google.com/macros/s/AKfycby2w2xMuOxUmh3Py08n67dNgQshw2_bkwQ6I05d5demBz6zYfFPBREXN0naIggflK0R/exec";

const params = new URLSearchParams(window.location.search);
const agent = params.get("agent") || "KINGDOM001";

const talk = document.getElementById("talk");
const status = document.getElementById("status");
const conversation = document.getElementById("conversation");
const bookingForm = document.getElementById("bookingForm");
const review = document.getElementById("review");
const reviewDetails = document.getElementById("reviewDetails");
const confirmation = document.getElementById("confirmation");
const confirmationText = document.getElementById("confirmationText");
const editBooking = document.getElementById("editBooking");
const confirmBooking = document.getElementById("confirmBooking");
const newBooking = document.getElementById("newBooking");

const fields = {
  service: document.getElementById("service"),
  name: document.getElementById("name"),
  phone: document.getElementById("phone"),
  date: document.getElementById("date"),
  time: document.getElementById("time")
};

fields.date.min = new Date().toISOString().slice(0, 10);

function addMessage(who, text) {
  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${who}: `;
  p.appendChild(strong);
  p.appendChild(document.createTextNode(text));
  conversation.appendChild(p);
}

function speak(text) {
  addMessage("Agent", text);
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = "en-US";
    window.speechSynthesis.speak(voice);
  }
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "full" }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value) {
  if (!value) return "";
  const [hour, minute] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

function syncQuickActions() {
  document.getElementById("serviceSummary").textContent = fields.service.value || "Choose";
  document.getElementById("dateSummary").textContent = fields.date.value ? formatDate(fields.date.value).split(",")[0] : "Choose";
  document.getElementById("timeSummary").textContent = fields.time.value ? formatTime(fields.time.value) : "Choose";
}

Object.values(fields).forEach((field) => field.addEventListener("input", syncQuickActions));
Object.values(fields).forEach((field) => field.addEventListener("change", syncQuickActions));

document.querySelectorAll(".quick").forEach((button) => {
  button.addEventListener("click", () => {
    const field = document.getElementById(button.dataset.focus);
    field?.focus();
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

function loadAvailability(date) {
  if (!date) return;
  fields.time.disabled = true;
  fields.time.innerHTML = '<option value="">Checking available times…</option>';
  status.textContent = "Checking available times…";

  const callback = `availability_${Date.now()}`;
  window[callback] = (result) => {
    try {
      fields.time.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = result.success && result.slots.length ? "Choose an available time" : "No times available";
      placeholder.disabled = true;
      placeholder.selected = true;
      fields.time.appendChild(placeholder);

      if (result.success) {
        result.slots.forEach((slot) => {
          const option = document.createElement("option");
          option.value = slot;
          option.textContent = formatTime(slot);
          fields.time.appendChild(option);
        });
        fields.time.disabled = result.slots.length === 0;
        status.textContent = result.slots.length ? `${result.slots.length} appointment times available.` : "No appointment times are available for that date.";
      } else {
        fields.time.disabled = true;
        status.textContent = "I couldn't check availability. Please try again.";
      }
      syncQuickActions();
    } finally {
      delete window[callback];
      script.remove();
    }
  };

  const script = document.createElement("script");
  script.src = `${API_URL}?action=availability&date=${encodeURIComponent(date)}&callback=${callback}`;
  script.onerror = () => {
    fields.time.innerHTML = '<option value="">Availability unavailable</option>';
    fields.time.disabled = true;
    status.textContent = "Availability could not be reached.";
    delete window[callback];
    script.remove();
  };
  document.body.appendChild(script);
}

fields.date.addEventListener("change", () => {
  fields.time.value = "";
  loadAvailability(fields.date.value);
  syncQuickActions();
});

function handleVoiceCommand(text) {
  const lower = text.toLowerCase();
  addMessage("You", text);

  if (lower.includes("cleaning")) fields.service.value = "Cleaning";
  else if (lower.includes("consultation")) fields.service.value = "Consultation";
  else if (lower.includes("service")) fields.service.value = "Service appointment";

  const dateMatch = lower.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  if (dateMatch) {
    let year = dateMatch[3];
    if (year.length === 2) year = `20${year}`;
    fields.date.value = `${year}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`;
    loadAvailability(fields.date.value);
  }

  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = timeMatch[2] || "00";
    if (timeMatch[3] === "pm" && hour < 12) hour += 12;
    if (timeMatch[3] === "am" && hour === 12) hour = 0;
    const requested = `${String(hour).padStart(2, "0")}:${minute}`;
    setTimeout(() => {
      const option = [...fields.time.options].find((item) => item.value === requested);
      if (option) fields.time.value = requested;
      syncQuickActions();
    }, 500);
  }

  syncQuickActions();
  bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
  speak("I filled in what I understood. I am checking the available times for you.");
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  talk.addEventListener("click", () => {
    status.textContent = "Listening…";
    talk.classList.add("listening");
    try { recognition.start(); } catch (_) {}
  });

  recognition.addEventListener("result", (event) => {
    handleVoiceCommand(event.results[0][0].transcript);
    status.textContent = "Ready when you are.";
    talk.classList.remove("listening");
  });

  recognition.addEventListener("error", () => {
    status.textContent = "I couldn't hear that. Try again.";
    talk.classList.remove("listening");
  });

  recognition.addEventListener("end", () => talk.classList.remove("listening"));
} else {
  status.textContent = "Voice isn't supported here. You can still book below.";
  talk.disabled = true;
}

function showReview() {
  const data = getBookingData();
  reviewDetails.innerHTML = "";
  const rows = [
    ["Service", data.service],
    ["Name", data.name],
    ["Phone", data.phone],
    ["Date", formatDate(data.date)],
    ["Time", formatTime(data.time)]
  ];
  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "review-row";
    const span = document.createElement("span");
    span.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    row.append(span, strong);
    reviewDetails.appendChild(row);
  });
  review.hidden = false;
  bookingForm.hidden = true;
  review.scrollIntoView({ behavior: "smooth", block: "center" });
}

function getBookingData() {
  return {
    service: fields.service.value,
    name: fields.name.value.trim(),
    phone: fields.phone.value.trim(),
    date: fields.date.value,
    time: fields.time.value,
    agent
  };
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;
  if (!fields.time.value) {
    speak("Please choose one of the available appointment times.");
    fields.time.focus();
    return;
  }
  showReview();
});

editBooking.addEventListener("click", () => {
  review.hidden = true;
  bookingForm.hidden = false;
  bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
});

function submitToAppsScript(data) {
  const frameName = `bookingFrame_${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.name = frameName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = API_URL;
  form.target = frameName;
  form.style.display = "none";

  Object.entries(data).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => { form.remove(); iframe.remove(); }, 10000);
}

confirmBooking.addEventListener("click", () => {
  const data = getBookingData();
  confirmBooking.disabled = true;
  status.textContent = "Securing your appointment…";

  try {
    submitToAppsScript(data);
    localStorage.setItem("lastBooking", JSON.stringify(data));
    review.hidden = true;
    confirmation.hidden = false;
    confirmationText.textContent = `${data.service} · ${formatDate(data.date)} · ${formatTime(data.time)}. Your appointment request has been submitted.`;
    status.textContent = "Booking submitted.";
    speak(`Your ${data.service.toLowerCase()} request was submitted for ${formatDate(data.date)} at ${formatTime(data.time)}.`);
    confirmation.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    console.error(error);
    status.textContent = "Something went wrong. Please try again.";
  } finally {
    confirmBooking.disabled = false;
  }
});

newBooking.addEventListener("click", () => {
  bookingForm.reset();
  fields.time.innerHTML = '<option value="">Choose a date first</option>';
  fields.time.disabled = true;
  review.hidden = true;
  confirmation.hidden = true;
  bookingForm.hidden = false;
  syncQuickActions();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

fields.time.disabled = true;
fields.time.innerHTML = '<option value="">Choose a date first</option>';
syncQuickActions();
