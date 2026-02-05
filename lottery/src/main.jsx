import React, { useState } from 'react';
import LotoLotteryGame from './loto-lottery';
import ScratchLotteryGame from './scratch-lottery';

export default function LotteryApp() {
    const [selectedGame, setSelectedGame] = useState('loto');

    const [gameData, setGameData] = useState({
        amount: 1000,
        isFeverMode: false,
     });

    return (
		<div className="container mx-auto p-0">
			<div className="flex justify-center mb-4">
				<button
					onClick={() => setSelectedGame('loto')}
					className={`px-4 py-2 mx-2 ${selectedGame === "loto" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} rounded`}
				>
					🎱 ロト6シミュレーター 🎱
				</button>
				<button
					onClick={() => setSelectedGame('scratch')}
					className={`px-4 py-2 mx-2 ${selectedGame === "scratch" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} rounded`}
				>
					🎰 スクラッチくじシミュレーター 🎰
				</button>

                 <button
                    onClick={() => setGameData({...gameData, isFeverMode: !gameData.isFeverMode})}
                    >
                    {gameData.isFeverMode ? '🔥 フィーバーモード中 🔥' : '通常モード'}
                 </button>
			</div>
			<div className="w-full">
				{selectedGame === 'loto' ? <LotoLotteryGame /> : <ScratchLotteryGame />}
			</div>
		</div>
	);
}