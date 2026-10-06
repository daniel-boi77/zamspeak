# ZamSpeak™

**ZamSpeak** is an online-first AI language assistant for Zambia, designed for tourists, visitors, and people who are not confident in English. It supports English, Bemba/Chibemba, Nyanja/Chichewa, Tonga/Chitonga, and Lozi/Silozi.

Developed by **Daniel Kalima** · Instagram: **[@dan_iel_777](https://instagram.com/dan_iel_777)**

## Included in this starter build

- Online AI chat through a server-side OpenAI-compatible proxy
- Language switcher inside the three-line menu
- English remains available
- Light and dark modes
- Browser-saved conversations using local storage
- Voice input where the browser supports Web Speech Recognition
- Hear responses aloud with browser speech synthesis
- Suggested tourist prompts
- Legal pages: App Use Agreement, Privacy Policy, and About
- Clear developer attribution and ZamSpeak™ product branding
- Responsive mobile layout

## Run locally

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Add your Google AI Studio key to `.env`:

```bash
GEMINI_API_KEY=your_google_ai_studio_key_here
```

4. Start the app:

```bash
npm start
```

5. Open `http://localhost:8787`.

The key stays on the server and is never placed in browser JavaScript. Do not put `.env` into GitHub.

## GitHub and hosting

GitHub can store the source code, but GitHub Pages is static-only and cannot safely hold an AI API key. For a real online deployment, host this Node server on a service that supports environment variables, or place the `/api/translate` route in a serverless function. Keep the frontend and backend behind HTTPS and add rate limiting before public launch.

## Important legal note

The included legal pages are starter templates, not legal advice or a guarantee against lawsuits. Before collecting real user conversations or launching commercially, have a qualified Zambian lawyer review the agreement, privacy policy, AI disclosure, content moderation, liability, child-safety, and data-retention wording.

## Recommended next features

1. **Verified phrase packs** reviewed by fluent speakers of each language.
2. **Pronunciation recordings** from consenting native speakers rather than relying only on browser text-to-speech.
3. **Tourist mode** with quick cards for greetings, taxis, markets, hotels, restaurants, directions, and emergencies.
4. **Conversation mode** that shows the original sentence, translation, pronunciation, and a slower audio button.
5. **Community corrections** with moderation and attribution for language contributors.
6. **Privacy controls**: export, delete-all, conversation expiry, and a clear “do not save” mode.
7. **Safety mode** that refuses dangerous certainty and points users to trusted local or emergency services.
8. **Abuse and spam protection**: rate limits, report button, and server-side logging that avoids storing message content by default.
9. **Language confidence labels** so users know when a translation is AI-generated or community-verified.
10. **Analytics without message content** to learn which phrase categories help users most.

## Files

- `server.mjs` — static server and protected AI proxy
- `public/index.html` — app shell and legal dialog
- `public/app.css` — responsive light/dark visual design
- `public/app.js` — chat, persistence, voice, themes, language menu
- `.env.example` — safe configuration template


## Python 3 preview

For a visual-only static preview, run `python3 -m http.server 8088 -d public`. This serves the UI, phrasebook, saved local data, theme, and service-worker shell, but it cannot execute `/api/translate`. If you see `Unexpected token '<'`, Python returned HTML for the API route. Run `npm start` instead for online AI translation.

## Logo

`public/assets/zamspeak-logo.svg` is the ZamSpeak mark used by the app, favicon, and install manifest.
