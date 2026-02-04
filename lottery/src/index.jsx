import React, { useState, useRef, useEffect, useCallback } from 'react';

// シンボルと等級の対応
const PRIZE_SYMBOLS = {
  '7️⃣': { name: '1等', amount: 1000000, probability: 0.000001 },   // 100万分の1
  '👑': { name: '2等', amount: 100000, probability: 0.00001 },      // 10万分の1
  '💎': { name: '3等', amount: 10000, probability: 0.0001 },        // 1万分の1
  '🎰': { name: '4等', amount: 1000, probability: 0.001 },          // 1000分の1
  '⭐': { name: '5等', amount: 200, probability: 0.01 },            // 100分の1
  '🍀': { name: '末等', amount: 200, probability: 0.1 },            // 10分の1
};

// ハズレ用シンボル（揃っても当たりにならないように制御）
const LOSE_SYMBOLS = ['🎯', '🔔', '🔴', '🟡'];

// 全シンボル
const ALL_SYMBOLS = [...Object.keys(PRIZE_SYMBOLS), ...LOSE_SYMBOLS];

// 期待値計算: 約0.3円/枚 (実際のスクラッチは約45%還元)
const TICKET_PRICE = 200;

const generateResult = () => {
  const rand = Math.random();
  let cumulative = 0;
  
  // 確率の高い順（末等から）にチェック
  const symbolEntries = Object.entries(PRIZE_SYMBOLS).sort((a, b) => b[1].probability - a[1].probability);
  
  for (const [symbol, prize] of symbolEntries) {
    cumulative += prize.probability;
    if (rand < cumulative) {
      return { won: true, symbol, prize };
    }
  }
  return { won: false, symbol: null, prize: null };
};

const generateScratchNumbers = (result) => {
  // 3x3のグリッド
  const grid = [];
  
  if (result.won) {
    // 当たりの場合：1行目に当籤シンボルを3つ
    grid.push([result.symbol, result.symbol, result.symbol]);
    
    // 残りの行はランダム（当籤シンボルが揃わないように）
    for (let i = 1; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 3; j++) {
        // 当籤シンボル以外からランダム選択
        const availableSymbols = ALL_SYMBOLS.filter(s => s !== result.symbol);
        row.push(availableSymbols[Math.floor(Math.random() * availableSymbols.length)]);
      }
      // 同じシンボルが揃わないようにする
      if (row[0] === row[1] && row[1] === row[2]) {
        const availableSymbols = ALL_SYMBOLS.filter(s => s !== row[0] && s !== result.symbol);
        row[2] = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
      }
      grid.push(row);
    }
  } else {
    // ハズレの場合：どの行も当籤シンボルで揃わないように
    for (let i = 0; i < 3; i++) {
      const row = [];
      for (let j = 0; j < 3; j++) {
        row.push(ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)]);
      }
      // 当籤シンボルで揃ってしまったら変更
      if (row[0] === row[1] && row[1] === row[2] && PRIZE_SYMBOLS[row[0]]) {
        row[2] = LOSE_SYMBOLS[Math.floor(Math.random() * LOSE_SYMBOLS.length)];
      }
      grid.push(row);
    }
  }
  
  return grid;
};

