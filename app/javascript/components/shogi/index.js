import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';
/*import imgKing from "./img/玉.png";
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
import imgPromotedPawn from "./img/と.png";*/
import imgKing from "./img/black_king.png";
import imgGyoku from "./img/black_king2.png"; // 玉の駒としてblack_king2.pngを使用
import imgRook from "./img/black_rook.png";
import imgBishop from "./img/black_bishop.png";
import imgGoldGeneral from "./img/black_gold.png";
import imgSilverGeneral from "./img/black_silver.png";
import imgKnight from "./img/black_knight.png";
import imgLance from "./img/black_lance.png";
import imgPawn from "./img/black_pawn.png";
import imgPromotedRook from "./img/black_dragon.png"; // 竜に対応
import imgPromotedBishop from "./img/black_horse.png"; // 馬に対応
import imgPromotedSilverGeneral from "./img/black_prom_silver.png";
import imgPromotedKnight from "./img/black_prom_knight.png";
import imgPromotedLance from "./img/black_prom_lance.png";
import imgPromotedPawn from "./img/black_prom_pawn.png";
import { BoardInfo, Selection } from './BoardInfo';

import ShogiTimer from './ShogiTimer/ShogiTimer';

import Header from '../Header';


import consumer from '../../channels/consumer'; // Action Cableのconsumerをインポート

