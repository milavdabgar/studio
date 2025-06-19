// src/components/shortcodes/Chart.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ChartProps {
  children?: string; // Chart configuration as string
  type?: string;
  data?: any;
  options?: any;
  className?: string;
}

export function Chart({ children, type, data, options, className }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const loadChartJs = async () => {
      try {
        // Dynamically import Chart.js to avoid SSR issues
        const { Chart: ChartJS } = await import('chart.js/auto');
        
        if (!canvasRef.current) return;

        // Destroy existing chart
        if (chartRef.current) {
          chartRef.current.destroy();
        }

        let chartConfig;

        // Parse configuration from children content or props
        if (children && children.trim()) {
          try {
            // Parse the chart configuration from the shortcode content
            const configString = children.trim();
            // Handle both object notation and JSON
            if (configString.startsWith('{')) {
              chartConfig = new Function('return ' + configString)();
            } else {
              // Handle YAML-like or simple key-value format
              chartConfig = parseSimpleConfig(configString);
            }
          } catch (error) {
            console.error('Error parsing chart configuration:', error);
            return;
          }
        } else if (type && data) {
          // Use props-based configuration
          chartConfig = {
            type,
            data,
            options: options || {}
          };
        } else {
          console.error('Chart component requires either children content or type/data props');
          return;
        }

        // Create the chart
        chartRef.current = new ChartJS(canvasRef.current, chartConfig);
      } catch (error) {
        console.error('Error loading Chart.js:', error);
      }
    };

    loadChartJs();

    // Cleanup
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [children, type, data, options]);

  const parseSimpleConfig = (configString: string) => {
    // Simple parser for YAML-like configuration
    const lines = configString.split('\n').filter(line => line.trim());
    const config: any = {};
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        try {
          // Try to parse as JSON
          config[key.trim()] = JSON.parse(value);
        } catch {
          // Fallback to string
          config[key.trim()] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    });

    return config;
  };

  return (
    <div className={cn('w-full max-w-4xl mx-auto p-4', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxHeight: '400px' }}
        />
      </div>
    </div>
  );
}

export default Chart;
