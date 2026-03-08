const ADMIN_CREDENTIALS = {
  username: 'Pathak bhai',
  password: 'pandit ji'
};

const STORAGE_KEYS = {
  tournaments: 'ffhub_tournaments',
  enrollments: 'ffhub_enrollments',
  users: 'ffhub_users',
  settings: 'ffhub_settings'
};

function load(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const tournamentForm = document.getElementById('tournamentForm');
const adminTournamentList = document.getElementById('adminTournamentList');
const paymentList = document.getElementById('paymentList');
const userList = document.getElementById('userList');
const settingsForm = document.getElementById('settingsForm');
const qrUrl = document.getElementById('qrUrl');

function setAdminAuth(state) {
  sessionStorage.setItem('ffhub_admin', state ? '1' : '0');
}

function isAdminAuth() {
  return sessionStorage.getItem('ffhub_admin') === '1';
}

function profitClass(amount) {
  return amount >= 0 ? 'profit-plus' : 'profit-minus';
}

function render() {
  if (!isAdminAuth()) {
    adminLogin.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    return;
  }

  adminLogin.classList.add('hidden');
  adminDashboard.classList.remove('hidden');

  const tournaments = load(STORAGE_KEYS.tournaments, []);
  const enrollments = load(STORAGE_KEYS.enrollments, []);
  const users = load(STORAGE_KEYS.users, []);
  const settings = load(STORAGE_KEYS.settings, { qrUrl: '' });
  qrUrl.value = settings.qrUrl || '';

  adminTournamentList.innerHTML = tournaments.length ? tournaments.map((t) => {
    const booked = enrollments.filter((e) => e.tournamentId === t.id).length;
    const prizePool = Number(t.prizePool || 0);
    const totalCollection = booked * Number(t.fee || 0);
    const hostProfit = totalCollection - prizePool;

    return `
      <div class="row admin-finance-row">
        <span>
          ${t.title} | ${t.date} | ₹${t.fee} | Prize ₹${prizePool} | ${t.mode} | ${t.map} | ${booked}/${t.slots}<br>
          Collection: ₹${totalCollection} | <span class="${profitClass(hostProfit)}">Profit/Loss: ₹${hostProfit}</span>
        </span>
        <button data-delete-t="${t.id}" class="danger">Delete</button>
      </div>
    `;
  }).join('') : '<p class="hint">No tournaments created.</p>';

  userList.innerHTML = users.length ? users.map((u) => `<div class="row"><span>${u.playerName} | IG: ${u.instagram || '-'} | TG: ${u.telegram || '-'}</span><button data-delete-u="${u.id}" class="danger">Remove User</button></div>`).join('') : '<p class="hint">No users yet.</p>';

  paymentList.innerHTML = enrollments.length ? enrollments.map((p) => {
    const user = users.find((u) => u.id === p.userId);
    const t = tournaments.find((tt) => tt.id === p.tournamentId);
    return `
      <div class="row">
        <span>${user ? user.playerName : 'Unknown'} | ${t ? t.title : 'Deleted'} | UTR: ${p.utr} | <span class="status ${p.status}">${p.status}</span></span>
        <span>
          <button data-approve="${p.id}" class="ff-btn">Accept</button>
          <button data-reject="${p.id}" class="danger">Reject</button>
        </span>
      </div>
    `;
  }).join('') : '<p class="hint">No payment requests yet.</p>';

  document.querySelectorAll('[data-delete-t]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deleteT;
      save(STORAGE_KEYS.tournaments, tournaments.filter((t) => t.id !== id));
      render();
    });
  });

  document.querySelectorAll('[data-delete-u]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deleteU;
      save(STORAGE_KEYS.users, users.filter((u) => u.id !== id));
      render();
    });
  });

  document.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.approve, 'accepted'));
  });

  document.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.reject, 'rejected'));
  });
}

function updateStatus(id, status) {
  const enrollments = load(STORAGE_KEYS.enrollments, []);
  const updated = enrollments.map((e) => e.id === id ? { ...e, status } : e);
  save(STORAGE_KEYS.enrollments, updated);
  render();
}

adminLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const enteredUsername = document.getElementById('adminUsername').value.trim();
  const enteredPassword = document.getElementById('adminPassword').value;

  if (enteredUsername !== ADMIN_CREDENTIALS.username || enteredPassword !== ADMIN_CREDENTIALS.password) {
    alert('Wrong username or password');
    return;
  }

  setAdminAuth(true);
  render();
});

adminLogoutBtn.addEventListener('click', () => {
  setAdminAuth(false);
  render();
});

tournamentForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const tournaments = load(STORAGE_KEYS.tournaments, []);
  tournaments.push({
    id: crypto.randomUUID(),
    title: document.getElementById('title').value.trim(),
    date: document.getElementById('date').value,
    fee: Number(document.getElementById('fee').value),
    prizePool: Number(document.getElementById('prizePool').value),
    slots: Number(document.getElementById('slots').value),
    mode: document.getElementById('mode').value.trim(),
    map: document.getElementById('map').value.trim()
  });
  save(STORAGE_KEYS.tournaments, tournaments);
  tournamentForm.reset();
  render();
});

settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  save(STORAGE_KEYS.settings, { qrUrl: qrUrl.value.trim() });
  alert('QR updated for all tournaments.');
});

render();
