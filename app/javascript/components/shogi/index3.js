// 仮定: GameコンポーネントがReactコンポーネントとして存在
function Room() {
//class Room extends React.Component {
  const [boardState, setBoardState] = React.useState({}); // 盤面状態を保持
  const [gameInfo, setGameInfo] = React.useState({});
  const [moveHistory, setMoveHistory] = React.useState([]);
  const [currentPlayer, setCurrentPlayer] = React.useState('先手');
  const [isConnected, setIsConnected] = React.useState(false);
  const subscriptionRef = React.useRef(null);
  let subscription;
  React.useEffect(() => {//レンダーの結果が画面に反映された後に動作します。つまりuseEffectとは、「関数の実行タイミングをReactのレンダリング後まで遅らせるhook」です。
    // URLから部屋番号を取得する例// 例: /shogi_games/123 -> room_id = "123"
    const pathSegments = window.location.pathname.split('/');
    const roomId = pathSegments[pathSegments.length - 1]; // URLの最後の部分を部屋番号と仮定
    //テストデータ
    const board = Array(9).fill(null).map(() => Array(9).fill(null));
    // サンプル駒配置（簡易版）
    board[0] = ['香', '桂', '銀', '金', '王', '金', '銀', '桂', '香'];
    board[1] = [null, '飛', null, null, null, null, null, '角', null];
    board[2] = ['歩', '歩', '歩', '歩', '歩', '歩', '歩', '歩', '歩'];
    board[6] = ['歩', '歩', '歩', '歩', '歩', '歩', '歩', '歩', '歩'];
    board[7] = [null, '角', null, null, null, null, null, '飛', null];
    board[8] = ['香', '桂', '銀', '金', '王', '金', '銀', '桂', '香'];
    //setBoardState(board);
    //setGameInfo(board);
    //setMoveHistory(board);
    //setCurrentPlayer("後手");
    
    if (!roomId) {
      console.error("URLにルームIDが見つかりません");
      return;
    }
    console.log(`ShogiGameChannelにroom_idでサブスクライブしようとしています: ${roomId}`);
    //const subscription = consumer.subscriptions.create(
    subscription = consumer.subscriptions.create(
      { channel: "ShogiGameChannel", room_id: roomId }, // チャンネル名と部屋番号をサーバーに送信
      {
        connected() {// 接続完了時
          console.log(`ShogiGameChannelに接続されています（ルームID: room_id）: ${roomId}`);
          // 接続時に現在の盤面データを要求するなどの処理
          // this.perform('request_initial_board_state'); // サーバー側で実装が必要
          this.perform('request_initial_board_state'); // ActionCable経由で初期データ要求
          //this.perform('request_initial_board_state', { move: { from: '7g', to: '7f' } ,currentPlayer: currentPlayer });
          
          //this.perform('start_rabbitmq_subscription'); // ActionCable経由で初期データ要求
          //this.perform('receive', { move: { from: '7g', to: '7f' } ,currentPlayer: currentPlayer }); // サーバーの receive メソッドを呼び出す
          setIsConnected(true);
        },
        disconnected() {// 切断時
          console.log(`ShogiGameChannelからroom_idで接続が切断されました。: ${roomId}`);
        },
        received(data) {// サーバーから盤面更新情報を受信した時
          console.log(`room_id のデータを取得しました。 ${roomId}:`, data);
          // ここで盤面データを更新し、Reactコンポーネントを再レンダリングする
          setBoardState(data.board); // 例: data.boardに新しい盤面データが入っている
          setCurrentPlayer(data.currentPlayer);
          const a = Array(9).fill(null).map(() => Array(9).fill(null));
          a[0] = data.last_move;
          a[1] = data.last_move;
          //setMoveHistory(data.last_move);
          //setMoveHistory(JSON.stringify(data.last_move));
          setMoveHistory(a);
          if (data.type === "initial_board") {
            setBoardState(data.board); // 初期盤面をセット
          }
          
          // ShogiコンポーネントがReactではない場合、ここでDOMを直接更新
          // shogiInstance.updateBoard(data.board);
        },
        // 必要に応じてクライアントからサーバーにメッセージを送るメソッド
        sendMove(move) {
          console.log("sendMoveメソッド")
          this.perform('receive', { move: move ,currentPlayer: currentPlayer }); // サーバーの receive メソッドを呼び出す
        }
      }
    );
    subscriptionRef.current = subscription;
    // クリーンアップ関数
    return () => {
      console.log(`ShogiGameChannelからroom_idでの購読を解除する: ${roomId}`);
      subscription.unsubscribe();
    };
  }, []); // []でコンポーネントマウント時のみ実行
  //subscriptionRef.current = subscription;
  const handleMove = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.sendMove({ from: "7g", to: "7f" });
    } else {
      console.warn("subscription がまだ確立されていません");
    }
  };
  const deleteData = () => {
    try {
      //const response = await fetch(`/api/games/${gameId}/destroy_data`, {
      const response = fetch(`/api/games/${gameId}/destroy_data`, {
        method: 'DELETE', // DELETEリクエスト
        headers: {
          'Content-Type': 'application/json',
          // RailsのCSRFトークンが必要な場合 (APIのみのコントローラーでは不要なことも多い)
          // 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
      });
      //const data = await response.json();
      const data = response.json()
      if (response.ok) { // HTTPステータスが2xx系の場合
        console.log('削除成功:', data.message);
        alert(data.message);
        // 削除成功後のUI更新（例: ページをリダイレクト、要素を隠すなど）
        window.location.href = '/'; // トップページへ戻る
      } else {
        console.error('削除失敗:', data.error || data.message);
        alert('データの削除に失敗しました: ' + (data.error || data.message));
      }
    } catch (error) {
      console.error('リクエストエラー:', error);
      alert('ネットワークエラーが発生しました。');
    }
  };

  // テスト用のボタン
  const simulateDataReceive = () => {
    const testData = {
      board: boardState,
      current_player: currentPlayer === '先手' ? '後手' : '先手',
      move: {
        from: [7, 7],
        to: [7, 6],
        piece: '歩'
      },
      game_info: {
        room_id: 'room_123',
        game_status: 'playing',
        timestamp: new Date().toISOString()
      }
    };
    
    handleReceivedData(testData);
  };
  const renderDataDisplay = () => {
    if (!boardState) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">盤面データを読み込み中...</div>
        </div>
      );
    }
  }

  return (
    <>
      {/* 実際のShogiコンポーネントをここにレンダリングする */}
      {/* <ShogiBoard boardData={boardState} onMove={subscription.sendMove} /> */}
      {/*<button onClick={() => subscription.sendMove({ from: '7g', to: '7f' })}>駒を動かすテスト</button> */}
  
      <Game />  
      <div className="bg-gray-100 p-4 rounded-lg">
        {/*<button
          onClick={() => subscription.sendMove({ from: '7g', to: '7f' })}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          テストデータ受信
        </button>
        */}
        <button
          onClick={handleMove}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          指し手を送信
        </button>
        <button
          onClick={deleteData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          試合が終わったのでデータ削除
        </button>
        <h3 className="text-lg font-bold mb-3">受信データ表示</h3>
        
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
        {moveHistory.length > 0 && (
          <div className="mb-3">
            <span className="font-semibold">指し手履歴:</span>
            <details className="mt-1">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">詳細を表示</summary>
              <div className="bg-white p-2 rounded max-h-32 overflow-y-auto mt-1">
                {moveHistory.map((move, index) => (
                  <div key={index} className="text-sm">
                    {index + 1}. {JSON.stringify(move)}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        {/* 生データ表示 */}
        <div className="mb-3">
          <span className="font-semibold">盤面データ:</span>
          <details className="mt-1">
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              詳細を表示
            </summary>
            <pre className="bg-white p-2 rounded text-xs mt-1 overflow-auto max-h-40">
              {boardState ? JSON.stringify(boardState, null, 2) : '盤面データなし'}
            </pre>
          </details>
        </div>
      
        <div className="max-w-6xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* データ表示エリア */}
            <div>
              {renderDataDisplay()}
            </div>
          </div>
        </div>
      </div>
    </>
    );
  //};
};
