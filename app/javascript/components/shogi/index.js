import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import imgKing from "./img/玉.png";
import imgRook from "./img/飛.png";
import imgBishop from "./img/角.png";
import imgGoldGeneral from "./img/金.png";
import imgSilverGeneral from "./img/銀.png";
import imgKnight from "./img/桂.png";
import imgLance from "./img/香.png";
import imgPawn from "./img/歩.png";
import imgPromotedRook from "./img/竜.png";
import imgPromotedBishop from "./img/馬.png";
import imgPromotedSilverGeneral from "./img/成銀.png";
import imgPromotedKnight from "./img/成桂.png";
import imgPromotedLance from "./img/成香.png";
import imgPromotedPawn from "./img/と.png";
//import { BoardInfo, Selection } from './components/BoardInfo';
import { BoardInfo, Selection } from './BoardInfo';

import { useEffect } from 'react'
//import { w3cwebsocket as W3CWebSocket } from 'websocket'
//import WebSocket from 'ws';

/*
//useEffect(() => {
  //const client = new W3CWebSocket('ws://localhost:3000/cable')
  //const client = new WebSocket('ws://localhost:3000/cable')
  const client = new WebSocket('ws://localhost:3000/cable')// ブラウザのネイティブWebSocket APIを使用


  client.onopen = () => {
    console.log('WebSocket Client Connected')
  }

  client.onmessage = (message) => {
    const data = JSON.parse(message.data)
    // Update board state based on received data
  }
//}, [])

const sendMove = (move) => {
  client.send(JSON.stringify({
    command: 'message',
    identifier: JSON.stringify({ channel: 'GameChannel', game_id: '1' }),
    data: JSON.stringify({ action: 'make_move', move })
  }))
}
*/
/*
//const socket = new WebSocket('ws://' + window.location.host + '/cable');
const socket = new WebSocket('ws://localhost:3000/cable');

socket.onopen = function(event) {
  console.log('WebSocket connected');
  socket.send(JSON.stringify({
    type: 'join_drawing',
    drawing_id: 1
  }));
};

*socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  if (data.type === 'drawing') {
    drawLine(
      data.fromX, data.fromY, 
      data.toX, data.toY, 
      data.color
    );
  }
};*
socket.onmessage = (message) => {
  const data = JSON.parse(message.data)
  // Update board state based on received data
}


// Send drawing data via WebSocket// WebSocket経由で描画データを送信する
socket.send(JSON.stringify({
  type: 'drawing',
  drawing_id: 1,
  fromX: 2
}));
*/


// 駒の画像をname(漢字)をキーとしたオブジェクトにマッピング
const imgByName = {
  "玉": imgKing,
  "飛": imgRook,
  "角": imgBishop,
  "金": imgGoldGeneral,
  "銀": imgSilverGeneral,
  "桂": imgKnight,
  "香": imgLance,
  "歩": imgPawn,
  "竜": imgPromotedRook,
  "馬": imgPromotedBishop,
  "成銀": imgPromotedSilverGeneral,
  "成桂": imgPromotedKnight,
  "成香": imgPromotedLance,
  "と": imgPromotedPawn
};

// マス目を表現するコンポーネント
function Square(props) {
  // props.selectInfo: マスの選択状態 ("選択状態"/"配置可能"/"未選択")
  // props.piece: マスに置かれている駒の情報
  // props.num: 持ち駒の数（持ち駒の場合のみ）
  return (
    <button id={props.selectInfo} className="square" onClick={props.onClick} >
      <img id={props.piece.owner} src={imgByName[props.piece.name]} alt="" />
      <p>{(props.num >= 2) && props.num}</p>
    </button>
  );
}


// 将棋盤を表現するコンポーネント
class Board extends React.Component {
  // 9x9のマス目を生成
  renderSquare(i, j) {
    return (
      <Square
        key={j}
        piece={this.props.board[i][j]}
        selectInfo={this.props.boardSelectInfo[i][j]}
        onClick={() => this.props.onClick(i, j)}
      />
    );
  }

  render() {
    // 9x9のグリッドを生成
    return (
      <div>
        {
          Array(9).fill(0).map((_, i) => {
            return (
              <div className="board-row" key={i}>
                {
                  Array(9).fill(0).map((_, j) => {
                    return (
                      this.renderSquare(i, j)
                    )
                  })
                }
              </div>
            )
          })
        }
      </div>
    );
  }
}

