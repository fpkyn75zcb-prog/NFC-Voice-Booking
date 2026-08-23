# NFC Voice Booking

Fast static MVP for an NFC appointment-booking card.

## Flow

NFC card → phone → GitHub Pages → voice prompt → booking form → confirmation.

## Current version

- Static GitHub Pages-ready site
- Mobile layout
- Browser voice input using Web Speech API when supported
- Browser text-to-speech response
- Appointment form
- Demo mode stores bookings in browser localStorage
- `AGENT_ID` supports different NFC cards/agents
- Optional Google Apps Script backend via `API_URL` in `app.js`

## Publish

GitHub → Settings → Pages → Deploy from branch → `main` → `/ (root)`.

## NFC card

Write the published GitHub Pages URL to the NFC card as an NDEF URL.

Example:

`https://fpkyn75zcb-prog.github.io/NFC-Voice-Booking/`

## Backend next

Create a Google Apps Script web app that accepts the JSON booking object and writes it to Google Sheets. Put its `/exec` URL into `API_URL` in `app.js`.
