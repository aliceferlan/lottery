import React, { useState, useEffect } from 'react';

// ロト6形式：1-43から6個選ぶ
const MIN_NUMBER = 1;
const MAX_NUMBER = 43;
const PICK_COUNT = 6;
const TICKET_PRICE = 200;

// 当籤条件と確率（実際のロト6に近い）
const PRIZE_TABLE = [
  { match: 6, name: '1等', amount: 200000000, probability: '1/6,096,454' },
  { match: 5, name: '2等', amount: 10000000, bonus: true, probability: '1/1,016,076' },
  { match: 5, name: '3等', amount: 300000, probability: '1/28,224' },
  { match: 4, name: '4等', amount: 6800, probability: '1/610' },
  { match: 3, name: '5等', amount: 1000, probability: '1/39' },
];

// 数字をランダムに選ぶ
const generateRandomNumbers = (count, min, max) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b);
};

// 当籤判定
const checkWin = (selected, winning, bonus) => {
  const matchCount = selected.filter(n => winning.includes(n)).length;
  const hasBonus = selected.includes(bonus);
  
  for (const prize of PRIZE_TABLE) {
    if (prize.match === matchCount) {
      if (prize.bonus && !hasBonus) continue;
      if (prize.match === 5 && !prize.bonus && hasBonus) continue;
      return { won: true, prize, matchCount, hasBonus };
    }
  }
  return { won: false, prize: null, matchCount, hasBonus };
};

// 数字選択パネル
const NumberSelector = ({ selected, onToggle, disabled }) => {
  const numbers = [];
  for (let i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
    numbers.push(i);
  }
  
  return (
    <div className="grid grid-cols-7 gap-1 p-2">
      {numbers.map(num => {
        const isSelected = selected.includes(num);
        return (
          <button
            key={num}
            onClick={() => onToggle(num)}
            disabled={disabled || (!isSelected && selected.length >= PICK_COUNT)}
            className={`
              w-10 h-10 rounded-full font-bold text-sm transition
              ${isSelected 
                ? 'bg-yellow-400 text-yellow-900 shadow-lg scale-110' 
                : 'bg-white/20 text-white hover:bg-white/30'}
              ${disabled || (!isSelected && selected.length >= PICK_COUNT) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer'}
            `}
          >
            {num}
          </button>
        );
      })}
    </div>
  );
};

// 抽選アニメーション付きの数字表示
const DrawingNumber = ({ number, revealed, isMatch, isBonus }) => {
  const [displayNumber, setDisplayNumber] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    if (!revealed) {
      setIsAnimating(true);
      const interval = setInterval(() => {
        setDisplayNumber(Math.floor(Math.random() * MAX_NUMBER) + 1);
      }, 50);
      
      return () => clearInterval(interval);
    } else {
      setIsAnimating(false);
      setDisplayNumber(number);
    }
  }, [revealed, number]);
  
  // 確定後のみハイライトを適用
  const showMatch = revealed && isMatch;
  const showBonus = revealed && isBonus;
  
  return (
    <div className={`
      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
      transition-all duration-300
      ${showBonus 
        ? 'bg-pink-500 text-white ring-2 ring-pink-300' 
        : showMatch 
          ? 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-300 scale-110' 
          : 'bg-white/30 text-white'}
      ${isAnimating ? 'animate-pulse' : ''}
    `}>
      {displayNumber}
    </div>
  );
};

