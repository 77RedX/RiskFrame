import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PriceChart({ ticker, dates, prices }) {
  const chartRef = useRef(null);

  const data = {
    labels: dates,
    datasets: [
      {
        label: `${ticker} Closing Price`,
        data: prices,
        borderColor: '#D4AF37',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(212, 175, 55, 0.22)');
          gradient.addColorStop(1, 'rgba(212, 175, 55, 0.00)');
          return gradient;
        },
        borderWidth: 2,
        fill: true,
        tension: 0.25,
        pointBackgroundColor: '#F6F6F8',
        pointBorderColor: '#D4AF37',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#D4AF37',
        pointHoverBorderColor: '#FFFFFF',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: '#EAE0CE',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 18, 22, 0.95)',
        titleColor: '#EAE0CE',
        bodyColor: '#F6F6F8',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { family: "'JetBrains Mono', monospace", size: 12 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 13, weight: '600' },
        callbacks: {
          label: function (context) {
            return ` ${ticker}: $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6E7282',
          font: { family: "'JetBrains Mono', monospace", size: 11 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      y: {
        ticks: {
          color: '#6E7282',
          font: { family: "'JetBrains Mono', monospace", size: 11 },
          callback: (val) => '$' + val,
        },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}
