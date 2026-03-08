 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/app.js b/app.js
new file mode 100644
index 0000000000000000000000000000000000000000..84812185ff1b4d52da5929467514da81c0db9b81
--- /dev/null
+++ b/app.js
@@ -0,0 +1,163 @@
+const STORAGE_KEYS = {
+  user: 'ffhub_user',
+  tournaments: 'ffhub_tournaments',
+  enrollments: 'ffhub_enrollments',
+  settings: 'ffhub_settings'
+};
+
+const defaultQr = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=FF-Tournament-Payment';
+
+function load(key, fallback) {
+  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
+}
+
+function save(key, value) {
+  localStorage.setItem(key, JSON.stringify(value));
+}
+
+function seedData() {
+  const existing = load(STORAGE_KEYS.tournaments, []);
+  if (existing.length) return;
+
+  save(STORAGE_KEYS.tournaments, [
+    { id: crypto.randomUUID(), title: 'Weekend Knockout', date: '2026-04-12', fee: 50, prizePool: 1800, slots: 48, mode: 'Squad', map: 'Bermuda' },
+    { id: crypto.randomUUID(), title: 'Late Night Rush', date: '2026-04-18', fee: 30, prizePool: 500, slots: 24, mode: 'Duo', map: 'Purgatory' }
+  ]);
+  save(STORAGE_KEYS.enrollments, []);
+  save(STORAGE_KEYS.settings, { qrUrl: defaultQr });
+}
+
+seedData();
+
+const loginSection = document.getElementById('loginSection');
+const dashboardSection = document.getElementById('dashboardSection');
+const loginForm = document.getElementById('loginForm');
+const welcomeMsg = document.getElementById('welcomeMsg');
+const tournamentList = document.getElementById('tournamentList');
+const myEnrollments = document.getElementById('myEnrollments');
+const logoutBtn = document.getElementById('logoutBtn');
+
+const enrollDialog = document.getElementById('enrollDialog');
+const enrollForm = document.getElementById('enrollForm');
+const selectedTournament = document.getElementById('selectedTournament');
+const qrImage = document.getElementById('qrImage');
+const utrInput = document.getElementById('utrInput');
+const cancelEnroll = document.getElementById('cancelEnroll');
+
+let activeTournamentId = null;
+
+function getCurrentUser() {
+  return load(STORAGE_KEYS.user, null);
+}
+
+function setCurrentUser(user) {
+  save(STORAGE_KEYS.user, user);
+}
+
+function renderTournamentCard(t, enrollments) {
+  const booked = enrollments.filter((e) => e.tournamentId === t.id).length;
+  const remaining = Math.max(t.slots - booked, 0);
+  const prizePool = Number(t.prizePool || 0);
+
+  return `
+    <article class="t-card ff-game-card">
+      <div class="t-head">
+        <h4>${t.title}</h4>
+        <span class="ff-chip">${t.mode}</span>
+      </div>
+      <p>Date: <strong>${t.date}</strong></p>
+      <p>Map: <strong>${t.map}</strong></p>
+      <p>Entry Fee: <strong>₹${t.fee}</strong> | Prize Pool: <strong>₹${prizePool}</strong></p>
+      <p>Booked: <strong>${booked}</strong> / ${t.slots} (Remaining ${remaining})</p>
+      <button data-enroll="${t.id}" class="ff-btn-blue" ${remaining === 0 ? 'disabled' : ''}>${remaining === 0 ? 'Full' : 'Enroll'}</button>
+    </article>
+  `;
+}
+
+function render() {
+  const user = getCurrentUser();
+  const tournaments = load(STORAGE_KEYS.tournaments, []);
+  const enrollments = load(STORAGE_KEYS.enrollments, []);
+
+  if (!user) {
+    loginSection.classList.remove('hidden');
+    dashboardSection.classList.add('hidden');
+    return;
+  }
+
+  loginSection.classList.add('hidden');
+  dashboardSection.classList.remove('hidden');
+  welcomeMsg.textContent = `Welcome, ${user.playerName}`;
+
+  tournamentList.innerHTML = tournaments.map((t) => renderTournamentCard(t, enrollments)).join('');
+
+  const my = enrollments.filter((e) => e.userId === user.id);
+  myEnrollments.innerHTML = my.length ? my.map((m) => {
+    const t = tournaments.find((x) => x.id === m.tournamentId);
+    return `<div class="row"><span>${t ? t.title : 'Deleted tournament'} | UTR: ${m.utr}</span><span class="status ${m.status}">${m.status.toUpperCase()}</span></div>`;
+  }).join('') : '<p class="hint">No enrollments yet.</p>';
+
+  document.querySelectorAll('[data-enroll]').forEach((btn) => {
+    btn.addEventListener('click', () => openEnroll(btn.dataset.enroll));
+  });
+}
+
+function openEnroll(tournamentId) {
+  const tournaments = load(STORAGE_KEYS.tournaments, []);
+  const settings = load(STORAGE_KEYS.settings, { qrUrl: defaultQr });
+  const t = tournaments.find((x) => x.id === tournamentId);
+  if (!t) return;
+
+  activeTournamentId = tournamentId;
+  selectedTournament.textContent = `${t.title} — Entry Fee ₹${t.fee} — Prize Pool ₹${Number(t.prizePool || 0)}`;
+  qrImage.src = settings.qrUrl || defaultQr;
+  utrInput.value = '';
+  enrollDialog.showModal();
+}
+
+loginForm.addEventListener('submit', (e) => {
+  e.preventDefault();
+  const playerName = document.getElementById('playerName').value.trim();
+  const instagram = document.getElementById('instagramId').value.trim();
+  const telegram = document.getElementById('telegramId').value.trim();
+
+  if (!instagram && !telegram) {
+    alert('Please provide Instagram ID or Telegram ID so admin can contact you.');
+    return;
+  }
+
+  const user = { id: crypto.randomUUID(), playerName, instagram, telegram };
+  const users = load('ffhub_users', []);
+  users.push(user);
+  save('ffhub_users', users);
+  setCurrentUser(user);
+  render();
+});
+
+enrollForm.addEventListener('submit', (e) => {
+  e.preventDefault();
+  const user = getCurrentUser();
+  const utr = utrInput.value.trim();
+  if (!user || !activeTournamentId || !utr) return;
+
+  const enrollments = load(STORAGE_KEYS.enrollments, []);
+  enrollments.push({
+    id: crypto.randomUUID(),
+    userId: user.id,
+    tournamentId: activeTournamentId,
+    utr,
+    status: 'pending'
+  });
+
+  save(STORAGE_KEYS.enrollments, enrollments);
+  enrollDialog.close();
+  render();
+});
+
+cancelEnroll.addEventListener('click', () => enrollDialog.close());
+logoutBtn.addEventListener('click', () => {
+  localStorage.removeItem(STORAGE_KEYS.user);
+  render();
+});
+
+render();
 
EOF
)
