import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(createBoard(difficulty));
  
  const [isStarted, setIsStarted] = useState(false);

  const { cellSize } = getDifficulty(difficulty);

  // 難易度ごとの数値を渡す関数
  function getDifficulty(difficulty)
  {
    switch(difficulty)
    {
      case 'easy':
        return{
          rows: 9,
          cols: 9,
          mines: 10,
          cellSize: 40,
        }
      
      case 'hard':
        return{
          rows: 30,
          cols: 16,
          mines: 99,
          cellSize: 22,
        }
    }
  }

  // 難易度の変更をする関数
  function difficultyChange(event)
  {
    const newDifficulty = event.target.value;
    setDifficulty(newDifficulty);
    setBoard(createBoard(newDifficulty));
  }

  // ゲームボード用の2次元配列を作成する関数
  function createBoard(difficulty)
  {
    const { rows, cols } = getDifficulty(difficulty);

    // [rows, cols]のfalseが入った2次元配列を作成
    return Array.from({ length: rows}, () =>
      Array.from({ length: cols}, () => 
        ({
          mine: false,
          number: 0,
          flagged: false,
          opened: false
        })
      )
    )
  }

  // ゲームボードに爆弾を配置する関数
  function setMines(board, safeZone, mines)
  {
    let mineCount = 0;

    while(mineCount < mines)
    {
      // Math.random()は0~1未満までの少数を取るからMath.floorで整数にする
      const row = Math.floor(Math.random() * board.length);
      const col = Math.floor(Math.random() * board[0].length);

      // 地雷がある場合
      if(board[row][col].mine)
      {
        continue;
      }

      // 基準座標と周囲8マスに地雷を設置しない為の処理
      if(safeZone.some(([x, y]) => x === row && y === col))
      {
        continue;
      }

      board[row][col].mine = true;
      mineCount++;
    }
    
    return board;
  }

  function getSafeZone(board, rowIndex, colIndex)
  {
    let safeZone = [];
    // 基準座標と周囲8マスの座標を取得
    for(let rowOffset = -1; rowOffset <= 1; rowOffset++)
    {
      for(let colOffset = -1; colOffset <= 1; colOffset++)
      {
        // 基準点からの差がboardの範囲内に収まっているか
        const row = rowIndex + rowOffset;
        const col = colIndex + colOffset;

        if(row < 0 ||  board.length <= row || col < 0 || board[0].length <= col)
        {
          continue;
        }

        safeZone.push([row, col]);
      }
    }
    return safeZone;
  }

  function searchMines(board)
  {
    for(let row = 0; row < board.length; row++)
    {
      for(let col = 0; col < board[0].length; col++)
      {
        if(board[row][col].mine)
        {
          continue;
        }

        board[row][col].number = countMines(board, row, col);
      }
    }

    return board;
  }

  // 周囲8マスの爆弾の数をカウントする関数
  function countMines(board, rowIndex, colIndex)
  {
    let count = 0

    // 基準座標から周囲8マス調べる
    for(let rowOffset = -1; rowOffset <= 1; rowOffset++)
    {
      for(let colOffset = -1; colOffset <= 1; colOffset++)
      {
        if(rowOffset === 0 && colOffset === 0)
        {
          continue;
        }

        // 基準点からの差がboardの範囲内に収まっているか
        const row = rowIndex + rowOffset;
        const col = colIndex + colOffset;

        if(row < 0 ||  board.length <= row || col < 0 || board[0].length <= col)
        {
          continue;
        }

        if(board[row][col].mine)
        {
          count++;
        }
      }
    }

    return count;
  }

  function cellClick(rowIndex, colIndex)
  {
    let newBoard = board.map(row =>
        row.map(cell => ({ ...cell }))
      )
    // 最初クリックした時の処理
    if(!isStarted)
    {
      const { mines } = getDifficulty(difficulty);

      const safeZone = getSafeZone(board, rowIndex, colIndex);
      // 地雷配置
      newBoard = setMines(newBoard, safeZone, mines);
      // 周囲8マスの地雷の数をカウント
      newBoard = searchMines(newBoard);
      
      setIsStarted(true);
    }

    // 最初のクリックを記録
    newBoard[rowIndex][colIndex].opened = true;
    setBoard(newBoard);
  }
  
  return (
    <div className="game">
      <h1>マインスイーパー</h1>
      <div className="difficulty">
        <label htmlFor="difficulty">難易度:</label> {/* htmlForを使うとselectのidと関連付けができて難易度をクリックしてもselectがクリック判定になる */}
        <select
          id="difficulty"
          value={difficulty}
          onChange={difficultyChange}
        >
          <option value="easy">やさしい</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>
      <div className="board" style={{gridTemplateColumns: `repeat(${board[0].length}, ${cellSize}px)`}}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`${cell.opened ? 'opened' : 'cell'}`}
              style={{width: `${cellSize}px`, height: `${cellSize}px`}}
              onClick={() => cellClick(rowIndex, colIndex)}
            >
              {cell.opened && 0 < cell.number && cell.number}
              {cell.opened && cell.mine && '💣'}
              {cell.opened && cell.flagged && '🚩'}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export default App
