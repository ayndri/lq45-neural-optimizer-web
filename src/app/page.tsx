'use client';
import { useState } from 'react';
import rawData from '../data/lq45_stats.json';

// Tipe data disamakan dengan keluaran JSON dari Python Flask
export interface StockItem {
  Ticker: string;
  Expected_Return_Annual: number;
  Risk_Annual: number;
  Last_Price: number;
}

export interface GAResult {
  best_portfolio: number[];
  best_fitness: number;
  history: number[]; 
  total_cost: number;
  total_profit: number;
  risk_level?: number;
  error?: boolean;
  message?: string;
}

const stockData: StockItem[] = rawData as StockItem[];

export default function Home() {
  const [budget, setBudget] = useState<string>('Rp 10.000.000');
  const [riskLevel, setRiskLevel] = useState<number>(10);
  const [result, setResult] = useState<GAResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val);
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numberStr = value.replace(/\D/g, "");
    if (!numberStr) {
      setBudget("");
      return;
    }
    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(parseInt(numberStr, 10));
    
    setBudget(formatted);
  };

  const getRiskLabel = (level: number) => {
    if (level <= 3) return "Konservatif (Diversifikasi Ekstrim)";
    if (level <= 6) return "Moderat (Setimbang)";
    if (level <= 8) return "Agresif (Risiko Tinggi)";
    return "Sangat Agresif (Fokus Profit Maksimal)";
  }

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setResult(null);
    setApiError(null);

    const budgetNum = parseInt(budget.replace(/\D/g, ''), 10) || 10000000;
      
    try {
      // 📡 Mengambil komputasi murni dari otak Python (Vercel Serverless Architecture)
      const req = await fetch('https://lq45-neural-optimizer-api.vercel.app/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: budgetNum, risk_level: riskLevel })
      });
      
      const data: GAResult = await req.json();
      
      if (data.error) {
         setApiError(data.message || "Unknown error dari Python");
      } else {
         setResult(data);
         // Simpan ke localStorage agar bisa dibaca halaman simulator proyeksi
         localStorage.setItem('portfolio_result', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setApiError("Koneksi gagal! Pastikan alamat API Python Vercel valid dan Vercel Backend dalam posisi menyala.");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <main className="container">
      <div className="header">
        <h1 className="title-gradient">LQ45 Neural Optimizer</h1>
        <p className="subtitle">Algoritma Genetika Terkoneksi API Python (Integer Knapsack)</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto 30px', textAlign: 'left', padding: '25px', borderLeft: '4px solid var(--accent-cyan)' }}>
         <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '12px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span>🧠</span> Bagaimana Cara Kerja AI Ini?
         </h3>
         <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.7', margin: 0 }}>
           <strong>Penting:</strong> Aplikasi ini <strong>BUKAN</strong> alat prediksi Analisis Teknikal (seperti pembacaan grafik, <i>Moving Average</i>, <i>Support-Resistance</i>, atau Volume Perdagangan).
           <br/><br/>
           Sistem ini memecahkan masalah matematika portofolio yang disebut <strong>Integer Knapsack Problem</strong> menggunakan <strong>Algoritma Genetika (Evolusioner)</strong>.
           Layaknya probabilitas seleksi alam, AI melempar dadu untuk menguji jutaan kombinasi acak. Tujuannya hanya satu: Mencari kombinasi <strong>"Berapa Lot untuk Saham A, B, C"</strong> dari daftar LQ45 yang memberikan <strong>Return Paling Maksimal</strong> secara probabilitas statistik, namun tetap pas di dalam keranjang <strong>Modal (Budget)</strong> dan batas <strong>Toleransi Risiko</strong> Anda.
         </p>
      </div>

      <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="input-group" style={{ textAlign: 'left' }}>
          <label className="input-label">Modal Tersedia</label>
          <input
            type="text"
            className="budget-input"
            value={budget}
            onChange={handleBudgetChange}
            placeholder="Ketik modal, misal Rp 50.000.000"
          />
        </div>

        <div className="input-group" style={{ textAlign: 'left', marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="input-label">Tingkat Risiko (1-10)</label>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>Level {riskLevel}: {getRiskLabel(riskLevel)}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={riskLevel}
            onChange={(e) => setRiskLevel(parseInt(e.target.value))}
            className="risk-slider"
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '5px' }}>
            {riskLevel === 10 ? "Alokasi Maks: 100% per emiten" : `Alokasi Maks: ${Math.round((0.10 + ((riskLevel - 1) * 0.10)) * 100)}% per emiten`}
          </p>
        </div>
        
        {apiError && (
          <div style={{ color: 'var(--danger)', marginBottom: '20px', background: 'rgba(255, 51, 102, 0.1)', padding: '15px', borderRadius: '10px' }}>
            ⚠️ {apiError}
          </div>
        )}
        
        <button 
          className="btn-optimize" 
          onClick={handleOptimize} 
          disabled={isOptimizing || !budget || parseInt(budget.replace(/\D/g, ''), 10) < 100000}
          style={{ width: '100%' }}
        >
          {isOptimizing ? '📡 Menyambungkan ke Otak Python...' : '🚀 Mulai Komputasi Python AI'}
        </button>

        <div style={{ marginTop: '15px' }}>
          <a href="/manual" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
            🛠️ Atau, Susun Portofolio Sendiri (Manual Picker) →
          </a>
        </div>
      </div>

      {result && !apiError && (
        <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
          <div className="results-grid">
            <div className="stat-card">
              <span className="stat-label">Dana Terserap (Cost)</span>
              <span className="stat-value neutral">{formatCurrency(result.total_cost)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Estimasi Keuntungan Tahunan</span>
              <span className="stat-value success">
                {result.total_profit > 0 ? "+" : ""}{formatCurrency(result.total_profit)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Lot Dibeli</span>
              <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                {result.best_portfolio.reduce((acc, curr) => acc + curr, 0)} Lot
              </span>
            </div>
          </div>

          <div className="glass-panel" style={{ marginTop: '40px' }}>
            <h3 className="input-label" style={{ marginBottom: '20px' }}>Rekomendasi Distribusi AI (Berdasarkan Kalkulasi Python)</h3>
            <div className="table-container">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Harga 1 Lot</th>
                    <th>Ekspektasi Return</th>
                    <th>Risiko (Volatilitas)</th>
                    <th>Tindakan (Dibeli)</th>
                    <th>SubTotal Biaya Aset</th>
                    <th>Potensi Profit/Rugi</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((stock, i) => {
                    const lots = result.best_portfolio[i];
                    if (lots > 0) {
                      const costPerLot = stock.Last_Price * 100;
                      const returnPct = stock.Expected_Return_Annual * 100;
                      const riskPct = stock.Risk_Annual * 100;
                      const subTotalCost = costPerLot * lots;
                      const expectedProfit = subTotalCost * stock.Expected_Return_Annual;
                      return (
                        <tr key={stock.Ticker}>
                          <td><strong>{stock.Ticker}</strong></td>
                          <td>{formatCurrency(costPerLot)}</td>
                          <td className={returnPct >= 0 ? 'positive-return' : 'negative-return'}>
                            {returnPct.toFixed(2)}%
                          </td>
                          <td style={{ color: riskPct > 40 ? 'var(--danger)' : riskPct > 20 ? 'orange' : 'var(--success)' }}>
                            {riskPct.toFixed(2)}%
                          </td>
                          <td><span className="badge">{lots} LOT</span></td>
                          <td>{formatCurrency(subTotalCost)}</td>
                          <td className={expectedProfit >= 0 ? 'positive-return' : 'negative-return'}>
                            {expectedProfit >= 0 ? '+' : ''}{formatCurrency(expectedProfit)}
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })}
                </tbody>
              </table>
            </div>

            {/* Tombol Menuju Simulator */}
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
              <a href="/simulator" className="btn-optimize" style={{ background: 'linear-gradient(90deg, #10b981, #059669)', width: 'auto', display: 'inline-block', textDecoration: 'none' }}>
                ⏳ Buka Simulator Bunga Majemuk Masa Depan
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
