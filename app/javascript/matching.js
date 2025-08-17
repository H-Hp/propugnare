import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import consumer from './channels/consumer.js';
import Header from './components/Header.jsx'; 
import LoadingOverlay from "./components/LoadingOverlay.jsx";
import { useState } from "react";
import { withTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from './lang/i18n';
//import imgKing from "./components/shogi/img/black_king.png";

class Matching extends React.Component {
  constructor(props) {
    super(props);
    const Element = document.getElementById('lobby-container'); // 例: 将棋盤を表示する<div>のID 
    const logoPath = Element.dataset.logoPath;
    const gamebackPath = Element.dataset.gamebackPath;
    const allGameRoomDatas = Element.dataset.allGameroomdatas;
    const loadingimgPath = Element.dataset.loadingimgPath;
    const kingPath = Element.dataset.kingPath;
    const lobbyComments = Element.dataset.lobbyComments;
    const lobby_bgmPath = Element.dataset.lobby_bgmPath;
    const notificationPath = Element.dataset.notificationPath;
    //console.log("lobbyComments:"+JSON.stringify(lobbyComments))
    //console.log("allGameRoomDatas:"+allGameRoomDatas)

    this.state = {
      allGameRoomDatas: allGameRoomDatas,
      logoPath: logoPath,
      lobby_bgmPath: lobby_bgmPath,
      notificationPath: notificationPath,
      isConnected: false,
      gamebackPath: gamebackPath,
      loadingimgPath: loadingimgPath,
      isLoading: true,
      actionCableIsConnected: false,
      username:"無名",
      debugMode: false,
      debugMassage: "",
      battleType: '10min',
      isMatching: false, // マッチング中の表示を制御
      isGameFound: false, // マッチング完了時の表示を制御
      matchingQueueLength: 0, // マッチング待機人数
      loadingMessage: "マッチング中です...", // ローディングメッセージ
      roomLink: "#", // ゲームルームへのリンク
      kingPath: kingPath,
      isChatOpen: true,
      //chatMessages: [], // 新しいstate: チャットメッセージを格納する配列
      chatMessages: lobbyComments, 
      currentChatMessage: '', // 新しいstate: 現在入力中のチャットメッセージ

    }

    this.handleChatInputChange = this.handleChatInputChange.bind(this);
    this.handleChatSubmit = this.handleChatSubmit.bind(this);
    this.toggleChat = this.toggleChat.bind(this);  

    // Action Cable, Audio, Page Title の参照を管理するRef (インスタンスプロパティとして)
    this.matchingChannelRef = null; // Action Cable チャネルのインスタンス
    this.connectionCheckInterval = null; // 接続監視用インターバルID
    this.heartbeatInterval = null; // ハートビート用インターバルID

    this.audioContextRef = null; // AudioContext のインスタンス
    this.notificationSoundBufferRef = null; // 通知音のオーディオバッファ
    //this.lobbyBgmSoundBufferRef = null;
    this.lobbyBgmAudioRef = React.createRef();
    this.originalPageTitleRef = document.title; // 元のページタイトル (初期値として直接設定)
    this.titleIntervalRef = null; // タイトル点滅の setInterval ID
    this.sessionIdRef = null; // 現在のクライアントセッションID

    // localStorage のキー定数 (クラスプロパティとして定義)
    this.MATCH_STATUS_KEY = 'shogi_matching_status';
    this.MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
    this.MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
    this.SESSION_ID_KEY = 'shogi_session_id';
    this.USERNAME_KEY= 'shogi_username';

    // メソッドのバインド (useCallback の代わりに)
    this.getCsrfToken = this.getCsrfToken.bind(this);
    this.setupNotificationAudio = this.setupNotificationAudio.bind(this);
    //this.setupBgmAudio= this.setupBgmAudio.bind(this);
    this.playNotificationSound = this.playNotificationSound.bind(this);
    this.flashPageTitle = this.flashPageTitle.bind(this);
    this.stopFlashingPageTitle = this.stopFlashingPageTitle.bind(this);
    this.resetMatchingUI = this.resetMatchingUI.bind(this);
    this.handleMatchedAndStore = this.handleMatchedAndStore.bind(this);
    this.attemptRedirect = this.attemptRedirect.bind(this);
    this.checkAndRedirectIfMatched = this.checkAndRedirectIfMatched.bind(this);
    this.subscribeToMatchingChannel = this.subscribeToMatchingChannel.bind(this);
    this.initializeMatchingSystem = this.initializeMatchingSystem.bind(this);
    this.handleBattleTypeChange = this.handleBattleTypeChange.bind(this);
    this.handleStartMatching = this.handleStartMatching.bind(this);
    this.handleCancelMatching = this.handleCancelMatching.bind(this);
    this.handleAllReset = this.handleAllReset.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this); // キーボードイベントハンドラ

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.check_maching_data = this.check_maching_data.bind(this);
    this.reNotificationEnemy = this.reNotificationEnemy.bind(this);

    const currentSessionIdFromDOM = Element.dataset.sessionId;
    this.sessionIdRef = currentSessionIdFromDOM; // Refに保存
    localStorage.setItem(this.SESSION_ID_KEY, currentSessionIdFromDOM); // localStorageにも保存
    //console.log("constructorのcurrentSessionIdFromDOM"+currentSessionIdFromDOM);
  }
  componentDidMount() {// コンポーネントがマウントされた後に一度だけ実行される
    this.initializeMatchingSystem();
    //this.setupBgmAudio();
    this.playBgmSound()
    //this.initBgm()

    // visibilitychange イベントリスナー
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    //this.handleKeyDown(event);
    //デバッグモード
    window.addEventListener('keydown', (event) => { if (event.key === 'd' || event.key === 'D') { 
      event.preventDefault(); //dでブックマーク登録を防ぐ
      this.handleKeyDown();
    } });

    //ユーザーのニックネームがブラウザに保存されてたら
    if (localStorage.getItem(this.USERNAME_KEY)) {
      this.setState({ username: localStorage.getItem(this.USERNAME_KEY) });
    }
  }

  // コンポーネントがアンマウントされる前に実行される (useEffect のクリーンアップの代わり)
  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.stopFlashingPageTitle(); // アンマウント時にタイトル点滅を停止

    // ActionCable接続を切断
    if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
      this.matchingChannelRef = null;
    }

    // 接続監視インターバルをクリア
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
   
    // ハートビートインターバルをクリア
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // CSRFトークンを取得するヘルパー関数
  getCsrfToken() {
    const tokenElement = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = tokenElement ? tokenElement.content : '';
    if (!csrfToken) {
      console.error("CSRF token is empty");
    }
    return csrfToken;
  }

  // AudioContextと音源の準備
  async setupNotificationAudio() {
    if (!this.audioContextRef) {
      this.audioContextRef = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!this.notificationSoundBufferRef) {
      try {
        //const response = await fetch('/assets/notification.mp3');
        const response = await fetch(this.state.notificationPath);
        const arrayBuffer = await response.arrayBuffer();
        this.notificationSoundBufferRef = await this.audioContextRef.decodeAudioData(arrayBuffer);
        console.log("通知音源をロードしました。");
      } catch (e) {
        console.error("通知音源のロードまたはデコードに失敗しました:", e);
      }
    }
  }

  /*async initBgm() {
    await this.setupBgmAudio();   // ロードが完了するまで待つ
    this.playBgmSound();          // 準備ができてから再生
  }*/
  // AudioContextと音源の準備
  /*async setupBgmAudio() {
    if (!this.audioContextRef) {
      this.audioContextRef = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!this.lobbyBgmSoundBufferRef) {
      try {
        const lobby_bgm_response = await fetch(this.state.lobby_bgmPath);
        //const lobby_bgm_response = await fetch('/assets/lobby_bgm.mp3');
        const lobby_bgm_arrayBuffer = await lobby_bgm_response.arrayBuffer();
        this.lobbyBgmSoundBufferRef = await this.audioContextRef.decodeAudioData(lobby_bgm_arrayBuffer);
        console.log("BGMをロードしました。");
      } catch (e) {
        console.error("BGMのロードまたはデコードに失敗しました:", e);
      }
    }
  }*/

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

  //BGMを再生する処理
  playBgmSound() {
    /*if (this.audioContextRef && this.lobbyBgmSoundBufferRef) {
      const source = this.audioContextRef.createBufferSource();
      source.buffer = this.lobbyBgmSoundBufferRef;
      source.connect(this.audioContextRef.destination);
      source.start(0);
      console.log("BGMを再生しました。");
    } else {
      console.warn("BGMを再生できません。オーディオコンテキストまたはバッファが未準備です。");
    }*/
    
    //const audio = new Audio(this.state.lobby_bgmPath);
    const audio = this.lobbyBgmAudioRef.current
    //const audio = document.getElementById("lobby_bgm");
    if (!audio) return;
    audio.loop = true;
    audio.volume = 0; // 無音で開始
    audio.play().then(() => {
      console.log("サイレント自動再生 OK");
      // 少し待ってから音量を上げる（フェードイン）
      setTimeout(() => {
        audio.volume = 0.7;
      }, 1000);
    }).catch(err => {
      console.warn("自動再生がブロックされました。ユーザー操作を待機中です。:"+err);
      // ブロックされたらクリック時に再生
      document.addEventListener("click", () => {
        console.log(" ブロックされたらクリック時に再生");
        audio.volume = 0.7; // ← 音量を上げてから
        audio.play();
      }, { once: true });
    });
    
    /*this.audio = new Audio(this.state.lobby_bgmPath);
    this.audio.loop = true;
    this.audio.volume = 0.3;

    // 自動再生を試みる
    this.audio
      .play()
      .catch((e) => {
        console.warn('Autoplay blocked, will wait for user interaction', e);
      });
      */
  }

  // ブラウザのタブタイトルを点滅させる
  flashPageTitle(message) {
    if (this.titleIntervalRef) return;
    let isFlashing = false;
    this.titleIntervalRef = setInterval(() => {
      document.title = isFlashing ? this.originalPageTitleRef : `🔔 ${message} 🔔`;
      isFlashing = !isFlashing;
    }, 1000);
  }

  // ブラウザのタブタイトルの点滅を停止する
  stopFlashingPageTitle() {
    if (this.titleIntervalRef) {
      clearInterval(this.titleIntervalRef);
      this.titleIntervalRef = null;
      document.title = this.originalPageTitleRef;
    }
  }

  // UIを初期状態に戻す関数
  resetMatchingUI() {
    this.setState({
      isMatching: false,
      isGameFound: false,
      loadingMessage: "マッチング中です...", // 初期メッセージに戻す
    });
    this.stopFlashingPageTitle();
    localStorage.removeItem(this.MATCH_STATUS_KEY);
    localStorage.removeItem(this.MATCH_ROOM_ID_KEY);
    localStorage.removeItem(this.MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
  }

  // マッチングが成立した際の共通処理（ローカルストレージへの保存を含む）
  handleMatchedAndStore(roomId, playerRole) {
    this.setState({
      loadingMessage: '対戦相手が見つかりました！ゲームを開始します。',
      isMatching: false, // ローディング表示を非表示に
      isGameFound: true, // マッチング完了表示を表示に
      roomLink: `/shogi/${roomId}`,
    });
    
    localStorage.setItem(this.MATCH_STATUS_KEY, 'matched');
    localStorage.setItem(this.MATCH_ROOM_ID_KEY, roomId);
    localStorage.setItem(this.MATCH_PLAYER_ROLE_KEY, playerRole);
    //localStorage.setItem(this.SESSION_ID_KEY, session_id); // セッションIDも保存

    this.playNotificationSound();
    this.flashPageTitle('マッチング！');
  }

  // 画面遷移を試みる関数
  attemptRedirect(roomId) {
    if (document.visibilityState === 'visible') {
      console.log("タブがアクティブなので、即座にリダイレクトします。");
      // window.location.href = `/shogi/${roomId}`; // 自動リダイレクトが必要なら有効化
      this.stopFlashingPageTitle();
    } else {
      console.log("タブが非アクティブなので、アクティブ化を待ちます。");
    }
  }

  // ロード時またはアクティブになったときにマッチング状態を確認しリダイレクト
  checkAndRedirectIfMatched() {
    const matchedStatus = localStorage.getItem(this.MATCH_STATUS_KEY);
    const roomId = localStorage.getItem(this.MATCH_ROOM_ID_KEY);
    const playerRole = localStorage.getItem(this.MATCH_PLAYER_ROLE_KEY);
    const storedSessionId = localStorage.getItem(this.SESSION_ID_KEY); // localStorageからセッションIDを取得
    this.check_maching_data(roomId).then(result =>{//game_room_dataが作成されているはずなのでgame_room_dataを取得
        const [ this_user_room_game_data , matching_user_exists, matchingQueueLength, allGameRoomDatas]= result
        //マッチング成立でゲームルームデータがある場合
        if(this_user_room_game_data){
          if(this_user_room_game_data.status!=="finished"){// "finished"
            this.reNotificationEnemy(this_user_room_game_data,playerRole,roomId)//一応相手に通知・matching_controller.rbでマッチングが成立した双方に通知送っているけどなぜか反映されないこともあるので再び相手に通知
            this.handleMatchedAndStore(roomId, playerRole) // UI更新とリンク表示
            this.attemptRedirect(roomId)
            this.setState({
              allGameRoomDatas_json: true,
            });
          }
        }else if(matching_user_exists){
          //console.log("matchingQueueLength:"+matchingQueueLength)
          // 進行中なら、マッチングUIを再度表示し、WebSocket接続が維持されていることを確認
          this.setState({
            isMatching: true,
            isGameFound: false,
            loadingMessage: '対戦相手を検索中です...',
            matchingQueueLength: matchingQueueLength
          });
          this.flashPageTitle('マッチング中...');
        }else{
          // マッチング状態がクリアされているか、存在しない場合
          this.resetMatchingUI();
        }
        this.setState({ isLoading: false})
    });
  }

  //マッチングデータやゲームルームデータを取得
  async check_maching_data(roomId){
    //console.log('マッチングデータ:', roomId);
      try {
        const response = await fetch('/matching/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.getCsrfToken()
          },
          body: JSON.stringify({ roomId: roomId ,sessionId: this.sessionIdRef})
        });
        const data = await response.json();
        const this_user_room_game_data = data.check_data.this_user_room_game_data;
        const matching_user_exists = data.check_data.matching_user_exists;
        const matchingQueueLength = data.check_data.matching_queue_length;
        const allGameRoomDatas = data.check_data.all_room_game_data_json

        return [this_user_room_game_data,matching_user_exists,matchingQueueLength,allGameRoomDatas]
      }catch (error) {
        console.error('エラー:', error);
      }
  }

  //一応相手に通知・matching_controller.rbでマッチングが成立した双方に通知送っているけどなぜか反映されないこともあるので再び相手に通知
  reNotificationEnemy(game_room_data, playerRole, roomId){
    if(!game_room_data){
      //console.log("あgame_room_data:"+JSON.stringify(game_room_data))
      const sente_identifier = JSON.parse(game_room_data).sente_identifier;
      const gote_identifier = JSON.parse(game_room_data).gote_identifier;
      //console.log("sente_identifier:"+sente_identifier);console.log("gote_identifier:"+gote_identifier);console.log("playerRole:"+playerRole)

      if(playerRole=="sente"){
        this.matchingChannelRef.perform('reNotificationEnemy', {
          game_room_data: game_room_data,
          enemyRole:"gote",
          enemyIdentifier: gote_identifier,
          roomId: roomId
        });
      }else if(playerRole=="gote"){
        this.matchingChannelRef.perform('reNotificationEnemy', {
          game_room_data: game_room_data,
          enemyRole:"sente",
          enemyIdentifier: sente_identifier,
          roomId: roomId
        });
      }
    }
  }

  // Action Cable 購読処理
  subscribeToMatchingChannel(identifier) {
    //console.log("subscribeToMatchingChannel()");

    // 既存の接続があれば切断
    if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
      this.matchingChannelRef = null;
    }

    this.matchingChannelRef = consumer.subscriptions.create(
      { channel: "MatchingChannel", identifier: identifier, room_id: "room_001", matching: "matching" },
      {
        connected: () => { // アロー関数で this をバインド
          //console.log(`Action Cableが${identifier}のMatchingChannelに接続されました`);
          this.setState({ actionCableIsConnected: true });
          this.checkAndRedirectIfMatched(); // 接続時に、もし既にマッチ済みだったらリダイレクトを試みる
        },
        disconnected: () => { // アロー関数で this をバインド
          this.setState({ actionCableIsConnected: false });
          //console.log(`${identifier}のMatchingChannelからAction Cableが切断されました`);
          setTimeout(() => { this.reSubscribeToMatchingChannel(); }, 3000); // 自動再接続
        },
        received: (data) => { // アロー関数で this をバインド
          //console.log('Action Cableから受信:', data);
          if (data.status === 'matched') {
            this.setState(prevState => {
              const currentData = typeof prevState.allGameRoomDatas === 'object' && prevState.allGameRoomDatas !== null
                ? prevState.allGameRoomDatas
                : {}; // 文字列や null の場合は空オブジェクト
              return {
                allGameRoomDatas: {
                  ...currentData,
                  [data.room_id]: JSON.parse(data.game_room_data)
                }
              };
            });
            //console.log("allGameRoomDatas:"+JSON.stringify(this.state.allGameRoomDatas))
            this.handleMatchedAndStore(data.room_id, data.player_role);
            this.attemptRedirect(data.room_id);
          } else if (data.status === 'user_added') {
            this.setState({ matchingQueueLength: data.matching_queue_length });
            //console.log("ユーザーが追加された");
          } else if (data.status === 'canceled') {
            this.setState({ loadingMessage: data.message });
            //console.log("マッチング人数："+data.debug_data.matching_queue_length+"・マッチングデータ："+data.debug_data.matching_queue_data);
            this.resetMatchingUI();
          } else if (data.status === 'in_progress') {
            this.setState({
              matchingQueueLength: data.matching_queue_length,
              loadingMessage: data.message,
              isMatching: true, // UIをマッチング中に設定
              isGameFound: false, // ゲーム見つかった状態をリセット
            });
            this.flashPageTitle('マッチング中...');
          }else if(data.data_type=="chat_update"){
            console.log(`data.chat_data:`, data.chat_data);
            this.setState({ chatMessages: data.chat_data })
            /*if (Array.isArray(data.chat_data)) {//配列かどうかチェック
              this.setState({ chatMessages: data.chat_data }) //最初はdata.chat_dataが"aaa"みたいに配列になっていないので配列に変換してchatMessageに入れる
            }else{
              this.setState({ chatMessages: data.chat_data })
            }*/
            //console.log(`this.state.chatMessages：`, this.state.chatMessages);
            return
          }else if (data.type === 'pong') {// pong受信時の処理（ハートビート応答）
           //console.log('サーバーからpong受信 - 接続正常');
          }else if(data.status==="test"){
            console.log("テスト受信")
          }
        }
      }
    );
  }

  //Matchingチャンネルに再接続
  reSubscribeToMatchingChannel = () => {
    //console.log("reSubscribeToMatchingChannel()");
    //console.log("ActionCable再接続試行中...");
    // 既存の接続を完全に切断
    if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
    }
    this.subscribeToMatchingChannel(this.sessionIdRef);// 新しい接続を確立
  }
  // 定期的に接続状態をチェック
  setupConnectionMonitoring = () => {
    //console.log("setupConnectionMonitoring()")
    this.connectionCheckInterval = setInterval(() => {// x秒ごとに接続状態をチェック
      if (!this.isConnectionOpen()) {// 接続が切断されていたら再接続
        console.log("接続切断を検出、再接続します");
        this.reSubscribeToMatchingChannel();
      }
    }, 10000);
  }
  // 接続状態をチェックする関数
  isConnectionOpen = () => {
    //console.log("this.isConnectionOpen() " )
    // チャンネル参照が存在し、かつ接続が開いているかチェック
    //if (!this.matchingChannelRef || !this.matchingChannelRef.consumer.connection.isOpen()) {
    //console.log("this.matchingChannelRef :"+this.matchingChannelRef )
    if (!this.matchingChannelRef) {
      console.log("matchingChannelRefがnull");
      return false;
    }
    //console.log("consumer:", this.matchingChannelRef.consumer);
    return this.matchingChannelRef && this.matchingChannelRef.consumer?.connection?.isOpen();
  }
  // ハートビート機能の設定（接続維持）・定期的にサーバーにpingを送信
  setupHeartbeat = () => {
    //console.log("setupHeartbeat()")
    this.heartbeatInterval = setInterval(() => {// x秒ごとにサーバーにpingを送信
      if (this.isConnectionOpen()) {// 接続が開いている場合のみpingを送信
        this.matchingChannelRef.perform('ping', { timestamp: Date.now(), sessionId: this.sessionIdRef });// 現在時刻を送信
      }
    }, 30000); // 30秒ごと
  }
  // 手動でActionCableに再接続ボタンのハンドラー
  handleManualActionvCableReconnect = () => {
    //console.log("手動再接続を実行");
    this.reSubscribeToMatchingChannel();
  }

  // ページロード時の初期処理
  initializeMatchingSystem() {
    this.subscribeToMatchingChannel(this.sessionIdRef); // 取得したセッションIDでActionCable購読開始
    //this.connectToMatching(); // ActionCable接続を開始
    this.setupConnectionMonitoring(); // 接続状態の監視を開始
    this.setupHeartbeat(); // ハートビート機能を開始
    this.checkAndRedirectIfMatched(); // ロード時にマッチング済みかチェック
  }

  // --- イベントハンドラ ---
  handleBattleTypeChange(event) {
    this.setState({ battleType: event.target.value });
  }

  //マッチング開始
  async handleStartMatching() {
    //this.setupAudio(); // ユーザー操作でオーディオを準備
    this.setupNotificationAudio(); 
    this.setState({
      isMatching: true,
      isGameFound: false,
      loadingMessage: '対戦相手を検索中です...',
    });
    // ローカルストレージのマッチング状態をクリア
    localStorage.removeItem(this.MATCH_STATUS_KEY);
    localStorage.removeItem(this.MATCH_ROOM_ID_KEY);
    localStorage.removeItem(this.MATCH_PLAYER_ROLE_KEY);
    //localStorage.removeItem(this.SESSION_ID_KEY);
    //console.log("this.getCsrfToken():"+this.getCsrfToken())
    try {
      const response = await fetch('/matching/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify({ battleType: this.state.battleType, userName: this.state.username })
      });
      const data = await response.json();
      //console.log('Matching start response:', JSON.stringify(data));
      if (data.status === 'in_progress') {
        localStorage.setItem(this.MATCH_STATUS_KEY, 'in_progress');
        this.setState({ matchingQueueLength: data.matching_queue_length });
      } else if (data.status === 'matched') {
        this.handleMatchedAndStore(data.room_id, data.player_role);
        this.attemptRedirect(data.room_id);
      } else {
        this.setState({ loadingMessage: `エラー: ${data.message}` });
        this.resetMatchingUI();
      }
    } catch (error) {
      //console.error('マッチング開始エラー:', error);
      this.setState({ loadingMessage: 'マッチング開始に失敗しました。' });
      this.resetMatchingUI();
    }
  }

  async handleCancelMatching() {
    try {
      const response = await fetch('/matching/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      });
      const data = await response.json();
      //console.log('Matching cancel response:', data);
      this.setState({ loadingMessage: data.message });
      this.resetMatchingUI();
    } catch (error) {
      //console.error('マッチングキャンセルエラー:', error);
      this.setState({ loadingMessage: 'マッチングキャンセルに失敗しました。' });
      this.resetMatchingUI();
    }
  }

  async handleAllReset() {
    localStorage.removeItem(this.MATCH_STATUS_KEY);
    localStorage.removeItem(this.MATCH_ROOM_ID_KEY);
    localStorage.removeItem(this.MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
    //console.log("マッチング情報の全削除処理");
    try {
      const response = await fetch('/matching/all_delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      });
      const data = await response.json();
      //console.log('マッチング情報を全部削除した:', data);
      this.setState({ loadingMessage: data.message });
      this.resetMatchingUI();
    } catch (error) {
      //console.error('マッチングキャンセルエラー:', error);
      this.setState({ loadingMessage: 'マッチングキャンセルに失敗しました。' });
      this.resetMatchingUI();
    }
    //console.log("セッションを削除してCSRFトークンも初期化されてしまうのでリロード");
    window.location.reload(); // ページリロード
  }

  // デバッグ
  async handleKeyDown(){
      this.setState(prevState => ({ debugMode: !prevState.debugMode }));
      const roomId = localStorage.getItem(this.MATCH_ROOM_ID_KEY);
      try {
        const response = await fetch('/matching/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.getCsrfToken()
          },
          //body: JSON.stringify({ roomId: roomId, sessionId: localStorage.getItem(this.SESSION_ID_KEY) })
          body: JSON.stringify({ roomId: roomId, sessionId: this.sessionIdRef })
      });
      const data = await response.json();
      //console.log('デバッグデータ:', JSON.stringify(data));
      this.setState({ debugMassage: JSON.stringify(data) });
      //post 'matching/debug', to: 'matching#debug', as: :start_matching #デバッグ用
      } catch (error) {
        console.error('デバッグエラー:', error);
        this.setState({ debugMassage: error });
      }
  }

  handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log("タブがアクティブになりました。");
      this.checkAndRedirectIfMatched();
    }
  }

  //ユーザーネームの変更
  handleUsernameChange = (event) => {
    this.setState({ username: event.target.value });
    localStorage.setItem(this.USERNAME_KEY, event.target.value);
  };

  matchedTest = () => {
    this.matchingChannelRef.perform('matchedTest', {
      battleType: this.state.battleType,
      userName: this.state.username,
      sessionId: this.sessionIdRef,
      userAgent: navigator.userAgent
    });
  }

  //チャット入力フィールドの値が変更された時にstateを更新
  handleChatInputChange(event) {
    this.setState({ currentChatMessage: event.target.value });
  }
  //チャットフォームが送信された時（「送信」ボタンクリックまたはEnterキー）
  async handleChatSubmit(event) {
    event.preventDefault(); // フォームのデフォルト送信（ページリロード）を防止
    const { currentChatMessage } = this.state;
    if (currentChatMessage.trim() === '') {
      return; // 空のメッセージは送信しない
    }
    try {
      //console.log("currentChatMessage:"+currentChatMessage)
      /*const content = currentChatMessage;
      const payload = { lobby_comment: { content } };
      const response = await fetch('/matching/lobby_comment_create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        body: JSON.stringify(payload)
      }); 
      const data = await response.json();
      console.log(data)

      */
      if (this.matchingChannelRef && this.state.actionCableIsConnected) {
        //非同期送信: WebSocketを通じてサーバーへメッセージを送信
        this.matchingChannelRef.perform('chat_save_and_broadcast', { 
          chat_data: currentChatMessage,
        });
        //this.subscription.sendChatMessage(currentChatMessage);
        this.setState({ currentChatMessage: '' }); // 入力フィールドをクリア

        setTimeout(() => {// 少し遅延させてDOMの更新を待ってチャットをスクロールして一番下のメッセージを表示
          document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
        }, 100);
        console.log("チャットメッセージを送信しました:", currentChatMessage);
      } else {
        console.warn("WebSocket接続が確立されていないため、メッセージを送信できません。");
        alert("チャットサーバーに接続されていません。");
      }
    } catch (error) {
      console.error('デバッグエラー:', error);
    }
  }
  //チャットの開閉の表示を切り替えるメソッド
  toggleChat() {
    this.setState(prevState => ({
      isChatOpen: !prevState.isChatOpen // 現在の状態を反転させる
    }));
  }

  render() {
    const { loadingimgPath,lobby_bgmPath, isLoading, allGameRoomDatas ,gamebackPath, actionCableIsConnected, battleType, isMatching, isGameFound, matchingQueueLength, loadingMessage, roomLink , debugMassage,kingPath,isChatOpen,chatMessages,currentChatMessage} = this.state;
    
    // debug_dataを解析
    let debug_matchingQueueLength;
    let debug_matchingQueueData;

    //JSON.parse() は文字列をオブジェクトに変換する関数
    let allGameRoomDatas_json;
    if (typeof allGameRoomDatas === 'string') {
      allGameRoomDatas_json = JSON.parse(allGameRoomDatas);
    } else {
      allGameRoomDatas_json = allGameRoomDatas;
    }

    const { t } = this.props;

    setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
      if (document.getElementById('chat-messages') && document.getElementById('chat-messages').scrollHeight !== undefined){
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    }, 100);

    setTimeout(() => {
      const King = document.getElementById('King');// ドラッグしたい要素を取得
      if (King) {
        new Draggable(King);// Draggable.js のインスタンスを作成し、要素をドラッグ可能にする// 'new Draggable()' の引数にドラッグ対象の要素を渡します。
      }
    }, 100);

    if (isLoading) {
      return (
        <LoadingOverlay loadingimgPath={loadingimgPath} loadingMessage={loadingMessage} />
      );
    }

    return (
      <div className={`w-full h-full bg-no-repeat bg-cover bg-center bg-[url('${gamebackPath}')]`} >
        <Header  logoPath={this.state.logoPath}  className="w-full"/>

        <img src={kingPath} alt="Black King" id="King" className="z-10 cursor-move w-[50px] h-[50px]" />

        <div 
          className={` 
            flex items-center p-4  
            ${!isChatOpen ? '' : 'w-[70%]'}
          `}>
          <div 
            className="
              p-8 rounded-lg shadow-xl w-full max-w-md text-center
              bg-gradient-to-br from-black via-gray-800 to-gray-900
          ">
            <h1 className="text-3xl font-extrabold text-white mb-6"> {t('matching.title')} </h1>
            <div className="mb-6">
              <label className="mr-4 text-white">
                <input
                  type="radio"
                  name="battle_type"
                  value="10min"
                  checked={battleType === '10min'}
                  onChange={this.handleBattleTypeChange}
                  className="mr-1"
                  disabled //フォーム要素を無効にし、ユーザーが操作できないように
                />
                10分切負け
              </label>
              {/* <label>
                <input
                  type="radio"
                  name="battle_type"
                  value="10sec"
                  checked={battleType === '10sec'}
                  onChange={this.handleBattleTypeChange}
                  className="mr-1"
                />
                10秒将棋
              </label> */}
            </div>
            
            {/* マッチング開始ボタンは、マッチング中でない場合のみ表示 */}
            {!isMatching && !isGameFound && (
              <div>
                <input
                  type="text"
                  value={this.state.username}
                  onChange={this.handleUsernameChange}
                  placeholder="ニックネーム"
                  className="border p-2 rounded text-white"
                />
                <button
                  id="startMatchingButton"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                  onClick={this.handleStartMatching}
                >
                  対戦相手を探す
                </button>
              </div>
            )}

            {/* ローディング中の表示 */}
            {isMatching && (
              <div id="matchingStatus" className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg shadow-inner flex flex-col items-center justify-center space-y-4">
                <div className="relative w-16 h-16">
                  {/* Tailwind CSSでスピナーを作成 */}
                  <div className="absolute inset-0 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p id="loadingMessage" className="text-blue-700 text-xl font-semibold">{loadingMessage}</p>
                <p className="text-xl font-extrabold text-gray-800 mb-6">
                  <span className="matching_queue_length">{matchingQueueLength}</span>人マッチング待機中
                </p>

                <button
                  id="cancelMatchingButton"
                  className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-5 rounded-full text-base transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-300"
                  onClick={this.handleCancelMatching}
                >
                  キャンセル
                </button>
              </div>
            )}

            {/* マッチング完了時の表示 */}
            {isGameFound && (
              <div id="gameRoomLink" className="mt-8 p-6 bg-[#a9a9a9] border border-yellow-200 rounded-lg shadow-inner text-center">
                <p className="text-yellow-700 text-xl font-semibold mb-4">対戦相手が見つかりました！</p>
                <a
                  href={roomLink}
                  id="roomLink"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                  ゲームを開始する
                </a>
              </div>
            )}
          </div>
        </div>

          <div
            className={` 
              text-white
              whitespace-pre    /* 改行をそのまま反映、折り返しも無効 */
              font-mono         /* 等幅フォントで見やすく */
              text-sm
              p-3
              overflow-auto   /* 横長のときはスクロール */
              bg-gradient-to-br from-black via-gray-800 to-gray-900
              p-6
              ${!isChatOpen ? '' : 'w-[50%]'}
            `}
          >
            {/* ヘッダー */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  オンライン対戦一覧
                </h1>
                <div className="flex justify-center gap-6 text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{/*1,247人オンライン*/}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                    {/*<span>
                      allGameRoomDatas_json_length 試合進行中
                    </span>*/}
                  </div>
                </div>
              </div>
            </div>

          {/* バトルカード */}
          <div className="space-y-4">
            {allGameRoomDatas_json && Object.entries(allGameRoomDatas_json).map(([roomId, gameDetails]) => {
                  const timeAgo = (ts) =>
                  (d => d < 0 ? (d = -d, d < 60 ? `${d}秒後` : d < 3600 ? `${Math.floor(d / 60)}分後` : d < 86400 ? `${Math.floor(d / 3600)}時間後` : `${Math.floor(d / 86400)}日後`) :
                    d < 60 ? `${d}秒前` : d < 3600 ? `${Math.floor(d / 60)}分前` : d < 86400 ? `${Math.floor(d / 3600)}時間前` : `${Math.floor(d / 86400)}日前`)
                  (Math.floor(Date.now() / 1000 - ts));
                  return (
                    <a key={roomId} href={roomLink}>
                      <div
                        className={`
                          relative group cursor-pointer
                          bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg
                          border border-white/20 rounded-2xl p-6
                          hover:from-white/20 hover:to-white/10
                          hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20
                          transform hover:-translate-y-1 transition-all duration-300
                        `}
                      >
                        {/* LIVE インジケーター */}
                        {gameDetails.status === "active" && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                              LIVE
                            </div>
                          </div>
                        )}

                        {/* メインコンテンツ */}
                        <div className="flex items-center justify-between mb-4">
                          {/* プレイヤー情報 */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                {/* プレイヤー1 */}
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg mb-1">{gameDetails.sente_user_name}</div>
                                </div>

                                {/* VS */}
                                <div className="mx-4">
                                  <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg">VS</div>
                                </div>

                                {/* プレイヤー2 */}
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg mb-1">{gameDetails.gote_user_name}</div>
                                </div>
                              </div>

                              {/* 右側の情報 */}
                              <div className="text-right">
                              </div>
                            </div>

                            {/* ステータスバー */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {/* ステータス */}
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                                      gameDetails.status === "active" ? "bg-green-400" :
                                      gameDetails.status === "finished" ? "bg-red-500" :
                                      "bg-gray-400"
                                    }`}></div>
                                  <span className={`font-medium text-sm ${
                                      gameDetails.status === "active" ? "text-green-400" :
                                      gameDetails.status === "finished" ? "text-red-500" :
                                      "text-gray-400"
                                    }`}>
                                      {gameDetails.status === "active" ? "対戦中" : 
                                      gameDetails.status === "finished" ? "終局" : 
                                      gameDetails.status}
                                  </span>
                                </div>

                                {/* バトルタイプ */}
                                <div className={`bg-gradient-to-r text-white px-3 py-1 rounded-full text-sm font-medium`}>
                                  {gameDetails.battleType === "10min" ? "10分切れ負け戦" : gameDetails.battleType}
                                </div>
                              </div>

                              {/* 時間 */}
                              <div className="flex items-center gap-2 text-gray-400">
                                <span className="text-sm">{timeAgo(gameDetails.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 装飾的な要素 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl">
                        </div>
                      </div>
                    </a>
                  );
                })}
            </div>
          </div>







            <div 
              className={`
                chat-container 
                fixed 
                top-[30px]
                right-0 
                min-w-[300px] 
                max-w-[350px] 
                flex 
                flex-col 
                h-[calc(100%-30px)]
                font-sans 
                bg-[#18181b] 
                shadow-[0_4px_12px_rgba(0,0,0,0.1)] 
                transition 
                duration-300 
                ease-out 
                transform 
                opacity-100
                ${isChatOpen ? '' : 'closed'}`} > {/* isChatOpen の状態に応じてクラスを適用 */}
              {/* 開閉ボタン */}
              <button
                className={`chat-toggle-button bg-[#18181b] hover:bg-[#27272a] ${isChatOpen ? '' : 'pointer-events-auto'}`}
                onClick={this.toggleChat} // クリックで開閉メソッドを呼び出す
                aria-expanded={isChatOpen} // アクセシビリティのため
                aria-controls="chat-messages-container" // 対象となるコンテナのID (chat-containerにIDを追加する場合)
              >
                {isChatOpen ? '→' : '←'} {/* isChatOpen の状態に応じてボタンのテキストを切り替える */}
              </button>
              
              <div id="chat-messages" className="chat-messages">
                {/*(() => {
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
                })()
                  
                  {return JSON.parse(lobbyComments).forEach(comment => {
                    <div className="chat-message p-2 mb-2 rounded">
                      {comment}
                    </div>
                  }*/}
                {
                //JSON.parse(chatMessages).map((comment, index) => (
                JSON.parse(chatMessages).slice().reverse().map((comment, index) => (
                //JSON.parse(lobbyComments).map((comment, index) => (
                  <div key={index} className="chat-message p-2 mb-2 rounded text-white text-[11px]">
                    {comment.content}
                  </div>
                ))}
              </div>
              <form id="chat-form" 
                className="chat-form bg-[#18181b]" 
                onSubmit={this.handleChatSubmit}>
                <input
                  type="text"
                  id="chat-input"
                  placeholder="メッセージを送信"
                  className="chat-input text-white"
                  autoComplete="off"
                  value={currentChatMessage}
                  onChange={this.handleChatInputChange}
                />
                {/*<button type="submit" className="chat-button">Send</button>*/}
              </form>
            </div>

        <audio 
          src={lobby_bgmPath}
          ref={this.lobbyBgmAudioRef}
          id="lobby_bgm" 
          controls 
          loop
          className="fixed bottom-4 left-4"
        />


        {/* デバッグモード */}
        {this.state.debugMode && (
          <div
            className="w-[70%] h-[50%] fixed top-7 left-4 opacity-85 bg-black overflow-auto"
          >

            {(() => {
              try {
                if (debugMassage) {
                  // データ1とデータ2の両方に対応
                  let debugData;
                  
                  // debugMassageが文字列の場合はパース、オブジェクトの場合はそのまま使用
                  if (typeof debugMassage === 'string') {
                    const parsedDebugData = JSON.parse(debugMassage);
                    debugData = parsedDebugData.check_data;
                  } else {
                    debugData = debugMassage.check_data;
                  }
                  
                  if (debugData) {
                    // debug_dataが文字列の場合はパース、オブジェクトの場合はそのまま使用
                    let finalDebugData;
                    if (typeof debugData === 'string') {
                      finalDebugData = JSON.parse(debugData);
                    } else {
                      finalDebugData = debugData;
                    }
                    
                    const matchingQueueLength = finalDebugData.matching_queue_length;
                    const matchingQueueData_json = finalDebugData.matching_queue_data;
                    
                    // matching_queue_dataの最初の要素を取得
                    let identifier, user_agent, username;
                    if (matchingQueueData_json && matchingQueueData_json.length > 0) {
                      const firstQueueItem = typeof matchingQueueData_json[0] === 'string' 
                        ? JSON.parse(matchingQueueData_json[0]) 
                        : matchingQueueData_json[0];
                      identifier = firstQueueItem.identifier;
                      user_agent = firstQueueItem.user_agent;
                      username   = firstQueueItem.user_name;
                    }
                    
                    // this_user_room_game_dataが存在する場合の処理（データ2の場合）
                    let roomGameData = null;
                    if (finalDebugData.this_user_room_game_data) {
                      try {
                        roomGameData = typeof finalDebugData.this_user_room_game_data === 'string' 
                          ? JSON.parse(finalDebugData.this_user_room_game_data)
                          : finalDebugData.this_user_room_game_data;
                      } catch (error) {
                        console.error('this_user_room_game_data解析エラー:', error);
                      }
                    }

                    //let AllRoomGameData = null;
                    if (finalDebugData.all_room_game_data_json) {
                      try {
                        allGameRoomDatas_json = JSON.parse(finalDebugData.all_room_game_data_json)
                      } catch (error) {
                        console.error('all_room_game_data_json解析エラー:', error);
                      }
                    }
                    
                    return (
                      <div>
<h3 className="text-white">Version6</h3>
                        <h1 className="text-white">
                          現在のマッチング人数: {matchingQueueLength}人
                        </h1>
                        <h1 className="text-white">
                          username: {username || '不明'}
                        </h1>
                        <h1 className="text-white">
                          identifier: {identifier || '不明'}
                        </h1>
                        <h1 className="text-white">
                          user_agent: {user_agent || '不明'}
                        </h1>
                        
                        {/* room_game_data_jsonが存在する場合の追加情報（データ2の場合） */}
                        {roomGameData && (
                          <div className="mt-4">
                            <h2 className="text-yellow-300">このユーザーのゲーム情報:</h2>
                            <p className="text-white">
                              先手の{roomGameData.sente_user_name}さん: {roomGameData.sente_identifier}
                            </p>
                            <p className="text-white">
                              後手{roomGameData.gote_user_name}さん: {roomGameData.gote_identifier}
                            </p>
                            <p className="text-white">
                              ステータス: {roomGameData.status}
                            </p>
                            <p className="text-white">
                              対戦形式: {roomGameData.battleType}
                            </p>
                            <p className="text-white">
                              作成日時: {new Date(roomGameData.created_at * 1000).toLocaleString()}
                            </p>
                          </div>
                        )}
                        
                        <details className="mt-4" open>
                          <summary className="text-gray-300 cursor-pointer">
                            詳細データを表示
                          </summary>
                          <pre className="text-xs text-gray-400 bg-gray-800 p-2 rounded mt-2 whitespace-pre-wrap break-words">
                            {JSON.stringify(finalDebugData, null, 2)}
                          </pre>
                        </details>

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
                          全部のゲームルームデータ: 
                          {allGameRoomDatas_json && Object.entries(allGameRoomDatas_json).map(([roomId, gameDetails]) => (
                            <div key={roomId} className="mt-4 border-t border-gray-700 pt-4">
                              <h3 className="text-lg font-semibold text-blue-300">ルームID: {roomId}</h3>
                              <p>Sente User Name: {gameDetails.sente_user_name}</p>
                              <p>Gote User Name: {gameDetails.gote_user_name}</p>
                              <p>Sente Identifier: {gameDetails.sente_identifier}</p>
                              <p>Gote Identifier: {gameDetails.gote_identifier}</p>
                              <p>Sente User Agent: {gameDetails.sente_user_agent}</p>
                              <p>Gote User Agent: {gameDetails.gote_user_agent}</p>
                              <p>Status: {gameDetails.status}</p>
                              <p>Battle Type: {gameDetails.battleType}</p>
                              <p>Created At: {gameDetails.created_at}</p>
                            </div>
                          ))}
                          </div>
                      </div>
                    );
                  }
                }
              } catch (error) {
                return  <p className="text-white">JSON解析エラー: {error.message}</p>;
              }
              return null;
            })()}

            {debugMassage && debugMassage.debug_data && (
              <div>
                <h1
                  className="text-white"
                >debugMassage: {debugMassage}</h1>

                <h1
                  className="text-white"
                >現在のマッチング人数: {JSON.parse(debugMassage.debug_data).matching_queue_length}人</h1>
                <h1
                  className="text-white"
                >現在のマッチングデータ: {JSON.parse(debugMassage.debug_data).matchingQueueData}人</h1>
              </div>
            )}

            <div className="mb-3">
              <span className="font-semibold text-white">ActionCable接続状態: </span>
              <span className={`px-2 py-1 rounded text-sm ${
                actionCableIsConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {actionCableIsConnected ? '接続中' : '未接続'}
              </span>
              
              {/* ActionCable手動再接続ボタン */}
              <button 
                onClick={this.handleManualActionvCableReconnect}
                disabled={actionCableIsConnected === '接続中'}
              >
                再接続
              </button>

              <div className="font-semibold text-white">
                このブラウザの(このユーザーの)セッションid: {localStorage.getItem(this.SESSION_ID_KEY)}
              </div>
            </div>

            <audio 
              src={lobby_bgmPath} 
              id="music" 
              controls 
              loop
            />

            <button
              id="AllResetButton"
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full text-base transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={this.matchedTest} 
            >
              擬似マッチング
            </button>

            <button
              id="AllResetButton"
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-full text-base transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={this.handleAllReset}
            >
              全データリセット
            </button>
          </div>
        )}
      </div>
    );
  }
};

// withTranslationでコンポーネントをラップ
const MatchingWithTranslation = withTranslation()(Matching);

//document.addEventListener('turbolinks:load', () => {//urbolinks による初回ページロード時・Turbolinks によるページ遷移時・通常のブラウザリロード時 のすべてで発生します。  
document.addEventListener('turbo:load', () => {
  const tokenElement = document.querySelector('meta[name="csrf-token"]');
  window.csrfToken = tokenElement ? tokenElement.content : '';
  const Element = document.getElementById('lobby-container'); // 例: 将棋盤を表示する<div>のID 
  const logoPath = Element.dataset.logoPath;
  if (Element) {
    const rootElement = document.createElement('div');
    rootElement.className = 'top-0 h-full w-full';
    document.body.appendChild(rootElement);
    const root = ReactDOM.createRoot(rootElement);
    //root.render(<Matching/>);
    root.render(
      <I18nextProvider i18n={i18n}>
        {/*<Matching/>*/}
        <MatchingWithTranslation />
      </I18nextProvider>
    );
  } else {
    // shogi-board要素が見つからない場合は、このページが将棋ページではないと判断
    //console.log("将棋ゲームコンポーネントは、このページでは初期化されませんでした（#shogi-board要素なし）。");
  }
});

export default Matching;