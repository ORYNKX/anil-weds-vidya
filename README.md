# Anil & Vidya — Digital Wedding Invitation

A single-page, mobile-first wedding invitation for **Anil & Vidya**, celebrating on
**Wednesday, 25 November 2026 at 10:30 AM IST** at **Grand Hotel, Kovalam, Kerala**.

Built as a dependency-free static site: no framework, no build step, no external
image or font requests. Everything the page needs ships in this folder.

## Highlights

- **Luxury coastal design** — ivory, eucalyptus green and gold, with Cormorant
  Garamond and Montserrat self-hosted for instant, private font loading.
- **Animated entry gate** that satisfies browser autoplay rules. Guests choose
  “Tap to Enter & Play Music” or “Continue without music”.
- **Original ambient soundtrack** (2:46, generated locally) with a floating
  play/pause control and gentle fade-in.
- **Live countdown** to the muhurtham, recalculated every second.
- **Scroll-driven story**, four-part itinerary, venue guide and editorial gallery.
- **Add to Calendar** — Google Calendar link plus a downloadable `.ics` file with
  a one-day reminder.
- **RSVP form** with inline validation, guest count, attendance choice, a personal
  message, and instant confirmation. Responses persist in `localStorage` and can
  optionally post to a real endpoint.
- **Accessible by design** — skip link, visible focus, keyboard-operable menu and
  dialog, inert background behind the entry gate, reduced-motion support and no
  axe-detectable violations.
- **No console errors, broken images or third-party tracking.** Google Maps is the
  only embedded external resource.

## Run locally

The site is plain HTML, CSS and JavaScript. Open `index.html` directly, or serve
the folder (recommended, so fonts, audio and relative paths behave exactly as in
production):

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then visit <http://127.0.0.1:4173/>.

Any static server works: `npx serve .`, `php -S localhost:4173`, VS Code Live
Server, etc. There is nothing to install or compile.

## Project structure

```text
.
├── index.html                 # All page content, metadata and inline SVG icons
├── styles.css                 # Theme, layout, responsive rules and animations
├── app.js                     # Entry gate, music, countdown, calendar, RSVP, menus
├── favicon.svg                # Monogram favicon
├── assets/
│   ├── audio/ambient.mp3      # Original royalty-free soundtrack
│   ├── fonts/                 # Self-hosted WOFF2 files + fonts.css + download.py
│   └── img/                   # AI artwork, responsive WebP variants, og.jpg
└── scripts/
    ├── generate_images.py     # Regenerate the seven source illustrations
    ├── build_images.py        # Export WebP variants and the social preview
    └── generate_audio.py      # Synthesise the ambient track (NumPy)
```

## Make it yours

### Names, story and visible copy

All wording lives in `index.html`: the entry screen, hero, invitation note, story,
itinerary, venue details, RSVP deadline and footer. Search for the old date
(`25 November 2026`) and names to catch every instance.

Theme colours and type scales are CSS custom properties at the top of
`styles.css`:

```css
:root {
  --ivory: #faf6ee;
  --green-deep: #22372e;
  --gold: #b9945a;
  /* ... */
}
```

### Date, time and calendar links

Calendar data is centralised in the `WEDDING` object near the top of `app.js`:

```js
const WEDDING = {
  date: new Date('2026-11-25T10:30:00+05:30'),
  icsStart: '20261125T050000Z', // 10:30 IST in UTC
  icsEnd: '20261125T090000Z',   // 13:30 IST in UTC
  googleDates: '20261125T050000Z%2F20261125T090000Z',
  title: "Anil & Vidya's Wedding",
  location: 'Grand Hotel, Kovalam, Kerala, India',
};
```

If you change the date, update all five values, plus:

- the countdown label and date text in `index.html`;
- the calendar dialog’s “Wednesday, 25 November 2026 · 10:30 AM – 1:30 PM IST”;
- the `.ics` `DESCRIPTION` inside `buildIcs()` if the schedule wording changes;
- the RSVP reply-by date (currently **10 November 2026**).

`icsStart`/`icsEnd` are UTC (`Z`) timestamps. For a 10:30 AM IST start, subtract
5 hours 30 minutes from local time (05:00 UTC).

### Venue and directions

The venue name and address appear in the hero, venue section, RSVP card and
footer in `index.html`. Update the map embed and directions link there too:

```html
<iframe src="https://www.google.com/maps?q=Grand+Hotel+Kovalam+Kerala+India&z=14&output=embed"></iframe>
<a href="https://www.google.com/maps/dir/?api=1&destination=Grand+Hotel+Kovalam+Kerala+India">Get directions</a>
```

