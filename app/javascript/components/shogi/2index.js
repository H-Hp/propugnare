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

//将棋盤の1マスを表現するコンポーネント・ループさせて将棋盤と持ち駒台をつくる
// props.selectInfo: マスの選択状態 ("選択状態"/"配置可能"/"未選択")
// props.piece: マスに置かれている駒の情報
// props.num: 持ち駒の数（持ち駒の場合のみ）
/**
 * マス目を表現する関数コンポーネント（将棋盤の各マス目または持ち駒台の各マス）
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.selectInfo - マスの選択状態 ("selected"=選択状態/"movable"=配置可能/"unselected"=未選択)
 * @param {Object} props.piece - マスに置かれている駒の情報 - { name: "駒の種類", owner: "駒の所有者" }
 * @param {number} [props.num] - 持ち駒の数（持ち駒台で表示する場合のみ使用）
 * @param {Function} props.onClick - クリック時のイベントハンドラ
 * @returns {JSX.Element} - 将棋のマス目を表すボタン要素
 */
function Square(props) {
  return (
    // マス目を表すボタン要素
    // id属性に選択状態を設定（CSSでスタイリングするために使用）
    <button id={props.selectInfo} className="square" onClick={props.onClick} >
      {/* 駒の画像を表示 */}
      {/* imgByName は駒の種類に対応する画像パスを格納したオブジェクト（外部で定義） */}
      {/* id属性に所有者情報を設定（駒の向きや色を制御するためにCSSで使用） */}
      <img id={props.piece.owner} src={imgByName[props.piece.name]} alt="" />
      
      {/* 持ち駒の数が2つ以上ある場合のみ、その数を表示 */}
      {/* 1つしかない場合は数を表示しない */}
      <p>{(props.num >= 2) && props.num}</p>
    </button>
  );
}


// 将棋盤を表現するコンポーネント/ 
/*このコンポーネントは将棋盤そのものを表現しています。
1.構造: 9×9のマス目からなる将棋盤を作成します
2.データフロー: 親コンポーネントから受け取った盤面状態(board)を表示します
3.相互作用: マスをクリックすると親コンポーネントの処理(onClick)が呼び出されます
主要な機能として：
9行9列のマス目をループで生成
各マスには駒の情報と選択状態が渡される
マスのクリックイベントを親コンポーネントに通知 */
// 9x9のマス目を持つ将棋盤全体を管理する
class Board extends React.Component {
  /**
   * 将棋盤の各マス目を表現するSquareコンポーネントを生成する
   * @param {number} i - 行インデックス（0-8）
   * @param {number} j - 列インデックス（0-8）
   * @returns {JSX.Element} - マス目を表すSquareコンポーネント
   */
  renderSquare(i, j) {
    //console.log("renderSquare:i, j="+i+","+j)
    return (
      <Square
        key={j} // Reactの配列レンダリング用のユニークキー
        piece={this.props.board[i][j]} // このマスに配置されている駒の情報
        selectInfo={this.props.boardSelectInfo[i][j]} // このマスの選択状態の情報
        onClick={() => this.props.onClick(i, j)} // マスがクリックされた時に呼び出される関数
      />
    );
  }

