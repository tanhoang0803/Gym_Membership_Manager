/* ─────────────────────────────────────────────────────────────────────────────
   Gym Membership Manager — Frontend Logic
   Talks to the Express/SQLite backend at /api/members
   ───────────────────────────────────────────────────────────────────────────── */

const API = '/api/members';

// ── State ─────────────────────────────────────────────────────────────────────
let sortCol   = 'id';
let sortOrder = 'asc';
let deleteTargetId = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const tableBody     = document.getElementById('tableBody');
const searchInput   = document.getElementById('searchInput');
const filterStatus  = document.getElementById('filterStatus');
const emptyMsg      = document.getElementById('emptyMsg');
const memberModal   = document.getElementById('memberModal');
const deleteModal   = document.getElementById('deleteModal');
const memberForm    = document.getElementById('memberForm');
const modalTitle    = document.getElementById('modalTitle');
const fName         = document.getElementById('fName');
const fLocation     = document.getElementById('fLocation');
const fDate         = document.getElementById('fDate');
const fStatus       = document.getElementById('fStatus');
const fAmount       = document.getElementById('fAmount');
const fAvatar       = document.getElementById('fAvatar');
const memberId      = document.getElementById('memberId');
const errName       = document.getElementById('err-name');
const deleteName    = document.getElementById('deleteName');

// ── Utility ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatAmount(n) {
  return '$' + parseFloat(n || 0).toFixed(2);
}

function statusClass(s) {
  return ({ Delivered: 'delivered', Cancelled: 'cancelled', Pending: 'pending', Shipped: 'shipped' })[s] || '';
}

function showToast(message, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  document.getElementById('toastContainer').appendChild(t);
  setTimeout(() => t.remove(), 3100);
}

function openModal(el) { el.classList.add('open'); }
function closeModal(el) { el.classList.remove('open'); }

// ── Stats ─────────────────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res = await fetch(`${API}/stats`);
    if (!res.ok) return;
    const s = await res.json();
    document.getElementById('val-total').textContent     = s.total ?? 0;
    document.getElementById('val-delivered').textContent = s.delivered ?? 0;
    document.getElementById('val-shipped').textContent   = s.shipped ?? 0;
    document.getElementById('val-pending').textContent   = s.pending ?? 0;
    document.getElementById('val-cancelled').textContent = s.cancelled ?? 0;
    document.getElementById('val-revenue').textContent   = formatAmount(s.totalRevenue);
  } catch (e) {
    console.warn('Stats unavailable', e);
  }
}

// ── Load & Render Table ───────────────────────────────────────────────────────
async function loadMembers() {
  const search = searchInput.value.trim();
  const status = filterStatus.value;
  const params = new URLSearchParams({ sort: sortCol, order: sortOrder });
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  try {
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error('Failed to fetch members');
    const members = await res.json();
    renderTable(members);
  } catch (e) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc2626;padding:1.5rem">
      Error loading data. Is the server running? (npm start)
    </td></tr>`;
    showToast('Could not reach the server.', 'error');
  }
}

function renderTable(members) {
  emptyMsg.style.display = members.length === 0 ? 'block' : 'none';

  if (members.length === 0) {
    tableBody.innerHTML = '';
    return;
  }

  tableBody.innerHTML = members.map(m => `
    <tr data-id="${m.id}">
      <td>${m.id}</td>
      <td>
        <img src="${m.avatar || 'images/default-avatar.png'}"
             alt="${escHtml(m.name)}"
             onerror="this.style.display='none'">
        ${escHtml(m.name)}
      </td>
      <td>${escHtml(m.location || '—')}</td>
      <td>${formatDate(m.date)}</td>
      <td><span class="status ${statusClass(m.status)}">${escHtml(m.status)}</span></td>
      <td><strong>${formatAmount(m.amount)}</strong></td>
      <td>
        <div class="action-cell">
          <button class="btn-edit"   onclick="openEditModal(${m.id})">Edit</button>
          <button class="btn-delete" onclick="openDeleteModal(${m.id}, '${escHtml(m.name)}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Sort ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('thead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortCol === col) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortOrder = 'asc';
    }
    document.querySelectorAll('thead th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
    loadMembers();
  });
});

// ── Search / Filter ───────────────────────────────────────────────────────────
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(loadMembers, 280);
});
filterStatus.addEventListener('change', loadMembers);

// ── Add Modal ─────────────────────────────────────────────────────────────────
document.getElementById('btnAdd').addEventListener('click', () => {
  memberForm.reset();
  memberId.value  = '';
  errName.textContent = '';
  modalTitle.textContent = 'Add Member';
  fDate.value = new Date().toISOString().split('T')[0];
  openModal(memberModal);
  fName.focus();
});

// ── Edit Modal ────────────────────────────────────────────────────────────────
async function openEditModal(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    if (!res.ok) throw new Error();
    const m = await res.json();

    memberId.value   = m.id;
    fName.value      = m.name;
    fLocation.value  = m.location || '';
    fDate.value      = m.date     || '';
    fStatus.value    = m.status;
    fAmount.value    = m.amount   || '';
    fAvatar.value    = m.avatar   || '';
    errName.textContent = '';
    modalTitle.textContent = 'Edit Member';
    openModal(memberModal);
    fName.focus();
  } catch {
    showToast('Failed to load member data.', 'error');
  }
}
window.openEditModal = openEditModal;

// ── Form Submit (Create or Update) ───────────────────────────────────────────
memberForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errName.textContent = '';

  const name = fName.value.trim();
  if (!name) {
    errName.textContent = 'Name is required.';
    fName.focus();
    return;
  }

  const payload = {
    name,
    location: fLocation.value.trim(),
    date:     fDate.value,
    status:   fStatus.value,
    amount:   parseFloat(fAmount.value) || 0,
    avatar:   fAvatar.value.trim(),
  };

  const id  = memberId.value;
  const url = id ? `${API}/${id}` : API;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Save failed.', 'error');
      return;
    }

    closeModal(memberModal);
    showToast(id ? 'Member updated!' : 'Member added!', 'success');
    await loadMembers();
    await loadStats();
  } catch {
    showToast('Network error. Check server connection.', 'error');
  }
});

// ── Delete Modal ──────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
  deleteTargetId = id;
  deleteName.textContent = name;
  openModal(deleteModal);
}
window.openDeleteModal = openDeleteModal;

document.getElementById('btnDeleteConfirm').addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    const res = await fetch(`${API}/${deleteTargetId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    closeModal(deleteModal);
    showToast('Member deleted.', 'info');
    deleteTargetId = null;
    await loadMembers();
    await loadStats();
  } catch {
    showToast('Delete failed.', 'error');
  }
});

// ── Close Modals ──────────────────────────────────────────────────────────────
function setupClose(overlay, ...triggers) {
  triggers.forEach(el => el?.addEventListener('click', () => closeModal(overlay)));
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
}

setupClose(memberModal,
  document.getElementById('modalClose'),
  document.getElementById('btnModalCancel')
);
setupClose(deleteModal,
  document.getElementById('deleteModalClose'),
  document.getElementById('btnDeleteCancel')
);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal(memberModal);
    closeModal(deleteModal);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  await Promise.all([loadStats(), loadMembers()]);
})();
