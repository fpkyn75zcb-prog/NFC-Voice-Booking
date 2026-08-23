const API_URL = "https://script.google.com/macros/s/AKfycby2w2xMuOxUmh3Py08n67dNgQshw2_bkwQ6I05d5demBz6zYfFPBREXN0naIggflK0R/exec";

const params = new URLSearchParams(window.location.search);
const agent = params.get("agent") || "KINGDOM001";

const talk = document.getElementById("talk");
const status = document.getElementById("status");
const conversation = document.getElementById("conversation");
const booking = document.getElementById("booking");
const bookButton = document.getElementById("book");

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
    booking.style.display = "block";
    speak("Sure. Please enter your name, phone number, date and time, then press Book Appointment.");
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
    status.textContent = "I couldn't hear that. Tap Talk and try again.";
  });

  recognition.addEventListener("end", () => {
    if (status.textContent === "Listening...") status.textContent = "Ready.";
  });
} else {
  status.textContent = "Voice recognition is not supported in this browser. Use Safari or Chrome on a supported device.";
  talk.disabled = true;
}

bookButton.addEventListener("click", async () => {
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

  bookButton.disabled = true;
  status.textContent = "Booking your appointment...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) throw new Error("Booking was not accepted.");

    status.textContent = "Appointment confirmed.";
    speak(`Your appointment is booked for ${data.date} at ${data.time}.`);
    localStorage.setItem("lastBooking", JSON.stringify(data));
  } catch (error) {
    console.error(error);
    status.textContent = "The booking could not be completed.";
    speak("I could not complete the booking. Please check the connection and try again.");
  } finally {
    bookButton.disabled = false;
  }
});

if (booking) booking.style.display = "block";
