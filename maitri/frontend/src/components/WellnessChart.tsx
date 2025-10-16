import { useEffect, useRef } from 'react';

interface WellnessData {
  timestamp: Date;
  overall: number;
  emotional: number;
  physical: number;
  stress: number;
  energy: number;
}

interface WellnessChartProps {
  data: WellnessData[];
  height?: number;
}

export function WellnessChart({ data = [], height = 200 }: WellnessChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Vertical grid lines
    const maxPoints = Math.min(data.length, 10);
    for (let i = 0; i <= maxPoints; i++) {
      const x = padding + (chartWidth / maxPoints) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      const value = (1 - i * 0.25).toFixed(1);
      ctx.fillText(value, padding - 10, y);
    }

    if (data.length === 0) return;

    // Prepare data for plotting
    const recentData = data.slice(-maxPoints);
    const xStep = chartWidth / (recentData.length - 1 || 1);

    // Draw wellness score line
    const drawLine = (values: number[], color: string, lineWidth = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      values.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = padding + chartHeight - (value * chartHeight);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw points
      ctx.fillStyle = color;
      values.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = padding + chartHeight - (value * chartHeight);
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // Draw overall wellness line (main line)
    drawLine(recentData.map(d => d.overall), '#3b82f6', 3);

    // Draw other metrics with lighter colors
    drawLine(recentData.map(d => d.emotional), '#10b981', 1);
    drawLine(recentData.map(d => d.physical), '#f59e0b', 1);
    drawLine(recentData.map(d => 1 - d.stress), '#ef4444', 1); // Invert stress for better visualization
    drawLine(recentData.map(d => d.energy), '#8b5cf6', 1);

  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm">No wellness data available</p>
          <p className="text-gray-400 text-xs">Start a session to see your wellness trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="w-full border border-gray-200 rounded-lg"
        style={{ height }}
      />
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-blue-600 mr-2"></div>
          <span className="text-gray-600">Overall</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-green-600 mr-2"></div>
          <span className="text-gray-600">Emotional</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-yellow-600 mr-2"></div>
          <span className="text-gray-600">Physical</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-red-600 mr-2"></div>
          <span className="text-gray-600">Stress (inverted)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-0.5 bg-purple-600 mr-2"></div>
          <span className="text-gray-600">Energy</span>
        </div>
      </div>
    </div>
  );
}