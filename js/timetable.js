/**
 * CollegeFlow — Timetable Grid Component
 * Renders the weekly spreadsheet grid, handles interactive cell clicking,
 * sticky headers, and dynamic slot columns.
 */

import {
  formatDayHeader,
  getDaysOfWeek,
  toISODate,
  isDateToday,
  calculateSlotDuration,
  formatTimeSlotDisplay
} from './dateUtils.js';
import { stateManager } from './state.js';

export class TimetableRenderer {
  constructor({ containerId, onCellClick, onSlotEditClick, onAddSlotClick }) {
    this.container = document.getElementById(containerId);
    this.onCellClick = onCellClick;
    this.onSlotEditClick = onSlotEditClick;
    this.onAddSlotClick = onAddSlotClick;
  }

  /**
   * Main render method.
   * @param {Date} currentMonday
   * @param {Object} state - From stateManager
   */
  render(currentMonday, stateInput) {
    if (!this.container) return;

    const state = stateInput?.state || stateInput || {};
    const slots = state.slots || (stateInput?.slots) || [];
    const semester = state.semester || (stateInput?.semester) || { startDate: '', endDate: '', activeDays: [1, 2, 3, 4, 5] };
    const activeDayIndices = semester.activeDays || [1, 2, 3, 4, 5];
    const totalDaysToShow = Math.max(...activeDayIndices, 5);
    const weekDays = getDaysOfWeek(currentMonday, totalDaysToShow);

    // Filter to only active days (e.g. Mon-Fri or including Sat/Sun if enabled)
    const displayDays = weekDays.filter(date => {
      let dayIndex = date.getDay();
      if (dayIndex === 0) dayIndex = 7; // Treat Sunday as 7 for simple 1-7 mapping
      return activeDayIndices.includes(date.getDay()) || activeDayIndices.includes(dayIndex);
    });

    // Check semester bounds
    const mondayISO = toISODate(currentMonday);
    const sundayDate = new Date(currentMonday);
    sundayDate.setDate(sundayDate.getDate() + 6);
    const sundayISO = toISODate(sundayDate);

    const isEntirelyOutOfSemester =
      (semester.startDate && sundayISO < semester.startDate) ||
      (semester.endDate && mondayISO > semester.endDate);

    let html = '';

    if (isEntirelyOutOfSemester) {
      html += `
        <div class="out-of-semester-notice">
          <span>Notice: This week is outside the semester dates (${semester.startDate} to ${semester.endDate}). Template classes are still previewed below.</span>
        </div>
      `;
    }

    html += `
      <div class="timetable-viewport">
        <table class="timetable-table" aria-label="Weekly Timetable">
          <thead>
            <tr>
              <th class="th-corner" scope="col">
                <div class="corner-content">
                  <span class="corner-label">Timetable</span>
                  <span class="corner-slots-count">${slots.length} Time Slots</span>
                </div>
              </th>
              ${slots.map((slot, index) => this.renderSlotHeader(slot, index)).join('')}
            </tr>
          </thead>
          <tbody>
            ${displayDays.map(date => this.renderDayRow(date, slots, stateInput || stateManager)).join('')}
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents(displayDays, slots);
  }

  renderSlotHeader(slot, index) {
    const duration = calculateSlotDuration(slot.startTime, slot.endTime);
    const isBreak = Boolean(slot.isBreak);
    return `
      <th class="th-slot ${isBreak ? 'is-break-header' : ''}" scope="col" data-slot-id="${slot.id}">
        <div class="slot-header-content">
          <div class="slot-time-range">${slot.startTime} – ${slot.endTime}</div>
          <div class="slot-meta">
            <span class="slot-name-badge">${slot.label || `Slot ${index + 1}`}</span>
            ${duration ? `<span class="slot-duration">${duration}</span>` : ''}
          </div>
          <div class="slot-actions-hover">
            <button type="button" class="slot-action-btn edit-slot-trigger" data-slot-id="${slot.id}" title="Edit this time slot" aria-label="Edit time slot ${slot.startTime} to ${slot.endTime}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
        </div>
      </th>
    `;
  }

  renderDayRow(date, slots, stateInput) {
    const sm = stateInput?.getClassForCell ? stateInput : stateManager;
    const state = sm.state || sm;
    const semester = state.semester || sm.semester || { startDate: '', endDate: '' };
    const { dayName, dayNum, fullDateStr } = formatDayHeader(date);
    const isToday = isDateToday(date);
    let dayOfWeek = date.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Standardize Sunday to 7

    const isDateInSemester =
      Boolean(semester.startDate && semester.endDate &&
      fullDateStr >= semester.startDate && fullDateStr <= semester.endDate);

    const rowClasses = [
      'tr-day',
      isToday ? 'is-today' : '',
      !isDateInSemester ? 'is-out-of-semester' : ''
    ].filter(Boolean).join(' ');

    return `
      <tr class="${rowClasses}" data-date="${fullDateStr}">
        <th class="th-day" scope="row">
          <div class="day-header-content">
            <div class="day-date-badge">
              <span class="day-num">${dayNum}</span>
            </div>
            <div class="day-info">
              <span class="day-name">${dayName}</span>
              <div class="day-sub">
                ${isToday ? '<span class="day-today-tag">Today</span>' : ''}
              </div>
            </div>
          </div>
        </th>
        ${slots.map(slot => this.renderCell(date, fullDateStr, dayOfWeek, slot, sm)).join('')}
      </tr>
    `;
  }

  renderCell(date, dateStr, dayOfWeek, slot, stateInput) {
    const sm = stateInput?.getClassForCell ? stateInput : stateManager;
    const classData = sm.getClassForCell(dateStr, dayOfWeek, slot.id);
    const isBreak = Boolean(slot.isBreak);

    return `
      <td class="td-cell ${isBreak ? 'is-break-slot' : ''}"
          data-date="${dateStr}"
          data-day-of-week="${dayOfWeek}"
          data-slot-id="${slot.id}">
        ${classData ? this.renderClassCard(classData, dateStr, slot) : this.renderEmptyCell(isBreak, slot)}
      </td>
    `;
  }

  renderClassCard(classData, dateStr, slot) {
    const { subject, room, teacher, notes, color = 'blue', isCancelled, reason, isOverride } = classData;

    return `
      <div class="class-card ${isCancelled ? 'is-cancelled' : ''}"
           data-color="${color}"
           role="button"
           tabindex="0"
           title="${isCancelled ? `Cancelled: ${reason || ''}` : `${subject} in ${room || ''}`}">
        <div class="card-header-row">
          <span class="class-subject-title">${this.escapeHtml(subject)}</span>
          ${isCancelled ? '<span class="cancelled-pill">CANCELLED</span>' : ''}
          ${!isCancelled && isOverride ? '<span class="override-badge" title="Adjusted for this date">Single Day</span>' : ''}
        </div>

        ${(room || teacher) ? `
          <div class="card-details-row">
            ${room ? `
              <span class="class-room-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${this.escapeHtml(room)}
              </span>
            ` : ''}
            ${teacher ? `
              <span class="class-teacher-label">
                ${this.escapeHtml(teacher)}
              </span>
            ` : ''}
          </div>
        ` : ''}

        ${isCancelled && reason ? `
          <div class="class-notes-preview is-cancel-reason">
            <span class="class-notes-text">${this.escapeHtml(reason)}</span>
          </div>
        ` : (notes ? `
          <div class="class-notes-preview" title="${this.escapeHtml(notes)}">
            <svg class="notes-mini-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span class="class-notes-text">${this.escapeHtml(notes)}</span>
          </div>
        ` : '')}
      </div>
    `;
  }

  renderEmptyCell(isBreak, slot) {
    if (isBreak) {
      const isTea = (slot.label || '').toLowerCase().includes('tea');
      return `
        <div class="break-slot-indicator" title="${this.escapeHtml(slot.label || 'Break')}">
          ${isTea
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><line x1="15" y1="2" x2="15" y2="22"/><line x1="12" y1="2" x2="12" y2="5"/><path d="M6 2v20"/><path d="M9 2v4a3 3 0 0 1-3 3"/></svg>`
          }
          <span class="break-label-text">${this.escapeHtml(slot.label || 'Break')}</span>
        </div>
      `;
    }

    return `
      <button type="button" class="empty-cell-cta" aria-label="Add class">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>Add Class</span>
      </button>
    `;
  }

  bindEvents(displayDays, slots) {
    // Cell clicks
    const cells = this.container.querySelectorAll('.td-cell');
    cells.forEach(cell => {
      cell.addEventListener('click', (e) => {
        const dateStr = cell.getAttribute('data-date');
        const dayOfWeek = parseInt(cell.getAttribute('data-day-of-week'), 10);
        const slotId = cell.getAttribute('data-slot-id');

        if (this.onCellClick) {
          this.onCellClick({ dateStr, dayOfWeek, slotId });
        }
      });
    });

    // Slot header edit triggers
    const slotEditBtns = this.container.querySelectorAll('.edit-slot-trigger');
    slotEditBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const slotId = btn.getAttribute('data-slot-id');
        if (this.onSlotEditClick) {
          this.onSlotEditClick(slotId);
        }
      });
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
