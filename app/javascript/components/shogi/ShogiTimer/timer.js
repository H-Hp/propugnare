// timer.js

/*
class ShogiTimer {
    constructor(initialMinutes = 10) {
        this.initialTime = initialMinutes * 60 * 1000; // 初期時間をミリ秒で設定 (10分)
        this.senteTime = this.initialTime;
        this.goteTime = this.initialTime;
        this.activePlayer = null; // 'sente' or 'gote'
        this.timerInterval = null;
        this.isPaused = true; // 初期状態は一時停止

        this.senteTimeDisplay = document.getElementById('senteTime');
        this.goteTimeDisplay = document.getElementById('goteTime');
        this.senteTimerContainer = document.getElementById('senteTimer');
        this.goteTimerContainer = document.getElementById('goteTimer');
        this.startStopBtn = document.getElementById('startStopBtn');
        this.switchTurnBtn = document.getElementById('switchTurnBtn');
        this.resetBtn = document.getElementById('resetBtn');

        this.initEventListeners();
        this.updateDisplay();
    }

    initEventListeners() {
        this.startStopBtn.addEventListener('click', () => this.toggleStartPause());
        this.switchTurnBtn.addEventListener('click', () => this.switchTurn());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    // 時間を MM:SS 形式でフォーマットするヘルパー関数
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 表示を更新する
    updateDisplay() {
        this.senteTimeDisplay.textContent = this.formatTime(this.senteTime);
        this.goteTimeDisplay.textContent = this.formatTime(this.goteTime);

        // アクティブなプレイヤーのUIを強調表示
        this.senteTimerContainer.classList.toggle('active', this.activePlayer === 'sente');
        this.goteTimerContainer.classList.toggle('active', this.activePlayer === 'gote');

        // 時間切れの判定と表示
        if (this.senteTime <= 0) {
            this.senteTimeDisplay.textContent = "時間切れ！";
            this.senteTimeDisplay.style.color = 'red';
            this.pause();
            alert("先手の時間切れです！");
        }
        if (this.goteTime <= 0) {
            this.goteTimeDisplay.textContent = "時間切れ！";
            this.goteTimeDisplay.style.color = 'red';
            this.pause();
            alert("後手の時間切れです！");
        }
    }

    // タイマーを開始/再開する
    start() {
        if (!this.isPaused || this.timerInterval !== null) return; // すでに動いているかポーズ中でなければ何もしない

        this.isPaused = false;
        this.switchTurnBtn.disabled = false; // ゲーム開始後は手番交代可能に
        this.startStopBtn.textContent = "一時停止";

        // 初回スタート時は先手から
        if (this.activePlayer === null) {
            this.activePlayer = 'sente';
        }

        const startTime = Date.now();
        let lastUpdateTime = startTime;

        this.timerInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastUpdateTime;
            lastUpdateTime = now; // 次の更新のために時間を記録

            if (this.activePlayer === 'sente') {
                this.senteTime -= elapsed;
                if (this.senteTime < 0) this.senteTime = 0; // 0未満にならないように
            } else if (this.activePlayer === 'gote') {
                this.goteTime -= elapsed;
                if (this.goteTime < 0) this.goteTime = 0; // 0未満にならないように
            }
            this.updateDisplay();

            // 時間切れチェック
            if (this.senteTime <= 0 || this.goteTime <= 0) {
                this.pause(); // 時間切れでタイマーを停止
            }
        }, 100); // 100msごとに更新 (よりスムーズな表示と正確性のバランス)
    }

    // タイマーを一時停止する
    pause() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.startStopBtn.textContent = "ゲーム再開";
    }

    // 開始/一時停止を切り替える
    toggleStartPause() {
        if (this.isPaused) {
            this.start();
        } else {
            this.pause();
        }
    }

    // 手番を交代する
    switchTurn() {
        if (this.isPaused) return; // ポーズ中は手番交代させない

        this.activePlayer = (this.activePlayer === 'sente') ? 'gote' : 'sente';
        this.updateDisplay();
        // setInterval は常に動いているので、ここで特別な操作は不要
        // activePlayer の変更だけで時間が減る対象が変わる
    }

    // タイマーをリセットする
    reset() {
        this.pause(); // まず停止
        this.senteTime = this.initialTime;
        this.goteTime = this.initialTime;
        this.activePlayer = null; // アクティブなプレイヤーをリセット
        this.isPaused = true; // ポーズ状態にリセット

        this.senteTimeDisplay.style.color = '#555'; // 色を元に戻す
        this.goteTimeDisplay.style.color = '#555';
        this.startStopBtn.textContent = "ゲーム開始";
        this.switchTurnBtn.disabled = true; // リセット後はゲーム開始まで手番交代不可

        this.updateDisplay();
    }
}

// ページロード時にタイマーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new ShogiTimer(10); // 10分タイマーとして初期化
});
*/