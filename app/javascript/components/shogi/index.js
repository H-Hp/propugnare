import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';

import { BoardInfo, Selection } from './BoardInfo';
import ShogiTimer from './ShogiTimer/ShogiTimer';
import Header from '../Header.jsx';
import LoadingOverlay from "../LoadingOverlay.jsx";
import consumer from '../../channels/consumer.js'; // Action Cableのconsumerをインポート
import { withTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lang/i18n' 

import { getBestMoveFromSFEN } from "./shogiCpu.js";

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
  //console.log("props:"+JSON.stringify(props))
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

  // 成り確認モーダルコンポーネント
  function PromoteModal(props) {
  //class PromoteModal(props) {
      //console.log("props:"+JSON.stringify(props)) 
      //console.log("props.piece.name:"+JSON.stringify(props.piece.name))
      //console.log("props.yourRole"+JSON.stringify(props.yourRole))
      //console.log("props.piece.getPromotedPiece():"+JSON.stringify(props.piece.getPromotedPiece()))
      // マスの位置を計算（CSS Grid或いはflexboxの位置に基づく）
      const squareSize = 60; // 各マスのサイズ（px）
      const boardMargin = 20; // 盤面の余白
      
      const modalStyle = {
          position: 'absolute',
          left: `${boardMargin + (props.position.j * squareSize+60)}px`,
          top: `${boardMargin + (props.position.i * squareSize+40)}px`,
          backgroundColor: 'black',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 1000,
          minWidth: '120px',
          textAlign: 'center'
      };

      return (
          <div style={modalStyle} className="promote-modal bg-gradient-to-br from-black via-gray-800 to-gray-900">
              <div 
                style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>

                      <img
                        onClick={() => props.onChoice(false)}
                        id={props.piece.owner} 
                        src={imgByName[props.piece.name]} 
                        alt="" 
                        className={`w-[50px] h-[50px] cursor-pointer ${
                          (props.yourRole === "後手" || props.yourRole === "gote")
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />

                      <img 
                        onClick={() => props.onChoice(true)}
                        id={props.piece.getPromotedPiece().owner} 
                        src={imgByName[props.piece.getPromotedPiece().name]} 
                        alt=""
                        className={`w-[50px] h-[50px] cursor-pointer ${
                          (props.yourRole === "後手" || props.yourRole === "gote")
                            ? "transform rotate-180"
                            : ""
                        }`}
                      />
                  {/*<button
                      onClick={() => props.onChoice(true)}
                      style={{
                          padding: '5px 10px',
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                      }}
                  >
                  </button>
                  <button
                      onClick={() => props.onChoice(false)}
                      style={{
                          padding: '5px 10px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                      }}
                  >
                  </button>*/}
              </div>
          </div>
      );
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
    const yourUsername = element.dataset.yourUsername;
    const pieceMoveSoundPath = element.dataset.piece_move_soundPath;
    const gameBgmPath = element.dataset.game_bgmPath;
    const aimode = element.dataset.aimode;
    const railsEnv = element.dataset.railsEnv;

    //console.log("audienceUser: "+audienceUser)
    //console.log("プレーンなnew BoardInfo():"+JSON.stringify(new BoardInfo()))

    this.state = {
      logoPath: logoPath,
      gamebackPath: gamebackPath,
      loadingimgPath: loadingimgPath,
      gameBgmPath: gameBgmPath,
      pieceMoveSoundPath: pieceMoveSoundPath,

      boardInfo: new BoardInfo(), // 初期状態では引数なしでBoardInfoコンストラクタを呼び出し、デフォルトの初期盤面を生成
      //boardInfo: new_boardInfo, // 盤面状態を保持
      gameInfo: {},
      gameRoomData: gameRoomData,
      moveHistory: [],
      boardSfenHistory: [],
      moveHistorySelectedIndex:-1,
      yourUsername: yourUsername,
      nowTurn: '先手',
      isCheck: false, // 王手状態を結果に追加
      isCheckmate: false ,// 詰み状態

      showPromoteModal: false,//成るかどうかのモーダル
      promoteModalPosition: { i: -1, j: -1 }, // /成り確認モーダル位置情報を追加
      promoteCallback: null,
      currentPiece: null,

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

      winner: "yet",
      winReason: "yet",

      rematch_sended: false,//リクエストを送信したかどうか
      rematchRequest: false,//リクエストが来ているか
      decline_received: false,//再対戦リクエストの拒否を受け取ったかどうか
      gameStatus: 'playing', //playing, time_up, checkmate
      timeUpPlayer: null, // 時間切れになったプレイヤー

      bufferedInitialTimerState: null, //追加: 初期タイマー状態を一時的に保持する
      debugMode: false,
      aiMode: aimode,
      audienceUser: JSON.parse(audienceUser),
      railsEnv: railsEnv
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


    //this.boardInfo = new BoardInfo();
    //console.log("Setting callback to:", this.handlePromoteConfirm);
    //this.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);// BoardInfoにコールバック関数を設定

    this.setupBoardInfoCallback();
  }

  setupBoardInfoCallback = () => {
    //console.log("Setting up callback for:", this.state.boardInfo);
    //this.state.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
    
    // BoardInfoにコールバック関数を設定
    // 重要：stateのboardInfoに対してコールバックを設定
    this.state.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
    //console.log("BoardInfo instance in state:", this.state.boardInfo);
    //console.log("Callback set to:", this.state.boardInfo.onPromoteConfirmCallback);

  }

  // 成り確認のコールバック関数
  //handlePromoteConfirm = (piece, callback) => {
  handlePromoteConfirm = (piece, i, j, callback) => {
      //console.log("成り確認のコールバック関数呼ばれた");
      //console.log(`成り確認要求: piece=${piece.name}, position=(${i}, ${j})`);
      //console.log("handlePromoteConfirm called with piece:", piece);
      //i（行 index） → 縦方向（上から下）
      //j（列 index） → 横方向（左から右）
      //console.log("yourRole:"+this.state.yourRole)
      if(this.state.yourRole=="後手"){//後手の時は座標を逆にする
        //console.log("後手の時は座標を逆にする:")
        i = 8 - i; // 後手用の縦座標
        j = 8 - j; // 後手用の横座標
      }
      this.setState({
          promoteCallback: callback,
          showPromoteModal: true,
          currentPiece: piece,
          promoteModalPosition: { i, j }
      });

      if (this.state.aiMode && this.state.nowTurn==this.state.enemyRole ) { //ai対戦モードでaiのターンならtrueで自動進化
        console.log("成り判定でai対戦モードでaiのターンならtrueで自動成り")
        callback(true);
        this.setState({
          showPromoteModal: false,
          promoteCallback: null,
          currentPiece: null,
          promoteModalPosition: { i: -1, j: -1 }
        });
      }
  }

  // モーダルでの選択処理
  handlePromoteChoice = (shouldPromote) => {
      //console.log("ユーザーの選択:", shouldPromote ? "成る" : "成らない");
      //console.log("shouldPromote:"+shouldPromote)

      if (this.state.promoteCallback) {
          this.state.promoteCallback(shouldPromote);
      }
      this.setState({
          showPromoteModal: false,
          promoteCallback: null,
          currentPiece: null,
          promoteModalPosition: { i: -1, j: -1 }
      });
  }




  // コンポーネントがマウントされた後に一度だけ実行される
  componentDidMount() {
    this.initializeRoom();
    this.setupAudio()

    this.setupBoardInfoCallback();

    //デバッグモード
    window.addEventListener('keydown', (event) => { if (event.key === 'd' || event.key === 'D') { 
      event.preventDefault(); //dでブックマーク登録を防ぐ
      this.debugModeOn()
    } });
  }

  //prevProps と prevState を引数として明示的に受け取る
  componentDidUpdate(prevProps, prevState) {
    // stateが更新されたときにコールバックが失われていないかチェック
    if (prevState.boardInfo !== this.state.boardInfo) {
        //console.log("BoardInfoインスタンスが変更されました。コールバックをリセットします。");
        this.setupBoardInfoCallback();
    }

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

  // AudioContextと音源の準備
  async setupAudio() {
    /*if (!this.audioContextRef) {
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
    }*/
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

  //バッファされた初期状態を ShogiTimer に適用するメソッド
  applyBufferedInitialTimerState() {
    if (this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        //console.log("ShogiTimerにバッファされた初期タイマーの状態を適用する:", this.state.bufferedInitialTimerState);
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
            //console.log("aiMode:"+this.state.aiMode)
            //console.log("enemyRole:"+this.state.enemyRole)
            //console.log("nowTurn:"+this.state.nowTurn)
            if( this.state.aiMode && this.state.enemyRole==this.state.nowTurn && !this.state.isCheckmate){ 
              this.aiAct(new BoardInfo())
            } //Ai対戦モードで、現在のターンがaiのターンだったら
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
            if (this.state.nowTurn===this.state.yourRole) {
              this.piece_move_sound()
            }
            const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
            let moveHistory_redis = boardDataFromServer.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            if (boardDataFromServer) {
              //console.log("boardDataFromServer:"+JSON.stringify(boardDataFromServer))
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
              this.setState({
                boardInfo: newBoardInfoInstance,
                moveHistory: moveHistory_redis,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                isLoading: false,
                loadingMessage: "",
              }, () => {
                //console.log("aiMode:"+this.state.aiMode)
                //console.log("enemyRole:"+this.state.enemyRole)
                //console.log("nowTurn:"+this.state.nowTurn)
                if( this.state.aiMode && this.state.enemyRole==this.state.nowTurn && !this.state.isCheckmate){
                  this.aiAct(newBoardInfoInstance)
                }
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
              //console.log("data.chat_data: ",data.chat_data)
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
            yourUsername: this.state.yourUsername,
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
/// 
  //ユーザーが盤面上のi行、j列をクリックしたときに呼ばれるメソッド
  async handleBoardClick(i, j,player) {
  //handleBoardClick(i, j,player) {
    //console.log(`handleBoardClick: i=${i}, j=${j}, player=${player}`);
    //console.log("Current BoardInfo:", this.state.boardInfo);
    //console.log("BoardInfo callback exists?", !!this.state.boardInfo.onPromoteConfirmCallback);
    // 念のため、呼び出し前にコールバックが存在するかチェック
    if (!this.state.boardInfo.onPromoteConfirmCallback) {
        //console.log("Callback missing, resetting...");
        this.setupBoardInfoCallback();
    }

    //console.log("handleBoardClick起動、i , j :" +i+","+j);
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
    const { boardInfo, isConnected, yourRole, aiMode } = this.state;
    //const clickResult = boardInfo.boardClick(i, j,yourRole);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている

    //const clickResult = boardInfo.boardClick(i, j,player);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている
    const clickResult = await boardInfo.boardClick(i, j, player);

    if( clickResult.move_status=="illegalMove" && aiMode){//aiモードで自殺手ならaiの手番をやり直す
      console.log("aiモードで自殺手ならaiの手番をやり直す"); 
      //console.log("boardInfo:"+JSON.stringify(boardInfo));
      //console.log("boardInfo.selection:"+JSON.stringify(boardInfo.selection));
      //const EasyBoardData = this.state.boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
      //const EasyBoardData = boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
      //console.log("EasyBoardData:\n"+this.CreateEasyBoard(boardInfo.board));
      //console.log("boardInfoのseen:"+this.boardToSFEN(boardInfo.board));
      this.aiAct(boardInfo)
    }

    //console.log("clickResult:"+JSON.stringify(clickResult));
    //console.log("clickResult.moved_check:"+clickResult.moved_check);
    //console.log("clickResult.moveDetails:"+clickResult.moveDetails);
    if(clickResult!==undefined && clickResult.moved_check){//自分の手番じゃなかったり、クリックされたマスが移動先として不適切だったり、クリックされた駒が自分の手番の駒でなければ
      //新しいボードデータ作るためのデータを作成
      const game_data = {
        moveDetails: clickResult.moveDetails,
        boardSFEN: clickResult.boardSFEN,
        BoardInfo: clickResult.BoardInfo,
        pieceStandNum: clickResult.pieceStandNum,
        pieceStand: clickResult.pieceStand,
        nowTurn: clickResult.nowTurn,
        isCheck: clickResult.isCheck, // 王手状態を結果に追加
        isCheckmate: clickResult.isCheckmate ,// 詰み状態
        winner: clickResult.winner
      };
      //console.log("clickResult.moveDetails:"+clickResult.moveDetails)
      const newBoardInfoInstance = new BoardInfo(game_data); // clickResult.newBoardState には、boardClick 後の BoardInfo 内部の最新状態が返される・これを基に、新しい BoardInfo インスタンスを生成して React の state を更新する
      this.setState(prevState => {
        let newMoveHistory;
        if (prevState.moveHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            newMoveHistory = [clickResult.moveDetails];
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            newMoveHistory = [...prevState.moveHistory, clickResult.moveDetails];
        }

        let newBoardSfenHistory;
        if (prevState.boardSfenHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            newBoardSfenHistory = [clickResult.boardSFEN];
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            newBoardSfenHistory = [...prevState.boardSfenHistory, clickResult.boardSFEN];
        }
        //console.log("this.state.boardSfenHistory:"+this.state.boardSfenHistory)
        //console.log("clickResult.boardSFEN:"+clickResult.boardSFEN)
        //console.log("this.state.moveHistory:"+this.state.moveHistory)
       
        return {
            boardInfo: newBoardInfoInstance, // 新しいインスタンスでstateを更新
            moveHistory: newMoveHistory,     // 修正した moveHistory
            boardSfenHistory : newBoardSfenHistory,
            nowTurn: clickResult.nowTurn,    // BoardInfoインスタンスで手番を交代し取得して更新
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
        if (isConnected && this.subscription && clickResult.moved_check) { // 駒が動いた場合
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
          )//,() => {
            this.piece_move_sound()

        } else if (clickResult.moved_check) {
          console.warn("WebSocket接続が確立されていないため、盤面更新を送信できません。");
        }
      });
    }else if(clickResult===undefined){
      console.log(`clickResultがundefined`);
    }else if(!clickResult.moved_check){
      console.log(`選択状態などでclickResult.moved_checkがfalse:${clickResult.moved_check}`);
    }else{
      console.error(`その他エラー`);
    }
  }

  pieceStandClick(piece) {
    console.log("pieceStandClickのpiece:"+JSON.stringify(piece))
    this.state.boardInfo.pieceStandClick(piece);
  }

  piece_move_sound(){
    const audio = new Audio(this.state.pieceMoveSoundPath);
    audio.volume = 0.8; // 無音で開始
    audio.play()
  }
  async aiAct(newBoardInfoInstance){
  //aiAct(newBoardInfoInstance){
    //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
    //CPUにSFEN文字列を渡したら、合法手を取り出してランダムに1つ選び、指し手として返す
    //const boardSfenString = this.boardToSFEN(boardInfo.board);
    //const piecesSfenString = this.piecesToSFEN(boardInfo.pieceStandNum);
    //const turnSfenString = this.turnToSFEN(boardInfo.nowTurn);
    const boardSfenString = this.boardToSFEN(newBoardInfoInstance.board);
    //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
    const piecesSfenString = this.piecesToSFEN(newBoardInfoInstance.pieceStandNum);
    //const turnSfenString = this.turnToSFEN(newBoardInfoInstance.nowTurn);
    //const ai_turn="b"
    //const ai_turn = this.state.enemyRole === "先手" ? "w" : "b";//this.state.enemyRoleが"先手"だったらconst ai_turn="w"で、"後手"だったらconst ai_turn="b"に
    //const ai_turn = this.state.enemyRole === "先手" ? "w" : "b";//this.state.enemyRoleが"先手"だったらconst ai_turn="w"で、"後手"だったらconst ai_turn="b"に
    //const nowTurn = this.state.nowTurn === "先手" ? "w" : "b";//enemyRoleが"先手"だったらai_turn="w"で、"後手"だったらai_turn="b"に
    const nowTurn = this.state.nowTurn === "先手" ? "b" : "w";//enemyRoleが"先手"だったらai_turn="b"で、"後手"だったらai_turn="w"に

    const move_count=this.state.moveHistory.length+1;//手数・初期局面なら「1」//SFEN形式の手数は次に指す手の番号を表す。初期局面（先手番）: "...b - 1"  ← 1手目を指す前、先手が指した後（後手番）: "...w - 2"  ← 2手目を指す前  、後手が指した後（先手番）: "...b - 3"  ← 3手目を指す前・SFEN形式における手数は、初期局面では1で、後手の手番では1つ増えた数になる
    //const sfen = boardSfenString+" "+turnSfenString+" "+piecesSfenString+" 1";
    //const sfen = boardSfenString+" "+ai_turn+" "+piecesSfenString+" - "+move_count;
    const sfen = boardSfenString+" "+nowTurn+" "+piecesSfenString+" "+move_count;
    
    //const sfen = "9/1r3+P1b1/4+P1ppp/PPPP2PPP/9/pp1ppp1pp/PP+pP1P+p1P/1B5R1/4K4 b 2p 6" //K(後手の王が消えてるからetBestMoveFromSFEN(sfen)でnullになってしまう)
    //const sfen = "4k4/1r5b1/+P5ppp/P1PPPPPPP/9/pp3pppP/PP2+pPP2/3+p5/B8 w 2P2pr 11" //K(後手の王が消えてるからetBestMoveFromSFEN(sfen)でnullになってしまう)
    //const sfen = "4k4/1r3+P1b1/4+P1ppp/PPPP2PPP/9/pp1ppp1pp/PP+pP1P+p1P/1B5R1/4K4 b 2p 6"
    console.log("sfen:"+sfen); // 例：sfen:lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1

    //let move = getBestMoveFromSFEN(sfen); //
    let move;
    try {
        const response = await fetch("http://168.138.215.52:5000/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                //sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
                sfen: sfen,
                think_time: 1000,
            }),
        });
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        const response_data = await response.json();
        console.log("AIの応答:", response_data);
        move=response_data.move

        //let move ="P*2d"
        console.log("CPUの差し手・move:"+move);//例：6g6f
        const regex = /^[1-9][a-i][1-9][a-i](?:\+)?$/;
        let i=0
        /*if (!regex.test(move) && 10>i) {
          console.warn(`無効なSFEN move: "${move}", 再試行中…`);
          i++;
          //return getBestValidMove(sfen);
          return getBestMoveFromSFEN(sfen);
          //if(i>10){ break}
        }*/
        
        /*
        while (!regex.test(move) && i < 10) {
          console.warn(`無効なSFEN move: "${move}", 再試行中…`);
          move = getBestMoveFromSFEN(sfen); // ← return せず代入
          i++;
        }
        */

        //console.log("最終決定したCPUの手: " + move);
        //console.log("boardInfo:"+JSON.stringify(boardInfo.pieceStandNum))
        //const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/P1PPPPPPP/1B5R1/LNSGKGSNL b - 1";

        //const {i, j} = this.sfenPosToCoord(move)
        const data = this.sfenMoveToCoords(move)
        //const data = this.sfenMoveToCoords(newBoardInfoInstance)
        //console.log("data", data);
        const { from: { i: fromI, j: fromJ }, to: { i: toI, j: toJ } } = data;
        //console.log(fromI, fromJ); // 7, 8
        //console.log(toI, toJ);     // 8, 6
        //this.yourRole = this.state.yourRole === "先手" ? "後手" : "先手";
        //console.log("あ："+this.state.yourRole)
        //this.setState(prevState => ({ yourRole: prevState.yourRole === "先手" ? "後手" : "先手" }));
              
        this.setState(
          prevState => ({
            //yourRole: prevState.yourRole === "先手" ? "後手" : "先手"
          }),
          () => {
            //console.log("い：" + this.state.yourRole); // 更新後に出力
            //this.handleBoardClick(fromI, fromJ)
            if (move.includes("*")) {
              console.log("*があるから持ち駒を打つ");
              //const moveTest = "P*2d"
              const pieceCode = move.split("*")[0]; // "*" の前が駒種
              const pieceMap = { P: "歩", L: "香", N: "桂", S: "銀", G: "金", B: "角", R: "飛" };
              let pieceName = pieceMap[pieceCode]
              //let piece ="歩"
              //this.state.boardInfo.pieceStand["後手"][i]
              //console.log("this.state.boardInfo.pieceStand['後手'][i]"+JSON.stringify(this.state.boardInfo.pieceStand["後手"][0]))
              console.log("this.state.boardInfo.pieceStand['後手']"+JSON.stringify(this.state.boardInfo.pieceStand["後手"]))
              const foundPiece = this.state.boardInfo.pieceStand[this.state.enemyRole].find(p => p.name === pieceName); // name === "歩" のオブジェクトを探す
              console.log("foundPiece:", foundPiece); // => {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]}
              this.pieceStandClick(foundPiece)
              /*
              const pieceCode = move.split("*")[0]; // "*" の前が駒種
              const pieceMap = { P: "歩", L: "香", N: "桂", S: "銀", G: "金", B: "角", R: "飛" };
              let pieceName = pieceMap[pieceCode]
              //let piece ="歩"
              this.state.boardInfo.pieceStand["後手"][i]
              this.pieceStandClick()
              */
            }else{
              this.handleBoardClick(fromI, fromJ, this.state.enemyRole)
            }
            //this.handleBoardClick(fromJ, fromI)
            //this.handleBoardClick(0, 3)
            
            setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
              //console.log("アクト")
              //this.handleBoardClick(toI, toJ)
              this.handleBoardClick(toI, toJ, this.state.enemyRole)
              //this.handleBoardClick(toJ,toI)
              //this.handleBoardClick(1, 3)
              //this.handleBoardClick(3, 1)
            }, 1000);
            

          });
        //console.log("い："+this.state.yourRole)
        //this.setState((prevState) => ({ nowTurn: prevState.nowTurn === "先手" ? "後手" : "先手" }));
        //this.setState((prevState) => ({ yourRole: prevState.yourRole === "先手" ? "後手" : "先手" }));

        //console.log("pos", pos);
        //console.log("i, j:"+i+","+j);
    /*
        const matches = str.match(/\d/g);
        let a = null;
        let b = null;
        if (matches && matches.length >= 1) {
            a = parseInt(matches[0], 10);
        }
        if (matches && matches.length >= 2) {
            b = parseInt(matches[1], 10);
        }
        console.log("a , b :" +a+","+b);
        handleBoardClick(a, b)
        */
      //};
        //return data;
    } catch (err) {
        console.error("エラー:", err);
    }
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
          //console.warn("ShogiTimerRef.current is null for initial_timer_state. Buffering data.", data.data);
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
        //console.log("Unknown message type:", data.type);
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
    //console.log("handleToggleTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
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

  aiTest(){
    //console.log("a")
    //const boardInfo = this.state.boardInfo
    const { boardInfo, } = this.state;
    //const sfenString = this.convertToSfen(boardInfo.board);
    
    const boardSfenString = this.boardToSFEN(boardInfo.board);
    const piecesSfenString = this.piecesToSFEN(boardInfo.pieceStandNum);
    const turnSfenString = this.turnToSFEN(boardInfo.nowTurn);
    
    //const sfen = sfenString+" w - 1";
    const sfen = boardSfenString+" "+turnSfenString+" "+piecesSfenString+" 1";
    const move = getBestMoveFromSFEN(sfen);
    //const move = getBestMoveFromSFEN(sfenString);
    //console.log("boardInfo:"+JSON.stringify(boardInfo.board))
    //console.log("boardInfo:"+JSON.stringify(boardInfo))
    //console.log("boardInfo:"+JSON.stringify(boardInfo.pieceStandNum))

    
    //console.log(sfen); // lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL
    //const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/P1PPPPPPP/1B5R1/LNSGKGSNL b - 1";
    //console.log("bestmove", move);
    // 例: "bestmove 7g7f"

    //7g7fのような表記は SFEN表記（座標ベースの記法）マス目の対応・7g → (7筋, g段)、7f → (7筋, f段)・段は「a=1段, b=2段 ... i=9段」に対応するので、g = 7段f = 6段よって「7g7f」 = 7筋7段の駒を 7筋6段へ動かす
    //平手初期局面の盤上のSFEN文字列は「lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL」
    //手番・1文字で表記し、先手は「b」、後手は「w」
    //持ち駒「(先手の持ち駒)(後手の持駒)」の形式で表記する。どちらも持ち駒がないときはハイフン(-)と表記する。持ち駒は駒の種類+その枚数(1枚の場合は省略)で表記する。例として先手側が銀１枚歩２枚、後手側が角１枚歩３枚であれば、「S2Pb3p」と表記する。
    //手数・次の指し手の手数をそのまま数字で記載する。初期局面なら「1」となる。

  }

  /**
   * 将棋盤の情報をSFEN形式の文字列に変換します。
   * @param {Array<Array<Object>>} board - 将棋盤の2次元配列。
   * @returns {string} SFEN文字列。
   */
  boardToSFEN(board) {
    //console.log("board: "+JSON.stringify(board))
    const pieceMap = {
      "歩": "P",
      "香": "L",
      "桂": "N",
      "銀": "S",
      "金": "G",
      "角": "B",
      "飛": "R",
      "王": "K",
      "玉": "k",
      "と": "+P",
      "竜": "+R",
      "馬": "+B",
      "成銀": "+S",
      "成桂": "+K",
      "成香": "+L",
    };

    return board.map(row => {
      let sfenRow = "";
      let emptyCount = 0;

      row.forEach(cell => {
        if (!cell || !cell.name) {
          // 空マス
          emptyCount++;
        } else {
          // 空マスを数字に変換
          if (emptyCount > 0) {
            sfenRow += emptyCount;
            emptyCount = 0;
          }
          let piece = pieceMap[cell.name];
          //console.log("piece: "+piece)
          if (!piece) throw new Error(`Unknown piece: ${cell.name}`);
          // 後手は小文字に
          if (cell.owner === "後手") {
            piece = piece.toLowerCase();
          }
          sfenRow += piece;
        }
      });

      // 残りの空マスを数字に
      if (emptyCount > 0) {
        sfenRow += emptyCount;
      }

      return sfenRow;
    }).join("/");
  }

  piecesToSFEN(pieces) {
    const map = { "歩": "P", "香": "L", "桂": "N", "銀": "S", "金": "G", "角": "B", "飛": "R" };
    
    let sfen = "";

    // 先手（大文字）
    for (const [jp, en] of Object.entries(map)) {
      const count = pieces["先手"][jp];
      if (count > 0) {
        sfen += (count > 1 ? count : "") + en;
      }
    }

    // 後手（小文字）
    for (const [jp, en] of Object.entries(map)) {
      const count = pieces["後手"][jp];
      if (count > 0) {
        sfen += (count > 1 ? count : "") + en.toLowerCase();
      }
    }

    return sfen === "" ? "-" : sfen;
  }

  turnToSFEN(turn){
    if(turn=="先手"){
      return "w"
    }else if(turn=="後手") {
      return "b"
    }
  }

  // SFEN位置を (x, y) の座標に変換
  sfenPosToCoord(pos) {
    const file = parseInt(pos[0], 10); // 筋 (9〜1)
    const rank = pos[1];              // 段 (a〜i)

    // y = 9筋を0に
    const j = 9 - file;

    // x = a段を0に
    const i = rank.charCodeAt(0) - "a".charCodeAt(0);

    return { i, j };
  }
  //将棋盤を左上から0,0、その右のマスが0,1のような座標表記とした時に、2h2gなどSFEN文字列を座標表記に書き換えるメソッド
  // 移動を座標変換
  sfenMoveToCoords(sfenMove) {
    const from = sfenMove.slice(0, 2);
    const to = sfenMove.slice(2, 4);
    return {
      from: this.sfenPosToCoord(from),
      to: this.sfenPosToCoord(to)
    };
  }

  //差し手一覧から過去の盤面に戻せる
  backHistory(History,index){
    //if ( !this.state.isCheckmate ){ return } //試合終了してないならまだ差し手履歴からボードを更新できないように
    
    //moveHistorySelectedIndex
    //console.log("index: "+index)

    //console.log("backHistory:"+History)
    // 利用例
    //const sfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL w - 1';
    const forBoardInfoData = this.parseSFEN(History);
    //const forBoardInfoData = this.parseSFEN(sfen);
    //console.log("おきんたま:"+JSON.stringify(forBoardInfoData));
    //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
    const newBoardInfoInstance = new BoardInfo(forBoardInfoData);

    this.setState({
      boardInfo: newBoardInfoInstance,
      moveHistorySelectedIndex: index
      //moveHistory: moveHistory_redis,
      //nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
      //isLoading: false,
      //loadingMessage: "",
    });
  }

  //SFEN文字列をBoardInfoに渡すデータに変形
  // 駒種から動きパターンを定義（先手視点：dy=-1 が前進）
  movePatterns = {
    '歩': { dx: [0],        dy: [-1],                       dk: [1] },
    '香': { dx: [0],        dy: [-1],                       dk: [10] },
    '桂': { dx: [-1, 1],    dy: [-2, -2],                   dk: [1, 1] },
    '銀': { dx: [-1, -1, 1, 1, 0], dy: [-1, 1, 1, -1, -1],   dk: [1, 1, 1, 1, 1] },
    '金': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] },
    '王': { dx: [-1, -1, -1, 0, 1, 1, 1, 0], dy: [-1, 0, 1, 1, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1, 1, 1] },
    '角': { dx: [-1, -1, 1, 1], dy: [-1, 1, 1, -1],           dk: [10, 10, 10, 10] },
    '飛': { dx: [-1, 0, 1, 0],   dy: [0, 1, 0, -1],         dk: [10, 10, 10, 10] },
    // 成り駒
    'と': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // と金＝金
    '成香': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成香＝金
    '成桂': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成桂＝金
    '成銀': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成銀＝金
    '馬': { 
      dx: [-1, -1, 1, 1, -1, -1, 1, 1], 
      dy: [-1, 1, 1, -1, 0, 1, 0, -1], 
      dk: [10, 10, 10, 10, 1, 1, 1, 1] 
    }, // 馬＝角＋王の縦横一歩
    '竜': { 
      dx: [-1, 0, 1, 0, -1, -1, 1, 1], 
      dy: [0, 1, 0, -1, -1, 1, 1, -1], 
      dk: [10, 10, 10, 10, 1, 1, 1, 1] 
    }  // 竜＝飛＋王の斜め一歩
  };
  // SFEN文字 → 駒名マッピング
  pieceNameMap = {
    p: '歩', l: '香', n: '桂', s: '銀', g: '金',
    k: '王', b: '角', r: '飛',
    '+p': 'と', '+l': '成香', '+n': '成桂', '+s': '成銀',
    '+b': '馬', '+r': '竜'
  };
  /**
   * SFEN文字列を解析し、ボード情報オブジェクトを返す
   * @param {string} sfen - 例: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL w - 1'
   *
  */
  parseSFEN(sfen) {
    const [boardPart, activeSide, standInfo] = sfen.split(' ');
    const ranks = boardPart.split('/');
    const board = ranks.map((rank, i) => {
      const row = [];
      for (let j = 0; j < rank.length; j++) {
        //console.log("rank:"+rank)
        let ch = rank[j];
        if (ch === "+") {// 成駒（+駒）の場合
            j++; // 次の文字を読み込む
            ch = "+" + rank[j]; // 例: "+p"
        }
        //console.log("ch:"+ch)
        if (/\d/.test(ch)) {
          // 空マスを n 個追加
          const count = parseInt(ch, 10);
          for (let k = 0; k < count; k++) row.push({});
        } else {
          // 駒文字。大文字＝先手, 小文字＝後手
          const isUpper = ch === ch.toUpperCase();
          const key = ch.toLowerCase();
          //console.log("key:"+key)
          const owner = isUpper ? '先手' : '後手';
          const name  = this.pieceNameMap[key];
          //console.log("name:"+name)
          const { dx, dy, dk } = this.movePatterns[name];
          row.push({ owner, name, dx, dy, dk });
        }
      }
      return row;
    });

    // 持駒情報（この例では '-' のためすべて 0）
    const emptyStandNum = { 歩: 0, 香: 0, 桂: 0, 銀: 0, 金: 0, 角: 0, 飛: 0 };
    const pieceStandNum = { 先手: { ...emptyStandNum }, 後手: { ...emptyStandNum } };
    const emptyStand = Array(9).fill({}); 
    const pieceStand = { 先手: emptyStand.slice(), 後手: emptyStand.slice() };

    // セレクション初期状態
    const boardSelectInfo = Array(9).fill(null)
      .map(() => Array(9).fill(''));
    const pieceStandSelectInfo = {
      先手: Array(9).fill('持駒'),
      後手: Array(9).fill('持駒')
    };

    /*return {
      board,
      pieceStandNum,
      pieceStand,
      nowTurn: activeSide === 'b' ? '先手' : '後手',
      selection: {
        boardSelectInfo,
        isNow: false,
        state: false,
        before_i: null,
        before_j: null,
        pieceStandSelectInfo,
        pieceStandPiece: {}
      }
    };*/
    return {
      "BoardInfo":{
        board,
        pieceStandNum,
        pieceStand,
        nowTurn: activeSide === 'b' ? '先手' : '後手',
        selection: {
          boardSelectInfo,
          isNow: false,
          state: false,
          before_i: null,
          before_j: null,
          pieceStandSelectInfo,
          pieceStandPiece: {}
        }
      }
    };
  }

  //見やすいボード情報を作る
  CreateEasyBoard(board){
      const newBoard = board.map(row =>
          row.map(cell =>
              cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」"
          )
      );
      // []ごとに改行して表示
      const EasyBoard = newBoard.map(row => row.join(", ")).join("\n");
      return EasyBoard
  }

  render() {
    const { logoPath,gamebackPath,gameBgmPath,loadingimgPath, boardInfo, gameInfo, gameRoomData, moveHistory, boardSfenHistory, moveHistorySelectedIndex, nowTurn, isConnected, isLoading, loadingMessage, chatMessages, currentChatMessage, isChatOpen, yourRole, enemyRole, isCheck, isCheckmate,winner, winReason,rematch_sended,rematchRequest,decline_received,gameStatus, timeUpPlayer,debugMode ,aiMode ,audienceUser, railsEnv} = this.state;
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

    //背景・tailwindのclass名を変数化して再利用
    const myDarkGradient = "bg-gradient-to-br from-black via-gray-800 to-gray-900";

    //見やすいボードのデータを作る
    const EasyBoardData = this.state.boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
    
    if (isLoading) { //isLoading が true の間はローディング表示
      return (
        <LoadingOverlay loadingimgPath={loadingimgPath} loadingMessage={loadingMessage} />
      );
    }
    //console.log("railsEnv:"+railsEnv)
    //console.log("boardSfenHistory:"+boardSfenHistory)
    
    //let moveHistorySelectedIndex=1

    return (
      <div className=" h-full">
        <Header logoPath={logoPath}  className="w-full"/>
        <div className={`main-container h-[calc(100%-30px)] bg-no-repeat bg-cover bg-center bg-[url('${gamebackPath}')]`}>
          <div className="menu-container column">
            <div className={`menu-div ${myDarkGradient} text-white`}>
              {isCheckmate && ( //勝敗に決着が着いたら
                  <div className="rounded-lg shadow-lg p-6 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-[1.2rem] font-bold text-white mb-2">
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
                    {!rematch_sended && !aiMode &&  ( //再選リクエストを送信していないなら
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
                  initialMinutes={1000}
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
                <div className={`${myDarkGradient} rounded-lg shadow-lg p-2`}>
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
            style={ ( yourRole === "後手" || yourRole === "gote") //&& !aiMode//後手でaiモードがtrueなら回転させる・align-items:flex-startで垂直方向を上端揃え
                    ? { alignItems: "flex-start" }
                    : undefined
                  }
          >


            {/* 成り確認モーダル - 特定のマスに表示 */}
            {this.state.showPromoteModal && (
                <PromoteModal
                    position={this.state.promoteModalPosition}
                    piece={this.state.currentPiece}
                    yourRole={this.state.yourRole}
                    onChoice={this.handlePromoteChoice}
                />
            )}

            <div className="game-board"
                style={ (yourRole === "後手" || yourRole === "gote" ) //&& !aiMode //後手でaiモードがtrueなら回転させる・align-items:flex-startで垂直方向を上端揃え
                    ? { transform: "rotate(180deg)"}
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
                onClick={(i, j) => this.handleBoardClick(i, j, yourRole)}
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

          <div className={`chat-and-setting-container column`}>
            <div className={`setting-container column ${myDarkGradient}`}>
                {/* 差し手履歴*/ }
                <div className="h-[90%] overflow-y-auto p-2.5 overflow-y-auto text-white">
                  {/*moveHistory.map((move, index) => (*/}
                  {/*moveHistory.forEach((move, index) =>  ( */}
                  {(moveHistory || []).map((move, index) => (
                    //console.log(`${idx} 手目: ${move}`
                    <p 
                      key={index}
                      className={`cursor-pointer p-1 rounded 
                        ${moveHistorySelectedIndex === index ? "bg-blue-600" : "hover:bg-gray-700"}`}
                      /*onClick={() => this.backHistory(boardSfenHistory[index])}*/
                      onClick={() => {
                        this.backHistory(boardSfenHistory[index],index);
                      }}
                    >
                      {index + 1}: {move}
                    </p>
                  ))}
                </div>
                <div className="flex justify-between mb-2">
                  <button
                    className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    onClick={() => { this.backHistory(boardSfenHistory[moveHistorySelectedIndex-1],moveHistorySelectedIndex-1); }}
                  >
                    ←
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    onClick={() => { this.backHistory(boardSfenHistory[moveHistorySelectedIndex+1],moveHistorySelectedIndex+1); }}
                  >
                    →
                  </button>
                </div>
            </div>
              { !aiMode &&( 
                <div className={`chat-container ${myDarkGradient} ${isChatOpen ? '' : 'closed'}`} > {/* isChatOpen の状態に応じてクラスを適用 */}
                  {/* 開閉ボタン */}
                  <button
                    className={`chat-toggle-button bg-[#18181b] hover:bg-[#27272a] ${isChatOpen ? '' : 'pointer-events-auto'}`}
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
                      //console.log("messages:",messages)
                      //console.log("typeof chatMessages:",typeof chatMessages)
                      /*if (typeof chatMessages === 'string') {
                        messages = chatMessages.split(',').map(msg => msg.trim());// カンマ区切りで文字列を分割
                        return Array.isArray(messages) ? (
                          messages.map((message, index) => (
                            <div key={index} className="chat-message p-2 mb-2 rounded">
                              <strong>{JSON.parse(message).username}</strong>: {JSON.parse(message).chat_text}
                            </div>
                          ))
                        ) : (
                          <p className="text-red-500">メッセージがありません</p>
                        );
                      }else if (typeof messages === "object" && messages !== null) {
                          console.log("messagesgg:"+messages)
                          // 単一オブジェクトの場合
                          return (
                            <div className="chat-message p-2 mb-2 rounded bg-gray-100">
                              <strong>{messages.username}</strong>: {messages.chat_text}
                            </div>
                          );
                      }*/
                      let parsedMessages = [];
                      if (typeof messages === "string") {
                        try {
                          parsedMessages = JSON.parse(messages); // 文字列ならパース
                        } catch (e) {
                          console.error("JSONパース失敗:", e);
                          return null;
                        }
                      } else if (Array.isArray(messages)) {
                        parsedMessages = messages; // すでに配列ならそのまま
                      } else {
                        parsedMessages = [messages]; // 単一オブジェクトなら配列に変換
                      }
                      //console.log("parsedMessages:",parsedMessages)

                      return (
                        <>
                          {parsedMessages.map((msg, index) => {
                              // msgが文字列ならパース、オブジェクトならそのまま使う
                              const data = typeof msg === "string" ? JSON.parse(msg) : msg;
                            return (
                            <div key={index} className="chat-message p-2 mb-2 rounded text-white">
                              <strong>{data.username}</strong>: {data.chat_text}
                            </div>
                            );
                        })}
                        </>
                      );

                    })()}
                  </div>
                  <form id="chat-form" className="chat-form" onSubmit={this.handleChatSubmit}>
                    <input
                      type="text"
                      id="chat-input"
                      autoComplete="off"
                      placeholder="メッセージを送信"
                      className="chat-input text-white"
                      value={currentChatMessage}
                      onChange={this.handleChatInputChange}
                    />
                    {/*<button type="submit" className="chat-button">Send</button>*/}
                  </form>
                </div>
              )}
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


        {debugMode  && railsEnv=="development" && (
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

                <button
                  onClick={() => this.aiTest()}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  AI
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

        <audio 
          src={gameBgmPath}
          id="game_bgm" 
          controls 
          loop
          className="fixed bottom-4 left-25 hidden"
        />

        <div
          className="fixed left-4 bottom-4 z-50"
        >
          <button
            onClick={() =>
              document.getElementById("game_bgm")?.classList.toggle("hidden")
            }
            className={`w-full h-full bg-white rounded-full shadow-2xl p-3 flex items-center justify-center transform transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 "
              aria-hidden
            >
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </button>
        </div>

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