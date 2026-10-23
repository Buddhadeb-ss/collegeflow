/**
 * CollegeFlow — Application State & Storage Management
 * Handles local storage persistence, recurring templates, date overrides, and timetable slots.
 */

import { toISODate } from './dateUtils.js';

const STORAGE_KEY = 'collegeflow_routine_sem3_secb_v4';

const DEFAULT_STATE = {
  semester: {
    name: 'Semester III — Section B',
    startDate: '2026-08-24',
    endDate: '2026-12-20',
    activeDays: [1, 2, 3, 4, 5, 6] // Monday through Saturday
  },
  slots: [
    { id: 'slot-1', startTime: '09:00', endTime: '10:00', label: 'Period 1' },
    { id: 'slot-2', startTime: '10:00', endTime: '11:00', label: 'Period 2' },
    { id: 'slot-3', startTime: '11:00', endTime: '11:15', label: 'Tea Break', isBreak: true },
    { id: 'slot-4', startTime: '11:15', endTime: '12:15', label: 'Period 3' },
    { id: 'slot-5', startTime: '12:15', endTime: '13:15', label: 'Period 4' },
    { id: 'slot-6', startTime: '13:15', endTime: '14:00', label: 'Lunch Break', isBreak: true },
    { id: 'slot-7', startTime: '14:00', endTime: '15:00', label: 'Period 5' },
    { id: 'slot-8', startTime: '15:00', endTime: '16:00', label: 'Period 6' }
  ],
  templateClasses: {
    // MONDAY (Day 1) — Recurring routine (Notes are NEVER recurring)
    '1_slot-1': { id: 'c_mon_1', subject: 'AEC', room: 'Sec B', teacher: '', color: 'amber' },
    '1_slot-2': { id: 'c_mon_2', subject: 'NACS', room: 'Sec B', teacher: '', color: 'teal' },
    '1_slot-4': { id: 'c_mon_4', subject: 'DSC', room: 'Sec B', teacher: '', color: 'indigo' },
    '1_slot-5': { id: 'c_mon_5', subject: 'DEDV', room: 'Sec B', teacher: '', color: 'blue' },
    '1_slot-7': { id: 'c_mon_7', subject: 'Python lab', room: 'Lab', teacher: '', color: 'emerald' },
    '1_slot-8': { id: 'c_mon_8', subject: 'Python lab', room: 'Lab', teacher: '', color: 'emerald' },

    // TUESDAY (Day 2)
    '2_slot-1': { id: 'c_tue_1', subject: 'DEDV lab', room: 'Lab', teacher: '', color: 'blue' },
    '2_slot-2': { id: 'c_tue_2', subject: 'DEDV lab', room: 'Lab', teacher: '', color: 'blue' },
    '2_slot-4': { id: 'c_tue_4', subject: 'MAT', room: 'Sec B', teacher: '', color: 'purple' },
    '2_slot-5': { id: 'c_tue_5', subject: 'AEC', room: 'Sec B', teacher: '', color: 'amber' },
    '2_slot-7': { id: 'c_tue_7', subject: 'DEDV', room: 'Sec B', teacher: '', color: 'blue' },
    '2_slot-8': { id: 'c_tue_8', subject: 'DEDV EXCL', room: 'Sec B', teacher: '', color: 'blue' },

    // WEDNESDAY (Day 3)
    '3_slot-1': { id: 'c_wed_1', subject: 'DSC', room: 'Sec B', teacher: '', color: 'indigo' },
    '3_slot-2': { id: 'c_wed_2', subject: 'MAT', room: 'Sec B', teacher: '', color: 'purple' },
    '3_slot-4': { id: 'c_wed_4', subject: 'AEC lab', room: 'Lab', teacher: '', color: 'amber' },
    '3_slot-5': { id: 'c_wed_5', subject: 'AEC lab', room: 'Lab', teacher: '', color: 'amber' },
    '3_slot-7': { id: 'c_wed_7', subject: 'NACS', room: 'Sec B', teacher: '', color: 'teal' },
    '3_slot-8': { id: 'c_wed_8', subject: 'NACS', room: 'Sec B', teacher: '', color: 'teal' },

    // THURSDAY (Day 4)
    '4_slot-1': { id: 'c_thu_1', subject: 'DEDV', room: 'Sec B', teacher: '', color: 'blue' },
    '4_slot-2': { id: 'c_thu_2', subject: 'NACS', room: 'Sec B', teacher: '', color: 'teal' },
    '4_slot-4': { id: 'c_thu_4', subject: 'AEC', room: 'Sec B', teacher: '', color: 'amber' },
    '4_slot-5': { id: 'c_thu_5', subject: 'MAT', room: 'Sec B', teacher: '', color: 'purple' },
    '4_slot-7': { id: 'c_thu_7', subject: 'AEC EXCL', room: 'Sec B', teacher: '', color: 'amber' },
    '4_slot-8': { id: 'c_thu_8', subject: 'DSC EXCL', room: 'Sec B', teacher: '', color: 'indigo' },

    // FRIDAY (Day 5)
    '5_slot-1': { id: 'c_fri_1', subject: 'NACS lab', room: 'Lab', teacher: '', color: 'teal' },
    '5_slot-2': { id: 'c_fri_2', subject: 'NACS lab', room: 'Lab', teacher: '', color: 'teal' },
    '5_slot-4': { id: 'c_fri_4', subject: 'MAT', room: 'Sec B', teacher: '', color: 'purple' },
    '5_slot-5': { id: 'c_fri_5', subject: 'DSC', room: 'Sec B', teacher: '', color: 'indigo' },
    '5_slot-7': { id: 'c_fri_7', subject: 'SDC Project', room: 'Sec B', teacher: '', color: 'rose' },
    '5_slot-8': { id: 'c_fri_8', subject: 'SDC Project', room: 'Sec B', teacher: '', color: 'rose' },

    // SATURDAY (Day 6)
    '6_slot-1': { id: 'c_sat_1', subject: 'NACS EXCL', room: 'Sec B', teacher: '', color: 'teal' },
    '6_slot-2': { id: 'c_sat_2', subject: 'AEC EXCL', room: 'Sec B', teacher: '', color: 'amber' },
    '6_slot-4': { id: 'c_sat_4', subject: 'PROCTORING', room: 'Sec B', teacher: '', color: 'slate' },
    '6_slot-5': { id: 'c_sat_5', subject: 'PROCTORING', room: 'Sec B', teacher: '', color: 'slate' }
  },
  dateNotes: {}, // [dateStr_slotId]: string (Strictly one-off notes per specific day/class)
  overrides: {},
  settings: {
    theme: 'system',
    showSaturday: true,
    showSunday: false
  }
};

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return JSON.parse(JSON.stringify(DEFAULT_STATE));
      const parsed = JSON.parse(serialized);

      // Guarantee templateClasses NEVER contain notes (notes must never repeat weekly)
      if (parsed.templateClasses) {
        for (const key of Object.keys(parsed.templateClasses)) {
          delete parsed.templateClasses[key].notes;
        }
      }

      // Merge with defaults to ensure missing keys don't crash newer schema
      return {
        ...DEFAULT_STATE,
        ...parsed,
        dateNotes: parsed.dateNotes || {},
        semester: { ...DEFAULT_STATE.semester, ...(parsed.semester || {}) },
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.warn('Failed to load state from localStorage, falling back to defaults:', e);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state to localStorage:', e);
    }
    this.notify();
  }

  resetToDemo() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in state subscriber:', err);
      }
    }
  }

  // --- Direct Property Getters ---
  get slots() {
    return this.state.slots;
  }

  get semester() {
    return this.state.semester;
  }

  get templateClasses() {
    return this.state.templateClasses;
  }

  get overrides() {
    return this.state.overrides;
  }

  get dateNotes() {
    return this.state.dateNotes || {};
  }

  getDateNote(dateStr, slotId) {
    return this.state.dateNotes?.[`${dateStr}_${slotId}`] || '';
  }

  setDateNote(dateStr, slotId, note) {
    if (!this.state.dateNotes) this.state.dateNotes = {};
    const key = `${dateStr}_${slotId}`;
    if (note && note.trim()) {
      this.state.dateNotes[key] = note.trim();
    } else {
      delete this.state.dateNotes[key];
    }
    this.saveState();
  }

  get settings() {
    return this.state.settings;
  }

  // --- Slots API ---
  getSlots() {
    return [...this.state.slots];
  }

  getSlot(slotId) {
    return this.state.slots.find(s => s.id === slotId) || null;
  }

  updateSlot(slotId, updates) {
    const slot = this.state.slots.find(s => s.id === slotId);
    if (slot) {
      Object.assign(slot, updates);
      this.saveState();
    }
  }

  addSlot(newSlot) {
    const id = 'slot-' + Date.now();
    this.state.slots.push({
      id,
      startTime: newSlot.startTime || '15:00',
      endTime: newSlot.endTime || '16:00',
      label: newSlot.label || `Slot ${this.state.slots.length + 1}`,
      isBreak: Boolean(newSlot.isBreak)
    });
    this.saveState();
    return id;
  }

  deleteSlot(slotId) {
    this.state.slots = this.state.slots.filter(s => s.id !== slotId);
    // Remove orphaned template classes
    for (const key of Object.keys(this.state.templateClasses)) {
      if (key.endsWith(`_${slotId}`)) {
        delete this.state.templateClasses[key];
      }
    }
    // Remove orphaned overrides
    for (const key of Object.keys(this.state.overrides)) {
      if (key.endsWith(`_${slotId}`)) {
        delete this.state.overrides[key];
      }
    }
    // Remove orphaned date-specific notes
    for (const key of Object.keys(this.state.dateNotes || {})) {
      if (key.endsWith(`_${slotId}`)) {
        delete this.state.dateNotes[key];
      }
    }
    this.saveState();
  }

  reorderSlot(slotId, direction) {
    const index = this.state.slots.findIndex(s => s.id === slotId);
    if (index < 0) return;
    const targetIndex = direction === 'up' || direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.state.slots.length) return;

    const temp = this.state.slots[index];
    this.state.slots[index] = this.state.slots[targetIndex];
    this.state.slots[targetIndex] = temp;
    this.saveState();
  }

  // --- Classes & Exceptions API ---

  /**
   * Evaluates the active class for a specific date and time slot.
   * Merges recurring weekly template with date-specific overrides and one-off date notes.
   */
  getClassForCell(dateStr, dayOfWeek, slotId) {
    const overrideKey = `${dateStr}_${slotId}`;
    const override = this.state.overrides[overrideKey];

    const templateKey = `${dayOfWeek}_${slotId}`;
    const templateClass = this.state.templateClasses[templateKey] || null;

    // Notes are strictly specific to this day/date and NEVER recurring across weeks
    const dateSpecificNote = this.state.dateNotes?.[overrideKey] || '';

    if (override) {
      if (override.type === 'cancelled') {
        const baseClass = override.classData || templateClass || {
          subject: override.originalSubject || 'Class',
          room: '—',
          color: 'slate'
        };
        return {
          ...baseClass,
          notes: dateSpecificNote || override.notes || '',
          isCancelled: true,
          overrideType: 'cancelled',
          reason: override.reason || 'Class cancelled'
        };
      }
      if (override.type === 'deleted') {
        return null; // Suppressed on this single date
      }
      if (override.type === 'modified' || override.type === 'extra') {
        return {
          ...override.classData,
          notes: dateSpecificNote || override.classData?.notes || '',
          isCancelled: false,
          overrideType: override.type,
          isOverride: true
        };
      }
    }

    if (templateClass) {
      return {
        ...templateClass,
        // Notes never repeat weekly; only attached if user added a note for this specific date
        notes: dateSpecificNote,
        isCancelled: false,
        isRecurring: true
      };
    }

    return null;
  }

  /**
   * Saves a class either as recurring weekly template or as a single-date override.
   * Notes are ALWAYS saved as a separate, date-specific attribute and NEVER repeat weekly.
   */
  saveClass({ dateStr, dayOfWeek, slotId, classData, applyTo = 'all' }) {
    const { notes, ...recurringData } = classData;
    const noteKey = `${dateStr}_${slotId}`;

    // Notes are strictly saved for this specific date and class occurrence
    if (!this.state.dateNotes) this.state.dateNotes = {};
    if (notes && notes.trim()) {
      this.state.dateNotes[noteKey] = notes.trim();
    } else {
      delete this.state.dateNotes[noteKey];
    }

    if (applyTo === 'single') {
      // Save as date-specific override
      const overrideKey = `${dateStr}_${slotId}`;
      const templateKey = `${dayOfWeek}_${slotId}`;
      const hasTemplate = Boolean(this.state.templateClasses[templateKey]);

      this.state.overrides[overrideKey] = {
        type: hasTemplate ? 'modified' : 'extra',
        classData: {
          id: 'cls_' + Date.now(),
          ...recurringData,
          notes: notes && notes.trim() ? notes.trim() : ''
        }
      };
    } else {
      // Save to weekly recurring template (DO NOT store notes in weekly template)
      const templateKey = `${dayOfWeek}_${slotId}`;
      const currentTemplate = this.state.templateClasses[templateKey] || {};
      delete currentTemplate.notes;

      this.state.templateClasses[templateKey] = {
        ...currentTemplate,
        ...recurringData,
        id: currentTemplate.id || 'cls_' + Date.now()
      };

      // Clear any cancellation on this specific date if saving whole recurring series
      const overrideKey = `${dateStr}_${slotId}`;
      if (this.state.overrides[overrideKey]?.type === 'cancelled') {
        delete this.state.overrides[overrideKey];
      }
    }
    this.saveState();
  }

  /**
   * Cancels a class occurrence for a specific date only.
   */
  cancelClassOccurrence(dateStr, dayOfWeek, slotId, reason = 'Class cancelled') {
    const templateKey = `${dayOfWeek}_${slotId}`;
    const template = this.state.templateClasses[templateKey];
    const overrideKey = `${dateStr}_${slotId}`;

    this.state.overrides[overrideKey] = {
      type: 'cancelled',
      reason,
      originalSubject: template ? template.subject : 'Class',
      classData: template ? { ...template } : null
    };
    this.saveState();
  }

  /**
   * Restores a previously cancelled or overridden class back to normal.
   */
  restoreClassOccurrence(dateStr, slotId) {
    const overrideKey = `${dateStr}_${slotId}`;
    if (this.state.overrides[overrideKey]) {
      delete this.state.overrides[overrideKey];
      this.saveState();
    }
  }

  /**
   * Deletes a class.
   * Can delete just this occurrence (suppress with override) or delete from recurring template.
   */
  deleteClass({ dateStr, dayOfWeek, slotId, applyTo = 'all' }) {
    const noteKey = `${dateStr}_${slotId}`;
    if (this.state.dateNotes && this.state.dateNotes[noteKey]) {
      delete this.state.dateNotes[noteKey];
    }

    if (applyTo === 'single') {
      const overrideKey = `${dateStr}_${slotId}`;
      this.state.overrides[overrideKey] = { type: 'deleted' };
    } else {
      const templateKey = `${dayOfWeek}_${slotId}`;
      delete this.state.templateClasses[templateKey];
      // Clean overrides for this slot if desired
      const overrideKey = `${dateStr}_${slotId}`;
      delete this.state.overrides[overrideKey];
    }
    this.saveState();
  }

  // --- Semester & Settings API ---
  updateSemester(updates) {
    Object.assign(this.state.semester, updates);
    this.saveState();
  }

  updateSettings(updates) {
    Object.assign(this.state.settings, updates);
    this.saveState();
  }

  exportData() {
    return JSON.stringify(this.state, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.slots && parsed.templateClasses) {
        this.state = parsed;
        this.saveState();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON for timetable import:', e);
    }
    return false;
  }
}

export const stateManager = new StateManager();
