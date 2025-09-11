// 簡易 将棋CPU
// SFENを受け取り、ランダム合法手を返す



// 将棋の駒の定義・SFEN形式の駒と内部処理で使う駒のマッピングを定義します。
const PIECES = {
  'p': 'P', 'l': 'L', 'n': 'N', 's': 'S', 'g': 'G', 'b': 'B', 'r': 'R', 'k': 'K'
};

// 座標をUSI形式に変換 (0,0) -> "9a"
function coordToUSI(x, y) {
  const file = String(9 - x);
  const rank = String.fromCharCode(97 + y); // 'a' + y
  return file + rank;
}

// SFEN文字列を解析
function parseSFEN(sfen) {
  const parts = sfen.split(' ');
  const board = parts[0];
  const turn = parts[1];
  const hand = parts[2];
  
  // 盤面を解析
  const boardState = [];
  for (let i = 0; i < 9; i++) {
    boardState[i] = new Array(9).fill(null);
  }
  
  const rows = board.split('/');
  for (let y = 0; y < 9; y++) {
    let x = 0;
    let i = 0;
    while (i < rows[y].length && x < 9) {
      const char = rows[y][i];
      if (char >= '1' && char <= '9') {
        x += parseInt(char);
      } else if (char === '+') {
        i++;
        const nextChar = rows[y][i];
        boardState[y][x] = '+' + nextChar;
        x++;
      } else {
        boardState[y][x] = char;
        x++;
      }
      i++;
    }
  }
  
  // 持ち駒を解析
  const handPieces = {};
  if (hand !== '-') {
    let i = 0;
    while (i < hand.length) {
      let count = '';
      while (i < hand.length && hand[i] >= '0' && hand[i] <= '9') {
        count += hand[i];
        i++;
      }
      if (i < hand.length) {
        const piece = hand[i];
        handPieces[piece] = count ? parseInt(count) : 1;
        i++;
      }
    }
  }
  
  return { boardState, turn, handPieces };
}

// 駒が自分の駒かどうか判定
function isOwnPiece(piece, isFirstPlayer) {
  if (!piece) return false;
  
  if (piece.startsWith('+')) {
    // 成駒の場合、+を除いた部分で判定
    const basePiece = piece.substring(1);
    return isFirstPlayer ? basePiece === basePiece.toUpperCase() : basePiece === basePiece.toLowerCase();
  }
  
  // 通常の駒の場合
  // SFEN形式: 先手=大文字、後手=小文字
  return isFirstPlayer ? piece === piece.toUpperCase() : piece === piece.toLowerCase();
}

// 自分の玉の位置を取得
function findKing(boardState, isFirstPlayer) {
  const kingPiece = isFirstPlayer ? 'K' : 'k';
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (boardState[y][x] === kingPiece) {
        return [x, y];
      }
    }
  }
  return null;
}

// 成りが可能かチェック
function canPromote(piece, fromY, toY, isFirstPlayer) {
  if (piece.startsWith('+')) return false; // 既に成駒
  
  const basePiece = piece.replace('+', '').toLowerCase();
  if (!['p', 'l', 'n', 's', 'b', 'r'].includes(basePiece)) return false;
  
  if (isFirstPlayer) {
    return fromY <= 2 || toY <= 2; // 敵陣（上3段）に入るか出る
  } else {
    return fromY >= 6 || toY >= 6; // 敵陣（下3段）に入るか出る
  }
}

