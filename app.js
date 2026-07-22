// Fill in text from config.js
document.getElementById('eyebrow-text').textContent = `Turning ${PARTY.age}`;
document.getElementById('headline-text').textContent = PARTY.headline;
document.getElementById('tagline-text').textContent = PARTY.tagline;
document.getElementById('detail-date').textContent = PARTY.date;
document.getElementById('detail-time').textContent = PARTY.time;
document.getElementById('detail-location').textContent = PARTY.location;
document.getElementById('detail-location-note').textContent = PARTY.locationNote || '';
document.getElementById('rsvp-deadline-note').textContent = `Please respond by ${PARTY.rsvpDeadline}.`;
document.getElementById('rsvp-extra-note').textContent = PARTY.notes || '';
document.getElementById('footer-name').textContent = PARTY.childName;
document.title = `${PARTY.childName}'s Birthday`;

// Google Drive photo gallery — fetches the file list once, then renders a random subset.
// Uses drive.google.com/thumbnail links directly as <img src>, so there's no click-through
// and no framing restriction (unlike embedding a Google Photos page).
(function setupGallery() {
  const grid = document.getElementById('gallery-grid');
  const status = document.getElementById('gallery-status');
  const shuffleBtn = document.getElementById('shuffle-btn');
  let allFileIds = [];

  function renderRandom() {
    const shuffled = [...allFileIds].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, PARTY.photoCount || 6);
    grid.innerHTML = picked.map(id =>
      `<img src="https://drive.google.com/thumbnail?id=${id}&sz=w600" alt="Party photo" loading="lazy">`
    ).join('');
  }

  if (!PARTY.driveApiKey || !PARTY.driveFolderId ||
      PARTY.driveApiKey.includes('REPLACE_ME') || PARTY.driveFolderId.includes('REPLACE_ME')) {
    status.textContent = 'Add your Google Drive API key and folder ID in config.js to show photos here.';
    return;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q='${PARTY.driveFolderId}'+in+parents+and+mimeType+contains+'image/'&key=${PARTY.driveApiKey}&fields=files(id,name)&pageSize=1000`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Drive API request failed (' + res.status + ')');
      return res.json();
    })
    .then(data => {
      allFileIds = (data.files || []).map(f => f.id);
      if (allFileIds.length === 0) {
        status.textContent = 'No photos found in the Drive folder yet.';
        return;
      }
      renderRandom();
      if (allFileIds.length > (PARTY.photoCount || 6)) {
        shuffleBtn.style.display = 'inline-block';
        shuffleBtn.addEventListener('click', renderRandom);
      }
    })
    .catch(err => {
      status.textContent = "Couldn't load photos — check the API key, folder ID, and that the folder is shared as \"Anyone with the link.\"";
      console.error(err);
    });
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
