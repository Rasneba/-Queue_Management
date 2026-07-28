'use client';
import { useState, useEffect, memo } from 'react';

interface LiveClockProps {
  timeClassName?: string;
  dateClassName?: string;
  className?: string;
}

export default memo(function LiveClock({ timeClassName = '', dateClassName = '', className = '' }: LiveClockProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateStr(now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={className}>
      <div className={timeClassName}>{timeStr}</div>
      {dateStr && <div className={dateClassName}>{dateStr}</div>}
    </div>
  );
});
