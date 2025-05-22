import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MonthlyRate } from '../../types/analytics';

interface TurnoverTrendsChartProps {
  data: MonthlyRate[];
  isLoading: boolean;
}

const TurnoverTrendsChart: React.FC<TurnoverTrendsChartProps> = ({ data, isLoading }) => {
  const formattedData = data.map(item => ({
    month: item.month,
    rate: parseFloat((item.rate * 100).toFixed(1)),
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Turnover Rate Trends</h3>
      
      {isLoading ? (
        <div className="animate-pulse flex flex-col justify-center items-center h-64">
          <div className="h-1 bg-gray-200 rounded w-full mb-2.5"></div>
          <div className="h-1 bg-gray-200 rounded w-full mb-2.5"></div>
          <div className="h-1 bg-gray-200 rounded w-full mb-2.5"></div>
          <div className="h-1 bg-gray-200 rounded w-full mb-2.5"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
            <XAxis 
              dataKey="month" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'dataMax + 5']}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Turnover Rate']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="rate" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Turnover Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TurnoverTrendsChart;