// 持ち駒台を表現するコンポーネント
class PieceStand extends React.Component {
  renderSquare(i) {
    return (
      <Square
        key={i}
        piece={this.props.pieceStand[i]}// 持ち駒の情報
        num={this.props.pieceStandNum[this.props.pieceStand[i].name]}// 持ち駒の数
        selectInfo={this.props.pieceStandSelectInfo[i]}// 選択状態
        onClick={() => this.props.onClick(i)}// クリックハンドラ
      />
    );
  }

  render() {
    // 持ち駒台を横一列で表示
    return (
      <div className="board-row">
        {
          Array(9).fill(0).map((_, i) => {
            return (
              this.renderSquare(i)
            )
          })
        }
      </div>
    );
  }
}

// ゲーム全体を管理するメインコンポーネント
class Game extends React.Component {
  constructor(props) {
    super(props);
    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;
    console.log("gameId: "+gameId)
    /*console.log("this.props.gameId: "+this.props.gameId)
    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;
    console.log("gameId: "+gameId)

    this.socket = new WebSocket('ws://' + window.location.host + '/cable');// WebSocket接続を確立
    this.socket.onopen = () => {// WebSocket接続が開いたときの処理
      console.log('GameChannel_WebSocket connected');
      this.socket.send(JSON.stringify({// ChatChannelにサブスクライブ
        command: 'subscribe',
        identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
      }));
    };
    this.socket.onmessage = (event) => {// サーバーからメッセージを受信したときの処理
      *const data = JSON.parse(event.data);
      if (data.type === 'ping') return; // pingメッセージは無視
      //if (data.message) {
      if (data.message) {
        // 受信したメッセージをDOMに追加
        console.log("サーバーからメッセージを受信したときの処理: "+data.message)
      }*
      const data = JSON.parse(event.data);
  
      if (data.type === 'welcome') return;
      if (data.type === 'confirm_subscription') return;
  
      const message = JSON.parse(data.message);
      
      switch(message.action) {
        case 'move_made':
          handleMoveMade(message);
          break;
      }
    };
    */
    

    this.state = {
      boardInfo: new BoardInfo(gameId),// ゲームの状態を管理するクラスをインスタンス化
      gameId: props.gameId,
      socket: null,
      gameState: {}
    };
  }