// 各駒の移動可能位置を取得
function getPossibleMoves(piece, fromX, fromY, boardState, isFirstPlayer) {
  const moves = [];
  const basePiece = piece.replace('+', '').toLowerCase();
  
  // 方向の調整（後手の場合は上下反転）
  const flipY = isFirstPlayer ? 1 : -1;
  
  switch (basePiece) {
    case 'p': // 歩
      if (piece.startsWith('+')) {
        // と金（金と同じ動き）
        const goldMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 0], [1, 0], [0, 1 * flipY]];
        for (const [dx, dy] of goldMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 歩の前進
        const newX = fromX;
        const newY = fromY + (-1 * flipY);
        if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
          moves.push([newX, newY]);
        }
      }
      break;
      
    case 'l': // 香
      if (piece.startsWith('+')) {
        // 成香（金と同じ動き）
        const goldMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 0], [1, 0], [0, 1 * flipY]];
        for (const [dx, dy] of goldMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 香の直線移動（前方）
        for (let i = 1; i < 9; i++) {
          const newX = fromX;
          const newY = fromY + (-i * flipY);
          if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
          
          const targetPiece = boardState[newY][newX];
          if (targetPiece) {
            if (!isOwnPiece(targetPiece, isFirstPlayer)) {
              moves.push([newX, newY]);
            }
            break;
          } else {
            moves.push([newX, newY]);
          }
        }
      }
      break;
      
    case 'n': // 桂
      if (piece.startsWith('+')) {
        // 成桂（金と同じ動き）
        const goldMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 0], [1, 0], [0, 1 * flipY]];
        for (const [dx, dy] of goldMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 桂の跳躍
        const knightMoves = [[-1, -2 * flipY], [1, -2 * flipY]];
        for (const [dx, dy] of knightMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      }
      break;
      
    case 's': // 銀
      if (piece.startsWith('+')) {
        // 成銀（金と同じ動き）
        const goldMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 0], [1, 0], [0, 1 * flipY]];
        for (const [dx, dy] of goldMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 銀の動き
        const silverMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 1 * flipY], [1, 1 * flipY]];
        for (const [dx, dy] of silverMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      }
      break;
      
    case 'g': // 金
      const goldMoves = [[-1, -1 * flipY], [0, -1 * flipY], [1, -1 * flipY], [-1, 0], [1, 0], [0, 1 * flipY]];
      for (const [dx, dy] of goldMoves) {
        const newX = fromX + dx;
        const newY = fromY + dy;
        if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
          moves.push([newX, newY]);
        }
      }
      break;
      
    case 'k': // 玉
      const kingMoves = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      for (const [dx, dy] of kingMoves) {
        const newX = fromX + dx;
        const newY = fromY + dy;
        if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
          moves.push([newX, newY]);
        }
      }
      break;
      
    case 'b': // 角
      if (piece.startsWith('+')) {
        // 馬（角の動き + 玉の動き）
        // 斜め直線
        const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dx, dy] of bishopDirs) {
          for (let i = 1; i < 9; i++) {
            const newX = fromX + dx * i;
            const newY = fromY + dy * i;
            if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
            
            const targetPiece = boardState[newY][newX];
            if (targetPiece) {
              if (!isOwnPiece(targetPiece, isFirstPlayer)) {
                moves.push([newX, newY]);
              }
              break;
            } else {
              moves.push([newX, newY]);
            }
          }
        }
        // 隣接する縦横
        const adjacentMoves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of adjacentMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 角の斜め直線移動
        const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dx, dy] of bishopDirs) {
          for (let i = 1; i < 9; i++) {
            const newX = fromX + dx * i;
            const newY = fromY + dy * i;
            if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
            
            const targetPiece = boardState[newY][newX];
            if (targetPiece) {
              if (!isOwnPiece(targetPiece, isFirstPlayer)) {
                moves.push([newX, newY]);
              }
              break;
            } else {
              moves.push([newX, newY]);
            }
          }
        }
      }
      break;
      
    case 'r': // 飛
      if (piece.startsWith('+')) {
        // 龍（飛の動き + 玉の動き）
        // 縦横直線
        const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of rookDirs) {
          for (let i = 1; i < 9; i++) {
            const newX = fromX + dx * i;
            const newY = fromY + dy * i;
            if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
            
            const targetPiece = boardState[newY][newX];
            if (targetPiece) {
              if (!isOwnPiece(targetPiece, isFirstPlayer)) {
                moves.push([newX, newY]);
              }
              break;
            } else {
              moves.push([newX, newY]);
            }
          }
        }
        // 隣接する斜め
        const adjacentMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dx, dy] of adjacentMoves) {
          const newX = fromX + dx;
          const newY = fromY + dy;
          if (isValidMove(newX, newY, boardState, isFirstPlayer)) {
            moves.push([newX, newY]);
          }
        }
      } else {
        // 飛の縦横直線移動
        const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dx, dy] of rookDirs) {
          for (let i = 1; i < 9; i++) {
            const newX = fromX + dx * i;
            const newY = fromY + dy * i;
            if (newX < 0 || newX >= 9 || newY < 0 || newY >= 9) break;
            
            const targetPiece = boardState[newY][newX];
            if (targetPiece) {
              if (!isOwnPiece(targetPiece, isFirstPlayer)) {
                moves.push([newX, newY]);
              }
              break;
            } else {
              moves.push([newX, newY]);
            }
          }
        }
      }
      break;
  }
  
  return moves;
}

// 移動が有効かチェック
function isValidMove(x, y, boardState, isFirstPlayer) {
  if (x < 0 || x >= 9 || y < 0 || y >= 9) return false;
  
  const targetPiece = boardState[y][x];
  if (!targetPiece) return true;
  
  return !isOwnPiece(targetPiece, isFirstPlayer);
}

