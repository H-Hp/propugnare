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
import { BoardInfo, Selection } from './BoardInfo';

import Header from '../Header';


import consumer from '../../channels/consumer'; // Action Cableのconsumerをインポート

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

function Square(props) {
  return (
    <button id={props.selectInfo} className="square" onClick={props.onClick} >
      <img id={props.piece.owner} src={imgByName[props.piece.name]} alt="" />
      <p>{(props.num >= 2) && props.num}</p>
    </button>
  );
}

class Board extends React.Component {
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

class PieceStand extends React.Component {
  renderSquare(i) {
    return (
      <Square
        key={i}
        piece={this.props.pieceStand[i]}
        num={this.props.pieceStandNum[this.props.pieceStand[i].name]}
        selectInfo={this.props.pieceStandSelectInfo[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }
  render() {
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

class Game extends React.Component {
  constructor(props) {
    super(props);
    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    this.state = {
      boardInfo: new BoardInfo(),
      socket: null, // WebSocket接続のインスタンスを格納するプロパティ (初期値はnull)
      gameState: {} // ゲームの現在の状態を格納するプロパティ
    };
  }

  componentDidMount() {//コンポーネントがDOMにマウント（描画）された直後に実行されるライフサイクルメソッド
/*    const socket = new WebSocket('ws://' + window.location.host + '/cable');// WebSocket接続の確立
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
*/
  }

  canselSelection() {
    const nextBoardInfo = this.state.boardInfo;
    if (nextBoardInfo.selection.isNow) {
      nextBoardInfo.selection.isNow = false;
    } else {
      nextBoardInfo.selection = new Selection();
    }
    //盤面情報の更新
    this.setState({boardInfo: nextBoardInfo});
    //Railsの
  }

  boardClick(i, j) {
    this.state.boardInfo.boardClick(i, j);
  }

  pieceStandClick(piece) {
    this.state.boardInfo.pieceStandClick(piece);
  }

  render() {
    return (
      <div className="game" onClick={() => this.canselSelection()}>
        <div className="game-board">
          <PieceStand
            pieceStand={this.state.boardInfo.pieceStand["後手"]}
            pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
            pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
            onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
          />
          <br />
          <Board
            board={this.state.boardInfo.board}
            boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
            onClick={(i, j) => this.boardClick(i, j)}
          />
          <br />
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




class Room extends React.Component {
  constructor(props) {
    super(props);

    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    const roomId = element.dataset.roomId;// #data-game-id属性からゲームIDを取得
    console.log(`gameId:${gameId}・roomId:${roomId}`)

    //const new_boardInfo= new BoardInfo();
    //console.log(`new BoardInfo()：${new BoardInfo()}`)
    //console.log(`typeof new BoardInfo()：${typeof new BoardInfo()}`)

    this.state = {
      boardInfo: new BoardInfo(), // 初期状態では引数なしでBoardInfoコンストラクタを呼び出し、デフォルトの初期盤面を生成
      //boardInfo: new_boardInfo, // 盤面状態を保持
      gameInfo: {},
      moveHistory: [],
      currentPlayer: '先手',
      isConnected: false,
      gameId: gameId,
      roomId: roomId, // ルームIDもstateで管理
      isLoading: true,//ローディング状態
      loadingMessage: "データを読み込み中...", //ローディングメッセージ
      chatMessages: [], // 新しいstate: チャットメッセージを格納する配列
      currentChatMessage: '', // 新しいstate: 現在入力中のチャットメッセージ
      isChatOpen: true, //チャットが開いているかどうか
    };
    this.subscription = null; // Action Cableのサブスクリプションをインスタンス変数で保持

    // イベントハンドラのバインド
    this.handleChatInputChange = this.handleChatInputChange.bind(this);
    this.handleChatSubmit = this.handleChatSubmit.bind(this);
    this.toggleChat = this.toggleChat.bind(this);  
  }

  // コンポーネントがマウントされた後に一度だけ実行される
  componentDidMount() {
    this.initializeRoom();
  }

  // コンポーネントがアンマウントされる前に実行される（クリーンアップ）
  componentWillUnmount() {
    if (this.subscription) {
      console.log(`ShogiGameChannelからroom_idでの購読を解除する: ${this.state.roomId}`);
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  initializeRoom = () => {
    // URLから部屋番号を取得
    const pathSegments = window.location.pathname.split('/');
    const roomId = pathSegments[pathSegments.length - 1];

    if (!roomId) {
      console.error("URLにルームIDが見つかりません");
      return;
    }

    this.setState({ roomId }); // ルームIDをstateに保存 
    console.log(`ShogiGameChannelにroom_idでサブスクライブしようとしています: ${roomId}`);

    this.subscription = consumer.subscriptions.create(
      { channel: "ShogiGameChannel", room_id: roomId },
      {
        connected: () => {
          console.log(`ShogiGameChannelに接続されています（ルームID: ${roomId}）`);
          this.setState({ isConnected: true });
          //this.subscription.perform('request_initial_board_state'); // ActionCable経由で初期データ要求
          /*this.subscription.perform('request_initial_board_state', { 
            room_id: this.state.roomId,
            game_id: this.state.gameId
          });
          */
          /*
          // テストデータ初期化 (もしサーバーから受け取らない場合の一時的なもの)
          const initialBoard = Array(9).fill(null).map(() => Array(9).fill(null));
          initialBoard[0] = ['香', '桂', '銀', '金', '王', '金', '銀', '桂', '香'];
          //this.setState({ boardInfo: boardInfo });
          this.setState({ gameInfo: this.state.boardInfo });
          this.setState({ moveHistory: this.state.boardInfo });
          this.setState({ currentPlayer: "先手" });
          */

          //}
        },
        disconnected: () => {
          console.log(`ShogiGameChannelからroom_idで接続が切断されました。: ${roomId}`);
          this.setState({ isConnected: false });
        },
        received: (data) => {
          console.log(`room_id のデータを取得しました。 ${roomId}:`, data);
          // サーバーから受信したデータでstateを更新
          /*this.setState(prevState => ({
            boardInfo: data.boardInfo || prevState.boardInfo, // 盤面更新
            currentPlayer: data.currentPlayer || prevState.currentPlayer, // 手番更新
            moveHistory: data.move ? [...prevState.moveHistory, data.move] : prevState.moveHistory, // 指し手履歴追加
            // gameInfo: data.game_info || prevState.gameInfo // ゲーム情報も更新するなら
          }));
          */
          if(data.data_type=="initialize"){//Redisにデータがないから初期データのまま
            //this.setState({ isLoading: false });this.setState({ loadingMessage: "" });console.log("isLoading:"+this.state.isLoading)
            this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
            //this.setState({ chatMessages: "aaaaa" });
            return
          }else if(data.data_type=="already_redis_stored_board_data"){
            //console.log(`wwwwwwwdataあ: ${JSON.stringify(data.redis_stored_board_data)}`);
            
            data=JSON.parse(data.redis_stored_board_data);
            //console.log(`dataあ: ${JSON.stringify(data)}`);
            //console.log(`datagggg: ${JSON.stringify(data.BoardInfo)}`);
            
            //data_type: "redis_stored_data",
            //redis_stored_data: redis_stored_data

            //data.BoardInfo を受け取った後、それを BoardInfo クラスのインスタンスに「復元」する必要があります・Object.assign()では、オブジェクトのプロパティ（データ）はコピーされますが、メソッドやprototypeチェーンは正しく復元されません。そのため、getPromotedPiece()などのメソッドが利用できなくなります。
            //let NewBoardInfo=Object.assign(new BoardInfo(), data.BoardInfo);
            
            // ★ ここが最も重要：受信したデータをデシリアライズしてクラスインスタンスを再構築
            //let NewBoardInfo = this.deserializeBoard(data.BoardInfo);

            //console.dir(`NewBoardInfo: ${ NewBoardInfo}`);
            //console.dir(`NewBoardInfo: ${ JSON.stringify(NewBoardInfo)}`);
            
            //this.setState({ boardInfo: NewBoardInfo });
            //this.setState({ currentPlayer: data.currentPlayer });
            
            //const boardDataFromServer = data.BoardInfo; // サーバーから来たプレーンなデータ
            //const boardDataFromServer = data.BoardInfo.board; // サーバーから来たプレーンなデータ
            const boardDataFromServer = data;
            //console.log(`Received ${data.data_type} for reconstruction:`, boardDataFromServer);
            //console.log(`boardDataFromServer: ${JSON.stringify(boardDataFromServer)}`);
            if (boardDataFromServer) {
              // ★ サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              //console.log(`newBoardInfoInstance: ${JSON.stringify(newBoardInfoInstance)}`);
              this.setState({
                boardInfo: newBoardInfoInstance,
                currentPlayer: newBoardInfoInstance.currentPlayer, // BoardInfoのturnをstateに反映
                // selection, pieceStandNum, pieceStand は newBoardInfoInstance 内に保持される
                isLoading: false,
                loadingMessage: "",
                //hasReceivedInitialData: true,
              }, () => {
                console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }
            

            this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
          }else if(data.data_type=="board_update"){
            //console.log(`data： ${JSON.stringify(data)}`);
            //const boardDataFromServer = data.BoardInfo; // サーバーから来たプレーンなデータ
            const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
            //console.log(`Received ${data.data_type} for reconstruction:`, boardDataFromServer);
            //console.log(`data_type： ${JSON.stringify(data.data_type)}`);
            //console.log(`data.new_board_data： ${JSON.stringify(data.new_board_data)}`);
            
            if (boardDataFromServer) {
              //console.log(`wwwwww： ${JSON.stringify(boardDataFromServer)}`);
              // ★ サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              this.setState({
                boardInfo: newBoardInfoInstance,
                //currentPlayer: newBoardInfoInstance.turn, // BoardInfoのturnをstateに反映
                currentPlayer: newBoardInfoInstance.currentPlayer, // BoardInfoのturnをstateに反映
                // selection, pieceStandNum, pieceStand は newBoardInfoInstance 内に保持される
                isLoading: false,
                loadingMessage: "",
                //hasReceivedInitialData: true,
              }, () => {
                console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }

            //data=JSON.parse(data.new_board_data);
            /*data=data.new_board_data;
            let NewBoardInfo=Object.assign(new BoardInfo(), data.BoardInfo);//data.BoardInfo を受け取った後、それを BoardInfo クラスのインスタンスに「復元」する必要があります    
            this.setState({ boardInfo: NewBoardInfo });
            this.setState({ currentPlayer: data.currentPlayer });*/
            this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
            
          }else if(data.data_type=="already_redis_stored_chat_data" || data.data_type=="chat_update"){
            if (data.data_type=="already_redis_stored_chat_data"){ 
              this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了 
            }
            console.log(`data.chat_data:`, data.chat_data);
            //if (data.data_type=="already_redis_stored_chat_data"){ 
            if (Array.isArray(data.chat_data)) {//配列かどうかチェック
              //最初はdata.chat_dataが"aaa"みたいに配列になっていないので配列に変換してchatMessageに入れる
              this.setState({ chatMessages: [data.chat_data] }, () => {
                  console.log("state 更新後:", this.state.chatMessages);
              });
            }else{
              //this.setState({ chatMessages: data.redis_stored_chat_data });
              //this.setState({ chatMessages: data.chat_data });//非同期だから即時反映されない
              this.setState({ chatMessages: data.chat_data }, () => {
                console.log("state 更新後:", this.state.chatMessages);
              });
            }
            //console.log(`this.state.chatMessages：`, this.state.chatMessages);
            return
          /*}else if(data.data_type=="chat_update"){
            //this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
            console.log(`data.chat_data:`, data.updated_redis_stored_data);
            //this.setState({ chatMessages: data.chat_data });
            //this.setState(prevState => ({ chatMessages: [...prevState.chatMessages, data.chat_data] }));
            //this.setState({ chatMessages: data.chat_data });
            this.setState({ chatMessages: data.updated_redis_stored_data });
            console.log(`this.state.chatMessages：`, this.state.chatMessages);
            return
          */
          }
        },

        // クライアントからサーバーにメッセージを送るメソッド
        //sendMove: (move) => {
        //board_update: (move) => {
        board_update: (boardData,move) => {
          console.log("board_updateメソッド");
          console.log(`this.state.currentPlayer:${this.state.currentPlayer}`);
          //console.log(`boardData：${JSON.stringify(boardData)}`);
          //this.perform('receive', { move: move ,currentPlayer: currentPlayer }); // サーバーの receive メソッドを呼び出す
          //this.subscription.perform('receive', { 
          /*this.subscription.perform('board_broadcast_and_store', { 
            move: move, 
            BoardInfo: this.state.boardInfo, // 動かした後の盤面全体の情報
            currentPlayer: this.state.currentPlayer,   // 次の手番のプレイヤー情報
            room_id: this.state.roomId,
            game_id: this.state.gameId
          });
          */

          // ここで boardData は getBoardState() から返されるプレーンなオブジェクトであることを想定
          this.subscription.perform('board_broadcast_and_store', { 
            move: move, 
            BoardInfo: boardData,
            currentPlayer: this.state.currentPlayer,
            room_id: this.state.roomId,
            game_id: this.state.gameId
           });

        },
        // サーバーにメッセージを送信するためのカスタムメソッド
        //sendChatMessage: function(message) { 
        sendChatMessage: (chat_data)=> {//
          console.log(`sendChatMessageメソッド・chat_data:${chat_data}`);
          this.subscription.perform('chat_broadcast_and_store', { 
            chat_data: chat_data,
            room_id: this.state.roomId,
            game_id: this.state.gameId 
          });
        }
      }
    );
  };

  canselSelection() {
    const nextBoardInfo = this.state.boardInfo;// 現在のboardInfoの状態を取得
    if (nextBoardInfo.selection.isNow) {// 既に何か選択されている状態の場合
      nextBoardInfo.selection.isNow = false;// 選択状態を解除


    } else {
      nextBoardInfo.selection = new Selection();//selectionオブジェクトを初期状態に戻す (新しいSelectionインスタンスを作成)

          /*//Redisにデータ登録して/WebSoketでブロードキャスト
          if(this.state.currentPlayer==="先手"){
            this.setState({currentPlayer: "後手"});
          }else if(this.state.currentPlayer==="後手"){
            this.setState({currentPlayer: "先手"});
          }
          //this.subscription.sendMove(nextBoardInfo);
          this.subscription.board_update({from: "5g", to: "5f"});
          */
    }
    //盤面情報の更新
    this.setState({boardInfo: nextBoardInfo});


  }

  boardClick(i, j) {
    console.log(`boardClickメソッド・i,j：${i},${j}`);
    
    
    this.state.boardInfo.boardClick(i, j);
    //const moved = this.state.boardInfo.boardClick(i, j);
    /*console.log(`こまがうごいた：${moved}`);
    if (moved) {//trueかfalse
        // WebSocketへの登録処理
        this.subscription.board_update({from: "5g", to: "5f"});
    }
    */
  }

  handleBoardClick(i, j) {
    const { boardInfo, isConnected } = this.state;

    // BoardInfoインスタンスの boardClick メソッドを呼び出す
    // この呼び出しで boardInfo インスタンス内部の状態が更新される
    const clickResult = boardInfo.boardClick(i, j);
    //console.log(`clickResult：${JSON.stringify(clickResult)}`);

    //console.log(`clickResult.BoardInfo：${JSON.stringify(clickResult.BoardInfo)}`);
    //console.log(`clickResult.move：${JSON.stringify(clickResult.move)}`);
    //console.log(`clickResult.currentPlayer：${JSON.stringify(clickResult.currentPlayer)}`);

    const game_data = {
      move:          clickResult.move,
      BoardInfo:     clickResult.BoardInfo,
      currentPlayer: clickResult.currentPlayer
    };
    //console.log(`clickResultから作ったgame_data：${JSON.stringify(game_data)}`);

    // clickResult.newBoardState には、boardClick 後の BoardInfo 内部の最新状態が返される
    // これを基に、新しい BoardInfo インスタンスを生成して React の state を更新する
    
    //const newBoardInfoInstance = new BoardInfo(clickResult.newBoardState);
    //const newBoardInfoInstance = new BoardInfo(clickResult.BoardInfo);
    const newBoardInfoInstance = new BoardInfo(game_data);
    //const newBoardInfoInstance = new BoardInfo(clickResult.board);
    
    //console.log(`newBoardInfoInstance：${JSON.stringify(newBoardInfoInstance)}`);
    //console.log(`clickResult.moved${clickResult.moved}`);

    this.setState({
      boardInfo: newBoardInfoInstance, // 新しいインスタンスでstateを更新
      //currentPlayer: newBoardInfoInstance.turn, // BoardInfoインスタンスから手番を取得して更新
      currentPlayer: clickResult.currentPlayer, // BoardInfoインスタンスから手番を取得して更新
    }, () => {
      // stateの更新が完了した後、WebSocketでサーバーに送信
      if (isConnected && this.subscription && clickResult.moved) { // 駒が動いた場合のみ送信
        console.log(`こまがうごいた`);
        //console.log("盤面状態が変更されました。サーバーに送信します。", newBoardInfoInstance.getBoardState());
        // ★ getBoardState() を呼び出し、サーバーに送るためにプレーンなオブジェクトに変換
        this.subscription.board_update(
          //newBoardInfoInstance.getBoardState(),
          newBoardInfoInstance,
          clickResult.moveDetails
        );
      } else if (clickResult.moved) {
        console.warn("WebSocket接続が確立されていないため、盤面更新を送信できません。");
      }
    });
  }

  pieceStandClick(piece) {
    this.state.boardInfo.pieceStandClick(piece);
  }

  handleMove = () => {
    if (this.subscription) {
      //this.subscription.sendMove({ from: "7g", to: "7f" });
      //this.subscription.board_update({ from: "7g", to: "7f" });
    } else {
      console.warn("subscription がまだ確立されていません");
    }
  };




  deleteData = async () => { // async/await を使用
    const { roomId } = this.state; // stateからroomIdを取得
    if (!roomId) {
      alert("ルームIDが不明です。");
      return;
    }

    //if (!window.confirm(`ゲームID ${roomId} のデータを本当に削除しますか？`)) { return; }// キャンセルされたら処理を中断 

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch(`/shogi/${roomId}/destroy`, { // await を使う
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
          // 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content, // 必要に応じて
        },
        //body: JSON.stringify({ game_id: 12345 })
      });

      const data = await response.json(); // await を使う

      const MATCH_STATUS_KEY = 'shogi_matching_status';
      const MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
      const MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
      const SESSION_ID_KEY = 'shogi_session_id'; // localStorageにセッションIDを保存するキー
      localStorage.removeItem(MATCH_STATUS_KEY);
      localStorage.removeItem(MATCH_ROOM_ID_KEY);
      localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);

      if (response.ok) {
        console.log('削除成功:', data.message);
        //alert(data.message);
        //window.location.href = '/'; // トップページへ戻る
      } else {
        console.error('削除失敗:', data.error || data.message);
        alert('データの削除に失敗しました: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('リクエストエラー:', error);
      alert('ネットワークエラーが発生しました。');
    }
  };

  renderDataDisplay = () => {
    const { boardInfo } = this.state;
    if (!boardInfo || Object.keys(boardInfo).length === 0) { // boardStateが空オブジェクトの場合も考慮
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">盤面データを読み込み中...</div>
        </div>
      );
    }
    // 盤面データが存在する場合のレンダリングロジック（ここでは省略）
    return null;
  };


  // チャット入力フィールドの値が変更された時に state を更新
  handleChatInputChange(event) {
    this.setState({ currentChatMessage: event.target.value });
  }
  // チャットフォームが送信された時（「送信」ボタンクリックまたはEnterキー）
  handleChatSubmit(event) {
    event.preventDefault(); // フォームのデフォルト送信（ページリロード）を防止
    const { currentChatMessage } = this.state;
    if (currentChatMessage.trim() === '') {
      return; // 空のメッセージは送信しない
    }
    if (this.subscription && this.state.isConnected) {
      //非同期送信: WebSocketを通じてサーバーへメッセージを送信
      this.subscription.sendChatMessage(currentChatMessage);
      this.setState({ currentChatMessage: '' }); // 入力フィールドをクリア
      console.log("チャットメッセージを送信しました:", currentChatMessage);
    } else {
      console.warn("WebSocket接続が確立されていないため、メッセージを送信できません。");
      alert("チャットサーバーに接続されていません。");
    }
  }
    //チャットの開閉を切り替えるメソッド
  toggleChat() {
    this.setState(prevState => ({
      isChatOpen: !prevState.isChatOpen // 現在の状態を反転させる
    }));
  }
  /*
  // チャット入力フィールドの値が変わったとき
  handleChatInputChange(event) {
    this.setState({ currentChatMessage: event.target.value });
  }
  // チャットフォームが送信されたとき
  handleChatSubmit(event) {
    event.preventDefault(); // フォームのデフォルト送信を防止
    const { currentChatMessage } = this.state;
    if (currentChatMessage.trim() === '') {
      return; // 空のメッセージは送信しない
    }
    if (this.subscription) {
      this.subscription.sendChatMessage(currentChatMessage); // WebSocket経由でメッセージを送信
      this.setState({ currentChatMessage: '' }); // 入力フィールドをクリア
    } else {
      console.warn("WebSocket接続が確立されていません。");
      alert("チャットサーバーに接続されていません。");
    }
  }
*/

  render() {
    const { boardInfo, gameInfo, moveHistory, currentPlayer, isConnected, isLoading, loadingMessage, chatMessages, currentChatMessage, isChatOpen} = this.state;
    const roomId = this.state.roomId; // renderメソッド内でstateからroomIdを取得

    if (isLoading) { // ★ isLoading が true の間はローディング表示
      return (
        <div id="loading-overlay">
          <div className="spinner"></div>
          <p className="ml-4 text-xl text-gray-700">{loadingMessage}</p>
        </div>
      );
    }
    return (
      <>
      <Header/>

        {/*<div id="chat-zone">
          <div id="chat-messages"></div>
          <form id="chat-form">
            <input type="text" id="chat-input" placeholder="Type a message..." />
            <button type="submit">Send</button>
          </form>
        </div>*/}

        {/*<div className="chat-container">
          <div id="chat-messages" className="chat-messages"></div>
          <form id="chat-form" className="chat-form">
            <input
              type="text"
              id="chat-input"
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="chat-button">Send</button>
          </form>
        </div>*/}
              <div className="game-and-chat-container">
        {/* ... (ShogiBoardなどのゲームUI) */}

        <div
          className={`chat-container ${isChatOpen ? '' : 'closed'}`} // ★ isChatOpen の状態に応じてクラスを適用
        >

          <div id="chat-messages" className="chat-messages">
            {/*{chatMessages.map((msg, index) => (*/}
          {/*(chatMessages || []).map((msg, index) => ( */ }
          {Array.isArray(chatMessages) && chatMessages.map((msg, index) => (
              <div key={index} className="chat-message">{msg}</div>
            ))}
          </div>
          <form id="chat-form" className="chat-form" onSubmit={this.handleChatSubmit}>
            <input
              type="text"
              id="chat-input"
              placeholder="Type a message..."
              className="chat-input"
              value={currentChatMessage}
              onChange={this.handleChatInputChange}
            />
            {/*<button type="submit" className="chat-button">Send</button>*/}
          </form>

          
        </div>
        {/* ★ 開閉ボタン */}
          <button
            className="chat-toggle-button"
            onClick={this.toggleChat} // クリックで開閉メソッドを呼び出す
            aria-expanded={isChatOpen} // アクセシビリティのため
            aria-controls="chat-messages-container" // 対象となるコンテナのID (chat-containerにIDを追加する場合)
          >
            {isChatOpen ? '>' : '<'} {/* isChatOpen の状態に応じてボタンのテキストを切り替える */}
          </button>
      </div>

        <div className="game" onClick={() => this.canselSelection()}>
          <div className="game-board">
            <PieceStand
              pieceStand={this.state.boardInfo.pieceStand["後手"]}
              pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
              pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
              onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
            />
            <br />
            <Board
              board={this.state.boardInfo.board}
              boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
              onClick={(i, j) => this.handleBoardClick(i, j)}
            />
            {/*onClick={(i, j) => this.boardClick(i, j)} */}
            <br />
            <PieceStand
              pieceStand={this.state.boardInfo.pieceStand["先手"]}
              pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
              pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
              onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
            />
          </div>
        </div>


        <div className="bg-gray-100 p-4 rounded-lg">
          <button
            onClick={this.handleMove}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            指し手を送信
          </button>
          <button
            onClick={this.deleteData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            試合が終わったのでデータ削除
          </button>
          <h3 className="text-lg font-bold mb-3">受信データ表示 (ルームID: {roomId || 'N/A'})</h3>

          {/* 接続状態 */}
          <div className="mb-3">
            <span className="font-semibold">接続状態: </span>
            <span className={`px-2 py-1 rounded text-sm ${
              isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
          {/* 現在の手番 */}
          <div className="mb-3">
            <span className="font-semibold">現在の手番: </span>
            <span className="text-blue-600">{currentPlayer}</span>
          </div>
          {/* ゲーム情報 */}
          {Object.keys(gameInfo).length > 0 && (
            <div className="mb-3">
              <span className="font-semibold">ゲーム情報:</span>
              <details className="mt-1">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">詳細を表示</summary>
                <pre className="bg-white p-2 rounded text-xs mt-1 overflow-auto">
                  {JSON.stringify(gameInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}
          {/* 指し手履歴 */}
         {/* {moveHistory.length > 0 && (*/}
            <div className="mb-3">
              <span className="font-semibold">指し手履歴:</span>
              <details className="mt-1">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">詳細を表示</summary>
                <div className="bg-white p-2 rounded max-h-32 overflow-y-auto mt-1">
                  {JSON.stringify(moveHistory, null, 2)}
                  {/*{moveHistory.map((move, index) => (
                    <div key={index} className="text-sm">
                      {index + 1}. {JSON.stringify(move)}
                    </div>
                  ))}*/}
                </div>
              </details>
            </div>
          {/* )} */}
          {/* 生データ表示 */}
          <div className="mb-3">
            <span className="font-semibold">盤面データ:</span>
            <details className="mt-1">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                詳細を表示
              </summary>
              <pre className="bg-white p-2 rounded text-xs mt-1 overflow-auto max-h-40">
                {boardInfo ? JSON.stringify(boardInfo, null, 2) : '盤面データなし'}
              </pre>
            </details>
          </div>

          <div className="max-w-6xl mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* データ表示エリア */}
              <div>
                {this.renderDataDisplay()}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}





//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<Game />);

// ローディング要素とメインコンテンツ要素を取得
//const loadingOverlay = document.getElementById('loading-overlay');
//const mainContent = document.getElementById('main-content');

/*
document.addEventListener('DOMContentLoaded', async () => {
    loadingOverlay.classList.remove('hidden'); // hiddenクラスを削除して表示状態を明示
    try {
      await loadImportantData(); // 特定のメソッドの完了を待つ
      // 全ての準備が完了したらローディングを非表示にする
      loadingOverlay.classList.add('hidden'); // hiddenクラスを追加して非表示
      mainContent.style.display = 'block'; // メインコンテンツを表示
      console.log("すべての処理が完了し、コンテンツが表示されました。");
    } catch (error) {
      console.error("データのロード中にエラーが発生しました:", error);
      // エラー時の処理（例: エラーメッセージを表示してローディングを非表示にする）
      loadingOverlay.classList.add('hidden');
      mainContent.style.display = 'block'; // エラーでも表示したい場合
    }
  });
*/
//HTMLドキュメントの読み込みが完了したときに実行され、viewにReactをレンダリングする処理
//document.addEventListener('DOMContentLoaded', () => {
document.addEventListener('turbolinks:load', () => {//urbolinks による初回ページロード時・Turbolinks によるページ遷移時・通常のブラウザリロード時 のすべてで発生します。

  // Shogiコンポーネントを初期化するためのDOM要素があるか確認
  const shogiBoardElement = document.getElementById('game-container'); // 例: 将棋盤を表示する<div>のID
  console.dir("shogiBoardElement: "+shogiBoardElement);

  if (shogiBoardElement) {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    
    const root = ReactDOM.createRoot(rootElement);
    //root.render(<Game />);
    root.render(<Room />);
    //root.render(<Shogi />);
    
    // Shogiクラスのインスタンスを作成し、初期化メソッドを呼び出す
    //const shogi = new Shogi(shogiBoardElement); // コンポーネントによっては要素を渡す
    //shogi.init(); // 例えば、Shogiクラスにinitメソッドがあると仮定
    console.log("将棋ゲームコンポーネントが初期化されました。");
  } else {
    // shogi-board要素が見つからない場合は、このページが将棋ページではないと判断
    console.log("将棋ゲームコンポーネントは、このページでは初期化されませんでした（#shogi-board要素なし）。");
  }
})