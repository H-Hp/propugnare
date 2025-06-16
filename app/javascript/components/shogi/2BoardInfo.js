import { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn } from './Pieces';//Piecesファイルから駒のクラス群を読み込み・別のJavaScriptファイルで定義されたクラスや変数などを、このファイルで使えるようにするための構文

class BoardInfo {// 将棋盤の状態や操作を管理するクラス
   
    constructor(props) {
        //this.socket = null;
        console.log("BoardInfo: props :" +props)
        const gameId = props
        /*const socket = new WebSocket('ws://' + window.location.host + '/cable');// WebSocket接続を確立
        this.socket.onopen = () => {// WebSocket接続が開いたときの処理
          console.log('GameChannel_WebSocket connected');
          this.socket.send(JSON.stringify({// ChatChannelにサブスクライブ
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
          }));
        };
        this.socket.onmessage = (event) => {// サーバーからメッセージを受信したときの処理
          const data = JSON.parse(event.data);
          if (data.type === 'ping') return; // pingメッセージは無視
          if (data.message) {
            // 受信したメッセージをDOMに追加
            console.log("サーバーからメッセージを受信したときの処理: "+data.message.message)
          }
        };*/


        

        
        this.turn = "先手";// 現在の手番（"先手" or "後手"）
        
        // 盤面の初期配置を二次元配列で設定
        // 各要素はPieceクラスのインスタンス（具体的な駒の種類と所有者を持つ）
        this.board = [
            // 後手の駒の初期配置（1段目）
            [new Lance("後手"), new Knight("後手"), new SilverGeneral("後手"), new GoldGeneral("後手"), new King("後手"), new GoldGeneral("後手"), new SilverGeneral("後手"), new Knight("後手"), new Lance("後手")],// 後手の駒の初期配置
            // 2段目：飛車と角
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
            // 3段目：歩兵
            [new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手")],
            // 4-6段目：空白
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            // 7段目：先手の歩兵
            [new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
            // 8段目：角と飛車
            [new Blank(), new Bishop("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            // 9段目：その他の駒
            [new Lance("先手"), new Knight("先手"), new SilverGeneral("先手"), new GoldGeneral("先手"), new King("先手"), new GoldGeneral("先手"), new SilverGeneral("先手"), new Knight("先手"), new Lance("先手")]
        ];
        this.selection = new Selection();//選択状態を管理するSelectionクラスのインスタンスを初期化
        this.pieceStandNum = {//各プレイヤーの持ち駒の数を管理するオブジェクトを初期化（各駒の種類ごとに0で開始）
            "先手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 },
            "後手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 }
        };
        this.pieceStand = {// 持ち駒台の状態を管理（各プレイヤーごとに9マスの配列をBlankで初期化）
            "先手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            "後手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
        };
    }

    boardClick(i, j) {// 盤上のマスがクリックされた時の処理 (i: 行インデックス, j: 列インデックス)
        //this.selection.stateは、既に駒が選択されている状態かどうかを示す（true: 選択済み、false: 未選択）
        if (this.selection.state) {// 既に駒が選択されている場合の処理
            if (this.selection.boardSelectInfo[i][j] !== "配置可能") {
                //console.log("配置可能じゃないから終了");
                return;
            }
            let myPiece;// 駒の移動処理
            if (this.selection.pieceStandPiece.name) {// 持ち駒を置く場合
                console.log("持ち駒を置く場合");
                myPiece = this.selection.pieceStandPiece;// 選択中の持ち駒を取得
                this.pieceStandNum[this.turn][myPiece.name] -= 1;//自分の持ち駒の数を1減らす
                this.makePieceStand();//持ち駒台の表示を更新
            } else {// 盤上の駒を動かす場合
                console.log("盤上の駒を動かす場合");
                myPiece = this.board[this.selection.before_i][this.selection.before_j];// 選択元のマスから駒を取得
                this.board[this.selection.before_i][this.selection.before_j] = new Blank();// 選択元のマスを空白にする
                
                // 移動先に相手の駒がある場合の処理
                let yourPiece = this.board[i][j];// 相手の駒を取る場合の処理
                if (yourPiece.name) {// 相手の駒が存在する場合（nameプロパティがあるかチェック）
                    /*if (yourPiece.getPiece()) { // その駒が成り駒の場合（getPiece()メソッドが存在するかチェック）
                        yourPiece = yourPiece.getPiece();// 成り駒を元の駒に戻す
                    }
                    */

                    // yourPieceがgetPieceメソッドを持ち、それが関数であり、かつgetPiece()がnullでない（つまり成った駒である）場合に処理を行う
                    if (typeof yourPiece.getPiece === 'function' && yourPiece.getPiece() !== null) {
                        yourPiece = yourPiece.getPiece(); // 成り駒を元の駒に戻す
                    }
                    // 成っていない駒の場合や、そもそもgetPieceを持たないBlankの場合は、yourPieceはそのまま
                   
                    // 自分の持ち駒として追加 (相手の駒の所有者ではなく、自分の持ち駒としてカウント)
                    this.pieceStandNum[myPiece.owner][yourPiece.name] += 1;// 持ち駒に追加
                    this.makePieceStand();// 持ち駒台の表示を更新 
                    
                }
                // 成りの可能性をチェック
                //existCanMoveは、その駒が(i, j)の位置に移動可能かどうかをチェックする関数
                //console.log("成りの可能性をチェック：( "+i+","+j+")の位置に移動可能かどうかをチェック");
                console.log("myPiece: "+JSON.stringify(myPiece));
                //existCanMoveで、成る前の駒でその移動先に移動可能かを確認
                if (this.existCanMove(i, j, myPiece)) {//成りの確認 (駒が移動可能な位置にあるか)
                    console.log("成ることができる位置にいるかをチェックし、成れる場合は成った駒を返す・myPiece: "+JSON.stringify(myPiece));
                    //checkPromoteは、その駒が成ることができる位置にいるかをチェックし、成れる場合は成った駒を返す関数です・i（移動先の段）とbefore_i（移動元の段）を比較して、敵陣に入ったかどうかを判断
                    //checkPromoteで、駒が成れる場所かどうか、ユーザーに成るか尋ねる
                    // i（移動先の段）とbefore_i（移動元の段）を比較して、敵陣に入ったかどうかを判断
                    myPiece = this.checkPromote(myPiece, i, this.selection.before_i);
                    console.log("成りmyPiece "+JSON.stringify(myPiece));
                } else {
                    //移動できない場合は、強制的に成り駒になります（例：歩が最奥の段に到達した場合は必ず成る必要がある）
                    myPiece = myPiece.getPromotedPiece();// 強制的に成り駒にする
                    //console.log("強制成りmyPiece "+JSON.stringify(myPiece));
                }
            }
            this.board[i][j] = myPiece;// 駒を移動先に配置
            this.turn = this.turn === "先手" ? "後手" : "先手";// 手番を交代

            //window.send_socket(gameState);

            // WebSocketでメッセージをサーバーに送信
            /*const moveData = {x: 1,y: 2};
            socket.send(JSON.stringify({
                command: 'message',
                identifier: JSON.stringify({
                    channel: 'GameChannel',
                    game_id: 2
                }),
                data: JSON.stringify({
                    action: 'make_move',
                    game_id: 2,
                    move: moveData
                })
            }));
            */

        } else {// 新しく駒を選択する場合
            if (this.turn !== this.board[i][j].owner) {
                return;// 自分の駒でない場合は選択不可
            }
            // 選択状態を設定
            this.selection.isNow = true;
            this.selection.state = true;
            this.selection.before_i = i;
            this.selection.before_j = j;
            // 選択状態をリセット
            this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));
            this.selection.pieceStandSelectInfo = {
                "先手": Array(9).fill("未選択"),
                "後手": Array(9).fill("未選択")
            };
            this.selection.boardSelectInfo[i][j] = "選択状態";// クリックされたマスを選択状態に
            this.checkCanPutBoard(i, j);// 移動可能なマスをチェック
        }
    }

    //existCanMoveは、その駒が(i, j)の位置に移動可能かどうかをチェックする関数
    existCanMove(i, j, piece) {
        for (let l = 0; l < piece.dx.length; l++) {
            let y = i;
            let x = j;
            y += this.turn === "先手" ? piece.dy[l] : -piece.dy[l];
            x += this.turn === "先手" ? piece.dx[l] : -piece.dx[l];
            if (0 <= y && y <= 8 && 0 <= x && x <= 8) {
                return true;
            }
        }
        return false;
    }

    // 成りが可能な場合の処理
    checkPromote(piece, i, before_i) {
        console.dir("1111checkPromoteのpiece: "+JSON.stringify(piece)); //{"owner":"後手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],"dk":[10,10,10,10]}
        //console.dir("bububu: "+JSON.stringify(piece.getPromotedPiece())); //{"owner":"後手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],"dk":[10,10,10,10]}
        //console.dir("11checkPromoteのi: "+i);
        //console.dir("11checkPromoteのbefore_i: "+before_i);
        //console.dir("checkPromoteの!piece.getPromotedPiece(): "+JSON.stringify(!piece.getPromotedPiece()));
        
        // まず、pieceが有効なオブジェクトであり、かつgetPromotedPieceメソッドを持っているかを確認して、そのメソッドが実際に成り駒を返すかどうか（nullでないか）を確認する
        // typeof piece.getPromotedPiece === 'function'でメソッドの存在を確認
        // piece.getPromotedPiece()でnullでないことを確認
        const promotedPieceCandidate = typeof piece.getPromotedPiece === 'function' ? piece.getPromotedPiece() : null;
        console.dir("checkPromoteのpromotedPieceCandidate: "+JSON.stringify(promotedPieceCandidate));
        
        //if (!piece.getPromotedPiece()) {
        if (!piece) {
        //if (!promotedPieceCandidate) {
            console.log("キンタマ");
            return piece;
        }else{
            console.log("ちんこ");
        }
        // 成り可能エリアを判定
        const promoteAreaMinY = piece.owner === "先手" ? 0 : 6;
        const promoteAreaMaxY = piece.owner === "先手" ? 2 : 8;
        if ((promoteAreaMinY <= i && i <= promoteAreaMaxY) || (promoteAreaMinY <= before_i && before_i <= promoteAreaMaxY)) {
            if (window.confirm('成りますか？')) {
                //return piece.getPromotedPiece()
                return piece
            }
        }
        return piece;
    }

    // 選択された駒の移動可能なマスをチェック
    checkCanPutBoard(i, j) {
        const piece = this.board[i][j];
        for (let l = 0; l < piece.dx.length; l++) {
            let y = i;
            let x = j;
            for (let _ = 0; _ < piece.dk[l]; _++) {
                y += this.turn === "先手" ? piece.dy[l] : -piece.dy[l];
                x += this.turn === "先手" ? piece.dx[l] : -piece.dx[l];
                if (y < 0 || y > 8 || x < 0 || x > 8 || this.board[y][x].owner === piece.owner) {
                    break;// 盤外や自分の駒がある場合は移動不可
                }
                this.selection.boardSelectInfo[y][x] = "配置可能";
                if (!this.board[y][x].owner) {
                    continue;// 空マスの場合は続行
                }
                break;// 相手の駒がある場合はそこまで
            }
        }
    }

    // 持ち駒がクリックされた時の処理
    pieceStandClick(piece) {
        if (this.selection.state || this.turn !== piece.owner) {
            return;// 既に選択状態か、自分の持ち駒でない場合は処理しない
        }
        // 選択状態を設定
        this.selection.isNow = true;
        this.selection.state = true;
        this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));
        this.selection.pieceStandPiece = piece;
        this.selection.pieceStandSelectInfo = {
            "先手": Array(9).fill("未選択"),
            "後手": Array(9).fill("未選択")
        };
        // 持ち駒台での選択位置を記録
        const i = this.pieceStand[piece.owner].findIndex(p => p.name === piece.name);
        this.selection.pieceStandSelectInfo[this.turn][i] = "選択状態";
        this.checkCanPutPieceStand(piece);// 配置可能な場所をチェック
    }