// 指定した位置が敵から攻撃されているかチェック
function isUnderAttack(x, y, boardState, isFirstPlayer) {
  // 相手の駒から攻撃されているかチェック
  for (let fromY = 0; fromY < 9; fromY++) {
    for (let fromX = 0; fromX < 9; fromX++) {
      const piece = boardState[fromY][fromX];
      if (!piece || isOwnPiece(piece, isFirstPlayer)) continue;
      
      // 相手の駒の移動可能範囲を取得
      const enemyMoves = getPossibleMoves(piece, fromX, fromY, boardState, !isFirstPlayer);
      
      // 指定位置が攻撃範囲に含まれているかチェック
      for (const [moveX, moveY] of enemyMoves) {
        if (moveX === x && moveY === y) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// 手を指した後に王手になるかチェック
function isKingInCheckAfterMove(fromX, fromY, toX, toY, promote, boardState, handPieces, isFirstPlayer) {
  // 盤面をコピー
  const newBoard = boardState.map(row => [...row]);
  const newHandPieces = { ...handPieces };
  
  // 手を実行
  if (fromX === -1) {
    // 駒打ちの場合
    const dropPiece = Object.keys(handPieces).find(p => 
      isOwnPiece(p, isFirstPlayer) && handPieces[p] > 0
    );
    if (dropPiece) {
      newBoard[toY][toX] = dropPiece;
      newHandPieces[dropPiece]--;
    }
  } else {
    // 駒移動の場合
    const movingPiece = newBoard[fromY][fromX];
    const capturedPiece = newBoard[toY][toX];
    
    // 駒を移動
    newBoard[fromY][fromX] = null;
    
    if (promote) {
      newBoard[toY][toX] = '+' + movingPiece;
    } else {
      newBoard[toY][toX] = movingPiece;
    }
    
    // 駒を取った場合は持ち駒に加える
    if (capturedPiece) {
      let basePiece = capturedPiece.replace('+', '');
      // 相手の駒を自分の駒に変換
      if (isFirstPlayer) {
        basePiece = basePiece.toUpperCase();
      } else {
        basePiece = basePiece.toLowerCase();
      }
      newHandPieces[basePiece] = (newHandPieces[basePiece] || 0) + 1;
    }
  }
  
  // 玉の位置を取得
  const kingPos = findKing(newBoard, isFirstPlayer);
  if (!kingPos) return true; // 玉がない場合は危険とみなす
  
  // 玉が攻撃されているかチェック
  return isUnderAttack(kingPos[0], kingPos[1], newBoard, isFirstPlayer);
}

// 合法手を生成（王手回避チェック付き）
function generateLegalMoves(sfen) {
  const { boardState, turn, handPieces } = parseSFEN(sfen);
  const moves = [];
  const isFirstPlayer = turn === 'b';
  //const isFirstPlayer = turn === 'w';//現在の手番（turn）がwなら、先手プレイヤーである」という真偽値を isFirstPlayer に持たせている
  //console.log("isFirstPlayer:"+isFirstPlayer)
  
  // 盤上の駒の移動
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = boardState[y][x];
      if (!piece || !isOwnPiece(piece, isFirstPlayer)) continue;
      
      const possibleMoves = getPossibleMoves(piece, x, y, boardState, isFirstPlayer);
      
      for (const [newX, newY] of possibleMoves) {
        // 通常の移動
        if (!isKingInCheckAfterMove(x, y, newX, newY, false, boardState, handPieces, isFirstPlayer)) {
          const from = coordToUSI(x, y);
          const to = coordToUSI(newX, newY);
          moves.push(from + to);
        }
        
        // 成りが可能な場合
        if (canPromote(piece, y, newY, isFirstPlayer)) {
          if (!isKingInCheckAfterMove(x, y, newX, newY, true, boardState, handPieces, isFirstPlayer)) {
            const from = coordToUSI(x, y);
            const to = coordToUSI(newX, newY);
            moves.push(from + to + '+');
          }
        }
      }
    }
  }
  
  // 持ち駒の打ち込み
  for (const piece of Object.keys(handPieces)) {
    const count = handPieces[piece];
    if (count > 0 && isOwnPiece(piece, isFirstPlayer)) {
      // 持ち駒が歩の場合、二歩のチェック
      const isPawn = (isFirstPlayer && piece === 'P') || (!isFirstPlayer && piece === 'p');
      const dropPiece = PIECES[piece.toLowerCase()] || piece.toUpperCase();

      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (!boardState[y][x]) {
            // 二歩のチェック
            if (isPawn) {
              let pawnExistsInFile = false;
              for (let i = 0; i < 9; i++) {
                if (boardState[i][x] === piece) {
                  pawnExistsInFile = true;
                  break;
                }
              }
              if (pawnExistsInFile) {
                continue; // 二歩になるので、この筋には打てない
              }
            }
            
            // 王手にならない場合のみ追加
            if (!isKingInCheckAfterMove(-1, -1, x, y, false, boardState, handPieces, isFirstPlayer)) {
              const to = coordToUSI(x, y);
              moves.push(dropPiece + '*' + to);
            }
          }
        }
      }
    }
  }
  /*for (const piece of Object.keys(handPieces)) {
    const count = handPieces[piece];
    if (count > 0 && isOwnPiece(piece, isFirstPlayer)) {
      const dropPiece = PIECES[piece.toLowerCase()] || piece.toUpperCase();
      
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (!boardState[y][x]) {
            // 王手にならない場合のみ追加
            if (!isKingInCheckAfterMove(-1, -1, x, y, false, boardState, handPieces, isFirstPlayer)) {
              const to = coordToUSI(x, y);
              moves.push(dropPiece + '*' + to);
              //moves.push(dropPiece + to);
            }
          }
        }
      }
    }
  }
  */
  return moves;
}

// メイン関数
export function getBestMoveFromSFEN(sfen) {
  try {
    const legalMoves = generateLegalMoves(sfen);
    
    if (legalMoves.length === 0) {
      return null;
    }
    
    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
    
  } catch (error) {
    console.error('SFEN解析エラー:', error);
    return null;
  }
}