const ScratchCard = ({ ticket, onComplete, onExchange }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [exchanged, setExchanged] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    
    // 銀色のスクラッチ面を描画
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 少しテクスチャを追加
    ctx.fillStyle = '#A8A8A8';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // 「スクラッチしてね」テキスト
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ここを削ってね', canvas.width / 2, canvas.height / 2);
  }, [ticket.id]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const scratch = useCallback((e) => {
    if (!isScratching || revealed) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // キャンバス座標に変換
    let x = clientX - rect.left;
    let y = clientY - rect.top;
    
    // スケール調整
    x = x * (canvas.width / rect.width);
    y = y * (canvas.height / rect.height);
    
    // キャンバス範囲内のみ描画（範囲外でもスクラッチ状態は維持）
    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
      
      // 削った割合を計算
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) transparent++;
      }
      const percent = (transparent / (imageData.data.length / 4)) * 100;
      setScratchPercent(percent);
      
      // 80%削ったら判定＆キャンバスを完全透明化
      if (percent > 80 && !revealed) {
        setRevealed(true);
        clearCanvas();
        onComplete(ticket);
      }
    }
  }, [isScratching, revealed, ticket, onComplete, clearCanvas]);

  // windowレベルでmousemove/mouseup/touchmove/touchendを監視
  useEffect(() => {
    const handleMouseUp = () => setIsScratching(false);
    const handleMouseMove = (e) => scratch(e);
    const handleTouchEnd = () => setIsScratching(false);
    const handleTouchMove = (e) => scratch(e);

    if (isScratching) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isScratching, scratch]);

  const handleExchange = () => {
    if (ticket.result.won && !exchanged) {
      setExchanged(true);
      onExchange(ticket);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-72">
      <div className="text-center mb-2">
        <span className="text-xs text-gray-500">No. {ticket.id.toString().padStart(8, '0')}</span>
      </div>
      
      <div className="relative bg-yellow-100 rounded-lg p-4 border-4 border-yellow-400">
        <div className="text-center mb-2 text-sm font-bold text-yellow-800">
          🎰 スクラッチくじ 🎰
        </div>
        
        {/* シンボルグリッドとスクラッチのコンテナ */}
        <div className="relative" ref={containerRef}>
          {/* シンボルグリッド */}
          <div className="grid grid-cols-3 gap-1 select-none">
            {ticket.grid.map((row, i) => (
              row.map((symbol, j) => (
                <div 
                  key={`${i}-${j}`}
                  className="bg-white rounded p-2 text-2xl text-center border border-yellow-300 w-14 h-14 flex items-center justify-center pointer-events-none"
                >
                  {symbol}
                </div>
              ))
            ))}
          </div>
          
          {/* スクラッチキャンバス（グリッドに重ねる） */}
          {!revealed && (
            <canvas
              ref={canvasRef}
              width={180}
              height={180}
              className="absolute top-0 left-0 w-full h-full cursor-pointer rounded"
              style={{ touchAction: 'none' }}
              onMouseDown={() => setIsScratching(true)}
              onTouchStart={() => setIsScratching(true)}
            />
          )}
        </div>
        
        <div className="text-xs text-center text-yellow-700 mt-2">
          横一列に同じ絵柄が3つ揃えば当たり！
        </div>
      </div>
      
      {/* 結果表示 */}
      {revealed && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          ticket.result.won ? 'bg-red-100 border-2 border-red-400' : 'bg-gray-100'
        }`}>
          {ticket.result.won ? (
            <>
              <div className="text-xl font-bold text-red-600">
                🎉 {ticket.result.prize.name}当籤！ 🎉
              </div>
              <div className="text-2xl font-bold text-red-700">
                ¥{ticket.result.prize.amount.toLocaleString()}
              </div>
              {!exchanged ? (
                <button
                  onClick={handleExchange}
                  className="mt-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition"
                >
                  当籤金を受け取る
                </button>
              ) : (
                <div className="mt-2 text-green-600 font-bold">
                  ✓ 受取済み
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-600">
              残念...ハズレです 😢
            </div>
          )}
        </div>
      )}
      
      {!revealed && (
        <div className="mt-2 text-center text-xs text-gray-400">
          削った量: {scratchPercent.toFixed(0)}% (80%で結果表示)
        </div>
      )}
    </div>
  );
};

export default function ScratchLotteryGame() {
  const [balance, setBalance] = useState(10000);
  const [tickets, setTickets] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [showPrizeTable, setShowPrizeTable] = useState(false);
  const [stats, setStats] = useState({
    purchased: 0,
    revealed: 0,
    won: 0,
    prizes: {}
  });

  const buyTicket = () => {
    if (balance < TICKET_PRICE) return;
    
    const result = generateResult();
    const newTicket = {
      id: Date.now(),
      result,
      grid: generateScratchNumbers(result),
      revealed: false,
      exchanged: false
    };
    
    setTickets(prev => [newTicket, ...prev]);
    setBalance(prev => prev - TICKET_PRICE);
    setTotalSpent(prev => prev + TICKET_PRICE);
    setStats(prev => ({ ...prev, purchased: prev.purchased + 1 }));
  };

  const handleComplete = (ticket) => {
    setStats(prev => {
      const newStats = { ...prev, revealed: prev.revealed + 1 };
      if (ticket.result.won) {
        newStats.won = prev.won + 1;
        newStats.prizes = { 
          ...prev.prizes, 
          [ticket.result.prize.name]: (prev.prizes[ticket.result.prize.name] || 0) + 1 
        };
      }
      return newStats;
    });
  };

  const handleExchange = (ticket) => {
    setBalance(prev => prev + ticket.result.prize.amount);
    setTotalWon(prev => prev + ticket.result.prize.amount);
  };

  const addMoney = (amount) => {
    setBalance(prev => prev + amount);
  };

  const returnRate = totalSpent > 0 ? ((totalWon / totalSpent) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            🎰 スクラッチくじシミュレーター 🎰
          </h1>
          <p className="text-purple-200 text-sm">
            実際の当籤確率でシミュレーション（還元率約45%）
          </p>
        </div>

        {/* ステータスパネル */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-purple-200 text-xs">所持金</div>
              <div className="text-2xl font-bold text-yellow-400">
                ¥{balance.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-purple-200 text-xs">購入総額</div>
              <div className="text-xl font-bold text-white">
                ¥{totalSpent.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-purple-200 text-xs">当籤総額</div>
              <div className="text-xl font-bold text-green-400">
                ¥{totalWon.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-purple-200 text-xs">還元率</div>
              <div className={`text-xl font-bold ${
                returnRate >= 100 ? 'text-green-400' : 'text-red-400'
              }`}>
                {returnRate}%
              </div>
            </div>
          </div>
          
          {/* 統計 */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-purple-200 text-xs mb-2">当籤履歴</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 rounded px-2 py-1">
                購入: {stats.purchased}枚
              </span>
              <span className="bg-white/20 rounded px-2 py-1">
                確認済: {stats.revealed}枚
              </span>
              <span className="bg-green-500/30 rounded px-2 py-1">
                当籤: {stats.won}回
              </span>
              {Object.entries(stats.prizes).map(([name, count]) => (
                <span key={name} className="bg-yellow-500/30 rounded px-2 py-1">
                  {name}: {count}回
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={buyTicket}
            disabled={balance < TICKET_PRICE}
            className={`px-6 py-3 rounded-full font-bold text-lg transition ${
              balance >= TICKET_PRICE
                ? 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            🎫 くじを買う (¥{TICKET_PRICE})
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => addMoney(1000)}
              className="px-4 py-3 bg-green-500 hover:bg-green-400 text-white rounded-full font-bold transition"
            >
              +¥1,000
            </button>
            <button
              onClick={() => addMoney(10000)}
              className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold transition"
            >
              +¥10,000
            </button>
          </div>
        </div>

        {/* 当籤確率テーブル（折りたたみ可能） */}
        <div className="bg-white/10 backdrop-blur rounded-xl mb-6">
          <button
            onClick={() => setShowPrizeTable(prev => !prev)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="text-yellow-400 font-bold">📊 当籤確率</span>
            <span className="text-purple-200 text-xl">
              {showPrizeTable ? '▲' : '▼'}
            </span>
          </button>
          
          {showPrizeTable && (
            <div className="px-4 pb-4">
              <div className="text-purple-200 text-xs mb-3">
                当籤条件：横一列に同じ絵柄が3つ揃えば当たり！揃った絵柄で等級が決まります
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Object.entries(PRIZE_SYMBOLS).map(([symbol, prize]) => (
                  <div key={prize.name} className="bg-white/10 rounded p-2">
                    <div className="flex items-center gap-1">
                      <span className="text-xl">{symbol}</span>
                      <span className="text-xl">{symbol}</span>
                      <span className="text-xl">{symbol}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-yellow-300">{prize.name}</span>
                      <span className="text-white ml-2">¥{prize.amount.toLocaleString()}</span>
                    </div>
                    <span className="text-purple-300 block">
                      確率: 1/{(1/prize.probability).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-purple-300 text-xs">
                ※ {LOSE_SYMBOLS.join(' ')} はハズレ絵柄です
              </div>
            </div>
          )}
        </div>

        {/* くじ一覧 */}
        <div className="flex flex-wrap justify-center gap-4">
          {tickets.map(ticket => (
            <ScratchCard
              key={ticket.id}
              ticket={ticket}
              onComplete={handleComplete}
              onExchange={handleExchange}
            />
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="text-center text-purple-300 py-12">
            「くじを買う」ボタンでスクラッチくじを購入しよう！
          </div>
        )}
      </div>
    </div>
  );
}
