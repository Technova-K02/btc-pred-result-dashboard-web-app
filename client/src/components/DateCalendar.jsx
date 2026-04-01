import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];

  const startWeekday = firstDay.getDay(); // 0-6, Sunday = 0
  for (let i = 0; i < startWeekday; i += 1) {
    days.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d += 1) {
    days.push(d);
  }

  return days;
}

function DateCalendar({ selectedDate, onChange, availableDates }) {
  const initial = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const days = getMonthDays(viewYear, viewMonth);

  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(selectedDate);
    if (Number.isNaN(d.getTime())) return;
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [selectedDate]);

  const availableSet = new Set(availableDates || []);

  function toKey(y, m, d) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  function handleSelect(day) {
    if (!day) return;
    const key = toKey(viewYear, viewMonth, day);
    onChange(key);
  }

  function handlePrevMonth() {
    let y = viewYear;
    let m = viewMonth - 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function handleNextMonth() {
    let y = viewYear;
    let m = viewMonth + 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  const monthLabel = String(viewMonth + 1).padStart(2, '0');
  const headerLabel = `${viewYear}-${monthLabel}`;

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav"
          onClick={handlePrevMonth}
        >
          ‹
        </button>
        <span>{headerLabel}</span>
        <button
          type="button"
          className="calendar-nav"
          onClick={handleNextMonth}
        >
          ›
        </button>
      </div>
      <div className="calendar-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dow) => (
          <div key={dow} className="calendar-dow">
            {dow}
          </div>
        ))}
        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="calendar-day empty" />;
          }
          const key = toKey(viewYear, viewMonth, day);
          const isSelected = selectedDate === key;
          const hasData = availableSet.has(key);
          const classNames = [
            'calendar-day',
            hasData ? 'has-data' : '',
            isSelected ? 'selected' : ''
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={key}
              type="button"
              className={classNames}
              onClick={() => handleSelect(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

DateCalendar.propTypes = {
  selectedDate: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  availableDates: PropTypes.arrayOf(PropTypes.string)
};

DateCalendar.defaultProps = {
  selectedDate: '',
  availableDates: []
};

export default DateCalendar;

