// Fill in text from config.js
document.getElementById('eyebrow-text').textContent = `Turning ${PARTY.age}`;

// Multicolor per-letter headline, with the O in the child's name shown as a tire (like the invitation)
(function renderHeadline() {
  const el = document.getElementById('headline-text');
  const text = PARTY.headline;

  const nameIdx = text.toLowerCase().indexOf(PARTY.childName.toLowerCase());
  let tireIndex = -1;
  if (nameIdx !== -1) {
    const oInName = text.slice(nameIdx, nameIdx + PARTY.childName.length).toLowerCase().indexOf('o');
    if (oInName !== -1) tireIndex = nameIdx + oInName;
  }

  const tireSVG = `<svg class="letter-tire" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="18" fill="var(--ink)"/>
    <circle cx="20" cy="20" r="10" fill="#C9CED6"/>
    <circle cx="20" cy="20" r="3" fill="var(--ink)"/>
    <g fill="var(--ink)">
      <circle cx="20" cy="13" r="1.6"/><circle cx="26" cy="17" r="1.6"/>
      <circle cx="24" cy="24" r="1.6"/><circle cx="16" cy="24" r="1.6"/>
      <circle cx="14" cy="17" r="1.6"/>
    </g>
  </svg>`;

  el.innerHTML = '';
  let colorIndex = 0;
  for (let i = 0; i < text.length; i++) {
    if (i === tireIndex) {
      el.insertAdjacentHTML('beforeend', tireSVG);
      continue;
    }
    const span = document.createElement('span');
    span.textContent = text[i];
    if (text[i].trim() !== '') {
      span.className = 'letter c' + (colorIndex % 5);
      colorIndex++;
    }
    el.appendChild(span);
  }
})();

document.getElementById('tagline-text').textContent = PARTY.tagline;
document.getElementById('detail-date').textContent = PARTY.date;
document.getElementById('detail-time').textContent = PARTY.time;
document.getElementById('detail-location').textContent = PARTY.location;
document.getElementById('detail-location').href = PARTY.locationGoogleMaps || '#';
document.getElementById('rsvp-deadline-note').textContent = `Please respond by ${PARTY.rsvpDeadline}.`;
document.getElementById('rsvp-extra-note').textContent = PARTY.notes || '';
document.getElementById('footer-name').textContent = PARTY.childName;
document.title = `${PARTY.childName}'s Birthday`;

// Two small crossfading photo frames (left and right) — each shows one clear photo
// at a time from your Drive folder, fading to a new random one every few seconds.
(function setupPhotoFrames() {
  const framePairs = [
    { a: document.getElementById('frame-img-a'), b: document.getElementById('frame-img-b') },
    { a: document.getElementById('frame-img-c'), b: document.getElementById('frame-img-d') }
  ].filter(p => p.a && p.b);

  if (framePairs.length === 0) return;

  if (!PARTY.driveApiKey || !PARTY.driveFolderId ||
      PARTY.driveApiKey.includes('REPLACE_ME') || PARTY.driveFolderId.includes('REPLACE_ME')) {
    return; // no photos configured yet
  }

  const url = `https://www.googleapis.com/drive/v3/files?q='${PARTY.driveFolderId}'+in+parents+and+mimeType+contains+'image/'&key=${PARTY.driveApiKey}&fields=files(id,name)&pageSize=1000`;
  const toSrc = id => `https://drive.google.com/thumbnail?id=${id}&sz=w400`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Drive API request failed (' + res.status + ')');
      return res.json();
    })
    .then(data => {
      const ids = (data.files || []).map(f => f.id);
      if (ids.length === 0) return;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      framePairs.forEach((pair, frameIndex) => {
        let pool = [...ids].sort(() => Math.random() - 0.5);
        let poolIndex = 0;
        function nextId() {
          if (poolIndex >= pool.length) {
            pool = [...ids].sort(() => Math.random() - 0.5);
            poolIndex = 0;
          }
          return pool[poolIndex++];
        }

        let showingA = true;
        pair.a.src = toSrc(nextId());
        pair.a.classList.add('active');

        if (ids.length <= 1 || reducedMotion) return;

        // Stagger the two frames so they don't crossfade at the exact same moment.
        setTimeout(() => {
          setInterval(() => {
            const incoming = showingA ? pair.b : pair.a;
            const outgoing = showingA ? pair.a : pair.b;
            incoming.src = toSrc(nextId());
            incoming.classList.add('active');
            outgoing.classList.remove('active');
            showingA = !showingA;
          }, 5000);
        }, frameIndex * 2500);
      });
    })
    .catch(err => console.error('Photo frames failed to load:', err));
})();

// Footprint dividers fade in as you scroll past them
const footprints = document.querySelectorAll('.footprints');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.4 });
footprints.forEach(el => observer.observe(el));

// RSVP form submission -> Google Apps Script -> Google Sheet
document.getElementById('rsvp-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('submit-btn');
  const form = e.target;

  // Honeypot: real visitors never see or fill this field. If it's filled, it's a bot —
  // pretend success without actually sending anything.
  if (form.website && form.website.value.trim() !== '') {
    statusEl.textContent = `Thanks! Your RSVP is in.`;
    statusEl.className = 'form-status success';
    form.reset();
    return;
  }

  if (!PARTY.rsvpEndpointUrl || PARTY.rsvpEndpointUrl.includes('REPLACE_ME')) {
    statusEl.textContent = 'RSVP endpoint not configured yet — see README step 2.';
    statusEl.className = 'form-status error';
    return;
  }

  const data = {
    name: form.name.value,
    attending: form.attending.value,
    guests: form.guests.value,
    message: form.message.value,
    submittedAt: new Date().toISOString()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const res = await fetch(PARTY.rsvpEndpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight with Apps Script
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Request failed');
    statusEl.textContent = `Thanks, ${data.name}! Your RSVP is in.`;
    statusEl.className = 'form-status success';
    form.reset();
  } catch (err) {
    statusEl.textContent = "Something went wrong sending your RSVP — please try again or reach out directly.";
    statusEl.className = 'form-status error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send RSVP';
  }
});
