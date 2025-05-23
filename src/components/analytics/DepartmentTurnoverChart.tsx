import React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DepartmentTurnover } from '../../types/analytics';

interface DepartmentTurnoverChartProps {
  data: DepartmentTurnover[];
  isLoading: boolean;
}

const DepartmentTurnoverChart: React.FC<DepartmentTurnoverChartProps> = ({ data, isLoading }) => {
  const formattedData = data.map(item => ({
    department: item.department,
    rate: parseFloat((item.rate * 100).toFixed(1)),
    employeeCount: item.employee_count,
    leftCount: item.left_count,
  }));

  // Get color based on turnover rate
  const getBarColor = (rate: number) => {
    if (rate < 10) return '#16A34A';
    if (rate < 20) return '#EAB308';
    return '#DC2626';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium mb-4">Turnover by Department</h3>
      
      {isLoading ? (
        <div className="animate-pulse flex flex-col justify-center items-center h-64">
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={formattedData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `${value}%`}
              domain={[0, 'dataMax + 5']}
            />
            <YAxis 
              type="category" 
              dataKey="department" 
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'rate') return [`${value}%`, 'Turnover Rate'];
                if (name === 'employeeCount') return [value, 'Total Employees'];
                if (name === 'leftCount') return [value, 'Employees Left'];
                return [value, name];
              }}
            />
            <Bar 
              dataKey="rate" 
              name="Turnover Rate"
              radius={[0, 4, 4, 0]}
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DepartmentTurnoverChart