// src/components/ShogiTimer/ShogiTimer.jsx

// Reactの必要なHooksとユーティリティをインポート
// useState: コンポーネントのステート（状態）を管理するためのHook
// useEffect: コンポーネントのライフサイクルイベント（マウント、更新、アンマウント）に応じた副作用を処理するためのHook
// useRef: DOM要素への参照や、再レンダリングされても値が保持される可変の値を保持するためのHook
// useCallback: 関数をメモ化し、不要な再レンダリングを防ぐためのHook
// useImperativeHandle: 親コンポーネントから子コンポーネントの特定のメソッドを呼び出せるようにするためのHook
// forwardRef: 関数コンポーネントがrefを受け取れるようにするためのユーティリティ
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';


// forwardRef を使用して、親コンポーネントから ref を受け取れるように関数コンポーネントをラップする
// ({ initialMinutes = 10, onTimeUp = () => {} }, ref) は、
// 1つ目の引数でprops（initialMinutesとonTimeUp）、2つ目の引数でrefを受け取ることを示す
//const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {} }, ref) => {
//const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {}, yourRole }, ref) => {
const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {}, yourRole, roomId, sendActionCableMessage }, ref) => {
    const initialTime = initialMinutes * 60 * 1000; // initialMinutes (初期分数) をミリ秒単位に変換して保持・例: 10分 * 60秒/分 * 1000ミリ秒/秒 = 600000ミリ秒
    const [senteTime, setSenteTime] = useState(initialTime);// useState Hook: 先手の残り時間を管理するステート変数と更新関数・初期値は initialTime
    const [goteTime, setGoteTime] = useState(initialTime);// useState Hook: 後手の残り時間を管理するステート変数と更新関数・初期値は initialTime
    const [activePlayer, setActivePlayer] = useState(null);// useState Hook: 現在アクティブなプレイヤー（'sente' または 'gote'）を管理するステート変数と更新関数・初期値はnull（ゲーム開始前）
    const [isPaused, setIsPaused] = useState(true);// useState Hook: タイマーが一時停止中かどうかを管理するステート変数と更新関数・初期値はtrue（ゲーム開始前は一時停止状態）
    const timerIntervalRef = useRef(null);    // useRef Hook: setInterval のIDを保持するためのRef・これにより、コンポーネントの再レンダリング時もIDが保持され、clearIntervalで停止できる
    const lastUpdateTimeRef = useRef(Date.now());    // useRef Hook: 最後に時間を更新した時刻を保持するためのRef・これにより、setIntervalの実行間隔のずれを吸収し、正確な経過時間を計算できる

        
    // Redisから初期状態を受け取り、ShogiTimerのstateを初期化する
    useImperativeHandle(ref, () => ({
        
        // 既存のメソッドに加え、サーバーからの状態同期メソッドを追加
        start: startTimer,
        pause: pauseTimer,
        toggle: toggleStartPause,
        switchTurn: switchTurn,
        reset: resetTimer,
        // ShogiTimer.jsx 内の initializeTimerState と syncTimerState
        // useImperativeHandle 内で公開するメソッド
        // ⭐ ここに initializeTimerState と syncTimerState を追加する
        initializeTimerState: (stateFromServer) => {
            console.log("Initializing timer state from server:", stateFromServer);
            const serverTimestamp = stateFromServer.lastUpdateTime || Date.now();
            const now = Date.now();
            const elapsedSinceServerAction = now - serverTimestamp;

            let adjustedSenteTime = stateFromServer.senteTime;
            let adjustedGoteTime = stateFromServer.goteTime;

            if (!stateFromServer.isPaused && stateFromServer.activePlayer === 'sente') {
                adjustedSenteTime = Math.max(0, adjustedSenteTime - elapsedSinceServerAction);
            } else if (!stateFromServer.isPaused && stateFromServer.activePlayer === 'gote') {
                adjustedGoteTime = Math.max(0, adjustedGoteTime - elapsedSinceServerAction);
            }

            setSenteTime(adjustedSenteTime);
            setGoteTime(adjustedGoteTime);
            setActivePlayer(stateFromServer.activePlayer);
            setIsPaused(stateFromServer.isPaused);
            lastUpdateTimeRef.current = now; // クライアントの基準で最終更新時刻を再設定

            // 必要であれば、初期化後にタイマーを開始
            if (!stateFromServer.isPaused && stateFromServer.activePlayer !== null && timerIntervalRef.current === null) {
                // startTimer() は直接呼ばず、setState後にuseEffectが反応するようにする
                // または、ここで setInterval を直接開始するロジックを実装
                // この場合、runTimerLogic が正しく動くように lastUpdateTimeRef.current が設定されていることを確認
                timerIntervalRef.current = setInterval(runTimerLogic, 100);
            }
        },
        syncTimerState: (stateFromServer) => {
            // サーバーからの更新に基づいてUIを同期 (補正ロジックを適用)
            console.log("Syncing timer state from server:", stateFromServer);
            const serverTimestamp = stateFromServer.lastUpdateTime || Date.now();
            const now = Date.now();
            const elapsedSinceServerAction = now - serverTimestamp;

            let adjustedSenteTime = stateFromServer.senteTime;
            let adjustedGoteTime = stateFromServer.goteTime;

            if (!stateFromServer.isPaused && stateFromServer.activePlayer === 'sente') {
                adjustedSenteTime = Math.max(0, adjustedSenteTime - elapsedSinceServerAction);
            } else if (!stateFromServer.isPaused && stateFromServer.activePlayer === 'gote') {
                adjustedGoteTime = Math.max(0, adjustedGoteTime - elapsedSinceServerAction);
            }

            setSenteTime(adjustedSenteTime);
            setGoteTime(adjustedGoteTime);
            setActivePlayer(stateFromServer.activePlayer);
            setIsPaused(stateFromServer.isPaused);
            lastUpdateTimeRef.current = now; // クライアントの基準で最終更新時刻を再設定

            // 状態が変更されたら setInterval を調整
            if (!stateFromServer.isPaused && stateFromServer.activePlayer !== null) {
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current);
                }
                timerIntervalRef.current = setInterval(runTimerLogic, 100);
            } else if (stateFromServer.isPaused && timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
/*        initializeTimerState: (stateFromServer) => {
            console.log("Initializing timer state from server:", stateFromServer);
            setSenteTime(stateFromServer.senteTime);
            setGoteTime(stateFromServer.goteTime);
            setActivePlayer(stateFromServer.activePlayer);
            setIsPaused(stateFromServer.isPaused);
            // 最終更新時刻も同期し、正確な経過時間計算に役立てる
            lastUpdateTimeRef.current = stateFromServer.lastUpdateTime || Date.now();

            // 必要であれば、初期化後にタイマーを開始
            // if (!stateFromServer.isPaused && stateFromServer.activePlayer !== null) {
            //     startTimer(); // startTimer内でisPausedチェックがあるのでこれでOK
            // }
        },
        syncTimerState: (stateFromServer) => {
            // サーバーからの更新に基づいてUIを同期
            console.log("Syncing timer state from server:", stateFromServer);
            setSenteTime(stateFromServer.senteTime);
            setGoteTime(stateFromServer.goteTime);
            setActivePlayer(stateFromServer.activePlayer);
            setIsPaused(stateFromServer.isPaused);
            // lastUpdateTimeRefは、runTimerLogicが呼ばれる直前に更新されるべきなので、ここでは直接設定しないか、
            // もしサーバーが最新のlastUpdateTimeを持つなら同期する
            lastUpdateTimeRef.current = stateFromServer.lastUpdateTime || Date.now();
        }*/
    }));

    const formatTime = useCallback((ms) => {// useCallback Hook: 時間を「MM:SS」形式の文字列にフォーマットする関数をメモ化・ 依存配列が空（[]）なので、コンポーネントのマウント時に一度だけ作成され、再レンダリングされても同じ関数インスタンスが使われる
        const totalSeconds = Math.floor(ms / 1000);// ミリ秒を秒に変換し、小数点以下を切り捨てる
        const minutes = Math.floor(totalSeconds / 60);// 秒を分に変換し、小数点以下を切り捨てる
        const seconds = totalSeconds % 60;// 残りの秒数を計算
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;// 分と秒を2桁表示にフォーマットし、結合して返す
    }, []); // 依存配列が空なので、この関数は一度だけ定義される

    const runTimerLogic = useCallback(() => {// useCallback Hook: タイマーの主要な時間減少ロジックをメモ化・activePlayerが変更された場合にのみ、この関数が再作成される
        const now = Date.now();// 現在の時刻を取得
        const elapsed = now - lastUpdateTimeRef.current;// 前回の更新からの経過時間を計算
        lastUpdateTimeRef.current = now;// 次の更新のために現在の時刻をlastUpdateTimeRefに保存
        let newSenteTime = senteTime;
        let newGoteTime = goteTime;
        /*if (activePlayer === 'sente') {
            newSenteTime = senteTime - elapsed;
            newSenteTime = newSenteTime < 0 ? 0 : newSenteTime;
            setSenteTime(newSenteTime);
        } else if (activePlayer === 'gote') {
            newGoteTime = goteTime - elapsed;
            newGoteTime = newGoteTime < 0 ? 0 : newGoteTime;
            setGoteTime(newGoteTime);
        }*/
        if (activePlayer === 'sente') {// 現在アクティブなプレイヤーに応じて時間を減らす
            setSenteTime(prevTime => { // setSenteTimeにアロー関数を渡すことで、最新のprevTime（前回のステート値）に基づいて安全に更新できる
                const newTime = prevTime - elapsed; // 経過時間を引く
                return newTime < 0 ? 0 : newTime; // 0未満にならないように調整
            });
        } else if (activePlayer === 'gote') {
            setGoteTime(prevTime => {// 同様に後手の時間を更新
                const newTime = prevTime - elapsed;
                return newTime < 0 ? 0 : newTime;
            });
        }
        // ⭐ ここでの sendActionCableMessage.updateTimer の呼び出しは削除するか、
        // 頻度を非常に少なく設定する
        // 例: 特定の閾値（例えば1秒）ごとにのみ送信する
        // if (Math.floor(senteTime / 1000) !== Math.floor(newSenteTime / 1000) || ...) {
        //    sendActionCableMessage.updateTimer(...)
        // }
        /*
        // ⭐ 時間が更新されるたびにサーバーに通知
        // これは頻繁に発生するので、最適化（例: 1秒ごと、または特定の閾値を超えたら送信）が必要かもしれません
        // ただし、正確な同期にはある程度の頻度が必要
        if (sendActionCableMessage.updateTimer) {
             sendActionCableMessage.updateTimer({
                senteTime: newSenteTime,
                goteTime: newGoteTime,
                activePlayer: activePlayer,
                isPaused: isPaused,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }*/
    //}, [activePlayer, senteTime, goteTime, isPaused, sendActionCableMessage.updateTimer]);
    }, [activePlayer, senteTime, goteTime]); // isPaused は runTimerLogic の依存からは外れることが多い
    //}, [activePlayer]); // activePlayerが変更されたらこの関数は再生成される

    
    

    const startTimer = useCallback(() => { // useCallback Hook: タイマーを開始する関数をメモ化・isPausedとactivePlayer、runTimerLogicが変更された場合にのみ、この関数が再作成される
        if (!isPaused || timerIntervalRef.current !== null) return;// タイマーが一時停止中でない、またはすでにsetIntervalが動いている場合は何もしない
        setIsPaused(false);// isPausedステートをfalse（非一時停止）に設定
        /*if (activePlayer === null) {// activePlayerがまだ設定されていない（初回スタート時）場合は先手に設定
            setActivePlayer('sente');
        }*/
        const playerToActivate = activePlayer === null ? 'sente' : activePlayer;
        setActivePlayer(playerToActivate);

        lastUpdateTimeRef.current = Date.now();// タイマー開始時の現在時刻を記録（正確な経過時間計算のため）
        timerIntervalRef.current = setInterval(runTimerLogic, 100); // 100ミリ秒ごとに runTimerLogic 関数を実行するsetIntervalを設定・そのIDを timerIntervalRef.current に保存
        // ⭐ サーバーにタイマー開始を通知
        if (sendActionCableMessage.toggleTimer) {
             sendActionCableMessage.toggleTimer({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: playerToActivate,
                isPaused: false,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, activePlayer, runTimerLogic, senteTime, goteTime, sendActionCableMessage.toggleTimer]);
    //}, [isPaused, activePlayer, runTimerLogic]); // 依存配列

    const pauseTimer = useCallback(() => { // useCallback Hook: タイマーを一時停止する関数をメモ化・isPausedが変更された場合にのみ、この関数が再作成される
        if (isPaused) return;// すでに一時停止中の場合は何もしない
        setIsPaused(true);// isPausedステートをtrue（一時停止）に設定
        if (timerIntervalRef.current) {// setIntervalを停止し、IDをクリア
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        // ⭐ サーバーにタイマー一時停止を通知
        if (sendActionCableMessage.toggleTimer) {
             sendActionCableMessage.toggleTimer({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: activePlayer,
                isPaused: true,
                lastUpdateTime: lastUpdateTimeRef.current // 一時停止時の正確な時間
             });
        }
    }, [isPaused, activePlayer, senteTime, goteTime, sendActionCableMessage.toggleTimer]);
    //}, [isPaused]); // 依存配列

    const toggleStartPause = useCallback(() => { // useCallback Hook: タイマーの開始/一時停止を切り替える関数をメモ化・isPaused、startTimer、pauseTimerが変更された場合にのみ、この関数が再作成される
        if (isPaused) {// 現在一時停止中なら開始、そうでなければ一時停止
            startTimer();
        } else {
            pauseTimer();
        }
    }, [isPaused, startTimer, pauseTimer]); // 依存配列

    const switchTurn = useCallback(() => { // useCallback Hook: 手番を交代する関数をメモ化・isPaused、senteTime、goteTimeが変更された場合にのみ、この関数が再作成される
        if (isPaused || senteTime <= 0 || goteTime <= 0) return;// タイマーが一時停止中、またはどちらかの時間が0以下の場合は手番交代させない
        //setActivePlayer(prevPlayer => (prevPlayer === 'sente' ? 'gote' : 'sente'));// activePlayerを現在のプレイヤーの反対に切り替える
        //lastUpdateTimeRef.current = Date.now();// 手番交代時にも時間をリセット（正確な経過時間計算のため）
        const nextPlayer = activePlayer === 'sente' ? 'gote' : 'sente';
        setActivePlayer(nextPlayer);
        lastUpdateTimeRef.current = Date.now();

        // ⭐ サーバーに手番交代を通知
        if (sendActionCableMessage.switchTurn) {
             sendActionCableMessage.switchTurn({
                senteTime: senteTime, // 現在の時間も送信し、サーバーで保存
                goteTime: goteTime,
                activePlayer: nextPlayer,
                isPaused: isPaused,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, senteTime, goteTime, activePlayer, sendActionCableMessage.switchTurn]);
    //}, [isPaused, senteTime, goteTime]); // 依存配列

    const resetTimer = useCallback(() => { // useCallback Hook: タイマーをリセットする関数をメモ化・initialTimeとpauseTimerが変更された場合にのみ、この関数が再作成される
        pauseTimer();// まずタイマーを停止
        setSenteTime(initialTime);// 先手と後手の時間を初期値に戻す
        setGoteTime(initialTime);
        setActivePlayer(null);// アクティブプレイヤーをリセット
        setIsPaused(true);// 一時停止状態に設定
        // ⭐ サーバーにタイマーリセットを通知
        if (sendActionCableMessage.resetTimer) {
             sendActionCableMessage.resetTimer({
                senteTime: initialTime,
                goteTime: initialTime,
                activePlayer: null,
                isPaused: true,
                lastUpdateTime: null // リセット時はlastUpdateTimeもnullに
             });
        }
    }, [initialTime, pauseTimer, sendActionCableMessage.resetTimer]);
    //}, [initialTime, pauseTimer]); // 依存配列

    // useImperativeHandle Hook: 親コンポーネントに特定のメソッドを公開する
    // ref: 親から渡されたrefオブジェクト
    // () => ({ ... }): ref.current に設定されるオブジェクトを返す関数
    // これにより、親コンポーネントは ref.current.start() のように子コンポーネントのメソッドを呼び出せる
    useImperativeHandle(ref, () => ({
        start: startTimer,       // startTimer 関数を 'start' という名前で公開
        pause: pauseTimer,       // pauseTimer 関数を 'pause' という名前で公開
        toggle: toggleStartPause, // toggleStartPause 関数を 'toggle' という名前で公開
        switchTurn: switchTurn,   // switchTurn 関数を 'switchTurn' という名前で公開
        reset: resetTimer        // resetTimer 関数を 'reset' という名前で公開
    }));

    // useEffect Hook: 時間切れを監視し、アラートを表示し、親コンポーネントに通知する
    // senteTime, goteTime, pauseTimer, onTimeUp のいずれかが変更された場合に実行される
    useEffect(() => {
        if (senteTime <= 0) {// 先手の時間が0以下になった場合
            pauseTimer(); // タイマーを停止
            console.log("先手の時間切れです！"); // アラート表示
            onTimeUp('sente'); // 親コンポーネントに先手の時間切れを通知
            // 時間切れもサーバーに通知するべきか検討 (ゲーム終了ロジックのため)
        }
        if (goteTime <= 0) {// 後手の時間が0以下になった場合
            pauseTimer(); // タイマーを停止
            console.log("後手の時間切れです！"); // アラート表示
            onTimeUp('gote'); // 親コンポーネントに後手の時間切れを通知
            // 時間切れもサーバーに通知するべきか検討
        }
    }, [senteTime, goteTime, pauseTimer, onTimeUp]); // 依存配列


    
    // useEffect Hook: タイマーの開始/停止、アクティブプレイヤーの変更に応じてsetIntervalを管理する
    // activePlayer, isPaused, runTimerLogic のいずれかが変更された場合に実行される
    useEffect(() => {
        if (!isPaused && activePlayer !== null) {// タイマーが一時停止中でなく、かつアクティブプレイヤーが設定されている場合
            if (timerIntervalRef.current) { // 既存のsetIntervalがあればクリアする（手番交代時や再開時に重複しないように）
                clearInterval(timerIntervalRef.current);
            }
            lastUpdateTimeRef.current = Date.now();// 新しいsetIntervalを開始する前に、最後の更新時間をリセット
            timerIntervalRef.current = setInterval(runTimerLogic, 100);// 100ミリ秒ごとに runTimerLogic を実行する新しいsetIntervalを設定
        } else if (isPaused && timerIntervalRef.current) {
            // タイマーが一時停止状態になり、かつsetIntervalが動いている場合
            clearInterval(timerIntervalRef.current); // setIntervalを停止
            timerIntervalRef.current = null; // IDをクリア
        }

        // コンポーネントがアンマウントされる際のクリーンアップ関数・これにより、コンポーネントが画面から消えたときにsetIntervalが確実に停止される
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [activePlayer, isPaused, runTimerLogic]); // 依存配列

    // useEffect Hook: コンポーネントがアンマウントされる際の最終的なクリーンアップ
    // 依存配列が空（[]）なので、コンポーネントのマウント時に一度だけ設定され、アンマウント時に一度だけ実行される
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []); // 依存配列が空なので、マウント時とアンマウント時に一度だけ実行される




    


    // 先手と後手のタイマー表示部分をJSX変数として定義
    const senteTimerDiv = (
        <div key="sente" className={`player-timer ${activePlayer === 'sente' ? 'active' : ''}`}>
            <h2>先手</h2>
            <div
                className="time"
                style={{ color: senteTime <= 0 ? 'red' : '#555' }}
            >
                {senteTime <= 0 ? '時間切れ！' : formatTime(senteTime)}
            </div>
        </div>
    );

    const goteTimerDiv = (
        <div key="gote" className={`player-timer ${activePlayer === 'gote' ? 'active' : ''}`}>
            <h2>後手</h2>
            <div
                className="time"
                style={{ color: goteTime <= 0 ? 'red' : '#555' }}
            >
                {goteTime <= 0 ? '時間切れ！' : formatTime(goteTime)}
            </div>
        </div>
    );

    // -----------------------------------------------------
    // JSXレンダリング: コンポーネントのUIを定義する部分
    // -----------------------------------------------------
    return (

        <div className="shogi-timer-container">
            <div className="timer-display-area">
                {yourRole === '先手' ? ( // yourRole が「先手」の場合、後手を上に、先手を下にする
                    <>
                        {goteTimerDiv}
                        {senteTimerDiv}
                    </>
                ) : ( // yourRole が「後手」の場合、または指定がない場合（デフォルト）、先手を上に、後手を下にする
                    <>
                        {senteTimerDiv}
                        {goteTimerDiv}
                    </>
                )}
            </div>
   {/*
            <div className="timer-controls">
                <button onClick={toggleStartPause}>
                    {isPaused ? 'ゲーム開始 / 再開' : '一時停止'}
                </button>
                <button 
                    onClick={switchTurn} 
                    disabled={isPaused || activePlayer === null || senteTime <= 0 || goteTime <= 0}
                >
                    手番交代
                </button>
                <button id="resetBtn" onClick={resetTimer}>
                    リセット
                </button>
            </div>
        </div>    
 
       // 全体を囲むdiv要素。CSSクラス 'shogi-timer-container' を適用 
        <div className="shogi-timer-container">
            <div className="timer-display-area">
                <div className={`player-timer ${activePlayer === 'sente' ? 'active' : ''}`}>
                    <h2>先手</h2>
                    <div 
                        className="time" 
                        style={{ color: senteTime <= 0 ? 'red' : '#555' }}
                    >
                        {senteTime <= 0 ? '時間切れ！' : formatTime(senteTime)}
                    </div>
                </div>

                <div className={`player-timer ${activePlayer === 'gote' ? 'active' : ''}`}>
                    <h2>後手</h2>
                    <div 
                        className="time" 
                        style={{ color: goteTime <= 0 ? 'red' : '#555' }}
                    >
                        {goteTime <= 0 ? '時間切れ！' : formatTime(goteTime)}
                    </div>
                </div>
            </div>

            <div className="timer-controls">
                <button onClick={toggleStartPause}>
                    {isPaused ? 'ゲーム開始 / 再開' : '一時停止'}
                </button>
                <button 
                    onClick={switchTurn} 
                    disabled={isPaused || activePlayer === null || senteTime <= 0 || goteTime <= 0}
                >
                    手番交代
                </button>
                <button id="resetBtn" onClick={resetTimer}>
                    リセット
                </button>
            </div>*/}
        </div>
    );
});

// ShogiTimer コンポーネントをエクスポートし、他のファイルからインポートできるようにする
export default ShogiTimer;






/*
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

// forwardRef を使用して、親から ref を受け取れるようにする
const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {} }, ref) => {
    const initialTime = initialMinutes * 60 * 1000;

    const [senteTime, setSenteTime] = useState(initialTime);
    const [goteTime, setGoteTime] = useState(initialTime);
    const [activePlayer, setActivePlayer] = useState(null);
    const [isPaused, setIsPaused] = useState(true);

    const timerIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(Date.now());

    const formatTime = useCallback((ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    const runTimerLogic = useCallback(() => {
        const now = Date.now();
        const elapsed = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now;
        
        if (activePlayer === 'sente') {
            setSenteTime(prevTime => {
                const newTime = prevTime - elapsed;
                return newTime < 0 ? 0 : newTime;
            });
        } else if (activePlayer === 'gote') {
            setGoteTime(prevTime => {
                const newTime = prevTime - elapsed;
                return newTime < 0 ? 0 : newTime;
            });
        }
    }, [activePlayer]);

    // startTimer 関数を useCallback でメモ化
    const startTimer = useCallback(() => {
        if (!isPaused || timerIntervalRef.current !== null) return;

        setIsPaused(false);
        if (activePlayer === null) {
            setActivePlayer('sente');
        }
        
        lastUpdateTimeRef.current = Date.now();
        timerIntervalRef.current = setInterval(runTimerLogic, 100);
        //console.log("lastUpdateTimeRef:"+lastUpdateTimeRef.current)
        //console.log("timerIntervalRef:"+timerIntervalRef.current)
    }, [isPaused, activePlayer, runTimerLogic]);

    // pauseTimer 関数を useCallback でメモ化
    const pauseTimer = useCallback(() => {
        if (isPaused) return;
        
        setIsPaused(true);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
    }, [isPaused]);

    // toggleStartPause 関数を useCallback でメモ化
    const toggleStartPause = useCallback(() => {
        if (isPaused) {
            startTimer();
        } else {
            pauseTimer();
        }
    }, [isPaused, startTimer, pauseTimer]);

    // switchTurn 関数を useCallback でメモ化
    const switchTurn = useCallback(() => {
        if (isPaused || senteTime <= 0 || goteTime <= 0) return;

        setActivePlayer(prevPlayer => (prevPlayer === 'sente' ? 'gote' : 'sente'));
        lastUpdateTimeRef.current = Date.now();
    }, [isPaused, senteTime, goteTime]);

    // resetTimer 関数を useCallback でメモ化
    const resetTimer = useCallback(() => {
        pauseTimer();
        setSenteTime(initialTime);
        setGoteTime(initialTime);
        setActivePlayer(null);
        setIsPaused(true);
    }, [initialTime, pauseTimer]);

    // useImperativeHandle を使って、親コンポーネントに特定のメソッドを公開する
    useImperativeHandle(ref, () => ({
        start: startTimer, // startTimer を start という名前で公開
        pause: pauseTimer, // pauseTimer を pause という名前で公開
        toggle: toggleStartPause, // toggleStartPause を toggle という名前で公開
        switchTurn: switchTurn, // switchTurn も公開
        reset: resetTimer // resetTimer も公開
    }));

    useEffect(() => {
        if (senteTime <= 0) {
            pauseTimer();
            alert("先手の時間切れです！");
            onTimeUp('sente');
        }
        if (goteTime <= 0) {
            pauseTimer();
            alert("後手の時間切れです！");
            onTimeUp('gote');
        }
    }, [senteTime, goteTime, pauseTimer, onTimeUp]);

    useEffect(() => {
        if (!isPaused && activePlayer !== null) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            lastUpdateTimeRef.current = Date.now();
            timerIntervalRef.current = setInterval(runTimerLogic, 100);
        } else if (isPaused && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [activePlayer, isPaused, runTimerLogic]);

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    return (
        <div className="shogi-timer-container">
            <h1>将棋持ち時間タイマー</h1>
            <div className="timer-display-area">
                <div className={`player-timer ${activePlayer === 'sente' ? 'active' : ''}`}>
                    <h2>先手</h2>
                    <div 
                        className="time" 
                        style={{ color: senteTime <= 0 ? 'red' : '#555' }}
                    >
                        {senteTime <= 0 ? '時間切れ！' : formatTime(senteTime)}
                    </div>
                </div>

                <div className={`player-timer ${activePlayer === 'gote' ? 'active' : ''}`}>
                    <h2>後手</h2>
                    <div 
                        className="time" 
                        style={{ color: goteTime <= 0 ? 'red' : '#555' }}
                    >
                        {goteTime <= 0 ? '時間切れ！' : formatTime(goteTime)}
                    </div>
                </div>
            </div>

            <div className="timer-controls">
                {// これらのボタンはShogiTimer内部で管理するため、App.jsからは直接操作しない *}
                {// App.jsから操作したい場合は、これらのボタンをApp.jsに移動するか、
                    App.jsから呼び出すメソッドをShogiTimerに実装する *}
                <button onClick={toggleStartPause}>
                    {isPaused ? 'ゲーム開始 / 再開' : '一時停止'}
                </button>
                <button 
                    onClick={switchTurn} 
                    disabled={isPaused || activePlayer === null || senteTime <= 0 || goteTime <= 0}
                >
                    手番交代
                </button>
                <button id="resetBtn" onClick={resetTimer}>
                    リセット
                </button>
            </div>
        </div>
    );
});

export default ShogiTimer;
*/