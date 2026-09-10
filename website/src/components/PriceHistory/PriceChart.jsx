import { useEffect, useRef } from 'react';
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

// Register Chart.js components
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
        borderColor: '#4F8EF7',
        backgroundColor: 'rgba(79, 142, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#4F8EF7',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#e0e0e0' } },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            return ` $${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#999' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: {
          color: '#999',
          callback: (val) => '$' + val,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}
