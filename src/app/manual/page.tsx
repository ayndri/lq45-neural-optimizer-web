'use client';
import { useState, useMemo } from 'react';
import rawData from '../../data/lq45_stats.json';

// Tipe data disamakan dengan keluaran JSON dari Python Flask
export interface StockItem {
  Ticker: string;
  Expected_Return_Annual: number;
  Risk_Annual: number;
  Last_Price: number;
}

const stockData: StockItem[] = rawData as StockItem[];

export default function ManualPicker() {
  const [searchTerm, setSearchTerm] = useState('');
  const [lotMap, setLotMap] = useState<Record<string, number>>({});
  const [years, setYears] = useState<number>(5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val);
  };

  const handleLotChange = (ticker: string, value: number) => {
    setLotMap(prev => {
      const newMap = { ...prev };
      if (value <= 0) {
        delete newMap[ticker];
      } else {
        newMap[ticker] = value;
      }
      return newMap;
    });
  };

  // Kalkulasi agregat
  const { totalCost, totalProfit, totalLots } = useMemo(() => {
    let cost = 0;
    let profit = 0;
    let lots = 0;
    Object.entries(lotMap).forEach(([ticker, lotCount]) => {
      const stock = stockData.find(s => s.Ticker === ticker);
      if (stock) {
        const costPerLot = stock.Last_Price * 100;
        cost += costPerLot * lotCount;
        profit += costPerLot * lotCount * stock.Expected_Return_Annual;
        lots += lotCount;
      }
    });
    return { totalCost: cost, totalProfit: profit, totalLots: lots };
  }, [lotMap]);

  const expectedAnnualGrowthPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  // Simulasi Bunga Majemuk (Compound Interest)
  const compoundSimulations = useMemo(() => {
    const sims = [];
    let currentBalance = totalCost;
    if (totalCost > 0) {
      for (let y = 1; y <= years; y++) {
        const profitForYear = currentBalance * (expectedAnnualGrowthPct / 100);
        currentBalance += profitForYear;
        sims.push({
          year: y,
          profit: profitForYear,
          endBalance: currentBalance
        });
      }
    }
    return sims;
  }, [years, totalCost, expectedAnnualGrowthPct]);

  const filteredStocks = stockData.filter(stock => 
    stock.Ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="container">
      <div className="header">
        <h1 className="title-gradient">Manual Stock Picker & Simulator</h1>
        <p className="subtitle">Susun portofolio saham pilihan Anda sendiri dan proyeksikan returnnya</p>
      </div>

      <div className="results-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <span className="stat-label">Total Modal (Cost)</span>
          <span className="stat-value neutral">{formatCurrency(totalCost)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Estimasi Profit Tahunan</span>
          <span className="stat-value success">{totalProfit >= 0 ? "+" : ""}{formatCurrency(totalProfit)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Lot Dipilih</span>
          <span className="stat-value" style={{ color: 'var(--accent-purple)' }}>{totalLots} Lot</span>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '40px' }}>
        <h3 className="input-label" style={{ marginBottom: '15px' }}>Pemilihan Saham (Manual)</h3>
        <input 
          type="text" 
          placeholder="Cari Kode Ticker Saham (Misal: BBCA)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="budget-input"
          style={{ marginBottom: '20px', width: '100%', maxWidth: '400px' }}
        />

        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="stock-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Harga 1 Lot</th>
                <th>Ekspektasi Return</th>
                <th>Risiko</th>
                <th>Tindakan (Lot)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                const costPerLot = stock.Last_Price * 100;
                const returnPct = stock.Expected_Return_Annual * 100;
                const riskPct = stock.Risk_Annual * 100;
                const currentLots = lotMap[stock.Ticker] || 0;

                return (
                  <tr key={stock.Ticker} style={{ backgroundColor: currentLots > 0 ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                    <td><strong>{stock.Ticker}</strong></td>
                    <td>{formatCurrency(costPerLot)}</td>
                    <td className={returnPct >= 0 ? 'positive-return' : 'negative-return'}>
                      {returnPct.toFixed(2)}%
                    </td>
                    <td style={{ color: riskPct > 40 ? 'var(--danger)' : riskPct > 20 ? 'orange' : 'var(--success)' }}>
                      {riskPct.toFixed(2)}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                          onClick={() => handleLotChange(stock.Ticker, currentLots - 1)}
                          style={{ padding: '5px 15px', borderRadius: '5px', background: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}
                        >-</button>
                        <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>{currentLots}</span>
                        <button 
                          onClick={() => handleLotChange(stock.Ticker, currentLots + 1)}
                          style={{ padding: '5px 15px', borderRadius: '5px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer' }}
                        >+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalCost > 0 && (
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
          <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className="title-gradient" style={{ fontSize: '1.8rem', marginBottom: '10px' }}>Mesin Waktu Bunga Majemuk</h2>
            <h3>Agregat Portofolio Pertumbuhan: <span style={{ color: 'var(--success)', fontSize: '1.5rem' }}>+{expectedAnnualGrowthPct.toFixed(2)}%</span> / tahun</h3>
            <p style={{ color: 'var(--text-muted)' }}>Mensimulasikan keuntungan portofolio kustom Anda selama beberapa tahun ke depan.</p>
            
            <div style={{ marginTop: '30px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px' }}>
              <label className="input-label" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Jangka Waktu: <strong>{years} Tahun</strong></label>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={years}
                onChange={(e) => setYears(parseInt(e.target.value))}
                className="risk-slider"
                style={{ marginBottom: '10px' }}
              />
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="input-label" style={{ marginBottom: '20px' }}>Rincian Laju Bunga Majemuk</h3>
            <div className="table-container">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Tahun Ke-</th>
                    <th>Modal Awal Tahun</th>
                    <th>Keuntungan Portofolio</th>
                    <th>Aset Akhir Tahun</th>
                  </tr>
                </thead>
                <tbody>
                  {compoundSimulations.map((sim) => (
                    <tr key={sim.year}>
                      <td><strong>Tahun {sim.year}</strong></td>
                      <td>{formatCurrency(sim.endBalance - sim.profit)}</td>
                      <td className="positive-return">+{formatCurrency(sim.profit)}</td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{formatCurrency(sim.endBalance)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'rgba(16, 185, 129, 0.1)', fontWeight: 'bold' }}>
                    <td colSpan={2}>Nilai Final Di Tahun Ke-{years}</td>
                    <td className="positive-return">+{formatCurrency(compoundSimulations[compoundSimulations.length - 1]?.endBalance - totalCost)}</td>
                    <td style={{ color: 'var(--accent-cyan)' }}>{formatCurrency(compoundSimulations[compoundSimulations.length - 1]?.endBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '50px' }}>
         <a href="/" className="btn-optimize" style={{ background: '#334155', width: 'auto', display: 'inline-block', textDecoration: 'none' }}>
           ← Kembali ke Dasbor AI Utama
         </a>
      </div>
    </main>
  );
}