  /*
  componentDidMount() {
    // Establish WebSocket connection
    const socket = new WebSocket('ws://localhost:3000/cable');
    
    socket.onopen = () => {
      // Subscribe to game channel
      socket.send(JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify({ 
          channel: 'GameChannel', 
          game_id: this.state.gameId 
        })
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Skip connection confirmation messages
      if (data.type === 'welcome' || data.type === 'confirm_subscription') return;

      const message = JSON.parse(data.message);
      this.handleChannelMessage(message);
    };

    this.setState({ socket });
  }


  // Send multiple values to the channel
  sendGameAction(action, additionalData = {}) {
    const { socket, gameId } = this.state;
    
    socket.send(JSON.stringify({
      command: 'message',
      identifier: JSON.stringify({ 
        channel: 'GameChannel', 
        game_id: gameId 
      }),
      data: JSON.stringify({ 
        action: action,
        game_id: gameId
      })
    }));
  }

  // Handle different types of channel messages
  handleChannelMessage(message) {
    switch(message.action) {
      case 'game_update':
        this.setState({ gameState: message.game_state });
        break;
      case 'move_made':
        this.updateGameAfterMove(message);
        break;
      // Add more message type handlers as needed
    }
  }

  // Example of sending a complex move
  makeMove(piece, fromPosition, toPosition) {
    this.sendGameAction('make_move', {
      piece: piece,
      from: fromPosition,
      to: toPosition,
      timestamp: Date.now()
    });
  }
*/

componentDidMount() {
  // WebSocket接続の確立
  const socket = new WebSocket('ws://' + window.location.host + '/cable');
  
  socket.onopen = () => {
    console.log('shogi WebSocket Connected');
    // ゲームチャンネルへの接続
    socket.send(JSON.stringify({
      command: 'subscribe',
      identifier: JSON.stringify({ channel: 'GameChannel', game_id: this.state.boardInfo.gameId 
      })
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('shogi onmessage');
    if (data.type === 'ping') return;
    
    if (data.message) {
      //const gameState = JSON.parse(data.message);
      const gameState = data.message.move;
      console.dir('shogi onmessage'+data.message.move);
      // 受信したゲーム状態で盤面を更新
      this.updateGameState(gameState);
    }
  };

  this.setState({ socket });
}

// ゲーム状態を更新する関数
updateGameState(gameState) {
  const nextBoardInfo = this.state.boardInfo;
  nextBoardInfo.board = gameState.board;
  nextBoardInfo.turn = gameState.turn;
  nextBoardInfo.pieceStandNum = gameState.pieceStandNum;
  nextBoardInfo.pieceStand = gameState.pieceStand;
  
  console.dir("updateGameStateのnextBoardInfo: "+nextBoardInfo);
  console.dir("updateGameStateのnextBoardInfo.board: "+nextBoardInfo.board);
  console.dir("updateGameStateのnextBoardInfo.turn : "+nextBoardInfo.turn );
  console.dir("updateGameStateのnextBoardInfo.pieceStandNum: "+nextBoardInfo.pieceStandNum);
  console.dir("updateGameStateのnextBoardInfo.pieceStand: "+nextBoardInfo.pieceStand);

  this.setState({
    boardInfo: nextBoardInfo
  });
}

// 盤面の状態をWebSocketで送信する関数
sendGameState() {
  if (!this.state.socket) return;

  const gameState = {
    board: this.state.boardInfo.board,
    turn: this.state.boardInfo.turn,
    pieceStandNum: this.state.boardInfo.pieceStandNum,
    pieceStand: this.state.boardInfo.pieceStand
  };
  console.dir('sendGameState'+gameState);
  this.state.socket.send(JSON.stringify({
    command: 'message',
    identifier: JSON.stringify({ channel: 'GameChannel', game_id: this.state.boardInfo.gameId }),
    data: JSON.stringify({
      action: 'make_move',
      game_id: this.state.boardInfo.gameId,
      move: gameState
    })
  }));
}


  // 選択状態をキャンセルする
  canselSelection() {
    const nextBoardInfo = this.state.boardInfo;
    if (nextBoardInfo.selection.isNow) {
      nextBoardInfo.selection.isNow = false;
    } else {
      nextBoardInfo.selection = new Selection();
    }
    this.setState({
      boardInfo: nextBoardInfo
    });
  }

  // 盤上のマスがクリックされた時の処理
  boardClick(i, j) {
    //this.state.boardInfo.boardClick(i, j);

    const prevState = { ...this.state.boardInfo };
    this.state.boardInfo.boardClick(i, j);
    
    // 盤面が変更された場合のみ送信
    if (JSON.stringify(prevState) !== JSON.stringify(this.state.boardInfo)) {
      this.sendGameState();
    }

    //const moveData = {x: 1,y: 2};
    const moveData =1
    /*this.socket.send(JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify({
            channel: 'GameChannel',
            game_id: 2
        }),
        data: JSON.stringify({
            action: 'make_move',
            game_id: 2,
            move: moveData
        })
    }));*/
    console.log("まじ ")
    //const moveData =1
    /*this.socket.send(JSON.stringify({
      command: 'message',
      identifier: JSON.stringify({ channel: 'GameChannel',game_id: 2 }),
      data: JSON.stringify({ action: 'make_move',game_id: 2,move: 1 })
    }));
    */

    /*this.socket.send(JSON.stringify({
      command: 'message',
      identifier: JSON.stringify({ 
        channel: 'GameChannel', 
        game_id: 2 
      }),
      data: JSON.stringify({ 
        action: 'make_move', 
        game_id: 2, 
        move: 1 
      })
    }));
*/

  }

  // 持ち駒がクリックされた時の処理
  pieceStandClick(piece) {
    //this.state.boardInfo.pieceStandClick(piece);

    const prevState = { ...this.state.boardInfo };
    this.state.boardInfo.pieceStandClick(piece);
    
    // 盤面が変更された場合のみ送信
    if (JSON.stringify(prevState) !== JSON.stringify(this.state.boardInfo)) {
      this.sendGameState();
    }
  }

  render() {

    return (
      <div className="game" onClick={() => this.canselSelection()}>
        <div className="game-board">
          {/* 後手の持ち駒台 */}
          <PieceStand
            pieceStand={this.state.boardInfo.pieceStand["後手"]}
            pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
            pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
            onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
          />
          <br />
          {/* 将棋盤 */}
          <Board
            board={this.state.boardInfo.board}
            boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
            onClick={(i, j) => this.boardClick(i, j)}
          />
          <br />
          {/* 先手の持ち駒台 */}
          <PieceStand
            pieceStand={this.state.boardInfo.pieceStand["先手"]}
            pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
            pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
            onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
          />
        </div>
      </div>
    );
  }
}

// ========================================

//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<Game />);
//root.render(<Shogi />);


export default Game