// デバッグ用：盤面状態を表示
/*
function debugBoard(sfen) {
  const { boardState, turn, handPieces } = parseSFEN(sfen);
  console.log("=== 盤面状態 ===");
  console.log("手番:", turn === 'b' ? '先手' : '後手');
  
  for (let y = 0; y < 9; y++) {
    let row = "";
    for (let x = 0; x < 9; x++) {
      const piece = boardState[y][x];
      row += (piece || "  ").padEnd(3);
    }
    console.log(`${y}段: ${row}`);
  }
  
  console.log("持ち駒:", handPieces);
  
  // 特定位置の詳細確認
  console.log(`1c位置(x=8,y=2)の駒: "${boardState[2][8]}"`);
  console.log(`1b位置(x=8,y=1)の駒: "${boardState[1][8]}"`);
  
  // 駒の所有者判定テスト
  const isFirstPlayer = turn === 'b';
  console.log("\n=== 駒の所有者判定テスト ===");
  console.log(`"p"は先手の駒? ${isOwnPiece("p", isFirstPlayer)}`);
  console.log(`"P"は先手の駒? ${isOwnPiece("P", isFirstPlayer)}`);
  console.log(`"l"は先手の駒? ${isOwnPiece("l", isFirstPlayer)}`);
  console.log(`"L"は先手の駒? ${isOwnPiece("L", isFirstPlayer)}`);
}

// 詳細な合法手生成デバッグ
function debugMoveGeneration(sfen) {
  const { boardState, turn, handPieces } = parseSFEN(sfen);
  const isFirstPlayer = turn === 'b';
  console.log("\n=== 合法手生成デバッグ ===");
  
  // 盤上の各駒をチェック
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = boardState[y][x];
      if (!piece) continue;
      
      const isOwn = isOwnPiece(piece, isFirstPlayer);
      const pos = coordToUSI(x, y);
      
      if (isOwn) {
        const possibleMoves = getPossibleMoves(piece, x, y, boardState, isFirstPlayer);
        if (possibleMoves.length > 0) {
          console.log(`${pos}の${piece}: ${possibleMoves.length}手 - ${possibleMoves.map(([mx,my]) => coordToUSI(mx,my)).slice(0,3).join(', ')}
          ${possibleMoves.length > 3 ? '...' : ''}`);
        }
      }
    }
  }
}

// テスト用の関数
if (typeof window !== 'undefined' && window.console) {
  const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL b - 2";
  
  debugBoard(sfen)

  console.log("=== 王手回避機能付き合法手生成テスト ===");
  const allMoves = generateLegalMoves(sfen);
  console.log(`総合法手数: ${allMoves.length}`);
  console.log("合法手の例（最初の10手）:", allMoves.slice(0, 10));
  
  const move = getBestMoveFromSFEN(sfen);
  console.log("bestmove", move);
  
  // 複数回テスト
  console.log("\n複数回実行テスト:");
  for (let i = 0; i < 5; i++) {
    console.log(`${i + 1}回目:`, getBestMoveFromSFEN(sfen));
  }
}*/