Google Maps needs a network connection; every other asset is local.

### Music

Replace `assets/audio/ambient.mp3` with any track you have the rights to use.
Keep the filename or update the `<audio src>` in `index.html`. The floating
button and entry gate work automatically. Adjust the fade-in target volume
(`0.42`) in `startMusic()` inside `app.js` if needed.

To reuse the generated soundtrack, regenerate it with Python 3 + NumPy and
encode the WAV to MP3:

```bash
python scripts/generate_audio.py
ffmpeg -i assets/audio/ambient.wav -codec:a libmp3lame -b:a 128k assets/audio/ambient.mp3
```

Remove `ambient.wav` afterwards; only the MP3 is shipped and referenced.

### Artwork

The seven illustrations are AI-generated with
[Pollinations](https://pollinations.ai/) and stored locally, so there are no
hotlink failures, rate limits or licensing surprises at view time.

```bash
python -m pip install Pillow
python scripts/generate_images.py   # 7 images, rate-limited ~45s apart
python scripts/build_images.py      # WebP srcsets + og.jpg
```

`generate_images.py` writes `assets/img/<name>.jpg`; `build_images.py` exports the
responsive WebP files referenced by the `<picture>` elements and creates the
1200×630 social preview. If you swap in your own photos, keep the same filenames
and aspect ratios or update the `srcset` entries in `index.html`.

### Fonts

The site uses local copies of Cormorant Garamond and Montserrat. To refresh
them:

```bash
python assets/fonts/download.py
```

This rewrites the WOFF2 files and `fonts.css` next to the script. No request to
Google Fonts is made at runtime.

## RSVP delivery

Out of the box, the form:

1. validates name, party size and attendance;
2. saves the response under the `anil-vidya-rsvp-v1` key in `localStorage`;
3. shows a personalised confirmation and lets the guest edit their reply.

**A response is not sent to the couple unless a backend is configured.** This
static build has no server of its own.

To collect responses, set `RSVP_ENDPOINT` near the top of `app.js` to a form
service or API that accepts JSON:

```js
const RSVP_ENDPOINT = 'https://formspree.io/f/your-form-id';
```

The form posts:

```json
{
  "name": "Meera Nair",
  "guests": "2",
  "attending": "yes",
  "message": "Wishing you a lifetime of joy!",
  "submittedAt": "2026-10-23T08:00:00.000Z"
}
```

The endpoint must allow cross-origin requests (CORS) from your site. Formspree,
Basin, Getform, Netlify Forms (via a function) and a small serverless handler all
work. Leave the constant empty to keep the invitation entirely local. Because the
endpoint is public client-side configuration, never put secrets or API keys there.

## Deploy

Upload the folder as-is to any static host: Netlify, Vercel, Cloudflare Pages,
GitHub Pages, S3, or ordinary web hosting. HTTPS is recommended.

Before sharing:

- Replace the relative `og:image` with an **absolute** URL, for example
  `https://your-domain.com/assets/img/og.jpg`. Social platforms do not reliably
  resolve relative Open Graph images.
- Do the same for `twitter:image`.
- Confirm the final URL in `og:url` if you add one.
- Test the shared link in a private window to see the preview card.
- Submit an RSVP and verify delivery if `RSVP_ENDPOINT` is configured.
- If the invitation lives at a subpath (e.g. `/wedding/`), keep the folder
  structure intact; all asset paths are relative and will continue to work.

## Accessibility and performance notes

- Motion respects `prefers-reduced-motion`; reveals and transitions are disabled
  or shortened automatically.
- The entry overlay traps focus behind `inert`, supports Escape (enters silently)
  and returns focus to the hero heading.
- Images use responsive `srcset`/`sizes`, explicit dimensions where useful, and
  lazy loading below the fold. The hero is preloaded with high fetch priority.
- Contrast, touch targets, landmarks, labels and the native `<dialog>` were
  audited with axe on desktop and mobile with zero violations.
- The page remains readable without JavaScript; the entry gate and floating music
  control are hidden via the `no-js` class. Interactive extras (countdown, menu,
  calendar, RSVP) require JavaScript.

## Credits

- Design, code and copy: made for Anil & Vidya.
- Photography/artwork: AI-generated placeholders generated for this invitation.
- Music: original instrumental synthesised for this project — no external samples.
- Typefaces: Cormorant Garamond and Montserrat (SIL Open Font License), served
  locally.
- Map: Google Maps embed, subject to Google’s terms.
