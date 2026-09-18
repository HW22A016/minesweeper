import { useEffect, useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [difficulty, setDifficulty] = useState('easy');
  const [board, setBoard] = useState(createBoard(difficulty));
  const [flags, setFlags] = useState(0);
  
  const [isClear, setIsClear] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [timer, setTimer] = useState(0);

  const [data, setData] = useState(() => getLocalStorageData("minesweeper"));

  const { cellSize } = getDifficulty(difficulty);

  // timer, isStarted, isClear, isGameOverの変数が変更されれば動く
  // setTimeoutはtimer, isStarted, isClear, isGameOverの変数のどれかが変更されればclearTimeoutを実行してから新しいsetTimeoutを作る
  useEffect(() => {
    if(!isStarted || isGameOver)
    {
      return;
    }
    if(isClear)
    {
      updateData();
      return;
    }
    const timerId = setTimeout(() => {
      setTimer((time) => time + 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timer, isStarted, isClear, isGameOver]);

  function getLocalStorageData(key)
  {
    const localData = localStorage.getItem(key);
    return localData ? JSON.parse(localData) : [];
  }

  function updateData()
  {
    const newData = {
      ...data,
      [difficulty]: data[difficulty] ?
        timer < data[difficulty] ? timer : data[difficulty]
        :timer
    };

    localStorage.setItem("minesweeper", JSON.stringify(newData));
    setData(newData);
    console.log("記録が完了しました。");
  }

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
    reset(newDifficulty);
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
    setFlags(mines);

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

    // 全てのマスを掘り切った時の処理
    if(getRemainingCells(newBoard) === 0)
    {
      setIsClear(true);
    }
    // 爆弾を引いた時の処理
    else if(newBoard[selectedCell.row][selectedCell.col].mine)
    {
      setIsGameOver(true);
    }
  }

  // 旗のONOFF
  function setFlag()
  {
    const newBoard = board.map(row =>
        row.map(cell => ({ ...cell })
      )
    )

    // ボードのセルを保存
    const cell = newBoard[selectedCell.row][selectedCell.col];

    // 変更前のflagの状態を保存
    const wasFlagged = cell.flagged;

    if(!wasFlagged && flags === 0)
    {
      return;
    }
    
    cell.flagged = !wasFlagged;

    setFlags(flag => wasFlagged ? flag + 1 : flag - 1);
    
    setBoard(newBoard);
    setSelectedCell(null);
  }

  function actionSelect(rowIndex, colIndex)
  {
    // 開いていたら
    if(board[rowIndex][colIndex].opened)
    {
      return;
    }

    // 最初の一回目だけ
    if(!isStarted)
    {
      firstClick(rowIndex, colIndex);
      return;
    }

    // ゲームプレイが終わったら
    if(isClear || isGameOver)
    {
      return;
    }

    setSelectedCell({row: rowIndex, col: colIndex});
  }

  // 爆弾以外の掘っていないマスを返す関数
  function getRemainingCells(board)
  {
    return board.flat().filter(cell => !cell.opened && !cell.mine).length;
  }

  function reset(d = difficulty)
  {
    setIsClear(false);
    setIsGameOver(false);
    setIsStarted(false);
    setSelectedCell(null);
    setBoard(createBoard(d));
    setFlags(0);
    setTimer(0);
  }
  
  return (
    <div className="game">
      <h1>マインスイーパー</h1>
      <div className="difficulty">
        <label htmlFor="difficulty" className='textColor'>難易度:</label> {/* htmlForを使うとselectのidと関連付けができて難易度をクリックしてもselectがクリック判定になる */}
        <select
          id="difficulty"
          value={difficulty}
          onChange={difficultyChange}
        >
          <option value="easy">やさしい</option>
          <option value="hard">むずかしい</option>
        </select>
      </div>

      <div className='textColor'>
        {data[difficulty] !== undefined ?
          <p>最速記録:{data[difficulty]}秒</p> :
          <p>記録なし</p>
        }
      </div>
      <div className='textColor'>
        <p>⏰:{timer} 🚩x{flags}</p>
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
              {cell.flagged && !cell.opened && '🚩'}  {/* 旗が立っていたら表示 */}
              {!isClear && !isGameOver && cell.opened && 0 < cell.number && cell.number}
              {(isClear || isGameOver) && cell.mine && '💣'}  {/* clearとgameOverどちらかの判定がtrueかつ爆弾のcellなら */}
              {(isClear || isGameOver) && 0 < cell.number && cell.number} {/* clearとgameOverどちらかの判定がtrueかつ数字があるマスなら */}
            </button>
          ))
        )}

        {selectedCell && (
          <div className='actionSelectButton' style={{left: `${selectedCell.col * cellSize}px`, top: `${selectedCell.row * cellSize}px`}}>
            <button className='actionButton' style={{color: "#000"}} onClick={() => dig()}>
              ⛏
            </button>

            <button className='actionButton' onClick={() => setFlag()}>
              🚩
            </button>
          </div>
        )}
      </div>

      {isClear && (
        <div>
          <h1 style={{color: "#0F0"}}>GAMECLEAR</h1>
        </div>
      )}

      {isGameOver && (
        <div>
          <h1 style={{color: "#F00"}}>GAMEOVER</h1>
        </div>
      )}

      <div>
        <button
          onClick={() => reset()}
        >
          リセット
        </button>
      </div>
    </div>
  )
}

export default App