/*
// 将棋の駒の定義
const PIECES = {
  'p': 'P', 'l': 'L', 'n': 'N', 's': 'S', 'g': 'G', 'b': 'B', 'r': 'R', 'k': 'K'
};

// 駒の移動パターン（先手基準）
const MOVE_PATTERNS = {
  'p': [[0, -1]], // 歩
  'l': [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6], [0, -7], [0, -8]], // 香（直線）
  'n': [[-1, -2], [1, -2]], // 桂
  's': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1]], // 銀
  'g': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], // 金
  'k': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], // 玉
  'b': [], // 角（斜め直線、後で生成）
  'r': [], // 飛（縦横直線、後で生成）
  '+p': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], // と金
  '+l': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], // 成香
  '+n': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], // 成桂
  '+s': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], // 成銀
  '+b': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]], // 馬
  '+r': [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] // 龍
};

// 角と飛車の直線移動を生成
function generateStraightMoves() {
  // 角の斜め移動
  MOVE_PATTERNS['b'] = [];
  for (let i = 1; i < 9; i++) {
    MOVE_PATTERNS['b'].push([-i, -i], [-i, i], [i, -i], [i, i]);
  }
  
  // 飛車の縦横移動
  MOVE_PATTERNS['r'] = [];
  for (let i = 1; i < 9; i++) {
    MOVE_PATTERNS['r'].push([0, -i], [0, i], [-i, 0], [i, 0]);
  }
  
  // 馬の角移動を追加
  for (let i = 1; i < 9; i++) {
    MOVE_PATTERNS['+b'].push([-i, -i], [-i, i], [i, -i], [i, i]);
  }
  
  // 龍の縦横移動を追加
  for (let i = 1; i < 9; i++) {
    MOVE_PATTERNS['+r'].push([0, -i], [0, i], [-i, 0], [i, 0]);
  }
}

generateStraightMoves();

// 座標をUSI形式に変換 (0,0) -> "9a"
function coordToUSI(x, y) {
  const file = String(9 - x);
  const rank = String.fromCharCode(97 + y); // 'a' + y
  return file + rank;
}

// SFEN文字列を解析
function parseSFEN(sfen) {
  const parts = sfen.split(' ');
  const board = parts[0];
  const turn = parts[1];
  const hand = parts[2];
  
  // 盤面を解析
  const boardState = [];
  for (let i = 0; i < 9; i++) {
    boardState[i] = new Array(9).fill(null);
  }
  
  const rows = board.split('/');
  for (let y = 0; y < 9; y++) {
    let x = 0;
    let i = 0;
    while (i < rows[y].length && x < 9) {
      const char = rows[y][i];
      if (char >= '1' && char <= '9') {
        x += parseInt(char);
      } else if (char === '+') {
        i++;
        const nextChar = rows[y][i];
        boardState[y][x] = '+' + nextChar;
        x++;
      } else {
        boardState[y][x] = char;
        x++;
      }
      i++;
    }
  }
  
  // 持ち駒を解析
  const handPieces = {};
  if (hand !== '-') {
    let i = 0;
    while (i < hand.length) {
      let count = '';
      while (i < hand.length && hand[i] >= '0' && hand[i] <= '9') {
        count += hand[i];
        i++;
      }
      if (i < hand.length) {
        const piece = hand[i];
        handPieces[piece] = count ? parseInt(count) : 1;
        i++;
      }
    }
  }
  
  return { boardState, turn, handPieces };
}

// 駒が自分の駒かどうか判定
function isOwnPiece(piece, isFirstPlayer) {
  if (!piece) return false;
  if (piece.startsWith('+')) {
    const basePiece = piece.substring(1);
    return isFirstPlayer ? basePiece === basePiece.toLowerCase() : basePiece === basePiece.toUpperCase();
  }
  return isFirstPlayer ? piece === piece.toLowerCase() : piece === piece.toUpperCase();
}

// 移動パターンを手番に応じて調整
function adjustMovePattern(pattern, isFirstPlayer) {
  if (isFirstPlayer) {
    return pattern;
  } else {
    // 後手の場合は上下反転
    return pattern.map(([dx, dy]) => [dx, -dy]);
  }
}

// 直線移動の合法性をチェック
function checkLinearMove(boardState, fromX, fromY, dx, dy, isFirstPlayer) {
  const moves = [];
  let x = fromX + dx;
  let y = fromY + dy;
  
  while (x >= 0 && x < 9 && y >= 0 && y < 9) {
    const targetPiece = boardState[y][x];
    
    if (targetPiece) {
      // 相手の駒なら取れる
      if (!isOwnPiece(targetPiece, isFirstPlayer)) {
        moves.push([x, y]);
      }
      break; // 駒があったら直線移動終了
    } else {
      moves.push([x, y]);
    }
    
    x += dx;
    y += dy;
  }
  
  return moves;
}

// 成りが可能かチェック
function canPromote(piece, fromY, toY, isFirstPlayer) {
  if (piece.startsWith('+')) return false; // 既に成駒
  
  const basePiece = piece.toLowerCase();
  if (!['p', 'l', 'n', 's', 'b', 'r'].includes(basePiece)) return false;
  
  if (isFirstPlayer) {
    return fromY <= 2 || toY <= 2; // 敵陣（上3段）
  } else {
    return fromY >= 6 || toY >= 6; // 敵陣（下3段）
  }
}

// 合法手を生成
function generateLegalMoves(sfen) {
  const { boardState, turn, handPieces } = parseSFEN(sfen);
  const moves = [];
  const isFirstPlayer = turn === 'b';
  
  // 盤上の駒の移動
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = boardState[y][x];
      if (!piece || !isOwnPiece(piece, isFirstPlayer)) continue;
      
      const basePiece = piece.startsWith('+') ? piece : piece.toLowerCase();
      let patterns = MOVE_PATTERNS[basePiece] || [];
      
      // 直線移動する駒の処理
      if (['l', 'b', 'r', '+b', '+r'].includes(basePiece)) {
        if (basePiece === 'l') {
          // 香の直線移動
          const direction = isFirstPlayer ? [0, -1] : [0, 1];
          const linearMoves = checkLinearMove(boardState, x, y, direction[0], direction[1], isFirstPlayer);
          for (const [newX, newY] of linearMoves) {
            const from = coordToUSI(x, y);
            const to = coordToUSI(newX, newY);
            moves.push(from + to);
            
            if (canPromote(piece, y, newY, isFirstPlayer)) {
              moves.push(from + to + '+');
            }
          }
        } else if (['b', 'r', '+b', '+r'].includes(basePiece)) {
          // 角・飛車・馬・龍の直線移動
          const directions = basePiece === 'b' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] :
                           basePiece === 'r' ? [[0, -1], [0, 1], [-1, 0], [1, 0]] :
                           basePiece === '+b' ? [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]] :
                           [[-1, -1], [-1, 1], [1, -1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]];
          
          for (const [dx, dy] of directions) {
            const adjustedDir = adjustMovePattern([[dx, dy]], isFirstPlayer)[0];
            const linearMoves = checkLinearMove(boardState, x, y, adjustedDir[0], adjustedDir[1], isFirstPlayer);
            
            for (const [newX, newY] of linearMoves) {
              const from = coordToUSI(x, y);
              const to = coordToUSI(newX, newY);
              moves.push(from + to);
              
              if (canPromote(piece, y, newY, isFirstPlayer)) {
                moves.push(from + to + '+');
              }
            }
          }
          
          // 馬・龍の単歩移動
          if (basePiece === '+b') {
            const singleMoves = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            for (const [dx, dy] of singleMoves) {
              const [adjDx, adjDy] = adjustMovePattern([[dx, dy]], isFirstPlayer)[0];
              const newX = x + adjDx;
              const newY = y + adjDy;
              
              if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
                const targetPiece = boardState[newY][newX];
                if (!targetPiece || !isOwnPiece(targetPiece, isFirstPlayer)) {
                  const from = coordToUSI(x, y);
                  const to = coordToUSI(newX, newY);
                  moves.push(from + to);
                }
              }
            }
          } else if (basePiece === '+r') {
            const singleMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dx, dy] of singleMoves) {
              const [adjDx, adjDy] = adjustMovePattern([[dx, dy]], isFirstPlayer)[0];
              const newX = x + adjDx;
              const newY = y + adjDy;
              
              if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
                const targetPiece = boardState[newY][newX];
                if (!targetPiece || !isOwnPiece(targetPiece, isFirstPlayer)) {
                  const from = coordToUSI(x, y);
                  const to = coordToUSI(newX, newY);
                  moves.push(from + to);
                }
              }
            }
          }
        }
      } else {
        // 通常の移動パターン
        const adjustedPatterns = adjustMovePattern(patterns, isFirstPlayer);
        
        for (const [dx, dy] of adjustedPatterns) {
          const newX = x + dx;
          const newY = y + dy;
          
          if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
            const targetPiece = boardState[newY][newX];
            
            if (!targetPiece || !isOwnPiece(targetPiece, isFirstPlayer)) {
              const from = coordToUSI(x, y);
              const to = coordToUSI(newX, newY);
              moves.push(from + to);
              
              if (canPromote(piece, y, newY, isFirstPlayer)) {
                moves.push(from + to + '+');
              }
            }
          }
        }
      }
    }
  }
  
  // 持ち駒の打ち込み
  for (const piece of Object.keys(handPieces)) {
    const count = handPieces[piece];
    if (count > 0 && isOwnPiece(piece, isFirstPlayer)) {
      const dropPiece = PIECES[piece.toLowerCase()] || piece.toUpperCase();
      
      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          if (!boardState[y][x]) {
            const to = coordToUSI(x, y);
            moves.push(dropPiece + '*' + to);
          }
        }
      }
    }
  }
  
  return moves;
}

// メイン関数
export function getBestMoveFromSFEN(sfen) {
  try {
    const legalMoves = generateLegalMoves(sfen);
    
    if (legalMoves.length === 0) {
      return null;
    }
    
    // ランダムに1つ選択
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
    
  } catch (error) {
    console.error('SFEN解析エラー:', error);
    return null;
  }
}

// テスト実行
const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL b - 2";
//const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL b -2";
const move = getBestMoveFromSFEN(sfen);
console.log("bestmove", move);

// 複数回テストして異なる手が出ることを確認
console.log("\n複数回実行テスト:");
for (let i = 0; i < 5; i++) {
  console.log(`${i + 1}回目:`, getBestMoveFromSFEN(sfen));
}

// 生成される合法手の一部を表示
console.log("\n生成される合法手の例（最初の10手）:");
const { boardState, turn, handPieces } = parseSFEN(sfen);
const allMoves = generateLegalMoves(sfen);
console.log(allMoves.slice(0, 10));
*/

