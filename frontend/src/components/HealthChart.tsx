import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TelemetrySnapshot } from '../types';

interface HealthChartProps {
  data: TelemetrySnapshot[];
  cpuThreshold?: number;
  memoryThreshold?: number;
}

export const HealthChart: React.FC<HealthChartProps> = ({
  data,
  cpuThreshold = 80,
  memoryThreshold = 85,
}) => {
  const chartData = data.length > 0 ? data : [
    { timestamp: '00:00:00', cpu: 15, memory: 50, disk: 45, network_mb_s: 1.0 }
  ];

  return (
    <div className="bg-[#111827] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Real-Time Hardware Telemetry
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sliding telemetry window showing CPU & Memory utilization relative to safety thresholds.
          </p>
        </div>
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span className="text-slate-300">CPU %</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500"></span>
            <span className="text-slate-300">Memory %</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-red-500"></span>
            <span className="text-red-400 font-semibold">Threshold</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

            <XAxis 
              dataKey="timestamp" 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }} 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#64748B" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#334155' }} 
              unit="%" 
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F8FAFC',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              }}
              formatter={(val: any) => [`${val}%`, '']}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine 
              y={cpuThreshold} 
              stroke="#EF4444" 
              strokeDasharray="4 4" 
              strokeWidth={1.5}
              label={{ value: `CPU Limit (${cpuThreshold}%)`, fill: '#EF4444', fontSize: 10, position: 'right' }} 
            />

            <Area
              type="monotone"
              dataKey="cpu"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#cpuGradient)"
              name="CPU"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#memoryGradient)"
              name="Memory"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
