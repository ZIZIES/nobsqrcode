'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface HistoryItem {
  text: string;
  timestamp: number;
  qrCodeUrl: string;
}

export default function Home() {
  const [text, setText] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [size, setSize] = useState(256);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('M');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  // load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('qr-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateQR = async () => {
    if (!text.trim()) return;

    try {
      // generate base qr code
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, text, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      // if there's a logo, overlay it
      if (logo) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoImg = new Image();
          logoImg.onload = () => {
            const logoSize = size * 0.2; // 20% of qr size
            const x = (size - logoSize) / 2;
            const y = (size - logoSize) / 2;
            
            // draw white background circle for logo
            ctx.fillStyle = lightColor;
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, logoSize / 2 + 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // draw logo
            ctx.drawImage(logoImg, x, y, logoSize, logoSize);
            
            const url = canvas.toDataURL();
            setQrCodeUrl(url);
            saveToHistory(url);
          };
          logoImg.src = logo;
        }
      } else {
        const url = canvas.toDataURL();
        setQrCodeUrl(url);
        saveToHistory(url);
      }
    } catch (err) {
      console.error('failed to generate qr code:', err);
    }
  };

  const saveToHistory = (url: string) => {
    const newItem: HistoryItem = {
      text,
      timestamp: Date.now(),
      qrCodeUrl: url,
    };
    const newHistory = [newItem, ...history.slice(0, 9)]; // keep last 10
    setHistory(newHistory);
    localStorage.setItem('qr-history', JSON.stringify(newHistory));
  };

  const downloadPNG = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  const downloadSVG = async () => {
    if (!text.trim()) return;

    try {
      const svg = await QRCode.toString(text, {
        type: 'svg',
        width: size,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.svg';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('failed to generate svg:', err);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setText(item.text);
    setQrCodeUrl(item.qrCodeUrl);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qr-history');
  };

  const errorLevels: { value: ErrorCorrectionLevel; label: string }[] = [
    { value: 'L', label: 'low' },
    { value: 'M', label: 'medium' },
    { value: 'Q', label: 'high' },
    { value: 'H', label: 'max' },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full relative">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            nobs<span className="text-yellow-400">qr</span>code
          </h1>
          <p className="text-gray-300 text-lg">
            generate qr codes for anything
          </p>
        </div>

        {/* History Toggle Button */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-0 right-0 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {showHistory ? '← hide history' : 'history →'}
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Main Panel */}
          <div className={`transition-all duration-300 ${showHistory ? 'md:col-span-1' : 'md:col-span-2 max-w-2xl mx-auto'}`}>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
              {/* Input */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    text or url
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com or any text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>

                {/* Size Selector */}
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    size: {size}px
                  </label>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="64"
                    value={size}
                    onChange={(e) => setSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>small</span>
                    <span>medium</span>
                    <span>large</span>
                  </div>
                </div>

                {/* Error Correction */}
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    error correction: {errorCorrection}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {errorLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setErrorCorrection(level.value)}
                        className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors ${
                          errorCorrection === level.value
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      qr color
                    </label>
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">
                      background
                    </label>
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    logo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-600 file:text-white file:cursor-pointer hover:file:bg-yellow-700"
                  />
                  {logo && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={logo} alt="Logo preview" className="w-12 h-12 rounded object-cover" />
                      <button
                        onClick={() => setLogo(null)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateQR}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-4"
              >
                generate qr code
              </button>

              {/* QR Code Display */}
              {qrCodeUrl && (
                <div className="space-y-4">
                  <div className="rounded-lg p-6 flex items-center justify-center" style={{ backgroundColor: lightColor }}>
                    <img src={qrCodeUrl} alt="QR Code" className="max-w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={downloadPNG}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      download png
                    </button>
                    <button
                      onClick={downloadSVG}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      download svg
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-center text-gray-400 text-sm mt-6">
              scan with your phone camera
            </p>
          </div>

          {/* History Panel */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showHistory ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 md:hidden'
            }`}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold">history</h2>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    clear all
                  </button>
                )}
              </div>

              <div className="space-y-3 overflow-y-auto flex-1">
                {history.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">no history yet</p>
                ) : (
                  history.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => loadFromHistory(item)}
                      className="w-full bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img src={item.qrCodeUrl} alt="QR" className="w-12 h-12 rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{item.text}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
