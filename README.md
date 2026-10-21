# Codmcalculator

PHILIPPINE STANDARD TIME (PST)

Add a live digital clock displaying the current Philippine time (UTC+8) somewhere near the event countdown.

Display format:

- Label: PHILIPPINE STANDARD TIME
- Current time: 05:39:00 AM
- Current date: OCTOBER 20, 2026

The displayed date and time above are examples only. Always display the actual current Philippine date and time.

Functional requirements:

- Use the "Asia/Manila" time zone to ensure the clock always displays Philippine local time, regardless of the visitor's location.
- Update the displayed time every second.
- Display both the current Philippine date and time.
- Use a clear, compact digital-clock design that complements the AMOLED-black interface.
- Add a small green live indicator beside the label to communicate that the clock is active.
- Keep the clock visible near the event countdown without distracting from the featured weapon or sigil calculator.
- Calculate the event countdown using the fixed event deadline of December 10, 2026, at 7:39 AM Philippine time.
- Do not hardcode the displayed current date or time. Generate it dynamically using the browser's date and time functions with the "Asia/Manila" time zone.

Important: The live clock and event countdown must operate independently. Updating the Philippine clock must never reset or extend the event countdown.

The purpose is to let visitors immediately verify that the website displays an actively updating Philippine clock rather than a static timestamp.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://codmcalculator.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63f226bf-9755-4e1d-b914-86035785bd6c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
