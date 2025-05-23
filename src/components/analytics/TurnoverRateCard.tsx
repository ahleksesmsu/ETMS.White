import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface TurnoverRateCardProps {
  currentRate: number;
  previousRate?: number;
  title: string;
  className?: string;
}

const TurnoverRateCard: React.FC<TurnoverRateCardProps> = ({
  currentRate,
  previousRate,
  title,
  className = '',
}) => {
  const formattedRate = `${(currentRate * 100).toFixed(1)}%`;
  
  let changeDisplay = null;
  
  if (previousRate !== undefined) {
    const change = currentRate - previousRate;
    const changePercent = Math.abs(change * 100).toFixed(1);
    
    if (change < 0) {
      changeDisplay = (
        <div className="flex items-center text-green-600">
          <ArrowDown size={16} />
          <span className="ml-1">{changePercent}%</span>
        </div>
      );
    } else if (change > 0) {
      changeDisplay = (
        <div className="flex items-center text-red-600">
          <ArrowUp size={16} />
          <span className="ml-1">{changePercent}%</span>
        </div>
      );
    } else {
      changeDisplay = <div className="text-gray-600">No change</div>;
    }
  }
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold">{formattedRate}</div>
        {changeDisplay}
      </div>
    </div>
  );
};

export default TurnoverRateCard