//// SFENから合法手を1つ選んで返す関数
//export function getBestMoveFromSFEN(sfen) {

// テスト実行
/*const sfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL b - 2";
const move = getBestMoveFromSFEN(sfen);
console.log("bestmove", move);

// 複数回テストして異なる手が出ることを確認
console.log("\n複数回実行テスト:");
for (let i = 0; i < 5; i++) {
  console.log(`${i + 1}回目:`, getBestMoveFromSFEN(sfen));
}*/



/*
const boardData = {"board":
  [
    [
      {"owner":"後手","name":"香","dx":[0],"dy":[-1],"dk":[10]},
      {"owner":"後手","name":"桂","dx":[-1,1],"dy":[-2,-2],"dk":[1,1]},
      {"owner":"後手","name":"銀","dx":[-1,-1,1,1,0],"dy":[-1,1,1,-1,-1],"dk":[1,1,1,1,1]},
      {"owner":"後手","name":"金","dx":[-1,-1,0,1,1,0],"dy":[-1,0,1,0,-1,-1],"dk":[1,1,1,1,1,1]},
      {"owner":"後手","name":"王","dx":[-1,-1,-1,0,1,1,1,0],"dy":[-1,0,1,1,1,0,-1,-1],"dk":[1,1,1,1,1,1,1,1]},
      {"owner":"後手","name":"金","dx":[-1,-1,0,1,1,0],"dy":[-1,0,1,0,-1,-1],"dk":[1,1,1,1,1,1]},
      {"owner":"後手","name":"銀","dx":[-1,-1,1,1,0],"dy":[-1,1,1,-1,-1],"dk":[1,1,1,1,1]},
      {"owner":"後手","name":"桂","dx":[-1,1],"dy":[-2,-2],"dk":[1,1]},
      {"owner":"後手","name":"香","dx":[0],"dy":[-1],"dk":[10]}
    ],[
      {},
      {"owner":"後手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],
      "dk":[10,10,10,10]},
      {},{},{},{},{},
      {"owner":"後手","name":"角","dx":[-1,-1,1,1],"dy":[-1,1,1,-1],"dk":[10,10,10,10]},
      {}
    ],[
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]}
    ],[
      {},{},{},{},{},{},{},{},{}],[{},{},{},{},{},{},{},{},{}
    ],[
      {},{},{},{},{},{},{},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {}
    ],[
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]},
      {},
      {"owner":"先手","name":"歩","dx":[0],"dy":[-1],"dk":[1]}
    ],[
      {},
      {"owner":"先手","name":"角","dx":[-1,-1,1,1],"dy":[-1,1,1,-1],"dk":[10,10,10,10]},
      {},{},{},{},{},
      {"owner":"先手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],"dk":[10,10,10,10]},
      {}
    ],[
      {"owner":"先手","name":"香","dx":[0],"dy":[-1],"dk":[10]},
      {"owner":"先手","name":"桂","dx":[-1,1],"dy":[-2,-2],"dk":[1,1]},
      {"owner":"先手","name":"銀","dx":[-1,-1,1,1,0],"dy":[-1,1,1,-1,-1],"dk":[1,1,1,1,1]},
      {"owner":"先手","name":"金","dx":[-1,-1,0,1,1,0],"dy":[-1,0,1,0,-1,-1],"dk":[1,1,1,1,1,1]},
      {"owner":"先手","name":"王","dx":[-1,-1,-1,0,1,1,1,0],"dy":[-1,0,1,1,1,0,-1,-1],"dk":[1,1,1,1,1,1,1,1]},
      {"owner":"先手","name":"金","dx":[-1,-1,0,1,1,0],"dy":[-1,0,1,0,-1,-1],"dk":[1,1,1,1,1,1]},
      {"owner":"先手","name":"銀","dx":[-1,-1,1,1,0],"dy":[-1,1,1,-1,-1],"dk":[1,1,1,1,1]},
      {"owner":"先手","name":"桂","dx":[-1,1],"dy":[-2,-2],"dk":[1,1]},
      {"owner":"先手","name":"香","dx":[0],"dy":[-1],"dk":[10]}
    ]
  ],
  "pieceStandNum":{"先手":{"歩":0,"香":0,"桂":0,"銀":0,"金":0,"角":0,"飛":0},"後手":{"歩":0,"香":0,"桂":0,"銀":0,"金":0,"角":0,"飛":0}},"pieceStand":{"先手":[{},{},{},{},{},{},{},{},{}],"後手":[{},{},{},{},{},{},{},{},{}]},
  "nowTurn":"後手",
  "selection":{
    "boardSelectInfo":[
      ["","","","","","","","",""],
      ["","","","","","","","",""],
      ["","","","","","","","",""],
      ["","","","","","","","",""],["","","","","","","","",""],["","","","","","","","",""],["","","","","","","","",""],["","","","","","","","",""],["","","","","","","","",""]
    ],
    "isNow":false,
    "state":false,
    "before_i":null,
    "before_j":null,
    "pieceStandSelectInfo":{
      "先手":["持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒"],
      "後手":["持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒"]
    },
    "pieceStandPiece":{}
  }
}

console.log("===================================");
console.log("Starting Shogi CPU Test");
console.log("===================================");

const bestMove = getBestMoveFromSFEN(boardData);

console.log(`bestmove ${bestMove}`);
console.log("===================================");
*/

