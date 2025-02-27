import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Определяем тип данных исторических цен
export interface HistoricalDataPoint {
  timestamp: number; // Unix timestamp в секундах
  price: number;
}

interface TokenHistoricalChartProps {
  historicalData: HistoricalDataPoint[];
}

// Функция для форматирования даты
const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

// Основной компонент, оптимизированный с помощью React.memo
const TokenHistoricalChart: React.FC<TokenHistoricalChartProps> = React.memo(({ historicalData }) => {
  // Сортировка данных по времени по возрастанию, если еще не отсортированы
  const sortedData = React.useMemo(() => {
    return [...historicalData].sort((a, b) => a.timestamp - b.timestamp);
  }, [historicalData]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Historical Price Chart</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTimestamp}
            stroke="#D1D5DB"
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#D1D5DB', fontSize: 12 }}
          />
          <Tooltip
            labelFormatter={(value) => formatTimestamp(value as number)}
            contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
            itemStyle={{ color: '#F9FAFB' }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

TokenHistoricalChart.displayName = 'TokenHistoricalChart';

export default TokenHistoricalChart; 