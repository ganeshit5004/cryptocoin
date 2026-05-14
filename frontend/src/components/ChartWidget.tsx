import { LineChart } from '@mui/x-charts/LineChart';

interface ChartWidgetProps {
  data: any[];
}

export default function ChartWidget({ data }: ChartWidgetProps) {
  if (!data || data.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No chart data available.</div>;

  // Format data for MUI X Charts (must be chronological order)
  const chronologicalData = [...data].reverse();
  const xData = chronologicalData.map(item => new Date(item.timestamp));
  const priceData = chronologicalData.map(item => item.price);

  // Calculate SMAs (will pad with nulls at the start)
  const sma3Data = chronologicalData.map((item, i, arr) => {
    if (i < 2) return null;
    return (arr[i-2].price + arr[i-1].price + arr[i].price) / 3;
  });

  const sma5Data = chronologicalData.map((item, i, arr) => {
    if (i < 4) return null;
    return (arr[i-4].price + arr[i-3].price + arr[i-2].price + arr[i-1].price + arr[i].price) / 5;
  });

  return (
    <div style={{ width: '100%', height: '100%', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)', border: '1px solid rgba(255, 255, 255, 0.05)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0', fontWeight: 600, letterSpacing: '0.5px' }}>Price & Strategy MA Analysis</h3>
      <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
        <LineChart
          xAxis={[
            { 
              data: xData, 
              scaleType: 'time', 
              tickLabelStyle: { fill: '#94a3b8', fontSize: 11 },
              valueFormatter: (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]}
          yAxis={[
            {
              min: Math.min(...priceData) * 0.999,
              max: Math.max(...priceData) * 1.001,
              tickLabelStyle: { fill: '#94a3b8', fontSize: 11 },
              valueFormatter: (val) => `$${val.toLocaleString()}`
            }
          ]}
          series={[
            { 
              data: priceData, 
              label: 'Asset Price',
              color: '#38bdf8',
              showMark: false,
              connectNulls: true,
              curve: 'linear'
            },
            { 
              data: sma3Data, 
              label: 'Short SMA (3)',
              color: '#facc15',
              showMark: false,
              connectNulls: true,
              curve: 'linear'
            },
            { 
              data: sma5Data, 
              label: 'Long SMA (5)',
              color: '#c084fc',
              showMark: false,
              connectNulls: true,
              curve: 'linear'
            }
          ]}
          grid={{ vertical: false, horizontal: true }}
          slotProps={{
            legend: {
              labelStyle: { fill: '#e2e8f0', fontSize: 13, fontWeight: 500 },
              itemMarkWidth: 12,
              itemMarkHeight: 12,
              markGap: 6,
              itemGap: 20,
            }
          }}
          margin={{ top: 10, right: 20, bottom: 30, left: 70 }}
          sx={{
            '.MuiLineElement-root': {
              strokeWidth: 2.5,
            },
            '.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
              fill: '#94a3b8 !important',
            },
            '.MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
              fill: '#94a3b8 !important',
            },
            '.MuiChartsAxis-line': {
              stroke: '#334155 !important',
            },
            '.MuiChartsAxis-tick': {
              stroke: '#334155 !important',
            },
            '.MuiChartsGrid-line': {
              stroke: 'rgba(255,255,255,0.05) !important',
            },
            '.MuiChartsTooltip-root': {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #334155',
              color: '#f8fafc',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
            }
          }}
        />
      </div>
    </div>
  );
}
