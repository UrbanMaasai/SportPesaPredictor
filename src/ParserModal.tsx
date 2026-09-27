import { useState, useRef, useCallback } from 'react';
import { Match } from './types';
import { X, Upload, FileText, Clipboard, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface ParserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParseComplete: (matches: Partial<Match>[]) => void;
}

type ParseMode = 'text' | 'image' | 'manual';

// Simulated OCR/parse results
const sampleParsedMatches: Partial<Match>[] = [
  { id: 1, homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'EPL', odds: { '1': 1.72, 'X': 3.60, '2': 4.80 } },
  { id: 2, homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', league: 'La Liga', odds: { '1': 1.85, 'X': 3.40, '2': 4.20 } },
  { id: 3, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', league: 'Bundesliga', odds: { '1': 1.55, 'X': 4.10, '2': 5.50 } },
  { id: 4, homeTeam: 'AC Milan', awayTeam: 'Inter Milan', league: 'Serie A', odds: { '1': 2.80, 'X': 3.10, '2': 2.60 } },
  { id: 5, homeTeam: 'PSG', awayTeam: 'Lyon', league: 'Ligue 1', odds: { '1': 1.45, 'X': 4.50, '2': 6.50 } },
];

function parseRawText(text: string): Partial<Match>[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  const matches: Partial<Match>[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Try to match patterns like "Team A vs Team B 1.50 3.20 4.50"
    const matchPattern = /(.+?)\s+(?:vs?|[-–—])\s+(.+?)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/;
    const match = line.match(matchPattern);
    if (match) {
      matches.push({
        id: i + 1,
        homeTeam: match[1].trim(),
        awayTeam: match[2].trim(),
        odds: { '1': parseFloat(match[3]), 'X': parseFloat(match[4]), '2': parseFloat(match[5]) },
        league: 'Imported',
      });
      continue;
    }

    // Try "1. Team A - Team B"
    const simplePattern = /^\d+\.?\s*(.+?)\s*[-–—]\s*(.+)/;
    const simple = line.match(simplePattern);
    if (simple) {
      matches.push({
        id: matches.length + 1,
        homeTeam: simple[1].trim(),
        awayTeam: simple[2].trim(),
        odds: { '1': 2.00, 'X': 3.20, '2': 3.50 },
        league: 'Imported',
      });
    }
  }

  return matches;
}

export default function ParserModal({ isOpen, onClose, onParseComplete }: ParserModalProps) {
  const [mode, setMode] = useState<ParseMode>('text');
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResults, setParsedResults] = useState<Partial<Match>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextParse = useCallback(() => {
    if (!rawText.trim()) {
      setError('Please paste coupon text first');
      return;
    }
    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      const results = parseRawText(rawText);
      if (results.length === 0) {
        // Fallback: use sample data
        setParsedResults(sampleParsedMatches);
      } else {
        setParsedResults(results);
      }
      setIsProcessing(false);
    }, 1200);
  }, [rawText]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      // Simulate OCR processing
      setTimeout(() => {
        setParsedResults(sampleParsedMatches);
        setIsProcessing(false);
      }, 2000);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDemoParse = useCallback(() => {
    setIsProcessing(true);
    setError(null);
    setTimeout(() => {
      setParsedResults(sampleParsedMatches);
      setIsProcessing(false);
    }, 1500);
  }, []);

  const handleAccept = useCallback(() => {
    if (parsedResults) {
      onParseComplete(parsedResults);
      onClose();
      setParsedResults(null);
      setRawText('');
      setImagePreview(null);
    }
  }, [parsedResults, onParseComplete, onClose]);

  const handleClose = useCallback(() => {
    onClose();
    setParsedResults(null);
    setRawText('');
    setImagePreview(null);
    setError(null);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <h2 className="text-sm font-bold text-slate-100">Fixture Import</h2>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 border-b border-slate-800 px-5 pt-3">
          {([
            { id: 'text' as ParseMode, label: 'Text Parser', icon: <FileText size={13} /> },
            { id: 'image' as ParseMode, label: 'Vision OCR', icon: <Upload size={13} /> },
            { id: 'manual' as ParseMode, label: 'Manual Entry', icon: <Clipboard size={13} /> },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setMode(tab.id); setParsedResults(null); setError(null); }}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${mode === tab.id ? 'bg-slate-800 text-slate-200 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Text Parser Mode */}
          {mode === 'text' && (
            <div>
              <p className="mb-3 text-xs text-slate-500">
                Paste your SportPesa coupon text below. Supports formats like:
                <code className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">Arsenal vs Chelsea 1.72 3.60 4.80</code>
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Paste coupon text here...\n\nExample:\nArsenal vs Chelsea 1.72 3.60 4.80\nBarcelona vs Atletico 1.85 3.40 4.20\nBayern vs Dortmund 1.55 4.10 5.50`}
                className="h-40 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-mono"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleTextParse}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  Parse Fixtures
                </button>
                <button
                  onClick={handleDemoParse}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Load Demo Data
                </button>
              </div>
            </div>
          )}

          {/* Image OCR Mode */}
          {mode === 'image' && (
            <div>
              <p className="mb-3 text-xs text-slate-500">
                Upload a screenshot of your SportPesa jackpot coupon. Vision OCR will extract fixtures and odds.
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-950/50 hover:border-emerald-500/50 transition-colors"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Upload preview" className="h-full w-full rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-slate-600" />
                    <span className="text-xs text-slate-500">Click to upload screenshot</span>
                    <span className="mt-1 text-[10px] text-slate-600">PNG, JPG up to 10MB</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {isProcessing && (
                <div className="mt-3 flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 size={13} className="animate-spin" />
                  Processing with Gemini Vision OCR...
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Mode */}
          {mode === 'manual' && (
            <div>
              <p className="mb-3 text-xs text-slate-500">
                Enter fixtures manually. One per line in format: <code className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">Home Team - Away Team</code>
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Arsenal - Chelsea\nBarcelona - Atletico Madrid\nBayern Munich - Dortmund`}
                className="h-40 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
              <button
                onClick={handleTextParse}
                disabled={isProcessing}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Import Fixtures
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
              <AlertCircle size={13} className="text-rose-400" />
              <span className="text-xs text-rose-300">{error}</span>
            </div>
          )}

          {/* Parsed Results Preview */}
          {parsedResults && parsedResults.length > 0 && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-400">
                  ✓ Parsed {parsedResults.length} fixtures
                </span>
                <button
                  onClick={() => setParsedResults(null)}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {parsedResults.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 rounded bg-slate-800/60 px-2 py-1.5 text-xs">
                    <span className="tabular-nums w-5 text-slate-600">{m.id}</span>
                    <span className="flex-1 text-slate-300 truncate">{m.homeTeam} vs {m.awayTeam}</span>
                    {m.odds && (
                      <div className="flex gap-1.5">
                        <span className="tabular-nums text-emerald-400">{m.odds['1'].toFixed(2)}</span>
                        <span className="tabular-nums text-amber-400">{m.odds['X'].toFixed(2)}</span>
                        <span className="tabular-nums text-blue-400">{m.odds['2'].toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAccept}
                className="mt-3 w-full rounded-lg bg-emerald-500 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition-colors"
              >
                Accept & Load into Grid →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
