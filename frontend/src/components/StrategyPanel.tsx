import { useState, useEffect } from 'react';
import api from '../api/client';

interface StrategyPanelProps {
  symbol: string;
  historyData?: any[];
}

export default function StrategyPanel({ symbol, historyData = [] }: StrategyPanelProps) {
  const [signalData, setSignalData] = useState<any>(null);

  useEffect(() => {
    const runStrategy = async () => {
      try {
        const response = await api.post(`/strategy/run?symbol=${symbol}`);
        setSignalData(response.data);
      } catch (error) {
        console.error("Error running strategy", error);
      }
    };

    if (symbol) {
      runStrategy();
    }
  }, [symbol, historyData]); // Auto-runs when symbol changes or new history data arrives

  return (
    <div style={{ height: '100%', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', color: '#f8fafc', boxSizing: 'border-box', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600, letterSpacing: '0.5px' }}>Strategy: Simple Moving Average Crossover</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Asset: <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{symbol}</span></p>

      {signalData && (
        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: `4px solid ${signalData.signal === 'BUY' ? '#4ade80' : signalData.signal === 'SELL' ? '#f87171' : '#fbbf24'}` }}>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Signal: <span style={{ color: signalData.signal === 'BUY' ? '#4ade80' : signalData.signal === 'SELL' ? '#f87171' : '#fbbf24', letterSpacing: '1px' }}>{signalData.signal}</span></h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Short SMA (3t)</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{signalData.short_sma ? `$${signalData.short_sma.toLocaleString()}` : 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Long SMA (5t)</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{signalData.long_sma ? `$${signalData.long_sma.toLocaleString()}` : 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Latest Price</p>
              <p style={{ margin: 0, fontWeight: 'bold' }}>${signalData.latest_price ? signalData.latest_price.toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