    // 持ち駒台の状態を更新
    makePieceStand() {
        let myPieceStand = [];
        const myPieceStandNum = this.pieceStandNum[this.turn];
        // 持ち駒の数に応じて駒オブジェクトを作成
        for (let name in myPieceStandNum) {
            if (myPieceStandNum[name] > 0) {
                myPieceStand.push(Piece.getPieceByName(name, this.turn));
            }
        }
        // 9マスになるまで空マスで埋める
        while (myPieceStand.length < 9) {
            myPieceStand.push(new Blank());
        }
        this.pieceStand[this.turn] = myPieceStand;
    }

    // 持ち駒を配置可能な場所をチェック
    checkCanPutPieceStand(piece) {
        let pawnColMemo = Array(9).fill(true);
        // 歩の場合は二歩のチェックを行う
        if (piece.name === "歩") {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.board[i][j].name === "歩" && this.board[i][j].owner === piece.owner) {
                        pawnColMemo[j] = false;// 既に歩がある列は配置不可
                    }
                }
            }
        }
        // 配置可能な場所をチェック
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.board[i][j].owner && this.existCanMove(i, j, piece) && pawnColMemo[j]) {
                    this.selection.boardSelectInfo[i][j] = "配置可能";
                }
            }
        }
    }

}

class Selection {
    boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill(""))));// 盤面上の選択状態を管理する9x9の配列
    isNow = false;// 現在選択中かどうか
    state = false;// 選択状態
    before_i = null;// 前回選択した位置（行）
    before_j = null;// 前回選択した位置（列）
    pieceStandSelectInfo = {
        "先手": Array(9).fill("持駒"),
        "後手": Array(9).fill("持駒")
    };
    pieceStandPiece = new Blank();// 選択中の持ち駒
}

export { BoardInfo, Selection };
