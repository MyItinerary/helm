'use client'

import { Line } from 'react-chartjs-2'
import {
  BarElement, CategoryScale, Chart, Filler, LinearScale,
  LineElement, PointElement, Tooltip,
} from 'chart.js'
import useComputedStyle from '@/hooks/use-computed-style'

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

export default function TrafficChart() {
  const borderColor = useComputedStyle('--bs-border-color')
  const bodyColor = useComputedStyle('--bs-body-color')

  return (
    <Line
      data={{
        labels: MONTHS,
        datasets: [
          {
            label: 'Bookings',
            backgroundColor: 'rgba(13, 110, 253, 0.15)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 2,
            data: [65, 59, 84, 84, 51, 55, 40],
            fill: true,
          },
          {
            label: 'Revenue',
            borderColor: 'rgba(25, 135, 84, 1)',
            borderWidth: 2,
            data: [28, 48, 40, 19, 86, 27, 90],
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: { legend: { display: true } },
        scales: {
          x: {
            grid: { color: borderColor, drawOnChartArea: false },
            ticks: { color: bodyColor },
          },
          y: {
            beginAtZero: true,
            border: { color: borderColor },
            grid: { color: borderColor },
            ticks: { color: bodyColor, maxTicksLimit: 5 },
          },
        },
        elements: {
          line: { tension: 0.4 },
          point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
        },
      }}
    />
  )
}
