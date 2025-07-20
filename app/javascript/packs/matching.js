import consumer from '../channels/consumer'; // Action Cableのconsumerをインポート


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
