import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';

import { BoardInfo, Selection } from './BoardInfo';
import ShogiTimer from './ShogiTimer/ShogiTimer';
import Header from '../Header.jsx';
import consumer from '../../channels/consumer.js'; // Action Cableのconsumerをインポート
import { withTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lang/i18n' 

const element = document.querySelector('#game-container');
const kingPath = element.dataset.kingPath;
const gyokuPath = element.dataset.gyokuPath;
const rookPath = element.dataset.rookPath;
const bishopPath = element.dataset.bishopPath;
const goldPath = element.dataset.goldPath;
const silverPath = element.dataset.silverPath;
const knightPath = element.dataset.knightPath;
const lancePath = element.dataset.lancePath;
const pawnPath = element.dataset.pawnPath;
const dragonPath = element.dataset.dragonPath;
const horsePath = element.dataset.horsePath;
const prom_silverPath = element.dataset.prom_silverPath;
const prom_knightPath = element.dataset.prom_knightPath;
const prom_lancePath = element.dataset.prom_lancePath;
const prom_pawnPath = element.dataset.prom_pawnPath;

const imgByName = {
  "王": kingPath,
  "玉": gyokuPath,
  "飛": rookPath,
  "角": bishopPath,
  "金": goldPath,
  "銀": silverPath,
  "桂": knightPath,
  "香": lancePath,
  "歩": pawnPath,
  "竜": dragonPath,
  "馬": horsePath,
  "成銀": prom_silverPath,
  "成桂": prom_knightPath,
  "成香": prom_lancePath,
  "と": prom_pawnPath
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

class Room extends React.Component {
  constructor(props) {
    super(props);

    const element = document.querySelector('#game-container');
    const gameRoomData = element.dataset.gameRoomData;
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    const roomId = element.dataset.roomId;// #data-game-id属性からゲームIDを取得
    const yourRole = element.dataset.yourRole;
    const enemyRole = element.dataset.enemyRole;
    const logoPath = element.dataset.logoPath;
    const gamebackPath = element.dataset.gamebackPath;
    const loadingimgPath = element.dataset.loadingimgPath;
    const audienceUser = element.dataset.audienceUser;
    //console.log("audienceUser: "+audienceUser)

    this.state = {
      logoPath: logoPath,
      gamebackPath: gamebackPath,
      loadingimgPath: loadingimgPath,
      boardInfo: new BoardInfo(), // 初期状態では引数なしでBoardInfoコンストラクタを呼び出し、デフォルトの初期盤面を生成
      //boardInfo: new_boardInfo, // 盤面状態を保持
      gameInfo: {},
      gameRoomData: gameRoomData,
      moveHistory: [],
      nowTurn: '先手',
      isConnected: false,
      gameId: gameId,
      roomId: roomId, // ルームIDもstateで管理
      yourRole: yourRole,
      enemyRole: enemyRole,
      isLoading: true,//ローディング状態
      loadingMessage: "データを読み込み中...", //ローディングメッセージ
      chatMessages: [], // 新しいstate: チャットメッセージを格納する配列
      currentChatMessage: '', // 新しいstate: 現在入力中のチャットメッセージ
      isChatOpen: true, //チャットが開いているかどうか
      isCheck: false, // 王手状態を結果に追加
      isCheckmate: false ,// 詰み状態
      winner: "yet",
      winReason: "yet",
      rematch_sended: false,//リクエストを送信したかどうか
      rematchRequest: false,//リクエストが来ているか
      decline_received: false,//再対戦リクエストの拒否を受け取ったかどうか
      gameStatus: 'playing', // 例: 'playing', 'time_up', 'checkmate'
      timeUpPlayer: null, // 時間切れになったプレイヤー
      bufferedInitialTimerState: null, //追加: 初期タイマー状態を一時的に保持する
      debugMode: false,
      audienceUser: JSON.parse(audienceUser)
    };
    this.subscription = null; // Action Cableのサブスクリプションをインスタンス変数で保持

    // イベントハンドラのバインド
    this.handleChatInputChange = this.handleChatInputChange.bind(this);
    this.handleChatSubmit = this.handleChatSubmit.bind(this);
    this.toggleChat = this.toggleChat.bind(this);  

    this.handleTimeUp = this.handleTimeUp.bind(this);

    this.handleStartTimer = this.handleStartTimer.bind(this);
    this.handlePauseTimer = this.handlePauseTimer.bind(this);
    this.handleToggleTimer = this.handleToggleTimer.bind(this);
    this.handleSwitchTurn = this.handleSwitchTurn.bind(this);
    this.handleResetTimer = this.handleResetTimer.bind(this);
    //this.setupActionCable = this.setupActionCable.bind(this);
    //this.teardownActionCable = this.teardownActionCable.bind(this);
    this.handleActionCableMessage = this.handleActionCableMessage.bind(this);
    this.applyBufferedInitialTimerState = this.applyBufferedInitialTimerState.bind(this); // ⭐ 追加

    this.audioContextRef = null; // AudioContext のインスタンス
    this.notificationSoundBufferRef = null; // 通知音のオーディオバッファ
    this.setupAudio = this.setupAudio.bind(this);
    this.playNotificationSound = this.playNotificationSound.bind(this);

    // ShogiTimer コンポーネントのインスタンスを直接保持するプロパティ
    // React.createRef() は不要になります。
    this.shogiTimerInstance = null; 
    this.timerStarted = false;
    this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成
    //console.log(`this.shogiTimerRef: ${JSON.stringify(this.shogiTimerRef)}`);
  }

  // AudioContextと音源の準備
  async setupAudio() {
    if (!this.audioContextRef) {
      this.audioContextRef = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!this.notificationSoundBufferRef) {
      try {
        const response = await fetch('/assets/notification.mp3');
        const arrayBuffer = await response.arrayBuffer();
        this.notificationSoundBufferRef = await this.audioContextRef.decodeAudioData(arrayBuffer);
        console.log("通知音源をロードしました。");
      } catch (e) {
        console.error("通知音源のロードまたはデコードに失敗しました:", e);
      }
    }
  }

  // 通知音を再生する処理
  playNotificationSound() {
    if (this.audioContextRef && this.notificationSoundBufferRef) {
      const source = this.audioContextRef.createBufferSource();
      source.buffer = this.notificationSoundBufferRef;
      source.connect(this.audioContextRef.destination);
      source.start(0);
      console.log("通知音を再生しました。");
    } else {
      console.warn("通知音を再生できません。オーディオコンテキストまたはバッファが未準備です。");
    }
  }

  // コンポーネントがマウントされた後に一度だけ実行される
  componentDidMount() {
    this.initializeRoom();
    this.setupAudio()
    //デバッグモード
    window.addEventListener('keydown', (event) => { if (event.key === 'd' || event.key === 'D') { 
      event.preventDefault(); //dでブックマーク登録を防ぐ
      this.debugModeOn()
    } });
  }

  //prevProps と prevState を引数として明示的に受け取る
  componentDidUpdate(prevProps, prevState) {
    // shogiTimerRef.current が null から非nullになった、かつ bufferedInitialTimerState が存在する場合に適用を試みる
    if (this.shogiTimerRef.current && this.state.bufferedInitialTimerState) {
        this.applyBufferedInitialTimerState();
    }
    // bufferedInitialTimerState が null から非nullになった場合（データがバッファされた）
    else if (!prevState.bufferedInitialTimerState && this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        this.applyBufferedInitialTimerState();
    }
    if (!this.timerStarted && this.shogiTimerRef.current) {
      this.timerStarted = true;
      //console.log(`this.timerStarted: ${this.timerStarted}`);
      this.handleToggleTimer();
    }
  }

  //バッファされた初期状態を ShogiTimer に適用するメソッド
  applyBufferedInitialTimerState() {
    if (this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        console.log("ShogiTimerにバッファされた初期タイマーの状態を適用する:", this.state.bufferedInitialTimerState);
        this.shogiTimerRef.current.initializeTimerState(this.state.bufferedInitialTimerState);
        this.setState({ bufferedInitialTimerState: null }); // 適用したらクリア
    }
  }

  // コンポーネントがアンマウントされる前に実行される（クリーンアップ）
  componentWillUnmount() {
    if (this.subscription) {
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
    this.subscription = consumer.subscriptions.create(
      { channel: "ShogiGameChannel", room_id: roomId },
      {
        connected: () => {
          //console.log(`ShogiGameChannelに接続されています（ルームID: ${roomId}）`);
          this.setState({ isConnected: true });
        },
        disconnected: () => {
          //console.log(`ShogiGameChannelからroom_idで接続が切断されました。: ${roomId}`);
          this.setState({ isConnected: false });
        },
        received: (data) => {
          if(data.data_type!=="board_update"){
            this.handleActionCableMessage(data);//残り時間
          }
          //console.log(`room_id のデータを取得しました。 ${roomId}:`, data);
          if(data.data_type=="initialize"){//Redisにデータがないから初期データのまま
            this.setState({ isLoading: false, boardInfo: new BoardInfo()});//ローディングを終了
            return
          }else if(data.data_type=="rematch_initialize"){
            this.setState({
                boardInfo: new BoardInfo(),
                nowTurn: "先手", // BoardInfoのturnをstateに反映
                moveHistory: [],
                isLoading: false,
                loadingMessage: "",
                isCheckmate: false ,// 詰み状態
                winner: "yet",
                rematch_sended: false,//リクエストを送信したかどうか
                rematchRequest: false,//リクエストが来ているか
                decline_received: false,
                gameStatus: 'playing', // 例: 'playing', 'time_up', 'checkmate'
                timeUpPlayer: null, // 時間切れになったプレイヤー
                bufferedInitialTimerState: null,
              }, () => {
                // ここにタイマーのリセット処理を追加・リマッチが初期化されたら、タイマーもリセットする
                this.handleToggleTimer();
              });
          }else if(data.data_type=="already_redis_stored_board_data"){
            data=JSON.parse(data.redis_stored_board_data);

            //moveHistory取得
            let moveHistory_redis = data.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            
            const boardDataFromServer = data;
            if (boardDataFromServer) {
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              this.setState({
                boardInfo: newBoardInfoInstance,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                moveHistory: moveHistory_redis,
                isLoading: false,
                loadingMessage: "",
              }, () => {
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }            
          }else if(data.data_type=="board_update"){
            this.playNotificationSound()
            const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
            let moveHistory_redis = boardDataFromServer.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            if (boardDataFromServer) {
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              this.setState({
                boardInfo: newBoardInfoInstance,
                moveHistory: moveHistory_redis,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                isLoading: false,
                loadingMessage: "",
              }, () => {
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }            
          }else if(data.data_type=="already_redis_stored_chat_data" || data.data_type=="chat_update"){
            if (data.data_type=="already_redis_stored_chat_data"){ 
              this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了 
            }
            //console.log(`data.chat_data:`, data.chat_data);
            if (Array.isArray(data.chat_data)) {//配列かどうかチェック
              //最初はdata.chat_dataが"aaa"みたいに配列になっていないので配列に変換してchatMessageに入れる
              this.setState({ chatMessages: data.chat_data }, () => {
                  //console.log("state 更新後:", this.state.chatMessages);
              });
            }else{
              this.setState({ chatMessages: data.chat_data }, () => {
                //console.log("state 更新後:", this.state.chatMessages);
              });
            }
            //console.log(`this.state.chatMessages：`, this.state.chatMessages);
            return
          } else if (data.data_type === 'game_set'){
              console.log("ゲームセット")
              this.setState({
                isCheckmate: true ,// 詰み状態
                winner: data.winner,
                winReason: data.winReason,
                //gameStatus: 'time_up',
                //timeUpPlayer: player,
              });

              //マッチングデータも消す
              const MATCH_STATUS_KEY = 'shogi_matching_status';
              const MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
              const MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
              const SESSION_ID_KEY = 'shogi_session_id'; // localStorageにセッションIDを保存するキー

              // ローカルストレージのマッチング状態をクリア
              localStorage.removeItem(MATCH_STATUS_KEY);
              localStorage.removeItem(MATCH_ROOM_ID_KEY);
              localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);
              localStorage.removeItem(SESSION_ID_KEY);
          }else if (data.data_type === 'rematch_request') {
            const requesterRole = data.requester_role;
            const message = data.message;
            if (this.state.yourRole !== requesterRole) {
              // 後手のプレイヤーの場合：再対戦依頼の通知を表示
              //displayRematchRequest(message, data.current_game_id);
              //console.log("再対戦依頼の通知を表示"+message+" "+data.current_game_id);
              this.setState({ rematchRequest: true });
            } else {
              // 先手のプレイヤーの場合：自分がリクエストしたことの確認メッセージを表示（任意）
              console.log("あなたが再対戦をリクエストしました。相手の返答をお待ちください。");
              // または、リクエスト中であることを示すUI（例: ボタンを無効にする）
            }
        }else if (data.data_type === 'decline_rematch') {
          const declinedRole = data.declined_role;
          if (this.state.yourRole !== declinedRole) {
              this.setState({ decline_received: true ,rematch_sended: false});
            } else {
              // 先手のプレイヤーの場合：自分がリクエストしたことの確認メッセージを表示（任意）
              console.log("あなたが再対戦をリクエストしました。相手の返答をお待ちください。");
              // または、リクエスト中であることを示すUI（例: ボタンを無効にする）
            }
        }
        },

        // クライアントからサーバーにメッセージを送るメソッド
        board_update: (boardData,moveDetails) => {
          // ここで boardData は getBoardState() から返されるプレーンなオブジェクトであることを想定
          this.subscription.perform('board_broadcast_and_store', { 
            moveHistory: this.state.moveHistory, 
            //moveHistory: [], 
            BoardInfo: boardData,
            nowTurn: this.state.nowTurn,
            room_id: this.state.roomId,
            game_id: this.state.gameId
           });
        },
        // サーバーにメッセージを送信するためのカスタムメソッド
        sendChatMessage: (chat_data)=> {//
          //console.log(`sendChatMessageメソッド・chat_data:${chat_data}`);
          this.subscription.perform('chat_broadcast_and_store', { 
            chat_data: chat_data,
            room_id: this.state.roomId,
            game_id: this.state.gameId 
          });
        //再対戦
        },rematch_send: (yourRole)=> {
          this.subscription.perform('rematch_setup', {
              yourRole: yourRole, // キーが'yourRole'
              room_id: this.state.roomId,   // キーが'room_id'
              game_id: this.state.gameId    // キーが'game_id'
          });
        //再戦を承諾
        },
        // サーバーにアクションを送信するヘルパーメソッドを定義 (ShogiTimerから呼び出される)
        // これらはShogiTimerから参照されるため、bindする必要がある
        // Action Cable performsメソッドはPromiseを返さないため、同期的な呼び出し
        sendToggleTimer: (timerState) => {
          this.subscription.perform('toggle_timer', timerState);
        },
        sendSwitchTurn: (turnState) => {
          this.subscription.perform('switch_turn', turnState);
        },
        sendResetTimer: (resetState) => {
          this.subscription.perform('reset_timer', resetState);
        }
      }
    );
  };

  canselSelection() {
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
    const nextBoardInfo = this.state.boardInfo;// 現在のboardInfoの状態を取得
    if (nextBoardInfo.selection.isNow) {// 既に何か選択されている状態の場合
      nextBoardInfo.selection.isNow = false;// 選択状態を解除
    } else {//何も選択されてない状態の場合
      nextBoardInfo.selection = new Selection();//selectionオブジェクトを初期状態に戻す (新しいSelectionインスタンスを作成し、選択状態を完全に初期化する)
    }
    this.setState({boardInfo: nextBoardInfo});//盤面情報の更新
  }

  //ユーザーが盤面上のi行、j列をクリックしたときに呼ばれるメソッド
  handleBoardClick(i, j) {
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
    const { boardInfo, isConnected, yourRole } = this.state;
    const clickResult = boardInfo.boardClick(i, j,yourRole);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている
    if(clickResult!==undefined && clickResult.moved_check){//自分の手番じゃなかったり、クリックされたマスが移動先として不適切だったり、クリックされた駒が自分の手番の駒でなければ
      //新しいボードデータ作るためのデータを作成
      const game_data = {
        moveDetails: clickResult.moveDetails,
        BoardInfo: clickResult.BoardInfo,
        pieceStandNum: clickResult.pieceStandNum,
        pieceStand: clickResult.pieceStand,
        nowTurn: clickResult.nowTurn,
        isCheck: clickResult.isCheck, // 王手状態を結果に追加
        isCheckmate: clickResult.isCheckmate ,// 詰み状態
        winner: clickResult.winner
      };
      const newBoardInfoInstance = new BoardInfo(game_data); // clickResult.newBoardState には、boardClick 後の BoardInfo 内部の最新状態が返される・これを基に、新しい BoardInfo インスタンスを生成して React の state を更新する
      this.setState(prevState => {
        let newMoveHistory;
        if (prevState.moveHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            newMoveHistory = [clickResult.moveDetails];
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            newMoveHistory = [...prevState.moveHistory, clickResult.moveDetails];
        }
        return {
            boardInfo: newBoardInfoInstance, // 新しいインスタンスでstateを更新
            moveHistory: newMoveHistory,     // 修正した moveHistory
            nowTurn: clickResult.nowTurn,    // BoardInfoインスタンスから手番を取得して更新
            isCheck: clickResult.isCheck, // 王手状態を結果に追加
            isCheckmate: clickResult.isCheckmate, // 詰み状態
            winner: clickResult.winner,
        };
      }, () => {
        //勝敗がついてたら
        if(clickResult.isCheckmate){
          //console.log("勝敗がついている")
          this.subscription.perform('game_set', {
            room_id: this.state.roomId,
            winReason: "Tumi", 
            winner: clickResult.winner,
          });
        }
        //console.log("moveHistory:"+this.state.moveHistory[0])
        // stateの更新が完了した後、WebSocketでサーバーに送信
        if (isConnected && this.subscription && clickResult.moved_check) { // 駒が動いた場合のみ送信
          this.handleSwitchTurn({ // ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
          //this.sendSwitchTurn({ // ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
            senteTime: this.shogiTimerRef.current?.getSenteTime(), // 現在の時間を取得して送る
            goteTime: this.shogiTimerRef.current?.getGoteTime(),   // getSenteTime/getGoteTime はShogiTimerで公開する必要がある
            activePlayer: clickResult.nowTurn, // 次の手番
            isPaused: false, // 駒を動かしたら一時停止を解除
            lastUpdateTime: Date.now()
          });
          //console.log("盤面状態が変更されました。サーバーに送信します。", newBoardInfoInstance.getBoardState());
          //getBoardState() を呼び出し、サーバーに送るためにプレーンなオブジェクトに変換
          this.subscription.board_update(
            //newBoardInfoInstance.getBoardState(),
            newBoardInfoInstance,
            clickResult.moveDetails
          );
        } else if (clickResult.moved_check) {
          console.warn("WebSocket接続が確立されていないため、盤面更新を送信できません。");
        }
      });
    }else{
      //console.log(`clickResultがundefined・clickResult:${JSON.stringify(clickResult)}`);
    }
  }

  pieceStandClick(piece) {
    this.state.boardInfo.pieceStandClick(piece);
  }

  deleteData = async () => { // async/await を使用
    console.log('データを削除する');
    const { roomId } = this.state; // stateからroomIdを取得
    if (!roomId) {
      console.log("ルームIDが不明");
      return;
    }
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch(`/shogi/${roomId}/destroy`, { // await を使う
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
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
        //window.location.href = '/'; // トップページへ戻る
      } else {
        console.error('削除失敗:', data.error || data.message);
      }
    } catch (error) {
      console.error('リクエストエラー:', error);
    }
  };

  //チャット入力フィールドの値が変更された時にstateを更新
  handleChatInputChange(event) {
    this.setState({ currentChatMessage: event.target.value });
  }
  //チャットフォームが送信された時（「送信」ボタンクリックまたはEnterキー）
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

      setTimeout(() => {// 少し遅延させてDOMの更新を待ってチャットをスクロールして一番下のメッセージを表示
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }, 100);
      console.log("チャットメッセージを送信しました:", currentChatMessage);
    } else {
      console.warn("WebSocket接続が確立されていないため、メッセージを送信できません。");
      alert("チャットサーバーに接続されていません。");
    }
  }
  //チャットの開閉の表示を切り替えるメソッド
  toggleChat() {
    this.setState(prevState => ({
      isChatOpen: !prevState.isChatOpen // 現在の状態を反転させる
    }));
  }

  rematch(){
    //console.log("再戦する");
    this.subscription.rematch_send(this.state.yourRole);
    this.setState({ rematch_sended: true ,decline_received:false}); 
  }
  acceptRematch() {
    //console.log("再対戦を承諾しました。");
    this.setState({ rematchRequest: false, isCheckmate: false, winner: "yet" }); //再戦リクエストモーダルを非表示、勝敗をついていないことにし、勝者もyetに
    // サーバーに承諾したことを通知するAction Cableメッセージを送る
    this.subscription.perform('rematch_accept', {
      room_id: this.state.roomId // キーが'room_id'
    });
  }
  declineRematch() {
    console.log("再対戦を拒否しました。");
    //window.location.href = '/';
    // サーバーに拒否したことを通知するAction Cableメッセージを送る
    this.setState({ rematchRequest: false});//再戦リクエストモーダルを非表示
    this.subscription.perform('decline_rematch', {
        yourRole: this.state.yourRole, // キーが'yourRole'
        room_id: this.state.roomId,   // キーが'room_id'
    });
  }

  // 時間切れ時に実行されるコールバック関数
   handleActionCableMessage(data) {
    //console.log("handleActionCableMessage(data):", data); // JSON.stringify(data) はオブジェクトを見にくくするので直接 data をログに出す
    switch (data.type) {
      case 'initial_timer_state':
        // ShogiTimerに初期状態を渡す (ShogiTimerが自身で状態を更新するように)
        // ShogiTimerRefがまだ利用できない場合、状態をバッファする
        if (this.shogiTimerRef.current) {
          this.shogiTimerRef.current.initializeTimerState(data.data);
          // 適用したらバッファをクリア（念のため）
          this.setState({ bufferedInitialTimerState: null });
        } else {
          console.warn("ShogiTimerRef.current is null for initial_timer_state. Buffering data.", data.data);
          this.setState({ bufferedInitialTimerState: data.data });
        }
        break;
      case 'timer_updated':
      case 'turn_switched':
      case 'timer_toggled':
      case 'timer_reset':
        // ShogiTimerにサーバーからの最新の状態を渡し、UIを更新させる
        if (this.shogiTimerRef.current) {
          this.shogiTimerRef.current.syncTimerState(data.data);
        }
        break;
      // 他のゲームイベント (例: 駒の移動、チャットなど) のハンドリング
      default:
        console.log("Unknown message type:", data.type);
    }
  }

  handleTimeUp(player) {
    //console.log(`${player} の時間切れです！ゲームを終了します。`);
    const winner = player === 'sente' ? '後手' : '先手';//値がsenteならgoteにして、goteならsenteに
    this.subscription.perform('game_set', {
      room_id: this.state.roomId,
      winReason: "TimeUp", // キーが'yourRole'
      winner: winner,
    });
  }

  // ShogiTimer の startTimer メソッドを呼び出す
  handleStartTimer = () => {
    //console.log("handleStartTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.start(); // ShogiTimer で公開した 'start' メソッドを呼び出す
    }
       // this.shogiTimerInstance が null でないことを確認
  };

  // ShogiTimer の pauseTimer メソッドを呼び出す
  handlePauseTimer = () => {
    //console.log("handlePauseTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.pause(); // ShogiTimer で公開した 'pause' メソッドを呼び出す
    }
  };

  // ShogiTimer の toggleStartPause メソッドを呼び出す
  handleToggleTimer = () => {
    console.log("handleToggleTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.toggle(); // ShogiTimer で公開した 'toggle' メソッドを呼び出す
    }
  };

  // ShogiTimer の switchTurn メソッドを呼び出す
  handleSwitchTurn = () => {
    //console.log("handleSwitchTurn呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.switchTurn(); // ShogiTimer で公開した 'switchTurn' メソッドを呼び出す
    }
  };

  // ShogiTimer の resetTimer メソッドを呼び出す
  handleResetTimer = () => {
    console.log("handleResetTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.reset(); // ShogiTimer で公開した 'reset' メソッドを呼び出す
    }
  };

  gameFinishTest = () => {
    this.setState({ isCheckmate: true, winner:"あなた" });
    this.handleTimeUp(this.state.yourRole)
  };

  debugModeOn = () => {
    if(this.state.debugMode){
      this.setState({ debugMode: false });
    }else if(!this.state.debugMode){
      this.setState({ debugMode: true });
      setTimeout(() => {// 少し遅延させてDOMの更新を待ってチャットをスクロールして一番下のメッセージを表示
        const debugArea = document.getElementById('debugArea');// ドラッグしたい要素を取得
        if (debugArea) {
            new Draggable(debugArea);// Draggable.js のインスタンスを作成し、要素をドラッグ可能にする// 'new Draggable()' の引数にドラッグ対象の要素を渡します。
        }
      }, 100);
    }
  };

  chengeRoleDebug(){
    //setStateを呼び出す前に、nowTurnとyourRoleを決定する
    let newNowTurn;

    // yourRole に応じてyourRoleとenemyRoleを決定・もしthis.stateが既に存在し、yourRoleの値が格納されているなら、それを使う・ここでは、新しい対局の開始を想定して、this.propsか何かしらの初期値からyourRoleが渡されると仮定
    let newYourRole;
    let newEnemyRole;
    if (this.state.yourRole === "先手") {
      newYourRole= "後手"
      newEnemyRole = "先手";
    } else {
      newYourRole= "先手"
      newEnemyRole = "後手";
    }
    // 最終的な状態をセット
    this.setState({
      yourRole: newYourRole,
      enemyRole: newEnemyRole,
    });
  }

  render() {
    const { logoPath,gamebackPath,loadingimgPath, boardInfo, gameInfo, gameRoomData, moveHistory, nowTurn, isConnected, isLoading, loadingMessage, chatMessages, currentChatMessage, isChatOpen, yourRole, enemyRole, isCheck, isCheckmate,winner, winReason,rematch_sended,rematchRequest,decline_received,gameStatus, timeUpPlayer,debugMode ,audienceUser} = this.state;
    const roomId = this.state.roomId; // renderメソッド内でstateからroomIdを取得

    // Action Cable の送信メソッド群を ShogiTimer に渡すオブジェクトを作成・gameChannel がまだ null の可能性があるので ?. (オプショナルチェイニング) を使用
    const sendActions = {
      sendToggleTimer: (...args) => this.subscription?.sendToggleTimer(...args),
      sendSwitchTurn: (...args) => this.subscription?.sendSwitchTurn(...args),
      sendResetTimer: (...args) => this.subscription?.sendResetTimer(...args),
    };

    const { t } = this.props;

    //senteだったら"先手"に、goteだったら"後手"に

    setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
      if (document.getElementById('chat-messages') && document.getElementById('chat-messages').scrollHeight !== undefined){
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    }, 100);

    //見やすいボードのデータを作る
    const EasyBoardData = this.state.boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
    
    if (isLoading) { // ★ isLoading が true の間はローディング表示
      return (
        <div id="loading-overlay" className={`bg-[url('${loadingimgPath}')] bg-no-repeat bg-cover bg-center`}>
          <div className="spinner"></div>
          <p className="ml-4 text-xl text-white">{loadingMessage}</p>
        </div>
      );
    }
    return (
      <div className=" h-full">
        <Header logoPath={logoPath} />
        <div className={`main-container h-[calc(100%-30px)] bg-no-repeat bg-cover bg-center bg-[url('${gamebackPath}')]`}>
          <div className="menu-container column">
            <div className="menu-div">
              {isCheckmate && ( //勝敗に決着が着いたら
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-[1.2rem] font-bold text-gray-800 mb-2">
                        {winner === yourRole && !audienceUser ? ( "あなたの勝ち！"
                        ) : winner !== yourRole && !audienceUser ? ( "あなたの負け"
                        ) : ( winner+"の勝ち！" )}
                      </h2>
                      {winReason==="TimeUp" && (
                        <>時間切れ</>
                      )}
                      {winReason==="Tumi" && (
                        <>詰み</>
                      )}
                      <div className="w-16 h-1 bg-blue-500 mx-auto rounded"></div>
                    </div>
                    { winner === yourRole && !audienceUser &&(
                      <div className="mt-4 flex justify-center">
                        <div className="text-4xl">🎉</div>
                      </div>
                    )}
                    {!rematch_sended &&  ( //再選リクエストを送信していないなら
                      <div className="space-y-3">
                          { !audienceUser && (
                            <button
                              onClick={() => this.rematch()}
                              className="w-full bg-[#dc143c] hover:bg-[#b80f33] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                              再対戦する
                            </button>
                          )}
                          <a href="/">
                            <button
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                              ロビーに戻る
                            </button>                      
                          </a>
                      </div>
                    )}{rematch_sended && (
                      <div className="space-y-3">
                          再対戦リクエストを送信しました。
                      </div>
                    )}
                    {decline_received && (
                      <div className="space-y-3">
                          再対戦リクエストが拒否されました。
                      </div>
                    )}
                </div>
              )}

            {!isCheckmate && ( //ゲームセットしていないなら
              <div>
                <ShogiTimer
                  initialMinutes={10}
                  onTimeUp={this.handleTimeUp}
                  ref={this.shogiTimerRef}
                  yourRole={yourRole}
                  roomId={roomId} 
                  sendActionCableMessage={sendActions} // Action Cable の送信メソッド群を props として渡す
                  debugMode={debugMode}
                />

                <div style={ nowTurn !== yourRole
                    ? { display: "none" }
                    : undefined
                  }>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <div className="relative">
                    {nowTurn === yourRole && !audienceUser ? (
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 animate-pulse"></div>
                        <div className="relative z-10 text-center">
                          <div className="inline-block animate-bounce text-4xl mb-2">⚡</div>
                          <div className="text-1xl font-bold mb-1"> {t('shogi.yourturn')} </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full animate-ping"></div>
                      </div>
                    ) : nowTurn !== yourRole  && !audienceUser ?(
                      <div className="text-center py-6 px-6 bg-gray-100 border border-gray-300 rounded-xl">
                        <div className="text-xl text-gray-600 mb-1"> {t('shogi.enemyturn')} </div>
                        <div className="text-sm text-gray-500"> {t('shogi.turnwaiting')} </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 px-6 bg-gray-100 border border-gray-300 rounded-xl">
                        <div className="text-xl text-gray-600 mb-1">{nowTurn}の手番</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

          <div className="game-container column" onClick={() => this.canselSelection()}
            style={ yourRole === "後手" || yourRole === "gote"
                    ? { alignItems: "flex-start" }//後手なら回転させる・align-items:flex-startで垂直方向を上端揃え
                    : undefined
                  }
          >
            <div className="game-board"
                style={ yourRole === "後手" || yourRole === "gote"
                    ? { transform: "rotate(180deg)"}//後手なら回転させる・align-items:flex-startで垂直方向を上端揃え
                    : undefined
                  }
            >
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
              <br />
              <PieceStand
                pieceStand={this.state.boardInfo.pieceStand["先手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
              />
            </div>
          </div>

          <div className="chat-and-setting-container column">
            <div className="setting-container column">
                {/* 差し手履歴*/ }
                <div className="h-1/10 overflow-y-auto p-2.5 max-h-48 overflow-y-auto">
                  {moveHistory.map((move, index) => (
                    <p key={index}>{index + 1}: {move}</p>
                  ))}
                </div>
            </div>

            <div className={`chat-container ${isChatOpen ? '' : 'closed'}`} > {/* isChatOpen の状態に応じてクラスを適用 */}
              {/* 開閉ボタン */}
              <button
                className={`chat-toggle-button bg-[#dc143c] hover:bg-[#b80f33] ${isChatOpen ? '' : 'pointer-events-auto'}`}
                onClick={this.toggleChat} // クリックで開閉メソッドを呼び出す
                aria-expanded={isChatOpen} // アクセシビリティのため
                aria-controls="chat-messages-container" // 対象となるコンテナのID (chat-containerにIDを追加する場合)
              >
                {isChatOpen ? '>' : '<'} {/* isChatOpen の状態に応じてボタンのテキストを切り替える */}
              </button>
              
              <div id="chat-messages" className="chat-messages">
                {(() => {
                  // もしchatMessagesが文字列の場合、配列に変換
                  let messages = chatMessages;
                  if (typeof chatMessages === 'string') {
                    messages = chatMessages.split(',').map(msg => msg.trim());// カンマ区切りで文字列を分割
                  }
                  return Array.isArray(messages) ? (
                    messages.map((message, index) => (
                      <div key={index} className="chat-message p-2 mb-2 rounded">
                        {message}
                      </div>
                    ))
                  ) : (
                    <p className="text-red-500">メッセージがありません</p>
                  );
                })()}
              </div>
              <form id="chat-form" className="chat-form" onSubmit={this.handleChatSubmit}>
                <input
                  type="text"
                  id="chat-input"
                  placeholder="メッセージを送信"
                  className="chat-input"
                  value={currentChatMessage}
                  onChange={this.handleChatInputChange}
                />
                {/*<button type="submit" className="chat-button">Send</button>*/}
              </form>
            </div>

            </div>
        </div>

      {rematchRequest && ( //再戦リクエストが来たら
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
              !rematchRequest ? 'opacity-0' : 'opacity-50'
            }`}
          ></div>

          <div className={`
            relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 
            transform transition-all duration-300 
            ${!rematchRequest ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
          `}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold text-center">再戦リクエスト</h2>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⚔️</div>
                <p className="text-gray-700 text-lg">
                  相手から再戦の申し込みがあります
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => this.acceptRematch()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  承諾
                </button>
                <button
                  onClick={() => this.declineRematch()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  拒否
                </button>
              </div>
            </div>

            <button
              className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}


        {debugMode && (
          <div id="debugArea"
            className="w-[90%] h-[50%] fixed top-7 right-4 z-50 opacity-80 border bg-gray-500 items-center justify-center overflow-auto whitespace-pre-line"
          >  
<h3>Version1</h3>

                <span className="font-semibold m-5">あなたは{yourRole}</span>

                <button
                  onClick={() => this.chengeRoleDebug()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  自分の役割の手番を変更
                </button>

                <button
                  onClick={this.deleteData}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  試合が終わったのでデータ削除
                </button>

                <button
                  onClick={this.gameFinishTest}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  試合が終わらせる
                </button>

                <div className="mb-3">
                  <span className="font-semibold">接続状態: </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {isConnected ? '接続中' : '未接続'}
                  </span>
                </div>

                {/* */}
                <div
                 className="mb-3 text-white
                  whitespace-pre    /* 改行をそのまま反映、折り返しも無効 */
                  font-mono         /* 等幅フォントで見やすく */
                  text-sm
                  bg-black
                  p-3
                  border border-gray-200
                  overflow-x-auto   /* 横長のときはスクロール */
                ">
                  <p>ボードデータ: </p>
                  {EasyBoardData}
                </div>
                <div className="mb-3 text-white">
                  先手の持ち駒: {JSON.stringify(this.state.boardInfo.pieceStand["先手"])}
                </div>
                <div className="mb-3 text-white">
                  後手の持ち駒: {JSON.stringify(this.state.boardInfo.pieceStand["後手"])}
                </div>
                <div>
                  gameRoomData: {gameRoomData}
                </div>
          </div>
        )}

      </div>
    );
  }
}

// withTranslationでコンポーネントをラップ
const RoomWithTranslation = withTranslation()(Room);

document.addEventListener('turbo:load', () => {
  const shogiBoardElement = document.getElementById('game-container');
  if (shogiBoardElement) {
    const rootElement = document.createElement('div');
    rootElement.className = 'h-full';
    document.body.appendChild(rootElement);
    const root = ReactDOM.createRoot(rootElement);
    //root.render(<Room />);
    root.render(
      <I18nextProvider i18n={i18n}>
        <RoomWithTranslation />
      </I18nextProvider>
    );    
  } else {
    // shogi-board要素が見つからない場合は、このページが将棋ページではないと判断
    //console.log("将棋ゲームコンポーネントは、このページでは初期化されませんでした（#shogi-board要素なし）。");
  }
})

export default Room;