// チケット表示
const LotoTicket = ({ ticket, onCheck }) => {
  const [drawing, setDrawing] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  const startDraw = () => {
    setDrawing(true);
    setRevealedCount(0);
    
    // 1つずつ数字を公開
    for (let i = 1; i <= PICK_COUNT + 1; i++) {
      setTimeout(() => {
        setRevealedCount(i);
        if (i === PICK_COUNT + 1) {
          setTimeout(() => {
            setShowResult(true);
            onCheck(ticket);
          }, 500);
        }
      }, i * 800);
    }
  };
  
  const matchedNumbers = ticket.selected.filter(n => ticket.winning.includes(n));
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 w-80">
      <div className="text-center mb-2">
        <span className="text-xs text-gray-500">No. {ticket.id.toString().padStart(8, '0')}</span>
      </div>
      
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4">
        <div className="text-center text-white text-sm font-bold mb-3">
          🎱 ロト6 🎱
        </div>
        
        {/* 選んだ数字 */}
        <div className="bg-white/10 rounded-lg p-3 mb-3">
          <div className="text-xs text-blue-200 mb-1">あなたの数字</div>
          <div className="flex justify-center gap-2">
            {ticket.selected.map(num => (
              <div 
                key={num}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold
                  ${showResult && matchedNumbers.includes(num)
                    ? 'bg-yellow-400 text-yellow-900'
                    : 'bg-white text-blue-800'}
                `}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
        
        {/* 抽選ボタンまたは当籤番号 */}
        {!drawing ? (
          <button
            onClick={startDraw}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-bold py-3 rounded-lg transition"
          >
            🎰 抽選する
          </button>
        ) : (
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-xs text-blue-200 mb-1">当籤番号</div>
            <div className="flex justify-center gap-1 mb-2">
              {ticket.winning.map((num, i) => (
                <DrawingNumber
                  key={i}
                  number={num}
                  revealed={revealedCount > i}
                  isMatch={ticket.selected.includes(num)}
                  isBonus={false}
                />
              ))}
            </div>
            <div className="flex justify-center items-center gap-2">
              <span className="text-xs text-pink-300">ボーナス</span>
              <DrawingNumber
                number={ticket.bonus}
                revealed={revealedCount > PICK_COUNT}
                isMatch={ticket.selected.includes(ticket.bonus)}
                isBonus={true}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 結果表示 */}
      {showResult && (
        <div className={`mt-4 p-3 rounded-lg text-center ${
          ticket.result.won ? 'bg-red-100 border-2 border-red-400' : 'bg-gray-100'
        }`}>
          <div className="text-sm text-gray-600 mb-1">
            {ticket.result.matchCount}個一致
            {ticket.result.hasBonus && ticket.result.matchCount === 5 && ' + ボーナス'}
          </div>
          {ticket.result.won ? (
            <>
              <div className="text-xl font-bold text-red-600">
                🎉 {ticket.result.prize.name}当籤！ 🎉
              </div>
              <div className="text-2xl font-bold text-red-700">
                ¥{ticket.result.prize.amount.toLocaleString()}
              </div>
              {!ticket.exchanged ? (
                <button
                  onClick={() => ticket.onExchange(ticket)}
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
    </div>
  );
};

export default function LotoLotteryGame() {
  const [balance, setBalance] = useState(10000);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [showPrizeTable, setShowPrizeTable] = useState(false);
  const [stats, setStats] = useState({
    purchased: 0,
    checked: 0,
    won: 0,
    prizes: {}
  });

  const toggleNumber = (num) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      }
      if (prev.length >= PICK_COUNT) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
  };

  const quickPick = () => {
    setSelectedNumbers(generateRandomNumbers(PICK_COUNT, MIN_NUMBER, MAX_NUMBER));
  };

  const clearSelection = () => {
    setSelectedNumbers([]);
  };

  const buyTicket = () => {
    if (balance < TICKET_PRICE || selectedNumbers.length !== PICK_COUNT) return;
    
    const winning = generateRandomNumbers(PICK_COUNT, MIN_NUMBER, MAX_NUMBER);
    // ボーナス数字は当籤番号以外から選ぶ
    let bonus;
    do {
      bonus = Math.floor(Math.random() * MAX_NUMBER) + 1;
    } while (winning.includes(bonus));
    
    const result = checkWin(selectedNumbers, winning, bonus);
    
    const newTicket = {
      id: Date.now(),
      selected: [...selectedNumbers],
      winning,
      bonus,
      result,
      checked: false,
      exchanged: false,
      onExchange: handleExchange
    };
    
    setTickets(prev => [newTicket, ...prev]);
    setBalance(prev => prev - TICKET_PRICE);
    setTotalSpent(prev => prev + TICKET_PRICE);
    setStats(prev => ({ ...prev, purchased: prev.purchased + 1 }));
    setSelectedNumbers([]);
  };

  const handleCheck = (ticket) => {
    setStats(prev => {
      const newStats = { ...prev, checked: prev.checked + 1 };
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
    setTickets(prev => prev.map(t => 
      t.id === ticket.id ? { ...t, exchanged: true } : t
    ));
    setBalance(prev => prev + ticket.result.prize.amount);
    setTotalWon(prev => prev + ticket.result.prize.amount);
  };

  const addMoney = (amount) => {
    setBalance(prev => prev + amount);
  };

  const returnRate = totalSpent > 0 ? ((totalWon / totalSpent) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">
            🎱 ロト6シミュレーター 🎱
          </h1>
          <p className="text-blue-200 text-sm">
            1〜43から6つの数字を選んで抽選！
          </p>
        </div>

        {/* ステータスパネル */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-blue-200 text-xs">所持金</div>
              <div className="text-2xl font-bold text-yellow-400">
                ¥{balance.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-blue-200 text-xs">購入総額</div>
              <div className="text-xl font-bold text-white">
                ¥{totalSpent.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-blue-200 text-xs">当籤総額</div>
              <div className="text-xl font-bold text-green-400">
                ¥{totalWon.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-blue-200 text-xs">還元率</div>
              <div className={`text-xl font-bold ${
                returnRate >= 100 ? 'text-green-400' : 'text-red-400'
              }`}>
                {returnRate}%
              </div>
            </div>
          </div>
          
          {/* 統計 */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-blue-200 text-xs mb-2">当籤履歴</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white/20 rounded px-2 py-1">
                購入: {stats.purchased}枚
              </span>
              <span className="bg-white/20 rounded px-2 py-1">
                確認済: {stats.checked}枚
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

        {/* 数字選択パネル */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
          <div className="text-yellow-400 font-bold mb-2">
            数字を選択 ({selectedNumbers.length}/{PICK_COUNT})
          </div>
          
          <NumberSelector
            selected={selectedNumbers}
            onToggle={toggleNumber}
            disabled={false}
          />
          
          {/* 選択中の数字表示 */}
          <div className="flex justify-center gap-2 mt-4 mb-4">
            {Array.from({ length: PICK_COUNT }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  ${selectedNumbers[i] 
                    ? 'bg-yellow-400 text-yellow-900' 
                    : 'bg-white/20 text-white/50 border-2 border-dashed border-white/30'}
                `}
              >
                {selectedNumbers[i] || '?'}
              </div>
            ))}
          </div>
          
          {/* アクションボタン */}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={quickPick}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-full font-bold transition"
            >
              🎲 クイックピック
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white rounded-full font-bold transition"
            >
              ✕ クリア
            </button>
            <button
              onClick={buyTicket}
              disabled={balance < TICKET_PRICE || selectedNumbers.length !== PICK_COUNT}
              className={`px-6 py-2 rounded-full font-bold transition ${
                balance >= TICKET_PRICE && selectedNumbers.length === PICK_COUNT
                  ? 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              🎫 購入 (¥{TICKET_PRICE})
            </button>
          </div>
        </div>

        {/* 入金ボタン */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => addMoney(1000)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-full font-bold transition"
          >
            +¥1,000
          </button>
          <button
            onClick={() => addMoney(10000)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold transition"
          >
            +¥10,000
          </button>
        </div>

        {/* 当籤確率テーブル（折りたたみ可能） */}
        <div className="bg-white/10 backdrop-blur rounded-xl mb-6">
          <button
            onClick={() => setShowPrizeTable(prev => !prev)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <span className="text-yellow-400 font-bold">📊 当籤確率</span>
            <span className="text-blue-200 text-xl">
              {showPrizeTable ? '▲' : '▼'}
            </span>
          </button>
          
          {showPrizeTable && (
            <div className="px-4 pb-4">
              <div className="text-blue-200 text-xs mb-3">
                当籤条件：選んだ6つの数字が当籤番号といくつ一致するかで等級が決まります
              </div>
              <div className="space-y-2 text-sm">
                {PRIZE_TABLE.map(prize => (
                  <div key={prize.name + (prize.bonus || '')} className="bg-white/10 rounded p-3 flex justify-between items-center">
                    <div>
                      <span className="text-yellow-300 font-bold">{prize.name}</span>
                      <span className="text-blue-200 ml-2">
                        {prize.match}個一致{prize.bonus && ' + ボーナス'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">¥{prize.amount.toLocaleString()}</div>
                      <div className="text-blue-300 text-xs">{prize.probability}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-blue-300 text-xs">
                ※ ボーナス数字は2等判定にのみ使用されます
              </div>
            </div>
          )}
        </div>

        {/* チケット一覧 */}
        <div className="flex flex-wrap justify-center gap-4">
          {tickets.map(ticket => (
            <LotoTicket
              key={ticket.id}
              ticket={ticket}
              onCheck={handleCheck}
            />
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="text-center text-blue-300 py-12">
            数字を6つ選んで「購入」ボタンを押そう！
          </div>
        )}
      </div>
    </div>
  );
}
