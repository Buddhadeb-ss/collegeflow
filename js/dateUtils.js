/**
 * CollegeFlow — Date Utilities
 * Pure helper functions for weekly timetable calculations, ISO dates, and semester week numbers.
 */

/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 * @param {Date} date
 * @returns {string}
 */
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string to a local Date object.
 * @param {string} isoString
 * @returns {Date}
 */
export function parseISODate(isoString) {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Noon prevents DST timezone slips
}

/**
 * Returns the Monday of the week for a given date.
 * If input is Sunday (day 0), it moves to the preceding Monday.
 * @param {Date} date
 * @returns {Date}
 */
export function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns an array of Date objects for each day of the week starting from Monday.
 * @param {Date} mondayDate
 * @param {number} daysCount - Usually 5 (Mon-Fri) or 7 (Mon-Sun)
 * @returns {Date[]}
 */
export function getDaysOfWeek(mondayDate, daysCount = 5) {
  const days = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(mondayDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Formats a week range for the header (e.g. "September 21 – 27, 2026")
 * @param {Date} mondayDate
 * @returns {string}
 */
export function formatWeekRange(mondayDate) {
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(sundayDate.getDate() + 6);

  const startMonth = mondayDate.toLocaleString('default', { month: 'long' });
  const endMonth = sundayDate.toLocaleString('default', { month: 'long' });
  const startDay = mondayDate.getDate();
  const endDay = sundayDate.getDate();
  const startYear = mondayDate.getFullYear();
  const endYear = sundayDate.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}–${endDay}, ${startYear}`;
}

/**
 * Formats a day header for the timetable row (e.g. "Monday 21")
 * @param {Date} date
 * @returns {{ dayName: string, dayNum: number, monthShort: string, fullDateStr: string }}
 */
export function formatDayHeader(date) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayNum = date.getDate();
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const fullDateStr = toISODate(date);
  return { dayName, dayNum, monthShort, fullDateStr };
}

/**
 * Checks if two dates refer to the exact same calendar day.
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Checks if a given date is today in the user's environment.
 * @param {Date} date
 * @returns {boolean}
 */
export function isDateToday(date) {
  return isSameDay(date, new Date());
}

/**
 * Calculates the week number of the semester for a given date.
 * E.g., Week 5 of Semester
 * @param {Date} date
 * @param {string} semesterStartISO
 * @param {string} semesterEndISO
 * @returns {{ currentWeek: number, totalWeeks: number, isWithinSemester: boolean }}
 */
export function getSemesterWeekInfo(date, semesterStartISO, semesterEndISO) {
  const startMonday = getMondayOfWeek(parseISODate(semesterStartISO));
  const endMonday = getMondayOfWeek(parseISODate(semesterEndISO));
  const currentMonday = getMondayOfWeek(date);

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.max(1, Math.round((endMonday - startMonday) / MS_PER_WEEK) + 1);
  const diffWeeks = Math.round((currentMonday - startMonday) / MS_PER_WEEK);
  const currentWeek = diffWeeks + 1;

  const dateISO = toISODate(date);
  const isWithinSemester = dateISO >= semesterStartISO && dateISO <= semesterEndISO;

  return { currentWeek, totalWeeks, isWithinSemester };
}

/**
 * Calculates duration between two HH:MM strings in minutes
 * @param {string} start "09:00"
 * @param {string} end "10:00"
 * @returns {string} e.g. "60m" or "1h 15m"
 */
export function calculateSlotDuration(start, end) {
  if (!start || !end) return '';
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);

  if (totalMinutes <= 0) return '';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Formats a 24h time string (e.g. "09:00" or "13:00") into clean 12h or standard range.
 * @param {string} time24
 * @returns {string}
 */
export function formatTimeSlotDisplay(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}
