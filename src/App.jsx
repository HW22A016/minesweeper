import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(createBoard(difficulty));
  
  const [isStarted, setIsStarted] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

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

  function floodReveal(board, rowIndex, colIndex)
  {
    if(board[rowIndex][colIndex].mine || board[rowIndex][colIndex].number)
    {
      return;
    }
    
    const rowLength = board.length;
    const colLength = board[0].length;
    // 判定したかどうかの配列
    const visited = Array.from({ length: rowLength }, () => Array(colLength).fill(false));
    const queue = [[rowIndex, colIndex]];
    // 8方向
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    let head = 0;

    // 基準のマスを訪れた判定にする
    visited[rowIndex][colIndex] = true;
    
    while(head < queue.length)
    {
      const [currentRow, currentCol] = queue[head];
      for(const [rowOffset, colOffset] of directions)
      {
        const row = currentRow + rowOffset;
        const col = currentCol + colOffset;

        if(row < 0 || rowLength <= row || col < 0 || colLength <= col)
        {
          continue;
        }

        // 既に調べたかどうか
        if(visited[row][col])
        {
          continue;
        }
        
        // 地雷または旗が立っていれば開かない
        if(board[row][col].mine || board[row][col].flagged)
        {
          visited[row][col] = true;
          continue;
        }

        // 調べていないかつ地雷なしかつ旗なしなら開く
        board[row][col].opened = true;

        // 空白のマスならそこからまた調べる
        if(board[row][col].number === 0)
        {
          queue.push([row, col]);
        }

        visited[row][col] = true;
      }
      head++;
    }
  }

  // 最初のクリックの処理
  function firstClick(rowIndex, colIndex)
  {
    let newBoard = board.map(row =>
        row.map(cell => ({ ...cell }))
      )
  
    const { mines } = getDifficulty(difficulty);

    const safeZone = getSafeZone(board, rowIndex, colIndex);
    // 地雷配置
    newBoard = setMines(newBoard, safeZone, mines);
    // 周囲8マスの地雷の数をカウント
    newBoard = searchMines(newBoard);
    
    // 最初のクリックを記録
    setIsStarted(true);
    

    floodReveal(newBoard, rowIndex, colIndex);
    newBoard[rowIndex][colIndex].opened = true;

    setBoard(newBoard);
  }

  // 掘った時の処理
  function dig()
  {
    if(board[selectedCell.row][selectedCell.col].opened || board[selectedCell.row][selectedCell.col].flagged)
    {
      return;
    }

    let newBoard = board.map(row =>
        row.map(cell => ({ ...cell }))
      )

    floodReveal(newBoard, selectedCell.row, selectedCell.col);
    newBoard[selectedCell.row][selectedCell.col].opened = true;

    setSelectedCell(null);
    setBoard(newBoard);
  }

  // 旗のONOFF
  function setFlag()
  {
    const newBoard = board.map(row =>
        row.map(cell => ({ ...cell }))
      )
    
    newBoard[selectedCell.row][selectedCell.col].flagged = !newBoard[selectedCell.row][selectedCell.col].flagged;
    
    setBoard(newBoard);
    setSelectedCell(null);
  }

  function actionSelect(rowIndex, colIndex)
  {
    if(board[rowIndex][colIndex].opened)
    {
      return;
    }

    if(!isStarted)
    {
      firstClick(rowIndex, colIndex);
      return;
    }

    setSelectedCell({row: rowIndex, col: colIndex});
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
              className={`${cell.opened ? 'opened' : selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex ? 'selectCell' : 'cell'}`}
              style={{width: `${cellSize}px`, height: `${cellSize}px`}}
              onClick={() => actionSelect(rowIndex, colIndex)}
            >
              {cell.flagged && !cell.opened && '🚩'}
              {cell.opened && 0 < cell.number && cell.number}
              {cell.opened && cell.mine && '💣'}
            </button>
          ))
        )}
      </div>
      {selectedCell && (
        <div>
          <button
            onClick={() => dig()}
          >
            掘る
          </button>

          <button
            onClick={() => setFlag()}
          >
            旗を立てる
          </button>
        </div>
      )}
    </div>
  )
}

export default App
