import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
//import consumer from '../channels/consumer'; // Action Cableのconsumerをインポート
import consumer from './channels/consumer.js';
//import Header from '../components/Header';
import Header from './components/Header.jsx'; 
import { useState } from "react";
//import { useTranslation } from 'react-i18next'
import { withTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';
//import { withTranslation, I18nextProvider } from 'react-i18next';
import i18n from './lang/i18n' 

class Matching extends React.Component {
  constructor(props) {
    super(props);
    const Element = document.getElementById('lobby-container'); // 例: 将棋盤を表示する<div>のID 
    const logoPath = Element.dataset.logoPath;
    const gamebackPath = Element.dataset.gamebackPath;
    const allGameRoomDatas = Element.dataset.allGameroomdatas;
    const loadingimgPath = Element.dataset.loadingimgPath;

    //console.log("allGameRoomDatas:"+allGameRoomDatas)

    this.state = {
      allGameRoomDatas: allGameRoomDatas,
      logoPath: logoPath,
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
    }


    // Action Cable, Audio, Page Title の参照を管理するRef (インスタンスプロパティとして)
    this.matchingChannelRef = null; // Action Cable チャネルのインスタンス
    this.connectionCheckInterval = null; // 接続監視用インターバルID
    this.heartbeatInterval = null; // ハートビート用インターバルID

    this.audioContextRef = null; // AudioContext のインスタンス
    this.notificationSoundBufferRef = null; // 通知音のオーディオバッファ
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
    this.setupAudio = this.setupAudio.bind(this);
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

    // visibilitychange イベントリスナー
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    //this.handleKeyDown(event);
    //デバッグモード
    window.addEventListener('keydown', (event) => { if (event.key === 'd' || event.key === 'D') { 
      event.preventDefault(); //dでブックマーク登録を防ぐ
      this.handleKeyDown();
      /*if(!this.state.debugMode){
        this.setState({ debugMode: true})
      }else if(this.state.debugMode){
        this.setState({ debugMode: false})
      }*/
    } });

    //ユーザーのニックネームが武座裏に保存されてたら
    //console.log("localStorage.getItem(this.USERNAME_KEY):" +localStorage.getItem(this.USERNAME_KEY))
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
    //console.log("CSRF Token obtained:", csrfToken); // ⭐ ログを追加 ⭐
    if (!csrfToken) {
      console.error("CSRF token is empty! Check your application.html.erb and Turbolinks/Turbo settings.");
    }
    return csrfToken;
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

    /*if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
      this.matchingChannelRef = null;
    }*/
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
    //console.log("checkAndRedirectIfMatched - matchedStatus:", matchedStatus);

    this.check_maching_data(roomId).then(result =>{//game_room_dataが作成されているはずなのでgame_room_dataを取得
        //console.log("しresult:"+result)
        const [ this_user_room_game_data , matching_user_exists, matchingQueueLength, allGameRoomDatas]= result
        /*console.log("あgame_room_data:"+this_user_room_game_data)
        console.log("matching_user_exists:"+matching_user_exists)
        console.log("matchingQueueLength:"+matchingQueueLength)
        console.log("allGameRoomDatas:"+allGameRoomDatas)
        */
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
          
          // クライアントが切断されていたら再購読を試みる
          /*if (!this.matchingChannelRef || !this.matchingChannelRef.consumer.connection.isOpen()) {
            console.log("アクションケーブル接続が失われたか、または開いていない。再初期化を試みます。");
            if (this.sessionIdRef) {
              this.subscribeToMatchingChannel(this.sessionIdRef);
            } else {
              console.error("localStorageにセッションIDが見つかりません。");
            }
          }*/
        }else{
          // マッチング状態がクリアされているか、存在しない場合
          this.resetMatchingUI();
        }
        this.setState({ isLoading: false})
    });

    /*
    if (matchedStatus === 'matched' && roomId) {
      //const game_room_data = this.check_maching_data(roomId).then((game_room_data) =>//game_room_dataが作成されているはずなのでgame_room_dataを取得
      this.check_maching_data(roomId).then(game_room_data , matching_user_exists=>{//game_room_dataが作成されているはずなのでgame_room_dataを取得
        console.log("game_room_data:"+game_room_data)
        console.log("マッチング成立済みの状態が検出されました。");
        if(game_room_data){
          this.reNotificationEnemy(game_room_data,playerRole,roomId)//一応相手に通知・matching_controller.rbでマッチングが成立した双方に通知送っているけどなぜか反映されないこともあるので再び相手に通知
          this.handleMatchedAndStore(roomId, playerRole) // UI更新とリンク表示
          this.attemptRedirect(roomId)
        }
     });

    } else if (matchedStatus === 'in_progress') {
      // 進行中なら、マッチングUIを再度表示し、WebSocket接続が維持されていることを確認
      this.setState({
        isMatching: true,
        isGameFound: false,
        loadingMessage: '対戦相手を検索中です...',
      });
      this.flashPageTitle('マッチング中...');
      
      // クライアントが切断されていたら再購読を試みる
      if (!this.matchingChannelRef || !this.matchingChannelRef.consumer.connection.isOpen()) {
        console.log("アクションケーブル接続が失われたか、または開いていない。再初期化を試みます。");
        if (storedSessionId) {
          this.subscribeToMatchingChannel(storedSessionId);
        } else {
          console.error("localStorageにセッションIDが見つかりません。");
        }
      }
    } else {
      // マッチング状態がクリアされているか、存在しない場合
      this.resetMatchingUI();
    }*/
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
          //body: JSON.stringify({ roomId: roomId ,sessionId: localStorage.getItem(this.SESSION_ID_KEY)})
          body: JSON.stringify({ roomId: roomId ,sessionId: this.sessionIdRef})
        });
        const data = await response.json();
        //const game_room_data = data.check_data.room_game_data_json;
        const this_user_room_game_data = data.check_data.this_user_room_game_data;
        const matching_user_exists = data.check_data.matching_user_exists;
        const matchingQueueLength = data.check_data.matching_queue_length;
        const allGameRoomDatas = data.check_data.all_room_game_data_json
        //this.setState({ allGameRoomDatas: allGameRoomDatas });
        /*console.log('だdata:', JSON.stringify(data));
        console.log('this_user_room_game_data:', JSON.stringify(this_user_room_game_data));
        console.log('matching_user_exists:', data.check_data.matching_user_exists);
        console.log('matchingQueueLength:', data.check_data.matching_queue_length);
        console.log('allGameRoomDatas:', allGameRoomDatas);
        */

        return [this_user_room_game_data,matching_user_exists,matchingQueueLength,allGameRoomDatas]
      }catch (error) {
        console.error('エラー:', error);
      }
  }

  //一応相手に通知・matching_controller.rbでマッチングが成立した双方に通知送っているけどなぜか反映されないこともあるので再び相手に通知
  reNotificationEnemy(game_room_data, playerRole, roomId){
    if(!game_room_data){
      console.log("あgame_room_data:"+JSON.stringify(game_room_data))
      const sente_identifier = JSON.parse(game_room_data).sente_identifier;
      const gote_identifier = JSON.parse(game_room_data).gote_identifier;
      console.log("sente_identifier:"+sente_identifier)
      console.log("gote_identifier:"+gote_identifier)
      console.log("playerRole:"+playerRole)

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
            //this.setState({ allGameRoomDatas: data.game_room_data });
            // 既存のallGameRoomDatasに新しいデータを追加
            /*this.setState(prevState => ({
              allGameRoomDatas: {
                ...prevState.allGameRoomDatas,
                [data.room_id]: JSON.parse(data.game_room_data)
              }
            }));*/
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
            console.log("ユーザーが追加された");
          } else if (data.status === 'canceled') {
            this.setState({ loadingMessage: data.message });
            console.log("マッチング人数：", data.debug_data.matching_queue_length);
            console.log("マッチングデータ：", data.debug_data.matching_queue_data);
            this.resetMatchingUI();
          } else if (data.status === 'in_progress') {
            this.setState({
              matchingQueueLength: data.matching_queue_length,
              loadingMessage: data.message,
              isMatching: true, // UIをマッチング中に設定
              isGameFound: false, // ゲーム見つかった状態をリセット
            });
            this.flashPageTitle('マッチング中...');
          // pong受信時の処理（ハートビート応答）
          }else if (data.type === 'pong') {
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
    //console.log("connection:", this.matchingChannelRef.consumer?.connection);
    //console.log("isOpen:", this.matchingChannelRef.consumer?.connection?.isOpen());

    return this.matchingChannelRef && this.matchingChannelRef.consumer?.connection?.isOpen();
  }
  // ハートビート機能の設定（接続維持）・定期的にサーバーにpingを送信
  setupHeartbeat = () => {
    console.log("setupHeartbeat()")
    this.heartbeatInterval = setInterval(() => {// x秒ごとにサーバーにpingを送信
      if (this.isConnectionOpen()) {// 接続が開いている場合のみpingを送信
        this.matchingChannelRef.perform('ping', { timestamp: Date.now(), sessionId: this.sessionIdRef });// 現在時刻を送信
      }
    }, 30000); // 30秒ごと
  }
  // 手動でActionCableに再接続ボタンのハンドラー
  handleManualActionvCableReconnect = () => {
    console.log("手動再接続を実行");
    this.reSubscribeToMatchingChannel();
  }


  // ページロード時の初期処理
  initializeMatchingSystem() {
    this.subscribeToMatchingChannel(this.sessionIdRef); // 取得したセッションIDでActionCable購読開始
    //this.connectToMatching(); // ActionCable接続を開始
    this.setupConnectionMonitoring(); // 接続状態の監視を開始
    this.setupHeartbeat(); // ハートビート機能を開始
    this.checkAndRedirectIfMatched(); // ロード時にマッチング済みかチェック

    /*const matchingDataElement = document.querySelector('#matching-data');
    if (matchingDataElement) {
      const currentSessionIdFromDOM = matchingDataElement.dataset.sessionId;
      this.sessionIdRef = currentSessionIdFromDOM; // Refに保存
      localStorage.setItem(this.SESSION_ID_KEY, currentSessionIdFromDOM); // localStorageにも保存
      console.log("initializeMatchingSystemのcurrentSessionIdFromDOM"+currentSessionIdFromDOM);
      this.subscribeToMatchingChannel(currentSessionIdFromDOM); // 取得したセッションIDで購読開始
      this.checkAndRedirectIfMatched(); // ロード時にマッチング済みかチェック
    } else {
      console.warn("#matching-data 要素が見つかりません。セッションIDの取得に失敗しました。");
    }*/
  }

  // --- イベントハンドラ ---
  handleBattleTypeChange(event) {
    this.setState({ battleType: event.target.value });
  }

  //マッチング開始
  async handleStartMatching() {
    this.setupAudio(); // ユーザー操作でオーディオを準備

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
      console.error('マッチング開始エラー:', error);
      this.setState({ loadingMessage: 'マッチング開始に失敗しました。' });
      this.resetMatchingUI();
    }
  }

  async handleCancelMatching() {
    /*if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
      this.matchingChannelRef = null;
    }*/
    
    try {
      const response = await fetch('/matching/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      });
      const data = await response.json();
      console.log('Matching cancel response:', data);
      this.setState({ loadingMessage: data.message });
      this.resetMatchingUI();
    } catch (error) {
      console.error('マッチングキャンセルエラー:', error);
      this.setState({ loadingMessage: 'マッチングキャンセルに失敗しました。' });
      this.resetMatchingUI();
    }
  }

  async handleAllReset() {
    localStorage.removeItem(this.MATCH_STATUS_KEY);
    localStorage.removeItem(this.MATCH_ROOM_ID_KEY);
    localStorage.removeItem(this.MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(this.SESSION_ID_KEY);
    console.log("マッチング情報の全削除処理");
    
    /*if (this.matchingChannelRef) {
      this.matchingChannelRef.unsubscribe();
      this.matchingChannelRef = null;
    }*/
    try {
      const response = await fetch('/matching/all_delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        }
      });
      const data = await response.json();
      console.log('マッチング情報を全部削除した:', data);
      this.setState({ loadingMessage: data.message });
      this.resetMatchingUI();
    } catch (error) {
      console.error('マッチングキャンセルエラー:', error);
      this.setState({ loadingMessage: 'マッチングキャンセルに失敗しました。' });
      this.resetMatchingUI();
    }
    console.log("セッションを削除してCSRFトークンも初期化されてしまうのでリロード");
    window.location.reload(); // ページリロード
  }

  // デバッグ
  async handleKeyDown(){
  //async handleKeyDown(event) {
    //if (event.key === 'd' || event.key === 'D') {
      //console.log("dボタンでデバッグモード");
      this.setState(prevState => ({ debugMode: !prevState.debugMode }));
      //console.log("debugMode:", this.state.debugMode); // setStateは非同期なので、このログは古いstateを参照する可能性あり

      const roomId = localStorage.getItem(this.MATCH_ROOM_ID_KEY);
      //console.log("roomId:",roomId );

      /*if (!this.matchingChannelRef || !this.matchingChannelRef.consumer?.connection?.isOpen()) {
        console.log("アクションケーブル接続が失われたか、または開いていない。再初期化を試みます。");
        if (this.sessionIdRef) {
          this.subscribeToMatchingChannel(this.sessionIdRef);
        } else {
          console.error("localStorageにセッションIDが見つかりません。");
        }
      }*/

      //console.log("this.matchingChannelRef:",this.matchingChannelRef );
      //console.log("this.sessionIdRef:",this.sessionIdRef );
      
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
    //}
    //this.matchingChannelRef.perform('test', {test:"test"});
  }

  // visibilitychange イベントハンドラ
  /*handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      console.log("タブがアクティブになりました。");
      this.checkAndRedirectIfMatched();
    }
  }*/
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
    // クライアントが切断されていたら再購読を試みる
    //if (!this.matchingChannelRef || !this.matchingChannelRef.consumer.connection.isOpen()) {
    /*if (!this.matchingChannelRef || !this.matchingChannelRef.consumer?.connection?.isOpen()) {
        console.log("アクションケーブル接続が失われたか、または開いていない。再初期化を試みます。");
        if (this.sessionIdRef) {
          this.subscribeToMatchingChannel(this.sessionIdRef);
          this.matchingChannelRef.perform('matchedTest', {
            battleType: this.state.battleType,
            userName: this.state.username
          });
        } else {
          console.error("localStorageにセッションIDが見つかりません。");
        }
      }
    */
   /*if (!this.matchingChannelRef || !this.matchingChannelRef.consumer?.connection?.isOpen()) {
      console.log("アクションケーブル接続が失われたか、または開いていない。再初期化を試みます。");
      if (this.sessionIdRef) {
        this.subscribeToMatchingChannel(this.sessionIdRef);
        console.log("this.matchingChannelRef:",this.matchingChannelRef );
        this.matchingChannelRef.perform('matchedTest', {
          battleType: this.state.battleType,
          userName: this.state.username,
          sessionId: this.sessionIdRef,
          userAgent: navigator.userAgent
        });
      } else {
        console.error("localStorageにセッションIDが見つかりません。");
      }
    }*/

    this.matchingChannelRef.perform('matchedTest', {
      battleType: this.state.battleType,
      userName: this.state.username,
      sessionId: this.sessionIdRef,
      userAgent: navigator.userAgent
    });

  }



  render() {
    const { loadingimgPath, isLoading, allGameRoomDatas ,gamebackPath, actionCableIsConnected, battleType, isMatching, isGameFound, matchingQueueLength, loadingMessage, roomLink , debugMassage} = this.state;
    
      // debug_dataを解析
      let debug_matchingQueueLength;
      let debug_matchingQueueData;

      //console.log("gameRoomDatas:"+gameRoomDatas)
      //console.log("gameRoomDatas:"+JSON.parse(gameRoomDatas))

      //JSON.parse() は文字列をオブジェクトに変換する関数
      //let allGameRoomDatas_json = JSON.parse(allGameRoomDatas);
      let allGameRoomDatas_json;
      if (typeof allGameRoomDatas === 'string') {
        allGameRoomDatas_json = JSON.parse(allGameRoomDatas);
      } else {
        allGameRoomDatas_json = allGameRoomDatas;
      }
      //let allGameRoomDatas_json_length = Object.keys(allGameRoomDatas_json).length
      //console.log("ええええallGameRoomDatas_json:"+JSON.stringify(allGameRoomDatas_json))
      //console.log("うあああええallallGameRoomDatas_json:"+JSON.stringify(allGameRoomDatas_json))

      /*/テストデータ
      allGameRoomDatas_json= {
        "a9c0b2e1-b9fb-43e6-af36-cc06dc1258fa":{
          "sente_user_name":"アイくん",
          "gote_user_name":"鬼",
          "sente_identifier":"8f80807312a9e41b7c28d3a0a29211ce",
          "gote_identifier":"a801bd5414f38d63689a332d23a73003",
          "sente_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "gote_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "status":"active",
          "battleType":"10min",
          "created_at":1753363558,
        },"18da648f-f427-4e15-ae50-af7b5c512d49":{
          "sente_user_name":"あほくん",
          "gote_user_name":"バカちゃん",
          "sente_identifier":"a801bd5414f38d63689a332d23a73003",
          "gote_identifier":"8f80807312a9e41b7c28d3a0a29211ce",
          "sente_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "gote_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
          "status":"active",
          "battleType":"10min",
          "created_at":1753364500,
        }
      }*/
      
      /*for (const gameId in gameRoomDatas) {
        const gameData = gameRoomDatas[gameId];
        console.log(`ゲームID: ${gameId}`);
        console.log(`先手: ${gameData.sente_identifier}`);
        console.log(`後手: ${gameData.gote_identifier}`);
        console.log(`ステータス: ${gameData.status}`);
        console.log(`対戦タイプ: ${gameData.battleType}`);
        console.log('---');
      }*/
     /*Object.entries(gameRoomDatas_json).forEach(([id, details]) => {
        console.log("対局ID:", id);
        console.log("先手:", details.sente_identifier);
        console.log("後手:", details.gote_identifier);
        console.log("ステータス:", details.status);
        console.log("作成日時:", details.created_at);
        console.log("---------------------");
      });
      */
      /*Object.entries(gameRoomDatas).forEach(([gameId, info]) => {
        console.log("ゲームID:", gameId);
        console.log("先手ID:",  info.sente_identifier);
        console.log("後手ID:",  info.gote_identifier);
        console.log("開始時刻:", new Date(info.created_at * 1000).toLocaleString());
        console.log("--------------");
      });
      */


      /*if(debugMassage!="" || debugMassage!=undefined){
        const debugData = JSON.parse(debugMassage.debug_data);
        debug_matchingQueueLength = debugData.matching_queue_length;
        debug_matchingQueueData = debugData.matching_queue_data;
      }*/
     /*console.log(debugMassage)
     if(JSON.parse(debugMassage)){
      const parsedDebugData = JSON.parse(parsedDebugData.debug_data);
      const matchingQueueLength = parsedDebugData.matching_queue_length;
     }


      if (debugMassage && debugMassage.debug_data ) {
        try {
          const debugData = JSON.parse(debugMassage.debug_data);
          debug_matchingQueueLength = debugData.matching_queue_length;
          debug_matchingQueueData = debugData.matching_queue_data;
        } catch (error) {
          console.error('JSON解析エラー:', error);
        }
      }*/

    const { t } = this.props;
    //console.log("t:"+t)
    //{t('matching.title')}

    if (isLoading) {
      return (
        <div id="loading-overlay" className={`bg-[url('${loadingimgPath}')] bg-no-repeat bg-cover bg-center`}>
          <div className="spinner"></div>
          <p className="ml-4 text-xl text-white">{loadingMessage}</p>
        </div>
      );
    }

    return (
      <>
        <Header  logoPath={this.state.logoPath}  className="w-full"/>
        
        <div className={`h-[calc(100%-30px)] flex items-center justify-center from-indigo-500 to-purple-600 p-4  bg-no-repeat bg-cover bg-center bg-[url('${gamebackPath}')]`}>
          <div className="bg-[#696969] p-8 rounded-lg shadow-xl w-full max-w-md text-center">
            <h1 className="text-3xl font-extrabold text-white mb-6">aああ{t('matching.title')}</h1>
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
                  className="border p-2 rounded"
                />さん
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

          <div
            className={` text-white
            whitespace-pre    /* 改行をそのまま反映、折り返しも無効 */
            font-mono         /* 等幅フォントで見やすく */
            text-sm
            bg-black
            p-3
            border border-gray-200
            overflow-auto   /* 横長のときはスクロール */
            bg-[url('${gamebackPath}')]
            bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6
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
          {/*allGameRoomDatas_json && Object.entries(allGameRoomDatas_json).map(([roomId, gameDetails]) => (
            <a href={`/shogi/${roomId}`} className={`flex items-centerbg-[url('${gamebackPath}')]`} >
              <div key={roomId} className="mt-4 border-t border-gray-700 pt-4">
                <h3>{gameDetails.sente_user_name} vs {gameDetails.gote_user_name}</h3>
                <p>Status: {gameDetails.status}</p>
                <p>Battle Type: {gameDetails.battleType}</p>
                <p>Created At: {gameDetails.created_at}</p>
                
                <div className="text-center">
                  <div className="font-bold text-gray-800">{gameDetails.battleType}戦</div>
                </div>
              </div>
            </a>
          ))*/}

          {/* バトルカード */}
          <div className="space-y-4">
            {allGameRoomDatas_json && Object.entries(allGameRoomDatas_json).map(([roomId, gameDetails]) => {
                  const timeAgo = (ts) =>
                  (d => d < 0 ? (d = -d, d < 60 ? `${d}秒後` : d < 3600 ? `${Math.floor(d / 60)}分後` : d < 86400 ? `${Math.floor(d / 3600)}時間後` : `${Math.floor(d / 86400)}日後`) :
                    d < 60 ? `${d}秒前` : d < 3600 ? `${Math.floor(d / 60)}分前` : d < 86400 ? `${Math.floor(d / 3600)}時間前` : `${Math.floor(d / 86400)}日前`)
                  (Math.floor(Date.now() / 1000 - ts));

                  return (
                    <a key={roomId} href={roomLink}>
                      {/*<a href={`/shogi/${roomId}`} className={`flex items-centerbg-[url('${gamebackPath}')]`} >
                        <div key={roomId} className="mt-4 border-t border-gray-700 pt-4">
                          <h3>{gameDetails.sente_user_name} vs {gameDetails.gote_user_name}</h3>
                          <p>{gameDetails.status === "active" ? "対戦中" : gameDetails.status}</p>
                          <p>{gameDetails.battleType === "10min" ? "10分切れ負け戦" : gameDetails.battleType}</p>
                          <p>{timeAgo(gameDetails.created_at)}</p>
                        </div>
                      </a>
                      */}
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
                                  {/*<div className={`px-2 py-1 rounded-full text-xs font-medium`}>
                                    200
                                  </div>*/}
                                </div>

                                {/* VS */}
                                <div className="mx-4">
                                  <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg">VS</div>
                                </div>

                                {/* プレイヤー2 */}
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg mb-1">{gameDetails.gote_user_name}</div>
                                  {/*<div className={`px-2 py-1 rounded-full text-xs font-medium `}>
                                    110
                                  </div>*/}
                                </div>
                              </div>

                              {/* 右側の情報 */}
                              <div className="text-right">
                                {/*<div className="flex items-center gap-2 text-gray-300 mb-1">
                                  <span className="text-sm">10人 観戦中</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                  <span className="text-sm">89手</span>
                                </div>*/}
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

                          {/* 観戦ボタン 
                          <div className="ml-6">
                            <button className="group/btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2">
                              観戦する
                            </button>
                          </div>*/}
                        </div>

                        {/* プログレスバー（手数に基づく） 
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>対局進行度</span>
                            <span>{Math.min(100, (55 / 120) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (55 / 120) * 100)}%` }}
                            ></div>
                          </div>
                        </div>*/}

                        {/* ホバー時の追加情報 */}
                        {/*
                        {hoveredCard === battle.id && (
                          <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/10 animate-fade-in">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-gray-400 text-xs mb-1">平均手時間</div>
                                <div className="text-white font-medium">45秒</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-xs mb-1">予想勝率</div>
                                <div className="text-white font-medium">65% - 35%</div>
                              </div>
                              <div>
                                <div className="text-gray-400 text-xs mb-1">残り時間</div>
                                <div className="text-white font-medium">8:24 - 7:52</div>
                              </div>
                            </div>
                          </div>
                        )}
                        */}

                        {/* 装飾的な要素 */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-t-2xl">
                        </div>
                      </div>
                    </a>
                  );
                })}
            </div>
          </div>


            {/* デバッグモード */}
            {this.state.debugMode && (
              <div
                className="w-[70%] h-[50%] fixed top-7 left-4 opacity-85 bg-black overflow-auto"
              >
<h3>Version1</h3>
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








{/*
                {(() => {
                  try {
                    if (debugMassage) {
                      const parsedDebugData = JSON.parse(debugMassage);
                      if (parsedDebugData && parsedDebugData.debug_data) {
                        const debugData = JSON.parse(parsedDebugData.debug_data);
                        const matchingQueueLength = debugData.matching_queue_length;
                        const matchingQueueData_json = debugData.matching_queue_data;
                        const matchingQueueData = JSON.parse(matchingQueueData_json);
                        const identifier = matchingQueueData.identifier;
                        const user_agent = matchingQueueData.user_agent;

                        
                        return (
                          <div>
                            <h1
                              className="text-white"
                            >現在のマッチング人数: {matchingQueueLength}人</h1>
                            <h1
                              className="text-white"
                            >identifier: {identifier}</h1>
                            <h1
                              className="text-white"
                            >user_agent: {user_agent}</h1>

                          </div>
                        );
                      }
                    }
                  } catch (error) {
                    return <p className="text-white">JSON解析エラー: {error.message}</p>;
                  }
                  return null;
                })()}
*/}
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
      </>
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
    rootElement.className = 'h-full fixed top-0 w-full';
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

//export default withTranslation()(Matching);

/*// withTranslation で t を注入
const TranslatedMatching = withTranslation()(Matching);

// ReactRailsUJS にラップして登録
import ReactRailsUJS from 'react_ujs';
ReactRailsUJS.register({
  Matching: (props) => (
    <I18nextProvider i18n={i18n}>
      <TranslatedMatching {...props} />
    </I18nextProvider>
  )
});
*/
/*

// React コンポーネントをレンダリングする関数
// この関数は Turbolinks のロードイベントで呼び出されます。
const renderMatchingComponent = () => {
  // 既存のコンテナ要素を取得
  // Rails のビューファイル (例: app/views/matching/index.html.erb) に
  // <div id="react-matching-root"></div> のような要素を配置してください。
  const matchingContainer = document.getElementById('lobby-container'); 

  if (matchingContainer) {
    // 既に React ルートが作成されているか確認
    // _reactRoot は、React ルートインスタンスを保存するためのカスタムプロパティです。
    let root = matchingContainer._reactRoot; 

    if (!root) {
      // ルートがまだ存在しない場合、新しく作成
      root = ReactDOM.createRoot(matchingContainer);
      matchingContainer._reactRoot = root; // 作成したルートインスタンスを保存
      console.log("React root created for #react-matching-root");
    } else {
      console.log("Reusing existing React root for #react-matching-root");
    }

    // React コンポーネントをレンダリング（または再レンダリング）
    // これにより、コンポーネントの componentDidMount が適切に呼び出され直します。
    root.render(<Matching />);

    // CSRFトークンをグローバルに設定する行は、Reactコンポーネント内部で処理されるため、
    // ここでは特に必要ありませんが、もし他の場所で使うなら残しても良いです。
    const tokenElement = document.querySelector('meta[name="csrf-token"]');
    window.csrfToken = tokenElement ? tokenElement.content : '';
    console.log("CSRF Token updated globally (for other scripts if needed):", window.csrfToken);

  } else {
    // コンテナ要素が見つからない場合、このページがマッチングロビーではないと判断
    console.log("Matchingコンポーネントのコンテナ要素 (#react-matching-root) が見つかりませんでした。");
    // 既存のReactルートが存在する場合は、アンマウントしてクリーンアップすることも検討
    // 例: if (window._matchingReactRoot) { window._matchingReactRoot.unmount(); delete window._matchingReactRoot; }
  }
};

// ⭐ Turbolinks (Rails 6+ の Turbo も含む) の 'load' イベントで React コンポーネントをレンダリング ⭐
// これが、Turbolinks によるページ遷移時に React コンポーネントを正しく再初期化する鍵です。
document.addEventListener('turbo:load', renderMatchingComponent);
// 従来の Turbolinks (Rails 5.x など) を使用している場合はこちらも追加
document.addEventListener('turbolinks:load', renderMatchingComponent);

// 最初のフルページロード時 (Turbolinks が関与しない場合) のために DOMContentLoaded も残しておく
// ただし、Turbolinks が有効な場合は turbo:load/turbolinks:load が優先されることが多い
document.addEventListener('DOMContentLoaded', renderMatchingComponent);

// Turbolinks がページをキャッシュする前に React コンポーネントをアンマウントし、
// メモリリークや重複したイベントリスナーを防ぐためのクリーンアップ
document.addEventListener('turbo:before-cache', () => {
  const matchingContainer = document.getElementById('react-matching-root');
  if (matchingContainer && matchingContainer._reactRoot) {
    matchingContainer._reactRoot.unmount(); // コンポーネントツリーをアンマウント
    delete matchingContainer._reactRoot; // ルートインスタンスへの参照を削除
    console.log("React root unmounted before Turbolinks caching.");
  }
});


// 従来の Turbolinks の場合
document.addEventListener('turbolinks:before-cache', () => {
  const matchingContainer = document.getElementById('react-matching-root');
  if (matchingContainer && matchingContainer._reactRoot) {
    matchingContainer._reactRoot.unmount();
    delete matchingContainer._reactRoot;
    console.log("React root unmounted before Turbolinks caching.");
  }
});








*/






/*
document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startMatchingButton');
  const matchingStatusDiv = document.getElementById('matchingStatus');
  const loadingMessage = document.getElementById('loadingMessage');
  const gameRoomLinkDiv = document.getElementById('gameRoomLink');
  const roomLink = document.getElementById('roomLink');
  const cancelMatchingButton = document.getElementById('cancelMatchingButton');
  const AllResetButton = document.getElementById('AllResetButton');

  let matchingChannel = null; // Action Cable チャネルのインスタンスを保持

  let audioContext = null;
  let notificationSoundBuffer = null;

  const MATCH_STATUS_KEY = 'shogi_matching_status';
  const MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
  const MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
  const SESSION_ID_KEY = 'shogi_session_id'; // localStorageにセッションIDを保存するキー



  function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]').content;
  }

  //AudioContextと音源の準備・WebAudioAPI用の音声環境とサウンドファイルを初期化
  async function setupAudio() {
    if (!audioContext) {//audioContextが未作成の場合のみ新規作成
      audioContext = new (window.AudioContext || window.webkitAudioContext)();//AudioContextは音声処理のメインエンジン
      //重複作成を防ぐ理由：AudioContextは重いオブジェクト・複数作成するとメモリ使用量が増加・一つのページで一つのContextが基本
    }
    //音声ファイルの読み込み
    if (!notificationSoundBuffer) {
      try {
        const response = await fetch('/assets/notification.mp3');//fetch()でMP3ファイルをダウンロード
        const arrayBuffer = await response.arrayBuffer();//生データを取得(バイナリ変換)
        notificationSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);//decodeAudioData()でWeb Audio API用の形式に変換(音声デコード)
        console.log("通知音源をロードしました。");
      } catch (e) {
        console.error("通知音源のロードまたはデコードに失敗しました:", e);
      }
    }
  }

  //WebAudioAPIを使って通知音を再生する処理
  function playNotificationSound() {
    if (audioContext && notificationSoundBuffer) {//notificationSoundBufferは事前に読み込まれた音声データ
      const source = audioContext.createBufferSource();//音声バッファを再生するためのソースノードを作成・使い捨てオブジェクト（一度再生すると再利用不可）
      source.buffer = notificationSoundBuffer;//事前に読み込んだ音声データをソースに設定
      source.connect(audioContext.destination);//オーディオノードをスピーカー（destination）に接続・Web Audio APIは「ノードグラフ」という概念で音声処理
      source.start(0);// 再生開始・0は遅延なしで即座に再生開始を意味・source.start(2)なら2秒後に再生開始
      console.log("通知音を再生しました。");
    } else {
      console.warn("通知音を再生できません。オーディオコンテキストまたはバッファが未準備です。");
    }
  }

  let currentSessionId = null; // 現在のクライアントセッションIDを保持

  // --- Action Cable 購読処理 ---
  function subscribeToMatchingChannel(identifier) {
    //console.log("identifier:"+identifier)
    if (matchingChannel) {
      matchingChannel.unsubscribe(); // 既に購読済みなら一度解除
    }
    matchingChannel = consumer.subscriptions.create(
      { //channel: "MatchingStatusChannel", identifier: identifier }, // サーバーにidentifierを渡す
        channel: "MatchingChannel", 
        identifier: identifier, // サーバーにidentifierを渡す
        room_id: "room_001",
        matching: "matching"
      }, {
        connected() {
          console.log(`Action Cableが${identifier}のMatchingStatusChannelに接続されました`);
          // 接続時に、もし既にマッチ済みだったらリダイレクトを試みる
          checkAndRedirectIfMatched();
        },
        disconnected() {
          console.log(`${identifier}のMatchingStatusChannelからAction Cableが切断されました`);
          // ユーザーが切断された場合のUI更新など
          // 例えばマッチング待機中で切断されたら、UIをリセットするなど
          // resetMatchingUI(); // ページリロード時に問題になる可能性があるので注意
        },
        received(data) {
          //console.log('Action Cableから受信:', data);
          if (data.status === 'matched') {
            handleMatchedAndStore(data.room_id, data.player_role);
            attemptRedirect(data.room_id);
          }else if (data.status === 'user_added') {
            document.querySelector('.matching_queue_length').innerHTML = data.matching_queue_length;//現在のマッチング人数を更新
            console.log("ユーザーが追加された")
          } else if (data.status === 'canceled') {
            loadingMessage.textContent = data.message;
            console.log("マッチング人数："+data.debug_data.matching_queue_length)
            console.log("マッチングデータ："+data.debug_data.matching_queue_data)
            resetMatchingUI();
          } else if (data.status === 'in_progress') {
            document.querySelector('.matching_queue_length').innerHTML = data.matching_queue_length;//現在のマッチング人数を更新
            // サーバー側で接続時にin_progressを送り返すようにした場合
            loadingMessage.textContent = data.message;
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
            matchingStatusDiv.style.display = 'flex';
            cancelMatchingButton.style.display = 'block';
            gameRoomLinkDiv.style.display = 'none';
            flashPageTitle('マッチング中...');
          }
        }
      }
    );
  }

  //ページロード時の初期処理
  async function initializeMatchingSystem() {
    const matchingDataElement = document.querySelector('#matching-data');
    const currentSessionId = matchingDataElement.dataset.sessionId;
    const matchingQueue = matchingDataElement.dataset.matchingQueue;
    localStorage.setItem(SESSION_ID_KEY, currentSessionId); // localStorageにも保存
    console.log("matchingQueue:"+matchingQueue)

    subscribeToMatchingChannel(currentSessionId)// 取得したセッションIDで購読開始
    checkAndRedirectIfMatched(); // ロード時にマッチング済みかチェック
  }



  // マッチング開始ボタン
  startButton.addEventListener('click', async () => {
    setupAudio(); // ユーザー操作でオーディオを準備

    const battle_type_radios = document.getElementsByName('battle_type');
    let battle_type; 
    for (const radio of battle_type_radios) {
      if (radio.checked) {
        battle_type = radio.value;
        break;
      }
    }
    console.log("battle_type:"+battle_type)

    // UIの状態を「マッチング中」に設定
    startButton.disabled = true;
    startButton.classList.add('opacity-50', 'cursor-not-allowed');
    matchingStatusDiv.style.display = 'flex';
    loadingMessage.textContent = '対戦相手を検索中です...';
    cancelMatchingButton.style.display = 'block';
    gameRoomLinkDiv.style.display = 'none';

    // ローカルストレージのマッチング状態をクリア
    localStorage.removeItem(MATCH_STATUS_KEY);
    localStorage.removeItem(MATCH_ROOM_ID_KEY);
    localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);

    //console.log('getCsrfToken():'+getCsrfToken());

    try {
      // サーバーの /matching/start を叩く
      const response = await fetch('/matching/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          //'X-CSRF-Token': //getCsrfToken()
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ battleType: battle_type })
      });
      const data = await response.json();//レスポンスを取得
      console.log('Matching start response:', data);

      if (data.status === 'in_progress') {
        localStorage.setItem(MATCH_STATUS_KEY, 'in_progress'); // 進行中状態を保存
        document.querySelector('.matching_queue_length').innerHTML = data.matching_queue_length;//現在のマッチング人数を更新

        //console.log('redis_data:', data.redis_data);
        //console.log('sente_identifier:', data.redis_data.sente_identifier);
        //console.log('gote_identifier:', data.redis_data.gote_identifier);
        
        // in_progress のブロードキャストを待つ
      } else if (data.status === 'matched') {
        //console.log("data.player_role:"+data.player_role)
        // startを叩いた瞬間にマッチした場合
        handleMatchedAndStore(data.room_id, data.player_role);//マッチングが成立した際の共通処理
        attemptRedirect(data.room_id);//画面遷移を試みる
      } else {
        // 想定外のステータス（エラーなど）
        loadingMessage.textContent = `エラー: ${data.message}`;
        resetMatchingUI();//UIを初期状態に戻す
      }
    } catch (error) {
      console.error('マッチング開始エラー:', error);
      loadingMessage.textContent = 'マッチング開始に失敗しました。';
      resetMatchingUI();//UIを初期状態に戻す
    }
  });

  // マッチングが成立した際の共通処理（ローカルストレージへの保存を含む）
  function handleMatchedAndStore(roomId, playerRole) {
    loadingMessage.textContent = '対戦相手が見つかりました！ゲームを開始します。';
    matchingStatusDiv.style.display = 'none';
    gameRoomLinkDiv.style.display = 'block';
    roomLink.href = `/shogi/${roomId}`;
    roomLink.textContent = `ゲームを開始する (${playerRole === 'sente' ? '先手' : '後手'})`;

    // マッチング成立情報をローカルストレージに保存
    localStorage.setItem(MATCH_STATUS_KEY, 'matched');
    localStorage.setItem(MATCH_ROOM_ID_KEY, roomId);
    localStorage.setItem(MATCH_PLAYER_ROLE_KEY, playerRole);
    localStorage.setItem(SESSION_ID_KEY, playerRole);

    playNotificationSound();//通知音を再生
    flashPageTitle('マッチング！');//ブラウザのタブタイトルを点滅させる
  }

  // 画面遷移を試みる関数
  function attemptRedirect(roomId) {
    if (document.visibilityState === 'visible') {
      console.log("タブがアクティブなので、即座にリダイレクトします。");
      //window.location.href = `/shogi/${roomId}`;
      stopFlashingPageTitle();
    } else {
      console.log("タブが非アクティブなので、アクティブ化を待ちます。");
    }
  }

  // UIを初期状態に戻す関数
  function resetMatchingUI() {
    startButton.disabled = false;
    startButton.classList.remove('opacity-50', 'cursor-not-allowed');
    matchingStatusDiv.style.display = 'none';
    cancelMatchingButton.style.display = 'none';
    gameRoomLinkDiv.style.display = 'none';
    stopFlashingPageTitle();
    localStorage.removeItem(MATCH_STATUS_KEY);
    localStorage.removeItem(MATCH_ROOM_ID_KEY);
    localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
  }

  // キャンセルボタン
  if (cancelMatchingButton) {
    cancelMatchingButton.addEventListener('click', async () => {
      if (matchingChannel) {
        matchingChannel.unsubscribe(); // チャネル購読解除
        matchingChannel = null;
      }
      
      try {
        const response = await fetch('/matching/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          }
        });
        const data = await response.json();
        console.log('Matching cancel response:', data);
        loadingMessage.textContent = data.message;
        resetMatchingUI();
      } catch (error) {
        console.error('マッチングキャンセルエラー:', error);
        loadingMessage.textContent = 'マッチングキャンセルに失敗しました。';
        resetMatchingUI();
      }
    });
  }


  // マッチング情報の削除ボタン
  AllResetButton.addEventListener('click', async () => {
    // ローカルストレージのマッチング状態をクリア
    localStorage.removeItem(MATCH_STATUS_KEY);
    localStorage.removeItem(MATCH_ROOM_ID_KEY);
    localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);
    localStorage.removeItem(SESSION_ID_KEY);
    console.log("マッチング情報の全削除処理")
    console.log("localStorage(MATCH_STATUS_KEY):"+localStorage.getItem(MATCH_STATUS_KEY));
    console.log("localStorage(MATCH_ROOM_ID_KEY):"+localStorage.getItem(MATCH_ROOM_ID_KEY));
    console.log("localStorage(MATCH_PLAYER_ROLE_KEY):"+localStorage.getItem(MATCH_PLAYER_ROLE_KEY));
    console.log("localStorage(MATCH_PLAYER_ROLE_KEY):"+localStorage.getItem(SESSION_ID_KEY));

    if (matchingChannel) {
      matchingChannel.unsubscribe(); // チャネル購読解除
      matchingChannel = null;
    }
    try {
      const response = await fetch('/matching/all_delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        }
      });
      const data = await response.json();
      console.log('マッチング情報を全部削除した:', data);
      loadingMessage.textContent = data.message;
      resetMatchingUI();
    } catch (error) {
      console.error('マッチングキャンセルエラー:', error);
      loadingMessage.textContent = 'マッチングキャンセルに失敗しました。';
      resetMatchingUI();
    }

    alert("セッションを削除してCSRFトークンも初期化されてしまうのでリロード")
    location.reload();
  });

  //ページタイトル点滅関数
  let originalTitle = document.title;
  let titleInterval = null;

  //ブラウザのタブタイトルを点滅させる
  function flashPageTitle(message) {
    if (titleInterval) return;// 既に点滅中の場合は何もしない（重複実行防止）
    let isFlashing = false;// 点滅状態を管理するフラグ
    titleInterval = setInterval(() => {// 1秒間隔でタイトルを切り替える
      document.title = isFlashing ? originalTitle : `🔔 ${message} 🔔`;// 点滅状態に応じてタイトルを切り替え
      isFlashing = !isFlashing;// フラグを反転
    }, 1000);
  }

  //ブラウザのタブタイトルの点滅を停止する
  function stopFlashingPageTitle() {
    if (titleInterval) {// タイマーが実行中かチェック
      clearInterval(titleInterval);// 点滅タイマーを停止
      titleInterval = null;// タイマーIDをリセット
      document.title = originalTitle;// 元のタイトルに戻す
    }
  }

  //visibilitychangeイベントは、ブラウザのタブが表示・非表示に切り替わった時に発生・ユーザーが他のタブに移動したり、タブに戻ってきたりした時にトリガー
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {//visibilityStateプロパティでタブの現在の状態を確認し、visibleでタブが表示されている（アクティブ）なら実行
      console.log("タブがアクティブになりました。");
      checkAndRedirectIfMatched();//ロード時またはアクティブになったときにマッチング状態を確認しリダイレクト
    }
  });

  // ロード時またはアクティブになったときにマッチング状態を確認しリダイレクト
  function checkAndRedirectIfMatched() {
    const matchedStatus = localStorage.getItem(MATCH_STATUS_KEY);
    console.log("matchedStatus:"+matchedStatus);
    const roomId = localStorage.getItem(MATCH_ROOM_ID_KEY);
    const playerRole = localStorage.getItem(MATCH_PLAYER_ROLE_KEY);
    const sessionIdKey = localStorage.getItem(SESSION_ID_KEY);

    if (matchedStatus === 'matched' && roomId) {
      console.log("マッチング成立済みの状態が検出されました。");
      playNotificationSound();
      stopFlashingPageTitle();
      handleMatchedAndStore(roomId, playerRole); // UI更新とリンク表示
      attemptRedirect(roomId);
    } else if (matchedStatus === 'in_progress') {
      // 進行中なら、マッチングUIを再度表示し、WebSocket接続が維持されていることを確認
      startButton.disabled = true;
      startButton.classList.add('opacity-50', 'cursor-not-allowed');
      matchingStatusDiv.style.display = 'flex';
      loadingMessage.textContent = '対戦相手を検索中です...';
      cancelMatchingButton.style.display = 'block';
      gameRoomLinkDiv.style.display = 'none';
      flashPageTitle('マッチング中...');
      
      // クライアントが切断されていたら再購読を試みる
      if (!matchingChannel || !matchingChannel.consumer.connection.isOpen()) {
        console.log("アクションケーブル接続が失われたか、または開いていない");
        initializeMatchingSystem(); // 再初期化を試みる
      }
    }
  }

  // ページ読み込み時にシステムを初期化
  initializeMatchingSystem();
});
*/