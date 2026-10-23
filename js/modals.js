/**
 * CollegeFlow — Modal Dialog Controllers
 * Handles Class Edit/Add sheets, Slot Manager (Edit Timetable mode), and Semester Settings.
 */

import { formatDayHeader } from './dateUtils.js';

export class ModalController {
  constructor({ stateManager, onStateChange }) {
    this.state = stateManager;
    this.onStateChange = onStateChange;

    this.backdrop = document.getElementById('modalBackdrop');
    this.modalContent = document.getElementById('modalContainer');

    this.initKeyboardListeners();
  }

  initKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    if (this.backdrop) {
      this.backdrop.addEventListener('click', (e) => {
        if (e.target === this.backdrop) {
          this.close();
        }
      });
    }
  }

  isOpen() {
    return this.backdrop && this.backdrop.classList.contains('is-open');
  }

  open(html) {
    if (!this.backdrop || !this.modalContent) return;
    this.modalContent.innerHTML = html;
    this.backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this.backdrop) return;
    this.backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (this.modalContent) this.modalContent.innerHTML = '';
    }, 200);
  }

  // =========================================================================
  // 1. CLASS MODAL (Add / Edit / Cancel / Move)
  // =========================================================================

  openClassModal({ dateStr, dayOfWeek, slotId }) {
    const slot = this.state.getSlot(slotId);
    const existingClass = this.state.getClassForCell(dateStr, dayOfWeek, slotId);
    const [year, month, day] = dateStr.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const { dayName, dayNum, monthShort } = formatDayHeader(targetDate);

    const isEdit = Boolean(existingClass);
    const isCancelled = existingClass?.isCancelled;
    const initialSubject = existingClass?.subject || '';
    const initialRoom = existingClass?.room || '';
    const initialTeacher = existingClass?.teacher || '';
    const initialNotes = existingClass?.notes || this.state.getDateNote(dateStr, slotId) || '';
    const initialColor = existingClass?.color || 'blue';

    const timeLabel = slot ? `${slot.startTime} – ${slot.endTime}` : '';
    const dateLabel = `${dayName}, ${monthShort} ${dayNum}`;

    const colors = ['blue', 'purple', 'amber', 'indigo', 'teal', 'rose', 'emerald', 'slate'];

    const html = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">${isEdit ? 'Class Details' : 'Add New Class'}</h2>
            <div class="modal-subtitle">${dateLabel} • ${timeLabel}</div>
          </div>
          <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          ${isCancelled ? `
            <div class="modal-alert-box danger">
              <div>
                <strong>Cancelled for this date:</strong> ${existingClass.reason || 'No reason provided'}
              </div>
              <button type="button" class="btn btn-sm btn-subtle" id="btnRestoreOccurrence">Restore Class</button>
            </div>
          ` : ''}

          <!-- Scope Selector (Apply to this date only vs all weeks) -->
          <div class="form-group">
            <label class="form-label">Apply schedule changes to</label>
            <div class="segmented-control" id="scopeSelector">
              <button type="button" class="segmented-btn ${isEdit && existingClass.isOverride ? 'is-active' : ''}" data-scope="single">
                This Date Only (${monthShort} ${dayNum})
              </button>
              <button type="button" class="segmented-btn ${!isEdit || !existingClass.isOverride ? 'is-active' : ''}" data-scope="all">
                All Weeks (Recurring)
              </button>
            </div>
            <div class="hint-text" id="scopeHint">
              ${!isEdit || !existingClass.isOverride ? 'Repeats automatically every ' + dayName + ' throughout the semester.' : 'Applies only as a one-day exception on ' + dateLabel + '.'}
            </div>
          </div>

          <form id="classForm">
            <div class="form-group">
              <label class="form-label" for="inputSubject">Subject / Course Name *</label>
              <input type="text" id="inputSubject" class="form-input" placeholder="e.g. Network Analysis, Data Structures" value="${this.escapeHtml(initialSubject)}" required autofocus />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="inputRoom">Room / Hall</label>
                <input type="text" id="inputRoom" class="form-input" placeholder="e.g. Lab 204, LH 3" value="${this.escapeHtml(initialRoom)}" />
              </div>

              <div class="form-group">
                <label class="form-label" for="inputTeacher">Teacher / Faculty</label>
                <input type="text" id="inputTeacher" class="form-input" placeholder="e.g. Dr. Alistair" value="${this.escapeHtml(initialTeacher)}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="inputNotes">
                <span>Notes / Topic (Optional)</span>
                <span class="badge badge-subtle">For ${monthShort} ${dayNum} only</span>
              </label>
              <textarea id="inputNotes" class="form-textarea" placeholder="e.g. Chapter 4 quiz, Bring lab record...">${this.escapeHtml(initialNotes)}</textarea>
              <div class="hint-text">Specific to this date — notes never repeat weekly.</div>
            </div>

            <div class="form-group">
              <label class="form-label">Color Tag</label>
              <div class="color-picker-grid" id="colorPicker">
                ${colors.map(c => `
                  <button type="button" class="color-swatch-btn ${c === initialColor ? 'is-selected' : ''}" data-color="${c}" aria-label="${c} color"></button>
                `).join('')}
              </div>
              <input type="hidden" id="selectedColor" value="${initialColor}" />
            </div>
          </form>

          ${isEdit && !isCancelled ? `
            <div style="display: flex; gap: 8px; border-top: 1px solid var(--border-subtle); padding-top: 14px; margin-top: 4px;">
              <button type="button" class="btn btn-sm btn-subtle" id="btnCancelOccurrence" style="color: var(--danger-text);">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                Cancel Class on ${monthShort} ${dayNum}
              </button>
            </div>
          ` : ''}
        </div>

        <div class="modal-footer">
          <div>
            ${isEdit ? `
              <button type="button" class="btn btn-subtle" id="btnDeleteClass" style="color: var(--danger-text);">Delete</button>
            ` : ''}
          </div>
          <div class="modal-footer-right">
            <button type="button" class="btn" id="modalCancelBtn">Cancel</button>
            <button type="button" class="btn btn-primary" id="modalSaveBtn">${isEdit ? 'Save Changes' : 'Add Class'}</button>
          </div>
        </div>
      </div>
    `;

    this.open(html);
    this.bindClassModalEvents({ dateStr, dayOfWeek, slotId, isEdit, existingClass, dayName, dateLabel });
  }

  bindClassModalEvents({ dateStr, dayOfWeek, slotId, isEdit, existingClass, dayName, dateLabel }) {
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const saveBtn = document.getElementById('modalSaveBtn');
    const colorSwatches = document.querySelectorAll('#colorPicker .color-swatch-btn');
    const selectedColorInput = document.getElementById('selectedColor');
    const scopeButtons = document.querySelectorAll('#scopeSelector .segmented-btn');
    const scopeHint = document.getElementById('scopeHint');

    let currentScope = (isEdit && existingClass?.isOverride) ? 'single' : 'all';

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    // Color picker
    colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        colorSwatches.forEach(s => s.classList.remove('is-selected'));
        swatch.classList.add('is-selected');
        selectedColorInput.value = swatch.getAttribute('data-color');
      });
    });

    // Scope switcher
    scopeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        scopeButtons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentScope = btn.getAttribute('data-scope');
        if (currentScope === 'single') {
          scopeHint.textContent = `Applies only as a one-day exception on ${dateLabel}.`;
        } else {
          scopeHint.textContent = `Repeats automatically every ${dayName} throughout the semester.`;
        }
      });
    });

    // Form submit on Enter key
    const classForm = document.getElementById('classForm');
    classForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveBtn?.click();
    });

    // Save action
    saveBtn?.addEventListener('click', () => {
      const subject = document.getElementById('inputSubject').value.trim();
      const room = document.getElementById('inputRoom').value.trim();
      const teacher = document.getElementById('inputTeacher').value.trim();
      const notes = document.getElementById('inputNotes').value.trim();
      const color = selectedColorInput.value || 'blue';

      if (!subject) {
        document.getElementById('inputSubject').focus();
        return;
      }

      this.state.saveClass({
        dateStr,
        dayOfWeek,
        slotId,
        applyTo: currentScope,
        classData: { subject, room, teacher, notes, color }
      });

      this.close();
      if (this.onStateChange) this.onStateChange();
    });

    // Cancel this class on this date only
    const btnCancelOccurrence = document.getElementById('btnCancelOccurrence');
    btnCancelOccurrence?.addEventListener('click', () => {
      const reason = prompt(`Reason for cancelling ${existingClass?.subject || 'class'} on this date:`, 'Class cancelled') || 'Class cancelled';
      this.state.cancelClassOccurrence(dateStr, dayOfWeek, slotId, reason);
      this.close();
      if (this.onStateChange) this.onStateChange();
    });

    // Restore occurrence if cancelled
    const btnRestoreOccurrence = document.getElementById('btnRestoreOccurrence');
    btnRestoreOccurrence?.addEventListener('click', () => {
      this.state.restoreClassOccurrence(dateStr, slotId);
      this.close();
      if (this.onStateChange) this.onStateChange();
    });

    // Delete class action
    const deleteBtn = document.getElementById('btnDeleteClass');
    deleteBtn?.addEventListener('click', () => {
      const confirmMsg = currentScope === 'single'
        ? `Remove this class on ${dateLabel} only?`
        : `Delete ${existingClass?.subject || 'this class'} for all weeks?`;

      if (confirm(confirmMsg)) {
        this.state.deleteClass({
          dateStr,
          dayOfWeek,
          slotId,
          applyTo: currentScope
        });
        this.close();
        if (this.onStateChange) this.onStateChange();
      }
    });
  }

  // =========================================================================
  // 2. TIME SLOT MANAGER ("Edit Timetable" Mode)
  // =========================================================================

  openSlotManagerModal(targetSlotId = null) {
    const slots = this.state.getSlots();

    const html = `
      <div class="modal-window modal-window-lg">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">Edit Time Slots</h2>
            <div class="modal-subtitle">Customize slot timings, reorder columns, or add breaks.</div>
          </div>
          <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="slot-manager-list" id="slotListContainer">
            ${slots.map((slot, index) => `
              <div class="slot-item-card" data-slot-id="${slot.id}">
                <div class="slot-reorder-handle">
                  <button type="button" class="slot-action-btn slot-move-up" data-slot-id="${slot.id}" ${index === 0 ? 'disabled' : ''} title="Move earlier">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button type="button" class="slot-action-btn slot-move-down" data-slot-id="${slot.id}" ${index === slots.length - 1 ? 'disabled' : ''} title="Move later">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>

                <div class="slot-inputs-group">
                  <input type="time" class="slot-start-time" data-slot-id="${slot.id}" value="${slot.startTime}" aria-label="Start time" />
                  <span style="color: var(--text-tertiary); font-size: 12px;">to</span>
                  <input type="time" class="slot-end-time" data-slot-id="${slot.id}" value="${slot.endTime}" aria-label="End time" />
                  <input type="text" class="slot-name-input" data-slot-id="${slot.id}" value="${this.escapeHtml(slot.label || '')}" placeholder="Label (e.g. Slot 1 or Lunch)" />
                </div>

                <label class="slot-break-toggle">
                  <input type="checkbox" class="slot-is-break" data-slot-id="${slot.id}" ${slot.isBreak ? 'checked' : ''} />
                  <span>Break</span>
                </label>

                <button type="button" class="btn btn-icon btn-subtle slot-delete-btn" data-slot-id="${slot.id}" title="Delete slot" style="color: var(--danger-text);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 10px;">
            <button type="button" class="btn btn-subtle" id="btnAddSlotBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add New Time Slot
            </button>
          </div>
        </div>

        <div class="modal-footer">
          <span class="hint-text">Times update immediately on the timetable grid.</span>
          <button type="button" class="btn btn-primary" id="btnSlotManagerDone">Done</button>
        </div>
      </div>
    `;

    this.open(html);
    this.bindSlotManagerEvents();
  }

  bindSlotManagerEvents() {
    const closeBtn = document.getElementById('modalCloseBtn');
    const doneBtn = document.getElementById('btnSlotManagerDone');
    const addSlotBtn = document.getElementById('btnAddSlotBtn');

    closeBtn?.addEventListener('click', () => this.close());
    doneBtn?.addEventListener('click', () => {
      this.close();
      if (this.onStateChange) this.onStateChange();
    });

    // Handle input edits
    const container = document.getElementById('slotListContainer');
    if (container) {
      container.addEventListener('change', (e) => {
        const target = e.target;
        const slotId = target.getAttribute('data-slot-id');
        if (!slotId) return;

        if (target.classList.contains('slot-start-time')) {
          this.state.updateSlot(slotId, { startTime: target.value });
        } else if (target.classList.contains('slot-end-time')) {
          this.state.updateSlot(slotId, { endTime: target.value });
        } else if (target.classList.contains('slot-name-input')) {
          this.state.updateSlot(slotId, { label: target.value });
        } else if (target.classList.contains('slot-is-break')) {
          this.state.updateSlot(slotId, { isBreak: target.checked });
        }
        if (this.onStateChange) this.onStateChange();
      });

      // Move Up / Down / Delete
      container.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const slotId = btn.getAttribute('data-slot-id');

        if (btn.classList.contains('slot-move-up')) {
          this.state.reorderSlot(slotId, 'up');
          this.openSlotManagerModal();
          if (this.onStateChange) this.onStateChange();
        } else if (btn.classList.contains('slot-move-down')) {
          this.state.reorderSlot(slotId, 'down');
          this.openSlotManagerModal();
          if (this.onStateChange) this.onStateChange();
        } else if (btn.classList.contains('slot-delete-btn')) {
          if (confirm('Delete this time slot? Classes assigned to this slot will also be removed.')) {
            this.state.deleteSlot(slotId);
            this.openSlotManagerModal();
            if (this.onStateChange) this.onStateChange();
          }
        }
      });
    }

    addSlotBtn?.addEventListener('click', () => {
      const slots = this.state.getSlots();
      let nextStart = '15:00';
      let nextEnd = '16:00';
      if (slots.length > 0) {
        const last = slots[slots.length - 1];
        nextStart = last.endTime || '15:00';
        const [h, m] = nextStart.split(':').map(Number);
        const endH = (h + 1) % 24;
        nextEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }

      this.state.addSlot({
        startTime: nextStart,
        endTime: nextEnd,
        label: `Slot ${slots.length + 1}`
      });
      this.openSlotManagerModal();
      if (this.onStateChange) this.onStateChange();
    });
  }

  // =========================================================================
  // 3. SEMESTER SETTINGS MODAL (Start/End date recurrence)
  // =========================================================================

  openSemesterModal() {
    const semester = this.state.state.semester;
    const settings = this.state.state.settings;

    const html = `
      <div class="modal-window">
        <div class="modal-header">
          <div class="modal-title-group">
            <h2 class="modal-title">Semester & Timetable Settings</h2>
            <div class="modal-subtitle">Configure semester date boundaries and visible days.</div>
          </div>
          <button type="button" class="modal-close-btn" id="modalCloseBtn" aria-label="Close dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label" for="semesterName">Semester Name</label>
            <input type="text" id="semesterName" class="form-input" value="${this.escapeHtml(semester.name)}" placeholder="e.g. Fall 2026, Spring 2027" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="semesterStart">Semester Start Date</label>
              <input type="date" id="semesterStart" class="form-input" value="${semester.startDate}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="semesterEnd">Semester End Date</label>
              <input type="date" id="semesterEnd" class="form-input" value="${semester.endDate}" />
            </div>
          </div>
          <p class="hint-text" style="margin-top: -8px;">
            The weekly timetable repeats automatically for all weeks between these dates without generating separate duplicate rows.
          </p>

          <div class="form-group" style="margin-top: 14px;">
            <label class="form-label">Visible Days of the Week</label>
            <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                <input type="checkbox" id="chkMonFri" checked disabled /> Mon – Fri
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                <input type="checkbox" id="chkSat" ${semester.activeDays.includes(6) ? 'checked' : ''} /> Saturday
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px;">
                <input type="checkbox" id="chkSun" ${semester.activeDays.includes(0) || semester.activeDays.includes(7) ? 'checked' : ''} /> Sunday
              </label>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-subtle); padding-top: 14px; margin-top: 8px;">
            <label class="form-label" style="color: var(--text-tertiary);">Backup & Reset</label>
            <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-subtle" id="btnExportJson">Export Timetable (JSON)</button>
              <button type="button" class="btn btn-sm btn-subtle" id="btnImportJson">Import Timetable</button>
              <button type="button" class="btn btn-sm btn-danger" id="btnResetDemo">Reset to Demo Data</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn" id="modalCancelBtn">Cancel</button>
          <button type="button" class="btn btn-primary" id="btnSaveSemester">Save Settings</button>
        </div>
      </div>
    `;

    this.open(html);
    this.bindSemesterEvents();
  }

  bindSemesterEvents() {
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const saveBtn = document.getElementById('btnSaveSemester');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());

    saveBtn?.addEventListener('click', () => {
      const name = document.getElementById('semesterName').value.trim() || 'Semester';
      const startDate = document.getElementById('semesterStart').value;
      const endDate = document.getElementById('semesterEnd').value;
      const chkSat = document.getElementById('chkSat').checked;
      const chkSun = document.getElementById('chkSun').checked;

      const activeDays = [1, 2, 3, 4, 5];
      if (chkSat) activeDays.push(6);
      if (chkSun) activeDays.push(7);

      this.state.updateSemester({
        name,
        startDate,
        endDate,
        activeDays
      });

      this.close();
      if (this.onStateChange) this.onStateChange();
    });

    // Reset demo
    const resetBtn = document.getElementById('btnResetDemo');
    resetBtn?.addEventListener('click', () => {
      if (confirm('Reset the timetable to the initial demo schedule? This will restore Network Analysis, Digital Systems, etc.')) {
        this.state.resetToDemo();
        this.close();
        if (this.onStateChange) this.onStateChange();
      }
    });

    // Export JSON
    const exportBtn = document.getElementById('btnExportJson');
    exportBtn?.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(this.state.exportData());
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "CollegeFlow_Timetable.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    // Import JSON
    const importBtn = document.getElementById('btnImportJson');
    importBtn?.addEventListener('click', () => {
      const jsonStr = prompt('Paste your CollegeFlow JSON backup string here:');
      if (jsonStr) {
        if (this.state.importData(jsonStr)) {
          alert('Timetable imported successfully!');
          this.close();
          if (this.onStateChange) this.onStateChange();
        } else {
          alert('Failed to parse JSON backup. Please check format.');
        }
      }
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
