import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  TrendingUp, Activity, CheckCircle, Clock 
} from 'lucide-react';

function Report() {
  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);

  useEffect(() => {
    let chart1, chart2;
    if (window.Chart) {
      // Common Theme settings for charts
      window.Chart.defaults.color = '#9CA3AF';
      window.Chart.defaults.font.family = 'Outfit';
      
      // Chart 1: Work Orders Trend
      const ctx1 = chartRef1.current.getContext('2d');
      chart1 = new window.Chart(ctx1, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'],
          datasets: [
            {
              label: 'WO Selesai',
              data: [45, 52, 48, 61, 59, 65, 72, 81],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'WO Tertunda',
              data: [12, 19, 15, 10, 8, 14, 9, 5],
              borderColor: '#FFB302',
              backgroundColor: 'rgba(255, 179, 2, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: { grid: { color: '#374151' } },
            x: { grid: { color: '#374151' } }
          }
        }
      });

      // Chart 2: Asset Downtime
      const ctx2 = chartRef2.current.getContext('2d');
      chart2 = new window.Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Boiler Area', 'Genset Room', 'Water Treatment', 'HVAC Central'],
          datasets: [{
            label: 'Downtime (Jam)',
            data: [24, 18, 12, 36],
            backgroundColor: '#FF7043',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { grid: { color: '#374151' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    return () => {
      if (chart1) chart1.destroy();
      if (chart2) chart2.destroy();
    };
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 text-gray-200 font-sans">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">WO Selesai (Bulan ini)</div>
            <div className="text-2xl font-bold text-white">81</div>
          </div>
        </div>
        
        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">Rata-rata Waktu Respon</div>
            <div className="text-2xl font-bold text-white">1.2 <span className="text-sm font-normal text-gray-500">Jam</span></div>
          </div>
        </div>

        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">Produktivitas Teknisi</div>
            <div className="text-2xl font-bold text-white">94%</div>
          </div>
        </div>
        
        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total Downtime</div>
            <div className="text-2xl font-bold text-white">90 <span className="text-sm font-normal text-gray-500">Jam</span></div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Trend Chart */}
        <div className="bg-bg-surface rounded-xl border border-gray-700 shadow-lg flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Tren Penyelesaian Pekerjaan (YTD)</h3>
            <select className="bg-[#12161A] border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:border-[#FF7043]">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="relative flex-1 w-full min-h-[300px]">
            <canvas ref={chartRef1}></canvas>
          </div>
        </div>

        {/* Downtime Chart */}
        <div className="bg-bg-surface rounded-xl border border-gray-700 shadow-lg flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Downtime Aset Tertinggi</h3>
            <select className="bg-[#12161A] border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:border-[#FF7043]">
              <option>Bulan Ini</option>
              <option>Kuartal Ini</option>
            </select>
          </div>
          <div className="relative flex-1 w-full min-h-[300px]">
            <canvas ref={chartRef2}></canvas>
          </div>
        </div>
      </div>

    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Report />);
