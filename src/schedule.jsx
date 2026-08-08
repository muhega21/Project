import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Wrench
} from 'lucide-react';

const MOCK_EVENTS = [
  { id: 1, date: 5, title: 'Inspeksi Pompa Air', asset: 'PLT-102', worker: 'Budi Santoso', status: 'Pending' },
  { id: 2, date: 5, title: 'Ganti Oli Hidrolik', asset: 'PLT-105', worker: 'Agus Setiawan', status: 'In Progress' },
  { id: 3, date: 12, title: 'Kalibrasi Sensor', asset: 'PLT-201', worker: 'Joko Widodo', status: 'Pending' },
  { id: 4, date: 15, title: 'Preventive Boiler', asset: 'PLT-102', worker: 'Budi Santoso', status: 'Completed' },
  { id: 5, date: 22, title: 'Cek HVAC Gudang', asset: 'PLT-300', worker: 'Hadi Suyono', status: 'Pending' },
];

function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Make Monday the first day (0)

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const renderCells = () => {
    const cells = [];
    // Empty cells for previous month
    for (let i = 0; i < offset; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[100px] border border-border-color bg-bg-dark/50 p-2"></div>);
    }
    
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = MOCK_EVENTS.filter(e => e.date === i);
      const isToday = i === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
      
      cells.push(
        <div key={i} className={`min-h-[120px] border border-border-color bg-bg-surface p-2 transition-colors hover:bg-btn-secondary/80 ${isToday ? 'ring-2 ring-[#FF7043] ring-inset' : ''}`}>
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#FF7043] text-text-primary' : 'text-text-secondary'}`}>
              {i}
            </span>
            {dayEvents.length > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">{dayEvents.length} Tasks</span>}
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] scrollbar-thin">
            {dayEvents.map(event => (
              <div key={event.id} className="text-xs p-1.5 bg-bg-dark border-l-2 border-[#FF7043] rounded cursor-pointer hover:bg-gray-700 transition-colors" title={`${event.title} - ${event.worker}`}>
                <div className="font-semibold text-text-primary truncate">{event.title}</div>
                <div className="text-text-secondary truncate">{event.asset}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // Empty cells for next month
    const totalCells = cells.length;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remaining; i++) {
      cells.push(<div key={`empty-next-${i}`} className="min-h-[100px] border border-border-color bg-bg-dark/50 p-2"></div>);
    }
    
    return cells;
  };

  return (
    <div className="flex flex-col h-full gap-6 text-text-primary font-sans">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors border border-border-color"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-bold text-text-primary min-w-[150px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors border border-border-color"><ChevronRight size={20} /></button>
        </div>
        
        <div className="flex gap-3">
          <button className="bg-bg-surface border border-border-color hover:bg-btn-secondary text-text-primary px-4 py-2 rounded-lg font-medium transition-colors">
            Hari Ini
          </button>
          <button className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95">
            <CalendarIcon size={18} /> Tambah Jadwal
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow-lg overflow-hidden flex-1 flex flex-col">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-bg-dark border-b border-border-color">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-text-secondary">
              {day}
            </div>
          ))}
        </div>
        {/* Days Cells */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {renderCells()}
        </div>
      </div>

    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Schedule />);
