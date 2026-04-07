'use client';
import { useState, useEffect } from 'react';
import rawData from '../../data/lq45_stats.json';
import { StockItem, GAResult } from '../page';

export default function Simulator() {
  const [result, setResult] = useState<GAResult | null>(null);
  const [years, setYears] = useState<number>(5);

  useEffect(() => {
    // Membaca data portofolio dari localStorage yang disetor oleh halaman utama
    const savedData = localStorage.getItem('portfolio_result');
    if (savedData) {
      setResult(JSON.parse(savedData));
    }
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(val);
  };

  if (!result) {
    return (
      <main className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2 className="title-gradient">Data Portofolio Tidak Ditemukan</h2>
        <p className="subtitle">Anda harus melakukan komputasi AI di halaman utama terlebih dahulu.</p>
        <a href="/" className="btn-optimize" style={{ display: 'inline-block', width: 'auto', marginTop: '20px', textDecoration: 'none' }}>
          Kembali ke Dasbor Utama
        </a>
      </main>
    );
  }

  // Hitung persentase rata-rata Compound Interest per tahun dari total porsi
  const expectedAnnualGrowthPct = (result.total_profit / result.total_cost) * 100;
  
  // Simulasi dari Tahun 0 sampai `years`
  const compoundSimulations = [];
  let currentBalance = result.total_cost;

  for (let y = 1; y <= years; y++) {
    const profitForYear = currentBalance * (expectedAnnualGrowthPct / 100);
    currentBalance += profitForYear;
    compoundSimulations.push({
      year: y,
      profit: profitForYear,
      endBalance: currentBalance
    });
  }

  return (
    <main className="container">
      <div className="header">
        <h1 className="title-gradient">Mesin Waktu Bunga Majemuk</h1>
        <p className="subtitle">Simulasi Kekayaan dari Portofolio Genetik Anda</p>
      </div>

      <div className="glass-panel" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h3>Asumsi Laju Pertumbuhan Portofolio: <span style={{ color: 'var(--success)', fontSize: '1.5rem' }}>+{expectedAnnualGrowthPct.toFixed(2)}%</span> per tahun</h3>
        <p style={{ color: 'var(--text-muted)' }}>Menerapkan efek Compound Interest (Keuntungan tahunan diinvestasikan/dibelikan lot kembali)</p>
        
        <div style={{ marginTop: '30px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px' }}>
          <label className="input-label" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Geser Jangka Waktu Investasi: <strong>{years} Tahun</strong></label>
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

      <div className="results-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <span className="stat-label">Modal Awal Terserap</span>
          <span className="stat-value neutral">{formatCurrency(result.total_cost)}</span>
        </div>
        <div className="stat-card">
           <span className="stat-label">Total Keuntungan ({years} Thn)</span>
           <span className="stat-value success">+{formatCurrency(currentBalance - result.total_cost)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Proyeksi Aset Final</span>
          <span className="stat-value" style={{ color: 'var(--accent-purple)' }}>{formatCurrency(currentBalance)}</span>
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
                <th>Keuntungan Dipetik</th>
                <th>Total Aset Akhir Tahun</th>
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
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
         <a href="/" className="btn-optimize" style={{ background: '#334155', width: 'auto', display: 'inline-block', textDecoration: 'none' }}>
           ← Buat Susunan Lain (AI)
         </a>
         <a href="/manual" className="btn-optimize" style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', width: 'auto', display: 'inline-block', textDecoration: 'none' }}>
           🛠️ Coba Susun Manual
         </a>
      </div>
    </main>
  );
}
