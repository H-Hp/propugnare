// src/components/ShogiTimer/ShogiTimer.jsx
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
//import './ShogiTimer.css'; // 必要に応じてCSSファイルをインポート

const ShogiTimer = forwardRef(({ initialMinutes = 10, onTimeUp = () => {}, yourRole, roomId, sendActionCableMessage }, ref) => {
    const initialTime = initialMinutes * 60 * 1000;

    const [senteTime, setSenteTime] = useState(initialTime);
    const [goteTime, setGoteTime] = useState(initialTime);
    const [activePlayer, setActivePlayer] = useState(null);
    const [isPaused, setIsPaused] = useState(true);

    const timerIntervalRef = useRef(null);
    const lastUpdateTimeRef = useRef(Date.now()); // 最後にタイマーがローカルで更新された時刻

    // useImperativeHandle Hook: 親コンポーネントに特定のメソッドを公開する
    // ⭐ このブロックが正しく記述されていることを再確認してください！
    useImperativeHandle(ref, () => ({
        // 親から呼び出される公開メソッド
        start: startTimer,
        pause: pauseTimer,
        toggle: toggleStartPause,
        switchTurn: switchTurn,
        reset: resetTimer,

        // ⭐ initializeTimerState と syncTimerState は必須
        initializeTimerState: (stateFromServer) => {
            console.log("ShogiTimer: Initializing timer state from server:", stateFromServer);
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

            // サーバーから受信した状態に基づいてタイマーを開始/停止
            // ここで setInterval を直接操作する方が、useEffectに任せるより確実な場合があります
            if (!stateFromServer.isPaused && stateFromServer.activePlayer !== null && timerIntervalRef.current === null) {
                timerIntervalRef.current = setInterval(runTimerLogic, 100);
            } else if (stateFromServer.isPaused && timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        },
        syncTimerState: (stateFromServer) => {
            console.log("ShogiTimer: Syncing timer state from server:", stateFromServer);
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

            // サーバーから受信した状態に基づいてタイマーを開始/停止
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

    // 時間を「MM:SS」形式の文字列にフォーマットする関数
    const formatTime = useCallback((ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, []);

    // タイマーの主要な時間減少ロジック (ローカルで時間を減らす)
    const runTimerLogic = useCallback(() => {
        const now = Date.now();
        const elapsed = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now; // 次の計算のために更新

        if (activePlayer === 'sente') {
            setSenteTime(prevTime => Math.max(0, prevTime - elapsed));
        } else if (activePlayer === 'gote') {
            setGoteTime(prevTime => Math.max(0, prevTime - elapsed));
        }
        // ⭐ ここで sendActionCableMessage.updateTimer を頻繁に呼び出すのは避ける
        // 重要な状態変化 (手番交代、一時停止/再開) のみサーバーに通知する
    }, [activePlayer]); // senteTime, goteTime はsetStateのコールバック形式で安全なので依存不要

    // タイマーを開始する関数（Action Cableを通じてサーバーにも通知）
    const startTimer = useCallback(() => {
        if (!isPaused || timerIntervalRef.current !== null) return;

        setIsPaused(false);
        const playerToActivate = activePlayer === null ? 'sente' : activePlayer;
        setActivePlayer(playerToActivate);

        lastUpdateTimeRef.current = Date.now();
        // setInterval は useEffect で管理されるため、ここでは直接開始しない（または、開始するならuseEffectから除外）
        // ここでは、stateの変更によってuseEffectがトリガーされることを期待
        // timerIntervalRef.current = setInterval(runTimerLogic, 100); // サーバー通知のみ
        if (sendActionCableMessage.sendToggleTimer) {
             sendActionCableMessage.sendToggleTimer({
                senteTime: senteTime, // 現在の時間も送信し、サーバーで保存
                goteTime: goteTime,
                activePlayer: playerToActivate,
                isPaused: false,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, activePlayer, senteTime, goteTime, sendActionCableMessage]); // sendActionCableMessage を依存に追加

    // タイマーを一時停止する関数（Action Cableを通じてサーバーにも通知）
    const pauseTimer = useCallback(() => {
        if (isPaused) return;

        setIsPaused(true);
        // setInterval は useEffect で管理されるため、ここでは直接停止しない（または、停止するならuseEffectから除外）
        // if (timerIntervalRef.current) {
        //     clearInterval(timerIntervalRef.current);
        //     timerIntervalRef.current = null;
        // }
        if (sendActionCableMessage.sendToggleTimer) {
             sendActionCableMessage.sendToggleTimer({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: activePlayer,
                isPaused: true,
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, activePlayer, senteTime, goteTime, sendActionCableMessage]); // sendActionCableMessage を依存に追加

    // タイマーの開始/一時停止を切り替える関数
    const toggleStartPause = useCallback(() => {
        if (isPaused) {
            startTimer();
        } else {
            pauseTimer();
        }
    }, [isPaused, startTimer, pauseTimer]);

    // 手番を交代する関数（Action Cableを通じてサーバーにも通知）
    const switchTurn = useCallback(() => {
        if (isPaused || senteTime <= 0 || goteTime <= 0) return;

        const nextPlayer = activePlayer === 'sente' ? 'gote' : 'sente';
        setActivePlayer(nextPlayer);
        lastUpdateTimeRef.current = Date.now(); // 手番交代で基準時刻をリセット

        if (sendActionCableMessage.sendSwitchTurn) {
             sendActionCableMessage.sendSwitchTurn({
                senteTime: senteTime,
                goteTime: goteTime,
                activePlayer: nextPlayer,
                isPaused: isPaused, // 手番交代時はpaused状態は変わらないはず
                lastUpdateTime: lastUpdateTimeRef.current
             });
        }
    }, [isPaused, senteTime, goteTime, activePlayer, sendActionCableMessage]); // sendActionCableMessage を依存に追加

    // タイマーをリセットする関数（Action Cableを通じてサーバーにも通知）
    const resetTimer = useCallback(() => {
        pauseTimer(); // まず一時停止状態にする（サーバーに通知される）
        setSenteTime(initialTime);
        setGoteTime(initialTime);
        setActivePlayer(null);
        setIsPaused(true); // 明示的に一時停止状態に設定

        if (sendActionCableMessage.sendResetTimer) {
             sendActionCableMessage.sendResetTimer({
                senteTime: initialTime,
                goteTime: initialTime,
                activePlayer: null,
                isPaused: true,
                lastUpdateTime: null // リセット時はタイムスタンプもnullに
             });
        }
    }, [initialTime, pauseTimer, sendActionCableMessage]); // sendActionCableMessage を依存に追加


    // 時間切れを監視し、アラートを表示し、親コンポーネントに通知する
    useEffect(() => {
        if (senteTime <= 0) {
            pauseTimer();
            console.log("先手の時間切れです！");
            onTimeUp('sente');
        }
        if (goteTime <= 0) {
            pauseTimer();
            console.log("後手の時間切れです！");
            onTimeUp('gote');
        }
    }, [senteTime, goteTime, pauseTimer, onTimeUp]);

    // タイマーの開始/停止、アクティブプレイヤーの変更に応じてsetIntervalを管理する
    useEffect(() => {
        if (!isPaused && activePlayer !== null) {
            // 既存のタイマーがあればクリア
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            // 新しいタイマーを開始
            timerIntervalRef.current = setInterval(runTimerLogic, 100);
        } else if (isPaused && timerIntervalRef.current) {
            // タイマーが一時停止状態になり、かつsetIntervalが動いている場合、停止
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }

        // クリーンアップ関数: コンポーネントのアンマウント時や、依存配列が変更されて再実行される前に呼ばれる
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [activePlayer, isPaused, runTimerLogic]); // 依存配列

    // コンポーネントがアンマウントされる際の最終的なクリーンアップ
    // 依存配列が空（[]）なので、マウント時に一度だけ設定され、アンマウント時に一度だけ実行される
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);


    // JSXレンダリング: コンポーネントのUIを定義する部分
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
            {/* 以下のボタンは開発・デバッグ用。通常はゲームUIに統合されるべき 
            <div className="timer-controls">
                <button onClick={toggleStartPause} className="control-button">
                    {isPaused ? 'ゲーム開始 / 再開' : '一時停止'}
                </button>
                <button
                    onClick={switchTurn}
                    disabled={isPaused || activePlayer === null || senteTime <= 0 || goteTime <= 0}
                    className="control-button"
                >
                    手番交代
                </button>
                <button onClick={resetTimer} className="control-button">
                    リセット
                </button>
            </div>*/}
        </div>
    );
});

export default ShogiTimer;