const imgByName = {
  "王": imgKing,
  "玉": imgGyoku,
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

class Room extends React.Component {
  constructor(props) {
    super(props);

    const element = document.querySelector('#game-container');
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    const roomId = element.dataset.roomId;// #data-game-id属性からゲームIDを取得
    const yourRole = element.dataset.yourRole;
    const enemyRole = element.dataset.enemyRole;
    const logoPath = element.dataset.logoPath;
    
    
    //console.log(`gameId:${gameId}・roomId:${roomId}`)

    //const new_boardInfo= new BoardInfo();
    //console.log(`new BoardInfo()：${new BoardInfo()}`)
    //console.log(`typeof new BoardInfo()：${typeof new BoardInfo()}`)

    this.state = {
      logoPath: logoPath,
      boardInfo: new BoardInfo(), // 初期状態では引数なしでBoardInfoコンストラクタを呼び出し、デフォルトの初期盤面を生成
      //boardInfo: new_boardInfo, // 盤面状態を保持
      gameInfo: {},
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


    // ShogiTimer コンポーネントのインスタンスを直接保持するプロパティ
    // React.createRef() は不要になります。
    this.shogiTimerInstance = null; 
    this.timerStarted = false;
    this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成
    console.log(`this.shogiTimerRef: ${JSON.stringify(this.shogiTimerRef)}`);

    
  }

  // コンポーネントがマウントされた後に一度だけ実行される
  componentDidMount() {
    this.initializeRoom();
  }

  //prevProps と prevState を引数として明示的に受け取る
  componentDidUpdate(prevProps, prevState) {

    //console.log(`prevProps: ${JSON.stringify(prevProps)}`);
    //console.log(`prevState: ${JSON.stringify(prevState)}`);
    // shogiTimerRef.current が null から非nullになった、
    // かつ bufferedInitialTimerState が存在する場合に適用を試みる
    //if (this.shogiTimerRef.current && this.state.bufferedInitialTimerState && !prevState.bufferedInitialTimerState) {
    if (this.shogiTimerRef.current && this.state.bufferedInitialTimerState) {
        this.applyBufferedInitialTimerState();
    }
    // bufferedInitialTimerState が null から非nullになった場合（データがバッファされた）
    else if (!prevState.bufferedInitialTimerState && this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        this.applyBufferedInitialTimerState();
    }
    if (!this.timerStarted && this.shogiTimerRef.current) {
      this.timerStarted = true;
      console.log(`this.timerStarted: ${this.timerStarted}`);
      //this.handleStartTimer();
      //this.handleToggleTimer();
      //this.handleSwitchTurn();
    }
  }

  /*componentDidUpdate() {
    // shogiTimerRef.currentがnullから非nullになったときに、バッファされた初期状態を適用
    if (!prevState.bufferedInitialTimerState && this.state.bufferedInitialTimerState) {
        this.applyBufferedInitialTimerState();
    }
        // また、shogiTimerRef.current が null から非 null になったタイミングでも適用を試みる
    if (this.shogiTimerRef.current && !prevState.bufferedInitialTimerState && this.state.bufferedInitialTimerState === null) {
        // このケースは本来起こりにくいが、念のため
        this.applyBufferedInitialTimerState();
    }
  }*/

    /*if (this.state.gameId !== prevState.gameId) {
      console.log(`Game ID changed from ${prevState.gameId} to ${this.state.gameId}. Re-subscribing Action Cable.`);
      this.teardownActionCable();
      this.setupActionCable();
    }*/

    /*this.handleSwitchTurn({ // ⭐ ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
          senteTime: this.shogiTimerRef.current?.getSenteTime(), // 現在の時間を取得して送る
          goteTime: this.shogiTimerRef.current?.getGoteTime(),   // getSenteTime/getGoteTime はShogiTimerで公開する必要がある
          activePlayer: this.state.nowTurn, // 次の手番
          isPaused: false, // 駒を動かしたら一時停止を解除
          lastUpdateTime: Date.now()
      });
      */

  // ⭐ 追加: バッファされた初期状態を ShogiTimer に適用するメソッド
  applyBufferedInitialTimerState() {
    if (this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        console.log("ShogiTimerにバッファされた初期タイマーの状態を適用する:", this.state.bufferedInitialTimerState);
        this.shogiTimerRef.current.initializeTimerState(this.state.bufferedInitialTimerState);
        this.setState({ bufferedInitialTimerState: null }); // 適用したらクリア
    }
  }

  // Ref Callback メソッド
  // ShogiTimer コンポーネントがマウントされると、そのインスタンスが 'instance' として渡される
  // アンマウントされる際には 'null' が渡される
  /*setShogiTimerRef = (instance) => {
    console.log(`setShogiTimerRef ${instance}）`);
    if (instance) {
      this.shogiTimerInstance = instance; // ShogiTimer インスタンスを保存
      console.log("ShogiTimer instance available via ref callback:", this.shogiTimerInstance);
      
      // ★ShogiTimerが完全にマウントされ、メソッドが利用可能になったことを確認し、ここで呼び出す
      // componentDidMount で呼び出していた処理をここに移動します。
      this.handleStartTimer(); 
      this.handleSwitchTurn(); 
    } else {
      // コンポーネントがアンマウントされた場合、参照をクリア
      this.shogiTimerInstance = null;
      console.log("ShogiTimer instance removed (unmounting).");
    }
  };
  */

  // コンポーネントがアンマウントされる前に実行される（クリーンアップ）
  componentWillUnmount() {
    if (this.subscription) {
      //console.log(`ShogiGameChannelからroom_idでの購読を解除する: ${this.state.roomId}`);
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
    //console.log(`ShogiGameChannelにroom_idでサブスクライブしようとしています: ${roomId}`);

    this.subscription = consumer.subscriptions.create(
      { channel: "ShogiGameChannel", room_id: roomId },
      {
        connected: () => {
          //console.log(`ShogiGameChannelに接続されています（ルームID: ${roomId}）`);
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
          //console.log(`ShogiGameChannelからroom_idで接続が切断されました。: ${roomId}`);
          this.setState({ isConnected: false });
        },
        received: (data) => {

          if(data.data_type!=="board_update"){
            this.handleActionCableMessage(data);//残り時間
          }
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
            this.setState({ isLoading: false, boardInfo: new BoardInfo()});//ローディングを終了
            //this.setState({ chatMessages: "aaaaa" });
            //console.log("initialize");

            /*this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成
            console.log(`this.shogiTimerRef: ${JSON.stringify(this.shogiTimerRef)}`);
            this.handleStartTimer()
            this.handleSwitchTurn()*/

            return
          }else if(data.data_type=="rematch_initialize"){
            //console.log("rematch_initialize")
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
                // ⭐ ここにタイマーのリセット処理を追加
                // リマッチが初期化されたら、タイマーもリセットする
                //this.handleResetTimer();
                this.handleToggleTimer();
              });
              /*
              this.shogiTimerInstance = null; 
              this.timerStarted = false;
              this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成

              //this.handleStartTimer(); 
              //this.handleToggleTimer();
              this.handleResetTimer();
              */
              /*if (this.shogiTimerRef.current && this.state.bufferedInitialTimerState) {
                  this.applyBufferedInitialTimerState();
              }
              // bufferedInitialTimerState が null から非nullになった場合（データがバッファされた）
              //else if (bufferedInitialTimerState && this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
                  this.applyBufferedInitialTimerState();
              //}
              if (!this.timerStarted && this.shogiTimerRef.current) {
                this.timerStarted = true;
                console.log(`this.timerStarted: ${this.timerStarted}`);
              }*/
          }else if(data.data_type=="already_redis_stored_board_data"){
            //console.log(`wwwwwwwdataあ: ${JSON.stringify(data.redis_stored_board_data)}`);
            //console.log(`wwwwwwwdataあ: ${JSON.stringify(data)}`);

            /*this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成
            console.log(`this.shogiTimerRef: ${JSON.stringify(this.shogiTimerRef)}`);
            this.handleStartTimer()
            this.handleSwitchTurn()*/

            data=JSON.parse(data.redis_stored_board_data);
            //console.log(`dataあ: ${JSON.stringify(data)}`);
            //console.log(`datagggg: ${JSON.stringify(data.BoardInfo)}`);
            
            //data_type: "redis_stored_data",
            //redis_stored_data: redis_stored_data

            //data.BoardInfo を受け取った後、それを BoardInfo クラスのインスタンスに「復元」する必要があります・Object.assign()では、オブジェクトのプロパティ（データ）はコピーされますが、メソッドやprototypeチェーンは正しく復元されません。そのため、getPromotedPiece()などのメソッドが利用できなくなります。
            //let NewBoardInfo=Object.assign(new BoardInfo(), data.BoardInfo);
            
            //ここが最も重要：受信したデータをデシリアライズしてクラスインスタンスを再構築
            //let NewBoardInfo = this.deserializeBoard(data.BoardInfo);

            //console.dir(`NewBoardInfo: ${ NewBoardInfo}`);
            //console.dir(`NewBoardInfo: ${ JSON.stringify(NewBoardInfo)}`);
            
            //this.setState({ boardInfo: NewBoardInfo });
            //this.setState({ currentPlayer: data.currentPlayer });

            //moveHistory取得
            //const innerData =  JSON.parse(data.redis_stored_board_data);// 外側の JSON をパース
            let moveHistory_redis = data.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            /*console.log(`moveHistory_redis: ${moveHistory_redis}`);
            console.log(typeof moveHistory_redis);
            console.log(Array.isArray(moveHistory_redis)); // trueなら配列
            console.log(moveHistory_redis); // 出力: ["後手8五と", "先手2五と"]
            moveHistory_redis.forEach((move, index) => {
                console.log(`履歴 ${index + 1}: ${move}`);
            });
            */
            
            //const boardDataFromServer = data.BoardInfo; // サーバーから来たプレーンなデータ
            //const boardDataFromServer = data.BoardInfo.board; // サーバーから来たプレーンなデータ
            const boardDataFromServer = data;
            //console.log(`Received ${data.data_type} for reconstruction:`, boardDataFromServer);
            //console.log(`boardDataFromServer: ${JSON.stringify(boardDataFromServer)}`);

            if (boardDataFromServer) {
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);

              //console.log(`newBoardInfoInstance: ${JSON.stringify(newBoardInfoInstance)}`);
              this.setState({
                boardInfo: newBoardInfoInstance,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                moveHistory: moveHistory_redis,
                //moveHistory: [],
                isLoading: false,
                loadingMessage: "",
                //hasReceivedInitialData: true,
              }, () => {
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }
            

            //this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
          }else if(data.data_type=="board_update"){

            //console.log(`data： ${JSON.stringify(data)}`);
            //const boardDataFromServer = data.BoardInfo; // サーバーから来たプレーンなデータ
            const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
            //console.log(`Received ${data.data_type} for reconstruction:`, boardDataFromServer);
            //console.log(`data_type： ${JSON.stringify(data.data_type)}`);
            //console.log(`data.new_board_data： ${JSON.stringify(data.new_board_data)}`);
            
            //moveHistory取得
            let moveHistory_redis = boardDataFromServer.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            //let moveHistory_redis = data.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            //console.log(`moveHistory_redis: ${moveHistory_redis}`);
            //console.log(`moveHistory_redis: ${moveHistory_redis}`);
            //console.log(typeof moveHistory_redis);
            //console.log(Array.isArray(moveHistory_redis)); // trueなら配列
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            //console.log(moveHistory_redis); // 出力: ["後手8五と", "先手2五と"]
            //moveHistory_redis.forEach((move, index) => {
            //    console.log(`n履歴 ${index + 1}: ${move}`);
            //});


            if (boardDataFromServer) {
              //console.log(`wwwwww： ${JSON.stringify(boardDataFromServer)}`);
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              //console.log(`newBoardInfoInstance.moveHistory: ${JSON.stringify(newBoardInfoInstance.moveHistory)}`);

              this.setState({
              //this.setState(prevState => ({
                boardInfo: newBoardInfoInstance,
                //moveHistory: [...prevState.moveHistory, newBoardInfoInstance.moveDetails],
                //moveHistory: [moveHistory_redis],
                moveHistory: moveHistory_redis,
                //moveHistory: [],
                //currentPlayer: newBoardInfoInstance.turn, // BoardInfoのturnをstateに反映
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                // selection, pieceStandNum, pieceStand は newBoardInfoInstance 内に保持される
                isLoading: false,
                loadingMessage: "",
                //hasReceivedInitialData: true,
              }, () => {
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }

            //console.log(`ボード更新後のthis.state.moveHistory: ${this.state.moveHistory}`);

            //data=JSON.parse(data.new_board_data);
            /*data=data.new_board_data;
            let NewBoardInfo=Object.assign(new BoardInfo(), data.BoardInfo);//data.BoardInfo を受け取った後、それを BoardInfo クラスのインスタンスに「復元」する必要があります    
            this.setState({ boardInfo: NewBoardInfo });
            this.setState({ currentPlayer: data.currentPlayer });*/
            //this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了
            
          }else if(data.data_type=="already_redis_stored_chat_data" || data.data_type=="chat_update"){
            if (data.data_type=="already_redis_stored_chat_data"){ 
              this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了 
            }
            //console.log(`data.chat_data:`, data.chat_data);
            //if (data.data_type=="already_redis_stored_chat_data"){ 
            if (Array.isArray(data.chat_data)) {//配列かどうかチェック
              //最初はdata.chat_dataが"aaa"みたいに配列になっていないので配列に変換してchatMessageに入れる
              //this.setState({ chatMessages: [data.chat_data] }, () => {
              this.setState({ chatMessages: data.chat_data }, () => {
                  //console.log("state 更新後:", this.state.chatMessages);
              });
            }else{
              //this.setState({ chatMessages: data.redis_stored_chat_data });
              //this.setState({ chatMessages: data.chat_data });//非同期だから即時反映されない
              this.setState({ chatMessages: data.chat_data }, () => {
                //console.log("state 更新後:", this.state.chatMessages);
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
          } else if (data.data_type === 'game_set'){
              console.log("ゲームセット")
              this.setState({
                isCheckmate: true ,// 詰み状態
                winner: data.winner,
                winReason: data.winReason,
                //gameStatus: 'time_up',
                //timeUpPlayer: player,
              });
          }else if (data.data_type === 'rematch_request') {
            //console.log("requesterRole:"+data);
            const requesterRole = data.requester_role;
            const message = data.message;

            //console.log("requesterRole:"+requesterRole);
            //console.log("message:"+message);

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
          //console.log("decline_rematch");
          const declinedRole = data.declined_role;
          if (this.state.yourRole !== declinedRole) {
              //console.log("再対戦リクエストが拒否されました。");
              this.setState({ decline_received: true ,rematch_sended: false});
            } else {
              // 先手のプレイヤーの場合：自分がリクエストしたことの確認メッセージを表示（任意）
              console.log("あなたが再対戦をリクエストしました。相手の返答をお待ちください。");
              // または、リクエスト中であることを示すUI（例: ボタンを無効にする）
            }
        }
        },

        // クライアントからサーバーにメッセージを送るメソッド
        //sendMove: (move) => {
        //board_update: (move) => {
        board_update: (boardData,moveDetails) => {
          //console.log("board_updateメソッド");
          //console.log(`this.state.currentPlayer:${this.state.currentPlayer}`);
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
         //console.log(`登録前のthis.state.moveHistory:${this.state.moveHistory}`);

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
        //sendChatMessage: function(message) { 
        sendChatMessage: (chat_data)=> {//
          //console.log(`sendChatMessageメソッド・chat_data:${chat_data}`);
          this.subscription.perform('chat_broadcast_and_store', { 
            chat_data: chat_data,
            room_id: this.state.roomId,
            game_id: this.state.gameId 
          });
        //再対戦
        },rematch_send: (yourRole)=> {
          //console.log("rematch_send・yourRole"+this.state.yourRole)
          /*this.subscription.perform('rematch_setup', { 
            //yourRole: yourRole
            //room_id: this.state.roomId,
            //game_id: this.state.gameId 
          });
          */
          this.subscription.perform('rematch_setup', {
          //this.performAction('rematch_setup', {
              yourRole: yourRole, // キーが'yourRole'
              room_id: this.state.roomId,   // キーが'room_id'
              game_id: this.state.gameId    // キーが'game_id'
          });
        //再戦を承諾
        },
        // サーバーにアクションを送信するヘルパーメソッドを定義 (ShogiTimerから呼び出される)
        // これらはShogiTimerから参照されるため、bindする必要がある
        /*updateTimer: (timerState) => {
          console.log("updateTimer")
          this.subscription.perform('update_timer', timerState);
        },
        switchTurn: (turnState) => {
          console.log("switchTurn")
          this.subscription.perform('switch_turn', turnState);
        },
        toggleTimer: (toggleState) => {
          console.log("toggleTimer")
          this.subscription.perform('toggle_timer', toggleState);
        },
        resetTimer: (resetState) => {
          console.log("resetTimer")
          this.gameChannel.perform('reset_timer', resetState);
        }*/
        // サーバーにアクションを送信するヘルパーメソッドを定義
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
        // updateTimer はイベント駆動型同期では通常不要 (ただしデバッグ用などに残すことも可能)
        // sendUpdateTimer: (timerState) => {
        //   this.gameChannel.perform('update_timer', timerState);
        // },
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

  /*boardClick(i, j) {
    console.log(`boardClickメソッド・i,j：${i},${j}`);
    this.state.boardInfo.boardClick(i, j);//BoardInfoクラスのboardClick(i, j)を呼び出すだけで、選択／移動のロジックはBoardInfo側に一任
  }*/

  //ユーザーが盤面上のi行、j列をクリックしたときに呼ばれるメソッド
  handleBoardClick(i, j) {
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように

    //const { boardInfo, isConnected } = this.state;
    //const clickResult = boardInfo.boardClick(i, j);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている
    const { boardInfo, isConnected, yourRole } = this.state;
    const clickResult = boardInfo.boardClick(i, j,yourRole);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている
    //console.log(`clickResult：${JSON.stringify(clickResult)}`);
    //if(!clickResult){
    if(clickResult!==undefined && clickResult.moved_check){//自分の手番じゃなかったり、クリックされたマスが移動先として不適切だったり、クリックされた駒が自分の手番の駒でなければ
      //console.log(`clickResultがundefinedじゃない・clickResult:${JSON.stringify(clickResult)}`);

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
      //console.log(`clickResultのnowTurn：${JSON.stringify(clickResult.nowTurn)}`);
      //console.log(`moveDetails${JSON.stringify(clickResult.moveDetails)}`);
      //console.log(`clickResultから作ったgame_data：${JSON.stringify(game_data)}`);
      //console.log(`ああああclickResult.pieceStandNum: ${JSON.stringify(clickResult.pieceStandNum)}`);
      //console.log(`ううううああああclickResult.pieceStand：${JSON.stringify(clickResult.pieceStand)}`);

      // clickResult.newBoardState には、boardClick 後の BoardInfo 内部の最新状態が返される
      // これを基に、新しい BoardInfo インスタンスを生成して React の state を更新する
      
      //const newBoardInfoInstance = new BoardInfo(clickResult.newBoardState);
      //const newBoardInfoInstance = new BoardInfo(clickResult.BoardInfo);
      const newBoardInfoInstance = new BoardInfo(game_data);
      //const newBoardInfoInstance = new BoardInfo(clickResult.board);
      
      //console.log(`newBoardInfoInstance：${JSON.stringify(newBoardInfoInstance)}`);
      //console.log(`clickResult.moved${clickResult.moved}`);

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
      /*this.setState(prevState => ({//引数prevStateは更新前の this.state
      //this.setState({
        boardInfo: newBoardInfoInstance, // 新しいインスタンスでstateを更新
        //currentPlayer: newBoardInfoInstance.turn, // BoardInfoインスタンスから手番を取得して更新
        //moveHistory: this.state.moveHistory+"+"+clickResult.moveDetails,
        //...[配列] で各要素を展開・ || [] で未定義なら空配列を代替・clickResult.moveDetailsを末尾に追加
        moveHistory: [...prevState.moveHistory || [], clickResult.moveDetails],
        nowTurn: clickResult.nowTurn, // BoardInfoインスタンスから手番を取得して更新
        */
      //}), () => {
      }, () => {

        //勝敗がついてたらデータ消す
        if(clickResult.isCheckmate){
          console.log("勝敗がついているからデータ消す")
          //this.deleteData();
          this.subscription.perform('game_set', {
            room_id: this.state.roomId,
            winReason: "Tumi", 
            winner: clickResult.winner,
          });
        }

        //console.log("moveHistory:"+this.state.moveHistory[0])
        // stateの更新が完了した後、WebSocketでサーバーに送信
        if (isConnected && this.subscription && clickResult.moved_check) { // 駒が動いた場合のみ送信
          //console.log(`こまがうごいた`);

          //this.handleStartTimer()
          //this.handleSwitchTurn()
          this.handleSwitchTurn({ // ⭐ ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
          //this.sendSwitchTurn({ // ⭐ ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
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
      //};

    //}else if(clickResult){
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

  /*
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
*/

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
    console.log("再対戦を承諾しました。");
    this.setState({ rematchRequest: false, isCheckmate: false, winner: "yet" }); //再戦リクエストモーダルを非表示、勝敗をついていないことにし、勝者もyetに
    // サーバーに承諾したことを通知するAction Cableメッセージを送る
    // gameChannel.perform('accept_rematch', { game_id: game_id });
    //this.subscription.accept_rematch(this.state.yourRole);
    //,accept_rematch: ()=> {
    this.subscription.perform('rematch_accept', {
      room_id: this.state.roomId // キーが'room_id'
    });
          
     //   }
  }
  declineRematch() {
    console.log("再対戦を拒否しました。");
    //this.setState({ rematchRequest: false, isCheckmate: false, winner: "yet" });
    //window.location.href = '/';
    // サーバーに拒否したことを通知するAction Cableメッセージを送る
    // gameChannel.perform('decline_rematch', { game_id: game_id });
    this.setState({ rematchRequest: false});//再戦リクエストモーダルを非表示
    this.subscription.perform('decline_rematch', {
        yourRole: this.state.yourRole, // キーが'yourRole'
        room_id: this.state.roomId,   // キーが'room_id'
    });
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
  // 時間切れ時に実行されるコールバック関数
/*  handleTimeUp(player) {
    console.log(`${player} の時間切れです！ゲームを終了します。`);
    // ここにゲーム終了ロジック（例: 勝敗の決定、ゲーム状態の更新など）を記述
    this.setState({
      gameStatus: 'time_up',
      timeUpPlayer: player,
    });
    // 必要に応じて、他のゲームコンポーネントに通知するロジックを追加
  }*/
   handleActionCableMessage(data) {
    //console.log("handleActionCableMessage(data):", data); // JSON.stringify(data) はオブジェクトを見にくくするので直接 data をログに出す
    //console.log("this.shogiTimerRef.current before call:", this.shogiTimerRef.current); // ⭐ 追加

    switch (data.type) {
      case 'initial_timer_state':
        console.log("switch case initial_timer_state"); // ⭐ 追加

        // ShogiTimerに初期状態を渡す (ShogiTimerが自身で状態を更新するように)
        /*if (this.shogiTimerRef.current) {
          this.shogiTimerRef.current.initializeTimerState(data.data);
        }*/
        // ⭐ ShogiTimerRefがまだ利用できない場合、状態をバッファする
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
    console.log(`${player} の時間切れです！ゲームを終了します。`);
    const winner = player === 'sente' ? '後手' : '先手';//値がsenteならgoteにして、goteならsenteに
    this.subscription.perform('game_set', {
      room_id: this.state.roomId,
      winReason: "TimeUp", // キーが'yourRole'
      winner: winner,
    });
  }

  // ShogiTimer の startTimer メソッドを呼び出す
  handleStartTimer = () => {
    console.log("handleStartTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.start(); // ShogiTimer で公開した 'start' メソッドを呼び出す
    }
       // this.shogiTimerInstance が null でないことを確認
  };

  // ShogiTimer の pauseTimer メソッドを呼び出す
  handlePauseTimer = () => {
    console.log("handlePauseTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
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
    /*if (!this.shogiTimerRef.current) return;

    // ⭐ ShogiTimer コンポーネントの ref 経由で現在の状態を取得する
    // Room の state に shogiTimerIsPaused などがあるが、
    // handleToggleTimer の直前の ShogiTimer の状態を取得するため、ref 経由で取得するのが確実
    const isPaused = this.shogiTimerRef.current.pause();
    //const activePlayer = this.shogiTimerRef.current.player();
    const senteTime = this.shogiTimerRef.current.getSenteTime();
    const goteTime = this.shogiTimerRef.current.getGoteTime();

    //console.log(`handleToggleTimer: Current State - isPaused: ${isPaused}, activePlayer: ${activePlayer}, senteTime: ${senteTime}, goteTime: ${goteTime}`);

    const newIsPaused = !isPaused;
    //let playerToActivate = activePlayer;
    //if (newIsPaused === false && activePlayer === null) {
    if (newIsPaused === false ) {
        playerToActivate = 'sente'; // ゲーム開始時は先手から
    }

    //console.log(`handleToggleTimer: Sending - newIsPaused: ${newIsPaused}, playerToActivate: ${playerToActivate}`);

    this.sendToggleTimer({
        senteTime: senteTime,
        goteTime: goteTime,
        //activePlayer: playerToActivate,
        activePlayer: "sente",
        isPaused: newIsPaused,
        lastUpdateTime: Date.now()
    });
    */
  };

  // ShogiTimer の switchTurn メソッドを呼び出す
  handleSwitchTurn = () => {
    console.log("handleSwitchTurn呼び出された"+JSON.stringify(this.shogiTimerRef.current))
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
    console.log("gameFinishTest呼び出された")
    this.setState({ isCheckmate: true, winner:"あなた" });
  };

  debugModeOn = () => {
    console.log("デバッグモードオン")
    if(this.state.debugMode){
      this.setState({ debugMode: false });
    }else if(!this.state.debugMode){
      this.setState({ debugMode: true });
    }
  };

  

  render() {
    const { logoPath, boardInfo, gameInfo, moveHistory, nowTurn, isConnected, isLoading, loadingMessage, chatMessages, currentChatMessage, isChatOpen, yourRole, enemyRole, isCheck, isCheckmate,winner, winReason,rematch_sended,rematchRequest,decline_received,gameStatus, timeUpPlayer,debugMode} = this.state;
    const roomId = this.state.roomId; // renderメソッド内でstateからroomIdを取得

    // Action Cable の送信メソッド群を ShogiTimer に渡すオブジェクトを作成
    // gameChannel がまだ null の可能性があるので ?. (オプショナルチェイニング) を使用
    const sendActions = {
      sendToggleTimer: (...args) => this.subscription?.sendToggleTimer(...args),
      sendSwitchTurn: (...args) => this.subscription?.sendSwitchTurn(...args),
      sendResetTimer: (...args) => this.subscription?.sendResetTimer(...args),
      // sendUpdateTimer: (...args) => this.gameChannel?.sendUpdateTimer(...args), // 必要なら
    };

    //senteだったら"先手"に、goteだったら"後手"に
    //yourRole = yourRole === "sente" ? "先手" : yourRole === "gote" ? "後手" : yourRole;
    //enemyRole = enemyRole === "sente" ? "先手" : enemyRole === "gote" ? "後手" : enemyRole;
    //let board_data=this.state.boardInfo.board
    /*if (yourRole === "sente") this.setState({yourRole:"先手"});
    //if (yourRole === "gote") this.setState({yourRole:"後手"}); board_data=this.state.boardInfo.board.reverse();console.log("ah:"+board_data)
    if (yourRole === "gote") this.setState({yourRole:"後手"});
    if (enemyRole === "sente") this.setState({enemyRole: "先手"});
    if (enemyRole === "gote") this.setState({enemyRole: "後手"});
    */

    setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
      if (document.getElementById('chat-messages') && document.getElementById('chat-messages').scrollHeight !== undefined){
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    }, 100);

    //console.log("boardInfo:"+JSON.stringify(boardInfo))
    //console.log("nowTurn:"+this.state.nowTurn)
    //console.log("chatMessages:"+chatMessages)
    //console.log("currentChatMessage:"+currentChatMessage)
    // デバッグ用：データの型を確認
    //console.log('chatMessages:', chatMessages);
    //console.log('Is Array:', Array.isArray(chatMessages));
    //console.log('Type:', typeof chatMessages);
    
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

        <Header logoPath={logoPath} />

        <div className="main-container ">
          <div className="menu-container column">
            <div className="menu-div">

              {isCheckmate && ( //勝敗に決着が着いたら
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-[1.2rem] font-bold text-gray-800 mb-2">
                        {winner === yourRole ? "あなたの勝ち！" : "あなたの負け"}
                      </h2>
                      {winReason==="TimeUp" && (
                        <>時間切れ</>
                      )}
                      {winReason==="Tumi" && (
                        <>詰み</>
                      )}
                      <div className="w-16 h-1 bg-blue-500 mx-auto rounded"></div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <div className="text-4xl">🎉</div>
                    </div>
                    {!rematch_sended && ( //再選リクエストを送信していないなら
                      <div className="space-y-3">
                          <button
                            onClick={() => this.rematch()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                          >
                            再対戦する
                          </button>
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

                 {/*  {yourRole === winner ? (
                    <p>あなたが勝者です</p>
                  ) : (
                    <p>勝者は{winner}です</p>
                  )}

                  { !rematchRequest && (
                    <button onClick={() => this.rematch()}>再対戦する</button>
                  )}
                  <a href="/">
                    <button>ロビーに戻る</button>
                  </a>
                 */}
                </div>
              )}

            {!isCheckmate && ( //ゲームセットしていないなら
              <div>
                {/*
                <ShogiTimer initialMinutes={10} onTimeUp={this.handleTimeUp} ref={this.shogiTimerRef} yourRole={yourRole} />

                <ShogiTimer
                  initialMinutes={10}
                  onTimeUp={this.handleTimeUp}
                  ref={this.shogiTimerRef}
                  yourRole={yourRole}
                  roomId={roomId} // ⭐ gameId を ShogiTimer に渡す
                  // Action Cable の送信メソッドを props として ShogiTimer に渡す
                  // これにより ShogiTimer は直接Action Cableを使わず、親経由で通信
                  sendActionCableMessage={{
                    updateTimer: this.subscription ? this.subscription.updateTimer : () => {},
                    switchTurn: this.subscription ? this.subscription.switchTurn : () => {},
                    toggleTimer: this.subscription ? this.subscription.toggleTimer : () => {},
                    resetTimer: this.subscription ? this.subscription.resetTimer : () => {},
                  }}
                />*/}
                <ShogiTimer
                  initialMinutes={1}
                  onTimeUp={this.handleTimeUp}
                  ref={this.shogiTimerRef}
                  yourRole={yourRole}
                  roomId={roomId} // gameId を ShogiTimer に渡す
                  sendActionCableMessage={sendActions} // Action Cable の送信メソッド群を props として渡す
                  debugMode={debugMode}
                />
                {/* <ShogiTimer initialMinutes={10} onTimeUp={this.handleTimeUp} ref={this.setShogiTimerRef} yourRole={yourRole} />

                <div style={{ marginTop: '20px', border: '1px solid #2196F3', padding: '15px', borderRadius: '8px', backgroundColor: '#e3f2fd' }}>
                  <h3>App 内部からの直接呼び出し例</h3>
                  <button onClick={this.startTimerAutomatically} style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#2196F3', color: 'white' }}>
                    App.startTimerAutomatically() を実行
                  </button>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    このボタンは、`App` クラス内の `startTimerAutomatically` メソッドを呼び出します。<br/>
                    そのメソッド内で `this.handleStartTimer()` が実行されます。
                  </p>
                  <button onClick={() => this.setState(prevState => ({ yourRole: prevState.yourRole === '先手' ? '後手' : '先手' }))}
                          style={{ margin: '5px', padding: '10px 15px', backgroundColor: '#673AB7', color: 'white' }}>
                    役割を切り替える ({yourRole})
                  </button>
                </div>
                <div>
                  <h2>10:00</h2>
                </div>
                <div>
                  <h2>10:00</h2>
                </div>
                */}

                <div style={ nowTurn !== yourRole
                    ? { display: "none" }
                    : undefined
                  }>
                </div>
                <div className="bg-white rounded-lg shadow-lg p-2">
                  <div className="relative">
                    {nowTurn === yourRole ? (
                      <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 animate-pulse"></div>
                        <div className="relative z-10 text-center">
                          <div className="inline-block animate-bounce text-4xl mb-2">⚡</div>
                          <div className="text-1xl font-bold mb-1">あなたの手番です</div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full animate-ping"></div>
                      </div>
                    ) : (
                      <div className="text-center py-6 px-6 bg-gray-100 border border-gray-300 rounded-xl">
                        <div className="text-xl text-gray-600 mb-1">相手の手番</div>
                        <div className="text-sm text-gray-500">お待ちください...</div>
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
              {/*<PieceStand
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
              <Board
                board={board_data}
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
              */}
              {/*onClick={(i, j) => this.boardClick(i, j)} 
              <PieceStand
                pieceStand={this.state.boardInfo.pieceStand[enemyRole]}
                pieceStandNum={this.state.boardInfo.pieceStandNum[enemyRole]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo[enemyRole]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand[enemyRole][i])}
              />
              <br />
              <Board
                board={this.state.boardInfo.board}
                boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
                onClick={(i, j) => this.handleBoardClick(i, j)}

              />
              <br />
              <PieceStand
                pieceStand={this.state.boardInfo.pieceStand[yourRole]}
                pieceStandNum={this.state.boardInfo.pieceStandNum[yourRole]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo[yourRole]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand[yourRole][i])}
              />
                */}
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

                <button
                  onClick={() => this.debugModeOn()}
                  className="
                    text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg
                    fixed 
                    top-4
                    right-4
                    w-[15%]
                    h-[50px] 
                    bg-yellow-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
                    hover:bg-yellow-700
                    shadow-lg // 好みに応じて影を追加
                    z-50 // 他の要素の上に表示されるようにz-indexを設定

                  "
                >デバッグモード</button>
                {debugMode && (
                <>
                <span className="font-semibold">あなたは{yourRole}</span>
                <button
                  onClick={this.deleteData}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  試合が終わったのでデータ削除
                </button>

                <button
                  onClick={this.gameFinishTest}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
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
              </>
              )}
            </div>

            <div className={`chat-container ${isChatOpen ? '' : 'closed'}`} > {/* isChatOpen の状態に応じてクラスを適用 */}
              
              {/* 開閉ボタン */}
              <button
                className={`chat-toggle-button ${isChatOpen ? '' : 'pointer-events-auto'}`}
                onClick={this.toggleChat} // クリックで開閉メソッドを呼び出す
                aria-expanded={isChatOpen} // アクセシビリティのため
                aria-controls="chat-messages-container" // 対象となるコンテナのID (chat-containerにIDを追加する場合)
              >
                {isChatOpen ? '>' : '<'} {/* isChatOpen の状態に応じてボタンのテキストを切り替える */}
              </button>
              
              <div id="chat-messages" className="chat-messages">
                {/*Array.isArray(chatMessages) && chatMessages.map((msg, index) => (
                {chatMessages.map((message, index) => ( 
                    <div key={index} className="chat-message">{message}</div>
                ))}*/}

                {(() => {
                  // もしchatMessagesが文字列の場合、配列に変換
                  let messages = chatMessages;
                  if (typeof chatMessages === 'string') {
                    // 文字列を適切に分割（例：カンマ区切り）
                    messages = chatMessages.split(',').map(msg => msg.trim());
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


        {/*{rematchRequest && ( //再戦リクエストが来たら
          <div>
            <p>再戦リクエスト</p>
            <button onClick={() => this.acceptRematch()} >承諾</button>
            <button onClick={() => this.declineRematch()} >拒否</button>
          </div>
        )}*/}

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


        {/*
        <h3 className="text-lg font-bold mb-3">受信データ表示 (ルームID: {roomId || 'N/A'})</h3>

        <div className="bg-gray-100 p-4 rounded-lg">
             ShogiTimerコンポーネントをレンダリング 
            <ShogiTimer initialMinutes={10} onTimeUp={this.handleTimeUp} ref={this.shogiTimerRef} />
            
             index.js から ShogiTimer のメソッドを呼び出すためのボタン 
            <div style={{ marginTop: '20px' }}>
              <button onClick={this.handleStartTimer} style={{ margin: '5px', padding: '10px 15px' }}>タイマー開始</button>
              <button onClick={this.handlePauseTimer} style={{ margin: '5px', padding: '10px 15px' }}>タイマー一時停止</button>
              <button onClick={this.handleToggleTimer} style={{ margin: '5px', padding: '10px 15px' }}>開始/一時停止を切り替え</button>
              <button onClick={this.handleSwitchTurn} style={{ margin: '5px', padding: '10px 15px' }}>手番交代</button>
              <button onClick={this.handleResetTimer} style={{ margin: '5px', padding: '10px 15px' }}>タイマーリセット</button>
            </div>
            {gameStatus === 'time_up' && ( //ゲームステータスの表示例
              <h2 style={{ color: 'red', marginTop: '20px' }}>
                {nowTurn === 'sente' ? '先手' : '後手'} の時間切れによりゲーム終了！
              </h2>
            )}
        </div>*/}
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
  //console.dir("shogiBoardElement: "+shogiBoardElement);

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
    //console.log("将棋ゲームコンポーネントが初期化されました。");
  } else {
    // shogi-board要素が見つからない場合は、このページが将棋ページではないと判断
    console.log("将棋ゲームコンポーネントは、このページでは初期化されませんでした（#shogi-board要素なし）。");
  }
})