/*
// USI形式の駒の種類
const PIECES = ' PLNSGBRK plnsgbrk';
const SENTE = 1;
const GOTE = -1;

// 盤面データ（一次元配列）
let board = new Array(81);
let turn = SENTE;

// SFEN文字列から盤面を読み込む関数
function loadSfen(sfen) {
    let sfenParts = sfen.split(' ');
    let boardPart = sfenParts[0];
    let turnPart = sfenParts[1];

    // 盤面をクリア
    board.fill(0);

    let row = 0;
    let col = 0;
    for (let i = 0; i < boardPart.length; i++) {
        let char = boardPart.charAt(i);
        if (char === '/') {
            row++;
            col = 0;
        } else if (char >= '1' && char <= '9') {
            let emptyCount = parseInt(char);
            col += emptyCount;
        } else {
            board[row * 9 + col] = PIECES.indexOf(char);
            col++;
        }
    }

    // 手番を設定
    turn = (turnPart === 'b') ? SENTE : GOTE;
}

// 駒の移動方向を定義 (ごく簡単な実装)
const moveDirections = {
    'P': [[-1, 0]], 'L': [[-1, 0]], 'N': [[-2, -1], [-2, 1]], 'S': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    'G': [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1]],
    'R': [[-1, 0], [1, 0], [0, -1], [0, 1]],
    'B': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    'K': [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]],
};

// 合法手を生成する関数（非常に簡略化されたロジック）
function generateLegalMoves() {
    const moves = [];
    for (let i = 0; i < 81; i++) {
        let pieceCode = board[i];
        if (pieceCode === 0) continue;
        let piece = PIECES[pieceCode];
        let isSente = piece.toUpperCase() === piece;
        let isMyPiece = (isSente && turn === SENTE) || (!isSente && turn === GOTE);

        if (isMyPiece) {
            let startRow = Math.floor(i / 9);
            let startCol = i % 9;
            let directions = moveDirections[piece.toUpperCase()];

            directions.forEach(dir => {
                let [dRow, dCol] = dir;
                let endRow = startRow + (isSente ? dRow : -dRow);
                let endCol = startCol + (isSente ? dCol : -dCol);
                let endPos = endRow * 9 + endCol;

                if (endRow >= 0 && endRow < 9 && endCol >= 0 && endCol < 9) {
                    // USI形式の指し手を生成
                    const from = `${9 - startRow}${String.fromCharCode(97 + startCol)}`;
                    const to = `${9 - endRow}${String.fromCharCode(97 + endCol)}`;
                    moves.push(`${from}${to}`);
                }
            });
        }
    }
    return moves;
}

// SFENから合法手を1つ選んで返す関数
export function getBestMoveFromSFEN(sfen) {
    loadSfen(sfen);
    const legalMoves = generateLegalMoves();
    
    if (legalMoves.length === 0) {
        return null; // 指し手がなければnullを返す
    }

    // 合法手の中からランダムに1つ選ぶ
    const randomIndex = Math.floor(Math.random() * legalMoves.length);
    return legalMoves[randomIndex];
}*/





