(() => {
  "use strict";

  // ── Helpers ──────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const LS_KEY = "budget_tracker_transactions";

  function loadTransactions() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTransactions(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function formatMoney(n) {
    return "₦" + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ── State ────────────────────────────────────────────────
  let transactions = loadTransactions();
  let editingId = null;
  let deletingId = null;

  // ── DOM refs ─────────────────────────────────────────────
  const form = $("#transaction-form");
  const descInput = $("#description");
  const amountInput = $("#amount");
  const typeSelect = $("#type");
  const formTitle = $("#form-title");
  const submitBtn = $("#submit-btn");
  const cancelBtn = $("#cancel-btn");
  const searchInput = $("#search");
  const listEl = $("#transaction-list");
  const emptyEl = $("#empty-state");
  const balanceEl = $("#balance");
  const incomeEl = $("#income");
  const expenseEl = $("#expense");
  const modal = $("#confirm-modal");
  const confirmYes = $("#confirm-yes");
  const confirmNo = $("#confirm-no");

  // ── Render ───────────────────────────────────────────────
  function updateSummary() {
    let inc = 0;
    let exp = 0;
    for (const t of transactions) {
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    }
    balanceEl.textContent = (inc - exp >= 0 ? "" : "-") + formatMoney(inc - exp);
    incomeEl.textContent = formatMoney(inc);
    expenseEl.textContent = formatMoney(exp);
  }

  function renderList() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = query
      ? transactions.filter(
          (t) =>
            t.description.toLowerCase().includes(query) ||
            t.amount.toFixed(2).includes(query) ||
            t.type.includes(query)
        )
      : transactions;

    listEl.innerHTML = "";

    if (transactions.length === 0) {
      emptyEl.style.display = "";
      return;
    }

    emptyEl.style.display = "none";

    if (filtered.length === 0) {
      listEl.innerHTML =
        '<p style="text-align:center;color:var(--clr-muted);padding:20px 0;">No matching transactions found.</p>';
      return;
    }

    for (const t of filtered) {
      const item = document.createElement("div");
      item.className = `transaction-item ${t.type}`;
      item.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-desc" title="${escapeHtml(t.description)}">${escapeHtml(t.description)}</div>
          <div class="transaction-type">${t.type}</div>
        </div>
        <span class="transaction-amount ${t.type}">
          ${t.type === "expense" ? "-" : "+"}${formatMoney(t.amount)}
        </span>
        <div class="transaction-actions">
          <button title="Edit" data-edit="${t.id}">✏️</button>
          <button title="Delete" data-delete="${t.id}">🗑️</button>
        </div>`;
      listEl.appendChild(item);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function refresh() {
    saveTransactions(transactions);
    updateSummary();
    renderList();
  }

  // ── Form: Add / Edit ────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeSelect.value;

    if (!desc || isNaN(amount) || amount <= 0) return;

    if (editingId) {
      const t = transactions.find((x) => x.id === editingId);
      if (t) {
        t.description = desc;
        t.amount = amount;
        t.type = type;
      }
      exitEditMode();
    } else {
      transactions.unshift({ id: genId(), description: desc, amount, type });
    }

    form.reset();
    refresh();
  });

  function enterEditMode(t) {
    editingId = t.id;
    descInput.value = t.description;
    amountInput.value = t.amount;
    typeSelect.value = t.type;
    formTitle.textContent = "Edit Transaction";
    submitBtn.textContent = "Save Changes";
    cancelBtn.style.display = "";
    descInput.focus();
  }

  function exitEditMode() {
    editingId = null;
    formTitle.textContent = "Add Transaction";
    submitBtn.textContent = "Add Transaction";
    cancelBtn.style.display = "none";
    form.reset();
  }

  cancelBtn.addEventListener("click", exitEditMode);

  // ── Delete with confirmation ─────────────────────────────
  function showDeleteModal(id) {
    deletingId = id;
    modal.style.display = "";
  }

  function hideDeleteModal() {
    deletingId = null;
    modal.style.display = "none";
  }

  confirmYes.addEventListener("click", () => {
    if (deletingId) {
      transactions = transactions.filter((t) => t.id !== deletingId);
      if (editingId === deletingId) exitEditMode();
      refresh();
    }
    hideDeleteModal();
  });

  confirmNo.addEventListener("click", hideDeleteModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideDeleteModal();
  });

  // ── Delegated click handlers ─────────────────────────────
  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const editId = btn.dataset.edit;
    const deleteId = btn.dataset.delete;

    if (editId) {
      const t = transactions.find((x) => x.id === editId);
      if (t) enterEditMode(t);
    } else if (deleteId) {
      showDeleteModal(deleteId);
    }
  });

  // ── Search ───────────────────────────────────────────────
  searchInput.addEventListener("input", renderList);

  // ── Initial render ───────────────────────────────────────
  refresh();
})();

