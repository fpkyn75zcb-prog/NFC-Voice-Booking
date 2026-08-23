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
    try { recognition.start(); } catch (_) {}
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
} else {
  status.textContent = "Voice recognition is not supported in this browser. Use supported Chrome or Safari.";
  talk.disabled = true;
}

function submitToAppsScript(data) {
  // A normal HTML form POST avoids browser CORS/fetch restrictions and works
  // with Google Apps Script web-app redirects.
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

  setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 10000);
}

bookingForm.addEventListener("submit", (event) => {
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
  status.textContent = "Submitting appointment...";

  try {
    submitToAppsScript(data);
    localStorage.setItem("lastBooking", JSON.stringify(data));
    confirmation.hidden = false;
    confirmation.innerHTML = `<strong>Appointment submitted</strong>${data.date} at ${data.time}`;
    status.textContent = "Appointment submitted.";
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