// サンプルコード
//const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/P1PPPPPPP/1B5R1/LNSGKGSNL b - 1";
//const move = getBestMoveFromSFEN(sfen);
//console.log("bestmove", move);

/*
function parseSFEN(sfen) {
  // sfen例: "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
  const [boardStr, turn] = sfen.split(" ");
  const rows = boardStr.split("/");

  let board = [];
  rows.forEach((row, r) => {
    let col = 0;
    for (const ch of row) {
      if (/[1-9]/.test(ch)) {
        col += parseInt(ch, 10);
      } else {
        board.push({ piece: ch, x: col, y: r });
        col++;
      }
    }
  });

  return { board, turn };
}

function generateMoves(sfen) {
  const { board, turn } = parseSFEN(sfen);
  const moves = [];

  for (const { piece, x, y } of board) {
    const isBlack = piece === piece.toUpperCase(); // 先手大文字
    if ((turn === "b" && isBlack) || (turn === "w" && !isBlack)) {
      switch (piece.toLowerCase()) {
        case "p": // 歩
          if (isBlack && y > 0) moves.push(`${x+1}${9-y}${x+1}${9-(y-1)}`);
          if (!isBlack && y < 8) moves.push(`${x+1}${9-y}${x+1}${9-(y+1)}`);
          break;
        case "k": // 王
          const dirs = [
            [1,0],[-1,0],[0,1],[0,-1],
            [1,1],[1,-1],[-1,1],[-1,-1]
          ];
          for (const [dx,dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < 9 && ny >= 0 && ny < 9) {
              moves.push(`${x+1}${9-y}${nx+1}${9-ny}`);
            }
          }
          break;
      }
    }
  }
  return moves;
}

function think(sfen) {
  const moves = generateMoves(sfen);
  if (moves.length === 0) return "resign";
  const move = moves[Math.floor(Math.random() * moves.length)];
  return move;
}

// --- USI風のやり取りを模擬 ---
//export function usiGo(sfen) {
export function getBestMoveFromSFEN(sfen) {
  const move = think(sfen);
  //console.log("bestmove", move);
  return move
}

// ---- テスト ----
const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";
//usiGo(sfen);
//getBestMoveFromSFEN(sfen);
*/

/*
// 盤面サイズ
const FILES = 9;
const RANKS = 9;

// 簡易盤面クラス
class Board {
  constructor() {
    // 9x9の盤を"."で初期化
    this.board = Array.from({ length: RANKS }, () => Array(FILES).fill("."));
    this.turn = "b"; // b=先手, w=後手
  }

  // SFENのパース（駒配置 + 手番）
  loadSFEN(sfen) {
    const [pos, turn] = sfen.split(" ");
    const ranks = pos.split("/");
    for (let r = 0; r < RANKS; r++) {
      let file = 0;
      for (const ch of ranks[r]) {
        if (/[1-9]/.test(ch)) {
          file += parseInt(ch, 10);
        } else {
          this.board[r][file] = ch;
          file++;
        }
      }
    }
    this.turn = turn;
  }

  // ランダムに合法手っぽい動きを作る（本物の合法判定はしていない）
  // 本格的にやるなら駒ごとの動きルールを実装する必要あり
  generatePseudoLegalMoves() {
    const moves = [];
    for (let r = 0; r < RANKS; r++) {
      for (let f = 0; f < FILES; f++) {
        const piece = this.board[r][f];
        if (piece === ".") continue;

        const isSentePiece = piece === piece.toUpperCase();
        if ((this.turn === "b" && isSentePiece) ||
            (this.turn === "w" && !isSentePiece)) {
          // とりあえず1マス前に動かすだけの超簡易ルール
          const dir = this.turn === "b" ? -1 : 1;
          const nr = r + dir;
          if (nr >= 0 && nr < RANKS) {
            const move = `${f+1}${FILES-r}${f+1}${FILES-nr}`; // USI座標形式
            moves.push(move);
          }
        }
      }
    }
    return moves;
  }

  // bestmoveを返す
  getBestMove() {
    const moves = this.generatePseudoLegalMoves();
    if (moves.length === 0) return "resign";
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

// --- API風に呼び出せる関数 ---
export function getBestMoveFromSFEN(sfen) {
  const board = new Board();
  board.loadSFEN(sfen);
  return board.getBestMove();
}
*/