# Jake's Birthday Site

A reusable party website: hero banner, party details, a photo gallery, and an
RSVP form that writes straight into a Google Sheet.

Every year, you only need to touch **`config.js`** and create a new **Google
Photos shared album**. Everything else stays as-is.

---

## One-time setup (do this once)

### Step 1 — Create the Google Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
2. Name it something like "Birthday RSVPs".
3. Keep this tab open — you'll attach a script to it next.

### Step 2 — Connect the RSVP form to the Sheet (Apps Script)
1. In your new Sheet, click **Extensions → Apps Script**.
2. Delete any starter code in the editor, and paste in the contents of
   `apps-script.gs` (included in this folder).
3. Click **Deploy → New deployment**.
4. Click the gear icon next to "Select type" and choose **Web app**.
5. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
6. Click **Deploy**. Google will ask you to authorize it — approve it (it's
   your own script, so this is safe).
7. Copy the **Web app URL** it gives you (ends in `/exec`).
8. Paste that URL into `config.js` as `rsvpEndpointUrl`.

Every RSVP submitted on the site will now appear as a new row in this Sheet,
with a name, attending yes/no, guest count, and any notes.

> If you ever need to redeploy after editing the script, use **Deploy → Manage
> deployments → Edit → New version**, otherwise the URL won't reflect your changes.

### Step 3 — Set up hosting
The simplest free option is **GitHub Pages**:
1. Create a free GitHub account if you don't have one, and a new repository
   (e.g. `birthday-site`).
2. Upload all the files in this folder (`index.html`, `style.css`, `app.js`,
   `config.js`) to the repository.
3. Go to the repo's **Settings → Pages**, set the source to your main branch,
   and save.
4. GitHub will give you a live URL like `yourname.github.io/birthday-site`.

(Netlify works the same way if you'd rather drag-and-drop the folder instead
of using GitHub — netlify.com/drop is the fastest path there.)

### Step 4 — Optional: buy a domain
If you want a permanent link you reuse every year (e.g.
`ourfamilyparties.com`) instead of the free GitHub/Netlify URL:
1. Buy the domain from a low-markup registrar (Namecheap or Cloudflare
   Registrar are good, ~$10–15/year).
2. Point it at your GitHub Pages or Netlify site by following their "custom
   domain" instructions (both have a simple settings page for this — search
   "custom domain" in their docs once you're there).

---

## Every year (the only recurring steps)

### 1. Make a new Google Photos shared album
1. Open the Photos app on your Mac, select this year's photos, and create a
   **Shared Album**.
2. Share it, and copy the album's public link (from the "Link" option, not
   just inviting people by email — you need the shareable web link).
3. Note: iCloud shared album links usually work directly. If you'd rather
   use Google Photos instead, upload the photos there, create a shared
   album, and use **Options → Create link**.
4. Paste that link into `config.js` as `photosAlbumUrl`.

### 2. Update `config.js`
Change the name, age, date, time, location, RSVP deadline, and notes for
this year's party. That's the whole file — everything else on the page
reads from it automatically.

### 3. Re-upload
Push the updated `config.js` to your GitHub repo (or drag the folder into
Netlify again). The live site updates within a minute or two.

### 4. Clear last year's RSVPs (optional)
If you want a fresh Sheet each year, either clear the rows or make a copy of
the Sheet and repeat Step 2 of the one-time setup with the new copy.

---

## Files in this project

| File | What it's for |
|---|---|
| `index.html` | Page structure |
| `style.css` | Dinosaur theme (colors, fonts, layout) |
| `app.js` | Fills in your config data, animates the page, sends RSVPs |
| `config.js` | **The only file you edit each year** |
| `apps-script.gs` | Code to paste into Google Apps Script (Step 2 above) |

## Changing next year's theme

If you want a different theme next year (space, superheroes, etc.), the
easiest path is to come back and ask for a re-skin — the structure
(`index.html`) stays the same, only the colors, fonts, and hero illustration
in `style.css` need to change.
