/**
 * CollegeFlow — Main Application Coordinator
 * Initializes state, manages week navigation, theme switching, and wires components.
 */

import { stateManager } from './state.js';
import {
  getMondayOfWeek,
  formatWeekRange,
  toISODate,
  parseISODate,
  getSemesterWeekInfo,
  isDateToday
} from './dateUtils.js';
import { TimetableRenderer } from './timetable.js';
import { ModalController } from './modals.js';

class CollegeFlowApp {
  constructor() {
    // Reference date: start on current date's Monday
    // If today is 2026-09-21, Monday is 2026-09-21
    const today = new Date();
    this.currentMonday = getMondayOfWeek(today);

    this.initTheme();
    this.initComponents();
    this.bindNavigationEvents();
    this.bindKeyboardShortcuts();
    this.render();
  }

  initTheme() {
    const savedTheme = stateManager.state.settings.theme || 'system';
    this.applyTheme(savedTheme);

    // Listen to system preference changes if in system mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (stateManager.state.settings.theme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  applyTheme(theme) {
    let resolvedTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = prefersDark ? 'dark' : 'light';
    }

    if (resolvedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    // Update theme toggle icon
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.innerHTML = resolvedTheme === 'dark'
        ? `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
        : `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      themeBtn.setAttribute('title', `Switch theme (Current: ${resolvedTheme})`);
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    stateManager.updateSettings({ theme: newTheme });
    this.applyTheme(newTheme);
  }

  initComponents() {
    this.modalController = new ModalController({
      stateManager,
      onStateChange: () => this.render()
    });

    this.timetable = new TimetableRenderer({
      containerId: 'timetableRoot',
      onCellClick: ({ dateStr, dayOfWeek, slotId }) => {
        this.modalController.openClassModal({ dateStr, dayOfWeek, slotId });
      },
      onSlotEditClick: (slotId) => {
        this.modalController.openSlotManagerModal(slotId);
      },
      onAddSlotClick: () => {
        this.modalController.openSlotManagerModal();
      }
    });

    // Subscribe to external state changes
    stateManager.subscribe(() => {
      this.render();
    });
  }

  bindNavigationEvents() {
    const prevBtn = document.getElementById('prevWeekBtn');
    const nextBtn = document.getElementById('nextWeekBtn');
    const todayBtn = document.getElementById('todayBtn');
    const weekLabelBtn = document.getElementById('weekLabelBtn');
    const hiddenDatePicker = document.getElementById('hiddenDatePicker');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const btnEditSlots = document.getElementById('btnEditSlots');
    const btnSemesterSettings = document.getElementById('btnSemesterSettings');

    // Previous week
    prevBtn?.addEventListener('click', () => {
      this.currentMonday.setDate(this.currentMonday.getDate() - 7);
      this.render();
    });

    // Next week
    nextBtn?.addEventListener('click', () => {
      this.currentMonday.setDate(this.currentMonday.getDate() + 7);
      this.render();
    });

    // Today jump
    todayBtn?.addEventListener('click', () => {
      this.currentMonday = getMondayOfWeek(new Date());
      this.render();
    });

    // Direct Week/Date Picker
    weekLabelBtn?.addEventListener('click', () => {
      if (hiddenDatePicker) {
        hiddenDatePicker.showPicker ? hiddenDatePicker.showPicker() : hiddenDatePicker.click();
      }
    });

    hiddenDatePicker?.addEventListener('change', (e) => {
      if (e.target.value) {
        const selectedDate = parseISODate(e.target.value);
        this.currentMonday = getMondayOfWeek(selectedDate);
        this.render();
      }
    });

    // Theme toggle
    themeToggleBtn?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Slot manager button ("Edit Timetable")
    btnEditSlots?.addEventListener('click', () => {
      this.modalController.openSlotManagerModal();
    });

    // Semester settings button
    btnSemesterSettings?.addEventListener('click', () => {
      this.modalController.openSemesterModal();
    });
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger if typing in an input or modal is open
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (this.modalController.isOpen()) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.currentMonday.setDate(this.currentMonday.getDate() - 7);
        this.render();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.currentMonday.setDate(this.currentMonday.getDate() + 7);
        this.render();
      } else if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        this.currentMonday = getMondayOfWeek(new Date());
        this.render();
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.modalController.openSlotManagerModal();
      }
    });
  }

  updateHeaderUI() {
    const weekRangeStr = formatWeekRange(this.currentMonday);
    const weekRangeDisplay = document.getElementById('weekRangeDisplay');
    if (weekRangeDisplay) {
      weekRangeDisplay.textContent = weekRangeStr;
    }

    // Check if viewing today's week
    const currentWeekMonday = getMondayOfWeek(new Date());
    const isCurrentWeek = toISODate(this.currentMonday) === toISODate(currentWeekMonday);
    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
      todayBtn.classList.toggle('is-active', isCurrentWeek);
    }

    // Hidden date picker sync
    const hiddenDatePicker = document.getElementById('hiddenDatePicker');
    if (hiddenDatePicker) {
      hiddenDatePicker.value = toISODate(this.currentMonday);
    }

    // Update semester info sub-bar
    const semester = stateManager.state.semester;
    const weekInfo = getSemesterWeekInfo(this.currentMonday, semester.startDate, semester.endDate);

    const semesterPill = document.getElementById('semesterPillText');
    if (semesterPill) {
      semesterPill.textContent = semester.name || 'Current Semester';
    }

    const weekStatText = document.getElementById('weekStatText');
    if (weekStatText) {
      if (weekInfo.currentWeek < 1) {
        weekStatText.textContent = `Pre-semester (${semester.startDate} start)`;
      } else if (weekInfo.currentWeek > weekInfo.totalWeeks) {
        weekStatText.textContent = `Post-semester (Ended ${semester.endDate})`;
      } else {
        weekStatText.textContent = `Week ${weekInfo.currentWeek} of ${weekInfo.totalWeeks}`;
      }
    }
  }

  render() {
    this.updateHeaderUI();
    this.timetable.render(this.currentMonday, stateManager);
  }
}

// Bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.collegeFlowApp = new CollegeFlowApp();
});