  render() {
    // 9x9の将棋盤全体を生成
    return (
      <div>
        {/* 9行分のループ処理 */}
        {
          Array(9).fill(0).map((_, i) => {//長さが9の空の配列を作成し、配列の全ての要素を0で埋め、配列の各要素に対してコールバック関数を実行し、新しい配列を作成
            return (
              // 各行を表すdiv要素
              <div className="board-row" key={i}>
                {/* 各行に9列分のマス目を生成 */}
                {
                  Array(9).fill(0).map((_, j) => {
                    // 各マス目（Square）を生成
                    return this.renderSquare(i, j);
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
// 各プレイヤーが取った相手の駒（持ち駒）を表示する
class PieceStand extends React.Component {
  /**
   * 持ち駒台の各マスを表現するSquareコンポーネントを生成する
   * @param {number} i - 持ち駒台のインデックス（0-8）
   * @returns {JSX.Element} - 持ち駒を表すSquareコンポーネント
   */
  renderSquare(i) {
    return (
      <Square
        key={i} // Reactの配列レンダリング用のユニークキー
        piece={this.props.pieceStand[i]} // この位置に表示する持ち駒の情報
        num={this.props.pieceStandNum[this.props.pieceStand[i].name]} // この種類の持ち駒の数量
        selectInfo={this.props.pieceStandSelectInfo[i]} // この持ち駒の選択状態の情報
        onClick={() => this.props.onClick(i)} // 持ち駒がクリックされた時に呼び出される関数
      />
    );
  }

  render() {
    // 持ち駒台を横一列で表示（最大9種類の駒を表示可能）
    return (
      <div className="board-row">
        {/* 9マス分のループ処理 */}
        {
          Array(9).fill(0).map((_, i) => {
            // 各持ち駒マスを生成
            return this.renderSquare(i);
          })
        }
      </div>
    );
  }
}

// ゲーム全体を管理するメインコンポーネント
class Game extends React.Component {
  constructor(props) {// コンストラクター: コンポーネントが作成されたときに最初に実行される
    super(props);// 親クラス(React.Component)のコンストラクターを呼び出す
    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    //console.log("gameId: "+gameId)
 
    // コンポーネントの初期状態 (state) を設定
    this.state = {
      boardInfo: new BoardInfo(gameId),// ゲームの状態を管理するBoardInfoクラスのインスタンス化: ゲームの盤面、手番、持ち駒などのロジックとデータを管理
      gameId: gameId,
      socket: null, // WebSocket接続のインスタンスを格納するプロパティ (初期値はnull)
      gameState: {} // ゲームの現在の状態を格納するプロパティ
    };
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

  componentDidMount() {//コンポーネントがDOMにマウント（描画）された直後に実行されるライフサイクルメソッド
    
    const socket = new WebSocket('ws://' + window.location.host + '/cable');// WebSocket接続の確立
    // WebSocket接続が開いたときの処理・サーバーとの接続が確立された直後に一度だけ実行される
    socket.onopen = () => {
      //console.log('shogi WebSocket Connected');
      // ゲームチャンネルへの接続
      socket.send(JSON.stringify({
        command: 'subscribe',
        identifier: JSON.stringify({ channel: 'GameChannel', game_id: this.state.boardInfo.gameId })
      }));
    };

    // サーバーからメッセージを受信したときの処理・サーバーからデータが送信されるたびに実行される
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      //console.log('shogi onmessage');
      if (data.type === 'ping') return;
      
      if (data.message) {
        //const gameState = JSON.parse(data.message);
        const gameState = data.message.move;
        //console.dir('shogi onmessage'+data.message.move);
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
    
    //console.dir("updateGameStateのnextBoardInfo: "+nextBoardInfo);
    //console.dir("updateGameStateのnextBoardInfo.board: "+nextBoardInfo.board);
    //console.dir("updateGameStateのnextBoardInfo.turn : "+nextBoardInfo.turn );
    //console.dir("updateGameStateのnextBoardInfo.pieceStandNum: "+nextBoardInfo.pieceStandNum);
    //console.dir("updateGameStateのnextBoardInfo.pieceStand: "+nextBoardInfo.pieceStand);

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


  // 選択状態をキャンセルする関数: 盤面の空いている場所がクリックされた場合などに呼び出される
  canselSelection() {
    const nextBoardInfo = this.state.boardInfo;// 現在のboardInfoの状態を取得
    if (nextBoardInfo.selection.isNow) {// 既に何か選択されている状態の場合
      nextBoardInfo.selection.isNow = false;// 選択状態を解除
    } else {// 何も選択されていない場合
      nextBoardInfo.selection = new Selection();//selectionオブジェクトを初期状態に戻す (新しいSelectionインスタンスを作成)
    }
    // コンポーネントの状態を更新し、再レンダリング
    this.setState({
      boardInfo: nextBoardInfo
    });
  }

  // 盤上のマスがクリックされた時の処理: Boardコンポーネントから呼び出される
  boardClick(i, j) {
    //this.state.boardInfo.boardClick(i, j);

    // 現在のboardInfoの状態をディープコピーに近い形で保存 (stateの直接変更を比較するため)
    const prevState = { ...this.state.boardInfo };
    this.state.boardInfo.boardClick(i, j);// boardInfoインスタンスのboardClickメソッドを呼び出し、内部で盤面状態を更新
    
    // 盤面が変更された場合のみ送信
    // 盤面が変更されたかどうかをJSON文字列比較で簡易的にチェック
    // 変更があった場合のみ、sendGameStateを呼び出してサーバーに状態を送信
    if (JSON.stringify(prevState) !== JSON.stringify(this.state.boardInfo)) {
      //console.log("1盤面が変更された場合のみ送信"+JSON.stringify(prevState))
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
    
    //console.log("まじ ")
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

  // 持ち駒がクリックされた時の処理: PieceStandコンポーネントから呼び出される
  pieceStandClick(piece) {
    //this.state.boardInfo.pieceStandClick(piece);

    const prevState = { ...this.state.boardInfo };// 現在のboardInfoの状態を保存
    this.state.boardInfo.pieceStandClick(piece); // boardInfoインスタンスのpieceStandClickメソッドを呼び出し、内部で持ち駒関連の状態を更新
    
    // 盤面が変更された場合のみ送信
    // 盤面が変更されたかどうかをチェック (boardClickと同様)
    // 変更があった場合のみ、sendGameStateを呼び出してサーバーに状態を送信
    if (JSON.stringify(prevState) !== JSON.stringify(this.state.boardInfo)) {
      console.log("2盤面が変更された場合のみ送信"+JSON.stringify(prevState))
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

  //HTMLドキュメントの読み込みが完了したときに実行され、viewにReactをレンダリングする処理
  document.addEventListener('DOMContentLoaded', () => {
        console.dir("updateGameStateのnextBoardInfo: ");

    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(<Game />);
    //root.render(<Shogi />);
  })

// ========================================

//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<Game />);
//root.render(<Shogi />);


export default Game