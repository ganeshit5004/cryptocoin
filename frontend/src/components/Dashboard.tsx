import { useState, useEffect } from 'react';
import api from '../api/client';
import ChartWidget from './ChartWidget';
import StrategyPanel from './StrategyPanel';

export default function Dashboard() {
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [dailyHistory, setDailyHistory] = useState<any[]>([]);
  const [isDailyHistoryLoading, setIsDailyHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch available markets
    api.get('/markets').then(res => {
      setAssets(res.data);
      if (res.data.length > 0 && !selectedAsset) {
        setSelectedAsset(res.data[0].symbol);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedAsset) return;

    const fetchData = () => {
      // Fetch history
      api.get(`/history?symbol=${selectedAsset}&limit=50`).then(res => {
        setHistoryData(res.data);
      }).catch(console.error);

      // Fetch analytics
      api.get(`/analytics?symbol=${selectedAsset}`).then(res => {
        setAnalytics(res.data);
      }).catch(console.error);
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [selectedAsset]);

  // Fetch 5-day daily history when modal opens
  useEffect(() => {
    if (isHistoryModalOpen && selectedAsset) {
      setIsDailyHistoryLoading(true);
      setHistoryError(null);
      api.get(`/history/daily?symbol=${selectedAsset}&days=5`)
        .then(res => {
          setDailyHistory(res.data);
        })
        .catch((err) => {
          console.error(err);
          if (err.response && err.response.status === 429) {
             setHistoryError("Rate limit exceeded from CoinGecko. Please try again in a few minutes.");
          } else {
             setHistoryError("Failed to fetch historical data.");
          }
        })
        .finally(() => setIsDailyHistoryLoading(false));
    }
  }, [isHistoryModalOpen, selectedAsset]);

  return (
    <div style={{ width: '100%', margin: '0', padding: '1.5rem', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif", background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', color: '#e2e8f0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: 0, color: '#38bdf8', fontSize: '2.2rem', fontWeight: 800, textShadow: '0 2px 10px rgba(56, 189, 248, 0.2)' }}>Crypto Market Analytics</h1>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
          <h3 style={{ marginBottom: '1rem', marginTop: 0, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Available Assets</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flex: 1 }}>
            {assets.map(asset => (
              <li
                key={asset.symbol}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.8rem 1rem',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  transition: 'all 0.2s ease-in-out',
                  background: selectedAsset === asset.symbol ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  border: selectedAsset === asset.symbol ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
                  fontWeight: selectedAsset === asset.symbol ? '600' : '400',
                  color: selectedAsset === asset.symbol ? '#38bdf8' : '#e2e8f0'
                }}
              >
                <div style={{ flex: 1 }} onClick={() => setSelectedAsset(asset.symbol)}>
                  {asset.name} <span style={{ opacity: 0.5, fontSize: '0.85em', float: 'right', marginRight: '0.5rem' }}>{asset.symbol}</span>
                </div>
                {selectedAsset === asset.symbol && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsHistoryModalOpen(true); }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                    title="View History"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {selectedAsset && (
            <>
              {/* Header Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.5)', backdropFilter: 'blur(10px)', padding: '1.5rem 2rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>{selectedAsset}</h2>
                  {historyData.length > 0 && (
                    <p style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0.2rem 0 0 0', color: '#38bdf8' }}>
                      ${historyData[0].price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </p>
                  )}
                </div>
                {analytics && (
                  <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1.2rem', borderRadius: '12px' }}>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Change</p>
                      <p style={{ color: analytics.price_change_pct >= 0 ? '#4ade80' : '#f87171', margin: '0.3rem 0 0 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {analytics.price_change_pct > 0 ? '+' : ''}{analytics.price_change_pct}%
                      </p>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1.2rem', borderRadius: '12px' }}>
                      <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volume Change</p>
                      <p style={{ color: analytics.volume_change_pct >= 0 ? '#4ade80' : '#f87171', margin: '0.3rem 0 0 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {analytics.volume_change_pct > 0 ? '+' : ''}{analytics.volume_change_pct}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart and Strategy Panel */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flex: 1, minHeight: 0 }}>
                <div style={{ flex: '2', minWidth: 0, height: '100%' }}>
                  <ChartWidget data={historyData} />
                </div>
                <div style={{ flex: '1', minWidth: 0, height: '100%' }}>
                  <StrategyPanel symbol={selectedAsset} historyData={historyData} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* History Modal Overlay */}
      {isHistoryModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '2rem', width: '400px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>{selectedAsset} Daily Price History</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {isDailyHistoryLoading ? (
                 <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>Fetching daily history...</p>
              ) : historyError ? (
                 <div style={{ padding: '1rem', background: 'rgba(248, 113, 113, 0.1)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '8px', color: '#f87171', textAlign: 'center', fontSize: '0.9rem' }}>
                   {historyError}
                 </div>
              ) : dailyHistory.length > 0 ? dailyHistory.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '1rem' }}>
                  <span style={{ color: '#cbd5e1' }}>{new Date(item.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span style={{ fontWeight: '600', color: '#38bdf8' }}>${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                </div>
              )) : (
                <p style={{ color: '#94a3b8', textAlign: 'center' }}>No historical data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
