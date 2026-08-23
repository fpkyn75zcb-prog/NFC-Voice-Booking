const API_URL = "https://script.google.com/macros/s/AKfycby2w2xMuOxUmh3Py08n67dNgQshw2_bkwQ6I05d5demBz6zYfFPBREXN0naIggflK0R/exec";

const params = new URLSearchParams(window.location.search);
const agent = params.get("agent") || "KINGDOM001";

const talk = document.getElementById("talk");
const status = document.getElementById("status");
const conversation = document.getElementById("conversation");
const bookingForm = document.getElementById("bookingForm");
const confirmation = document.getElementById("confirmation");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

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

function handleVoiceCommand(text) {
  const lower = text.toLowerCase();
  if (lower.includes("appointment") || lower.includes("book") || lower.includes("schedule")) {
    bookingForm.scrollIntoView({ behavior: "smooth", block: "center" });
    speak("Sure. Please enter your name, phone number, date and time, then confirm the appointment.");
    return;
  }
  speak("I can help you book an appointment. Say book an appointment to begin.");
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  talk.addEventListener("click", () => {
    status.textContent = "Listening...";
    try {
      recognition.start();
    } catch (_) {}
  });

  recognition.addEventListener("result", (event) => {
    const text = event.results[0][0].transcript;
    addMessage("You", text);
    status.textContent = "I heard you.";
    handleVoiceCommand(text);
  });

  recognition.addEventListener("error", () => {
    status.textContent = "I couldn't hear that. Tap the microphone and try again.";
  });

  recognition.addEventListener("end", () => {
    if (status.textContent === "Listening...") status.textContent = "Ready";
  });
} else {
  status.textContent = "Voice recognition is not supported in this browser. Use a supported Chrome or Safari browser.";
  talk.disabled = true;
}

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const submitButton = bookingForm.querySelector("button[type='submit']");
  const data = {
    name: document.getElementById("name").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    date: document.getElementById("date").value,
    time: document.getElementById("time").value,
    agent
  };

  if (!data.name || !data.phone || !data.date || !data.time) {
    speak("Please complete your name, phone number, date and time.");
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Booking your appointment...";

  try {
    // Google Apps Script redirects its web-app response. Using a simple text/plain
    // request avoids a browser CORS preflight. The response is intentionally opaque.
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });

    localStorage.setItem("lastBooking", JSON.stringify(data));
    status.textContent = "Appointment submitted.";
    confirmation.hidden = false;
    confirmation.textContent = `Appointment submitted for ${data.date} at ${data.time}.`;
    speak(`Your appointment request was submitted for ${data.date} at ${data.time}.`);
    bookingForm.reset();
  } catch (error) {
    console.error(error);
    status.textContent = "The booking could not be submitted.";
    speak("I could not submit the appointment. Please try again.");
  } finally {
    submitButton.disabled = false;
  }
});
