const API_URL = ""; // Add your Google Apps Script web-app URL here when ready.
const AGENT_ID = "KINGDOM001";

const talk = document.getElementById("talk");
const status = document.getElementById("status");
const conversation = document.getElementById("conversation");
const form = document.getElementById("bookingForm");
const confirmation = document.getElementById("confirmation");
const dateInput = document.getElementById("date");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

const today = new Date();
dateInput.min = today.toISOString().slice(0, 10);

function addMessage(who, text) {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${who}:</strong> ${text}`;
  conversation.appendChild(p);
}

function speak(text) {
  addMessage("Agent", text);
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

function showBookingForm() {
  form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleVoiceCommand(text) {
  const lower = text.toLowerCase();
  addMessage("You", text);

  if (/book|appointment|schedule|reserve/.test(lower)) {
    speak("Sure. Enter your name, phone number, date and time, then confirm the appointment.");
    showBookingForm();
  } else {
    speak("I can help you book an appointment. Say book an appointment to begin.");
  }
}

if (recognition) {
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  talk.addEventListener("click", () => {
    status.textContent = "Listening...";
    try { recognition.start(); } catch (_) {}
  });

  recognition.onresult = (event) => {
    status.textContent = "Ready";
    handleVoiceCommand(event.results[0][0].transcript);
  };

  recognition.onerror = () => {
    status.textContent = "Voice input failed. Try again or use the form.";
  };

  recognition.onend = () => {
    if (status.textContent === "Listening...") status.textContent = "Ready";
  };
} else {
  talk.disabled = true;
  status.textContent = "Voice recognition is not supported here. Use the form below.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const booking = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    date: dateInput.value,
    time: document.getElementById("time").value,
    agent: AGENT_ID,
    createdAt: new Date().toISOString()
  };

  if (!booking.name || !booking.phone || !booking.date || !booking.time) return;

  if (API_URL) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(booking)
      });
      if (!response.ok) throw new Error("Booking request failed");
    } catch (error) {
      status.textContent = "The booking server is unavailable.";
      return;
    }
  } else {
    // Demo mode: keep the booking on this device until a backend is connected.
    const bookings = JSON.parse(localStorage.getItem("nfcBookings") || "[]");
    bookings.push(booking);
    localStorage.setItem("nfcBookings", JSON.stringify(bookings));
  }

  confirmation.hidden = false;
  confirmation.innerHTML = `<strong>Appointment requested</strong>${booking.name}, ${booking.date} at ${booking.time}.`;
  speak(`Your appointment request is recorded for ${booking.date} at ${booking.time}.`);
  form.reset();
  dateInput.min = new Date().toISOString().slice(0, 10);
});
