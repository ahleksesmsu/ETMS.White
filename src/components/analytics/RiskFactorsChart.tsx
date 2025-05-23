import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RiskFactor } from '../../types/analytics';

interface RiskFactorsChartProps {
  data: RiskFactor[];
  isLoading: boolean;
}

const RiskFactorsChart: React.FC<RiskFactorsChartProps> = ({ data, isLoading }) => {
  const formattedData = data.map(item => ({
    factor: item.factor,
    correlation: parseFloat((item.correlation * 100).toFixed(1)),
  })).sort((a, b) => b.correlation - a.correlation);

  // Get color based on correlation strength
  const getBarColor = (correlation: number) => {
    if (correlation < 30) return '#9CA3AF';  // Gray
    if (correlation < 50) return '#EAB308';  // Yellow
    if (correlation < 70) return '#F97316';  // Orange
    return '#DC2626';  // Red
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Key Turnover Risk Factors</h3>
      
      {isLoading ? (
        <div className="animate-pulse flex flex-col justify-center items-center h-64">
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          No risk factor data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={formattedData.slice(0, 5)} 
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <YAxis 
              type="category" 
              dataKey="factor" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Correlation']}
              labelFormatter={(label) => `Factor: ${label}`}
            />
            <Bar 
              dataKey="correlation" 
              name="Correlation" 
              radius={[0, 4, 4, 0]}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.correlation)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default RiskFactorsChart