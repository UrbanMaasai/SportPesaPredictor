import { Match, Selection } from './types';
import { calculatePermutations, formatSMS } from './data';
import { X, Printer } from 'lucide-react';
import { useRef } from 'react';

interface PrintableSlipProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  selections: Selection[][];
  stake: number;
  jackpotType: 'mega' | 'midweek';
}

export default function PrintableSlip({ isOpen, onClose, matches, selections, stake, jackpotType }: PrintableSlipProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const totalCombinations = calculatePermutations(selections);
  const totalPrice = totalCombinations * stake;
  const smsCode = formatSMS(selections, jackpotType);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>JackpotIQ - ${jackpotType === 'mega' ? 'Mega Jackpot Pro' : 'Midweek Jackpot'} Slip</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; padding: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { font-size: 18px; font-weight: bold; }
          .header p { font-size: 11px; margin-top: 4px; }
          .match-row { display: flex; align-items: center; padding: 4px 0; border-bottom: 1px dashed #ccc; font-size: 11px; }
          .match-num { width: 24px; font-weight: bold; }
          .match-teams { flex: 1; }
          .match-odds { display: flex; gap: 8px; }
          .match-odds span { width: 40px; text-align: center; }
          .match-pick { width: 60px; text-align: center; font-weight: bold; background: #eee; padding: 2px 4px; }
          .footer { margin-top: 15px; border-top: 2px solid #000; padding-top: 10px; text-align: center; }
          .sms-code { font-size: 16px; font-weight: bold; letter-spacing: 2px; margin: 8px 0; background: #f0f0f0; padding: 8px; display: inline-block; }
          .summary { display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">Printable Betting Slip</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Printable Content Preview */}
        <div className="p-5">
          <div ref={printRef} className="rounded-lg border-2 border-slate-600 bg-white p-5 text-black">
            {/* Header */}
            <div className="header" style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {jackpotType === 'mega' ? '🏆 MEGA JACKPOT PRO' : '⚽ MIDWEEK JACKPOT'}
              </h1>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>
                JackpotIQ Analytics · {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Match Rows */}
            <div className="matches" style={{ marginBottom: '15px' }}>
              {matches.map((match, i) => (
                <div key={match.id} className="match-row" style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: '1px dashed #ccc', fontSize: '11px' }}>
                  <span className="match-num" style={{ width: '24px', fontWeight: 'bold' }}>{match.id}</span>
                  <span className="match-teams" style={{ flex: 1 }}>{match.homeTeam} vs {match.awayTeam}</span>
                  <div className="match-odds" style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
                    <span style={{ width: '35px', textAlign: 'center' }}>{match.odds['1'].toFixed(2)}</span>
                    <span style={{ width: '35px', textAlign: 'center' }}>{match.odds['X'].toFixed(2)}</span>
                    <span style={{ width: '35px', textAlign: 'center' }}>{match.odds['2'].toFixed(2)}</span>
                  </div>
                  <span className="match-pick" style={{ width: '50px', textAlign: 'center', fontWeight: 'bold', background: '#eee', padding: '2px 4px' }}>
                    {selections[i].join('/')}
                  </span>
                </div>
              ))}
            </div>

            {/* SMS Code */}
            <div className="footer" style={{ borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#666' }}>SEND TO 79079:</p>
              <div className="sms-code" style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px', margin: '8px 0', background: '#f0f0f0', padding: '8px', display: 'inline-block' }}>
                {smsCode}
              </div>
              <div className="summary" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px' }}>
                <span>Lines: {totalCombinations}</span>
                <span>Doubles: {selections.filter(s => s.length === 2).length}</span>
                <span style={{ fontWeight: 'bold' }}>KES {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition-colors"
          >
            <Printer size={16} />
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
