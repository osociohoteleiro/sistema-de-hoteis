import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onChange, 
  minDate = new Date(), 
  maxMonths = 12,
  className = '',
  placeholder = 'Selecionar período',
  error = null 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const getDisplayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} → ${formatDate(endDate)}`;
    } else if (startDate) {
      return `${formatDate(startDate)} → Selecionar data final`;
    } else {
      return placeholder;
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Don't allow dates before minDate
    if (clickedDate < minDate) return;
    
    if (!startDate || (startDate && endDate)) {
      // Start new range
      onChange(clickedDate, null);
    } else if (clickedDate < startDate) {
      // If clicked date is before start, make it the new start
      onChange(clickedDate, null);
    } else {
      // Set as end date
      onChange(startDate, clickedDate);
      setIsOpen(false);
    }
  };

  const isDateInRange = (day) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (endDate) {
      return date >= startDate && date <= endDate;
    } else if (hoveredDate && hoveredDate > startDate) {
      return date >= startDate && date <= hoveredDate;
    }
    
    return false;
  };

  const isStartDate = (day) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === startDate.toDateString();
  };

  const isEndDate = (day) => {
    if (!endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === endDate.toDateString();
  };

  const isDisabled = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date < minDate;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isInRange = isDateInRange(day);
      const isStart = isStartDate(day);
      const isEnd = isEndDate(day);
      const disabled = isDisabled(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => !disabled && handleDateClick(day)}
          onMouseEnter={() => {
            if (!disabled) {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              setHoveredDate(date);
            }
          }}
          disabled={disabled}
          className={`
            h-8 w-8 text-sm rounded-md flex items-center justify-center transition-colors
            ${disabled 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-900 hover:bg-blue-100 cursor-pointer'
            }
            ${isInRange && !isStart && !isEnd ? 'bg-blue-50' : ''}
            ${isStart || isEnd 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : ''
            }
            ${isStart && isEnd ? 'bg-blue-600' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full pl-10 pr-4 py-2 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
            ${error 
              ? 'border-red-300 bg-red-50' 
              : isOpen 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 bg-white hover:border-gray-400'
            }
            ${!startDate ? 'text-gray-500' : 'text-gray-900'}
          `}
        >
          {getDisplayText()}
        </button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              {currentMonth.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendar()}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;