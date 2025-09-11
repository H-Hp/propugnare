import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {}, yourRole, roomId, sendActionCableMessage, debugMode }, ref) => {
    const initialTime = initialMinutes * 60 * 1000;

    const [senteTime, setSenteTime] = useState(initialTime);
    const [goteTime, setGoteTime] = useState(initialTime);
    const [activePlayer, setActivePlayer] = useState(null);
    const [isPaused, setIsPaused] = useState(true);

    const timerIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(Date.now()); // 最後にタイマーがローカルで更新された時刻

    // useImperativeHandle Hook
    useImperativeHandle(ref, () => ({
        start: startTimer,
        pause: pauseTimer,
        toggle: toggleStartPause,
        switchTurn: switchTurn,
        reset: resetTimer,
        
        // 追加: 現在の senteTime と goteTime を返すメソッド
        getSenteTime: () => senteTime,
        getGoteTime: () => goteTime,

        initializeTimerState: (stateFromServer) => {
            //console.log("ShogiTimer: Initializing timer state from server:", stateFromServer);
            const serverTimestamp = stateFromServer.lastUpdateTime || Date.now();
            const now = Date.now();
            const elapsedSinceServerAction = now - serverTimestamp;

            let adjustedSenteTime = stateFromServer.senteTime;
            let adjustedGoteTime = stateFromServer.goteTime;

            // サーバーから受け取った状態に基づいて時間を補正
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

            // setState後の値も確認
            //console.log(`DEBUG: After setState - senteTime: ${adjustedSenteTime}, goteTime: ${adjustedGoteTime}, activePlayer: ${stateFromServer.activePlayer}, isPaused: ${stateFromServer.isPaused}`);
              
            // サーバーから受信した状態に基づいてタイマーを開始/停止する
            if (!stateFromServer.isPaused && stateFromServer.activePlayer !== null) {
                // タイマーが動いているはずの状態なら、setIntervalを開始
                if (timerIntervalRef.current) {
                    clearInterval(timerIntervalRef.current); // 念のため既存のものをクリア
                }
                timerIntervalRef.current = setInterval(runTimerLogic, 100);
                //console.log("ShogiTimer: Initialized and started timer interval.");
            } else if (timerIntervalRef.current) {
                // タイマーが一時停止しているはずの状態なら、setIntervalを停止
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
                //console.log("ShogiTimer: Initialized and cleared timer interval.");
            }
        },
        syncTimerState: (stateFromServer) => {
            //console.log("ShogiTimer: Syncing timer state from server:", stateFromServer);
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
            //console.log(`DEBUG: After setState - senteTime: ${adjustedSenteTime}, goteTime: ${adjustedGoteTime}, activePlayer: ${stateFromServer.activePlayer}, isPaused: ${stateFromServer.isPaused}`);

            setSenteTime(adjustedSenteTime);
            setGoteTime(adjustedGoteTime);
            setActivePlayer(stateFromServer.activePlayer);
            setIsPaused(stateFromServer.isPaused);
            lastUpdateTimeRef.current = now;

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
    }));

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
            setSenteTime(prevTime => Math.max(0, prevTime - elapsed));
        } else if (activePlayer === 'gote') {
            setGoteTime(prevTime => Math.max(0, prevTime - elapsed));
        }
    }, [activePlayer]);

    const startTimer = useCallback(() => {
        if (!isPaused || timerIntervalRef.current !== null) return;

        // activePlayerがnullの場合、'sente'をデフォルトに設定
        const playerToActivate = activePlayer === null ? 'sente' : activePlayer;

        // Action Cable でサーバーに送信する前に状態を更新する
        setIsPaused(false);
        setActivePlayer(playerToActivate);
        lastUpdateTimeRef.current = Date.now();

        if (sendActionCableMessage.sendToggleTimer) {
             sendActionCableMessage.sendToggleTimer({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: playerToActivate,
                isPaused: false,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, activePlayer, senteTime, goteTime, sendActionCableMessage]);

    const pauseTimer = useCallback(() => {
        if (isPaused) return;

        // Action Cable でサーバーに送信する前に状態を更新する
        setIsPaused(true);
        lastUpdateTimeRef.current = Date.now(); // 一時停止時もタイムスタンプを更新

        if (sendActionCableMessage.sendToggleTimer) {
             sendActionCableMessage.sendToggleTimer({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: activePlayer,
                isPaused: true,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, activePlayer, senteTime, goteTime, sendActionCableMessage]);

    const toggleStartPause = useCallback(() => {
        if (isPaused) {
            startTimer();
        } else {
            pauseTimer();
        }
    }, [isPaused, startTimer, pauseTimer]);

    const switchTurn = useCallback(() => {
        if (isPaused || senteTime <= 0 || goteTime <= 0) return;
        const nextPlayer = activePlayer === 'sente' ? 'gote' : 'sente';
        // Action Cable でサーバーに送信する前に状態を更新する
        setActivePlayer(nextPlayer);
        lastUpdateTimeRef.current = Date.now();
        if (sendActionCableMessage.sendSwitchTurn) {
             sendActionCableMessage.sendSwitchTurn({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: nextPlayer,
                isPaused: isPaused,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, senteTime, goteTime, activePlayer, sendActionCableMessage]);

    const resetTimer = useCallback(() => {
        // ローカルの状態を即座にリセット
        setSenteTime(initialTime);
        setGoteTime(initialTime);
        setActivePlayer(null);
        setIsPaused(true);
        lastUpdateTimeRef.current = Date.now(); // リセット時もタイムスタンプを更新

        // サーバーにリセットを通知
        if (sendActionCableMessage.sendResetTimer) {
             sendActionCableMessage.sendResetTimer({
                senteTime: initialTime,
                goteTime: initialTime,
                activePlayer: null,
                isPaused: true,
                lastUpdateTime: lastUpdateTimeRef.current // リセット時のタイムスタンプ
             });
        }
    }, [initialTime, sendActionCableMessage]);


    // 時間切れを監視
    useEffect(() => {
        if (senteTime <= 0) {
            pauseTimer();
            //console.log("先手の時間切れです！");
            onTimeUp('sente'); // 親コンポーネントに通知
        }
        if (goteTime <= 0) {
            pauseTimer();
            //console.log("後手の時間切れです！");
            onTimeUp('gote'); // 親コンポーネントに通知
        }
    }, [senteTime, goteTime, pauseTimer, onTimeUp]);

    // isPaused と activePlayer の変更に応じて setInterval を管理
    useEffect(() => {
        if (!isPaused && activePlayer !== null) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            timerIntervalRef.current = setInterval(runTimerLogic, 100);
        } else if (isPaused && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [activePlayer, isPaused, runTimerLogic]);

    // アンマウント時のクリーンアップ
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    const senteTimerDiv = (
        <div key="sente" className={`player-timer ${activePlayer === 'sente' ? 'active' : ''}`}>
            <h2>先手</h2>
            <div
                className="time"
                style={{ color: senteTime <= 0 ? 'red' : 'white' }}
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
                style={{ color: goteTime <= 0 ? 'red' : 'white' }}
            >
                {goteTime <= 0 ? '時間切れ！' : formatTime(goteTime)}
            </div>
        </div>
    );

    return (
        <div className="shogi-timer-container">
            <div className="timer-display-area">
                {/* 自分の役割に応じてタイマーの表示順を切り替える */}
                {yourRole === 'sente' ? (
                    <>
                        {goteTimerDiv} {/* 相手の時間を上に表示 */}
                        {senteTimerDiv} {/* 自分の時間を下に表示 */}
                    </>
                ) : (
                    <>
                        {senteTimerDiv} {/* 相手の時間を上に表示 */}
                        {goteTimerDiv} {/* 自分の時間を下に表示 */}
                    </>
                )}
            </div>

            {debugMode && (
            <div className="timer-controls">
                <button onClick={toggleStartPause} className="control-button">
                    {isPaused ? 'ゲーム開始 / 再開' : '一時停止'}
                </button>
                <button
                    onClick={switchTurn}
                    // activePlayer が null の間は手番交代できないようにする
                    disabled={isPaused || activePlayer === null || senteTime <= 0 || goteTime <= 0}
                    className="control-button"
                >
                    手番交代
                </button>
                <button onClick={resetTimer} className="control-button">
                    リセット
                </button>
            </div>
            )}
        </div>
    );
});

export default ShogiTimer;