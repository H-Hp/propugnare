//import { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn } from './Pieces';
import { Piece, Blank, King, Gyoku, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn, PromotedRook,PromotedBishop,PromotedSilverGeneral,PromotedKnight,PromotedLance,PromotedPawn } from './Pieces';

class BoardInfo {

    // initialDataがない場合は、デフォルトの初期盤面を生成
    constructor(initialData = {}) {
        //console.log("initialData:"+JSON.stringify(initialData))
        //console.log("King:"+JSON.stringify(new King("後手")))
        //console.log("Rook:"+Rook)
        // デフォルトの初期配置の配列
        const defaultBoard = [
            [new Lance("後手"), new Knight("後手"), new SilverGeneral("後手"), new GoldGeneral("後手"), new Gyoku("後手"), new GoldGeneral("後手"), new SilverGeneral("後手"), new Knight("後手"), new Lance("後手")],
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
            [new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手")],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
            [new Blank(), new Bishop("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            [new Lance("先手"), new Knight("先手"), new SilverGeneral("先手"), new GoldGeneral("先手"), new King("先手"), new GoldGeneral("先手"), new SilverGeneral("先手"), new Knight("先手"), new Lance("先手")]
        ];
        const defaultSelection = new Selection();
        const defaultPieceStandNum = {
            "先手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 },
            "後手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 }
        };
        const defaultPieceStand = {
            "先手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            "後手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
        };
        //console.log("defaultPieceStandNum:"+JSON.parse(JSON.stringify(defaultPieceStandNum)))
        //console.log("defaultPieceStand:"+JSON.parse(JSON.stringify(defaultPieceStand)))
        //console.log("defaultBoard:"+JSON.stringify(defaultBoard))



        // initialData.board が存在しない、または配列でない場合はデフォルトボードを使用
        // 存在する場合はデシリアライズして復元
        //console.log("initialData.board:"+initialData.board)
        //console.log("initialData.board:"+JSON.stringify(initialData.BoardInfo))
        //console.log("initialData.board.board:"+JSON.stringify(initialData.BoardInfo.board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))

        //console.log("defaultBoard:"+JSON.stringify(defaultBoard))
        //console.log("initialData:"+JSON.stringify(initialData))

        // 初期値とRedisから取得したデータ構造がなぜかちょっと違うから分岐する(initialData.BoardInfo.boardで取得できるのがRedisのデータで、initialData.currentPlayerなどでアクセスするのが初期データ)
        if (Object.keys(initialData).length === 0) {
            //console.log("initialDataが空の時");
            this.board = this.deserializeBoard(defaultBoard);
            //console.log("this.board:"+JSON.stringify(this.board))
            this.pieceStandNum = defaultPieceStandNum
            this.pieceStand = defaultPieceStand
            this.nowTurn = initialData.nowTurn || "先手";
        }else{//initialDataにデータが入っている場合
            //console.log("initialDataが空じゃない時:"+JSON.stringify(initialData.BoardInfo.board));
            //console.log("initialDataが空じゃない時:");
            //const boardData = initialData.BoardInfo.board;
            this.board = this.deserializeBoard(initialData.BoardInfo.board);

            // pieceStandNum は通常プレーンなデータなので、ディープコピーでOK
            this.pieceStandNum = initialData.BoardInfo.pieceStandNum ? JSON.parse(JSON.stringify(initialData.BoardInfo.pieceStandNum)) : defaultPieceStandNum;

            // pieceStand のデシリアライズ
            this.pieceStand = this.deserializePieceStand(initialData.BoardInfo.pieceStand || defaultPieceStand);
            this.nowTurn = initialData.BoardInfo.nowTurn || "先手";
        }
        //console.log("this.board:"+JSON.stringify(this.board));
        //this.board = this.deserializeBoard(initialData.board || defaultBoard);
        //this.board = this.deserializeBoard(initialData.BoardInfo || defaultBoard);
        //this.board = this.deserializeBoard(initialData.BoardInfo.board || defaultBoard);
        //this.turn = initialData.turn || "先手";
        
        // selection の復元
        // JSON.parse(JSON.stringify())でディープコピーし、必要に応じて駒を再構築
        this.selection = initialData.selection ? JSON.parse(JSON.stringify(initialData.selection)) : defaultSelection;
        if (this.selection.pieceStandPiece && this.selection.pieceStandPiece.name) {
            this.selection.pieceStandPiece = this.deserializePiece(this.selection.pieceStandPiece);
        } else {
            this.selection.pieceStandPiece = {}; // 無効な場合は空オブジェクトに設定
        }

        // pieceStandNum は通常プレーンなデータなので、ディープコピーでOK
//消した        this.pieceStandNum = initialData.pieceStandNum ? JSON.parse(JSON.stringify(initialData.pieceStandNum)) : defaultPieceStandNum;

        // pieceStand のデシリアライズ
 //消した       this.pieceStand = this.deserializePieceStand(initialData.pieceStand || defaultPieceStand);

        //console.log("initialData:"+JSON.stringify(initialData))
        //console.log("initialData.pieceStandNum:"+JSON.stringify(initialData.pieceStandNum));
        //console.log("initialData.pieceStand:"+JSON.stringify(initialData.pieceStand));

        // メソッドのバインド (必要に応じて)
        this.boardClick = this.boardClick.bind(this);
        this.makePieceStand = this.makePieceStand.bind(this);
        this.checkCanPutBoard = this.checkCanPutBoard.bind(this);
        this.existCanMove = this.existCanMove.bind(this);
        this.checkPromote = this.checkPromote.bind(this);
        //this.canPromote = this.canPromote.bind(this);
        this.getBoardState = this.getBoardState.bind(this);
        this.convertToShogiAddress = this.convertToShogiAddress.bind(this);
        
        /*this.turn = "先手";
        this.board = [[new Lance("後手"), new Knight("後手"), new SilverGeneral("後手"), new GoldGeneral("後手"), new King("後手"), new GoldGeneral("後手"), new SilverGeneral("後手"), new Knight("後手"), new Lance("後手")],
        [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
        [new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手")],
        [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
        [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
        [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
        [new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
        [new Blank(), new Bishop("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
        [new Lance("先手"), new Knight("先手"), new SilverGeneral("先手"), new GoldGeneral("先手"), new King("先手"), new GoldGeneral("先手"), new SilverGeneral("先手"), new Knight("先手"), new Lance("先手")]
        ];
        this.selection = new Selection();
        this.pieceStandNum = {
            "先手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 },
            "後手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 }
        };
        this.pieceStand = {
            "先手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            "後手": [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
        };*/
    }

    //boardClick(i, j) {
    boardClick(i, j,yourRole) {
        //console.log("boardClickのyourRole:"+yourRole)
        if(yourRole!==this.nowTurn){//自分のターンじゃなければ操作できないように
            //console.log("自分のターンじゃないので操作はできない")
            return
        }
            
        if (this.selection.state) {//何らかの駒が選択されている状態の場合
            //console.log(`this.board[i][j].getPiece()：${this.board[i][j].getPiece()}`)
            if (this.selection.boardSelectInfo[i][j] !== "配置可能") {//クリックされたマスが移動先として不適切であれば
                return;
            }
            let myPiece;
            if (this.selection.pieceStandPiece.name) {// 持ち駒が選択されている場合 (駒を打つ)
                myPiece = this.selection.pieceStandPiece;// 持ち駒を移動する駒(myPiece)にする
                this.pieceStandNum[this.nowTurn][myPiece.name] -= 1;// 持ち駒の数を減らす
                this.makePieceStand();// 持ち駒台の表示を更新
            } else {// 盤上の駒が選択されている場合 (駒を動かす)
                myPiece = this.board[this.selection.before_i][this.selection.before_j]; // 選択していた盤上の駒(myPiece)にする
                this.board[this.selection.before_i][this.selection.before_j] = new Blank();// 元のマスを空白にする
                let yourPiece = this.board[i][j];// 移動先にあった駒をyourPieceにする
                if (yourPiece.name) { // 移動先に相手の駒があった場合 (駒を取る)
                    if (yourPiece.getPiece()) {// 成駒だった場合、元の駒に戻す
                        yourPiece = yourPiece.getPiece();
                    }
                    
                    this.pieceStandNum[myPiece.owner][yourPiece.name] += 1;// 持ち駒として追加
                    //console.log("持ち駒として追加・this.pieceStandNum:"+JSON.stringify(this.pieceStandNum))
                    this.makePieceStand();// 持ち駒台の表示を更新
                }
                // 成りの判定と処理
                if (this.existCanMove(i, j, myPiece)) {// その駒がまだ動ける場合（成りを選択可能）
                    myPiece = this.checkPromote(myPiece, i, this.selection.before_i);// 成りを確認
                    console.log("i:"+i+"・j:"+j)
                } else {// その駒がもう動けない場合（強制的に成る）
                    myPiece = myPiece.getPromotedPiece();// 強制的に成る
                }
            }
            const ShogiAddress = this.convertToShogiAddress(i, j)
            this.board[i][j] = myPiece;// 駒を新しいマスに配置
            this.nowTurn = this.nowTurn === "先手" ? "後手" : "先手";
            //console.log("boardClickのthis.nowTurn:"+this.nowTurn)
            //console.log("this.board[i][j]:"+JSON.stringify(this.board[i][j]))
            //console.log("this.selection.before_i:"+JSON.stringify(this.selection.before_i))
            //console.log("this.selection.before_j:"+JSON.stringify(this.selection.before_j))
            //return true; // コマが動いた
            return {
                //newBoardState: this.getBoardState(), // 変更後の盤面状態を返す
                BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                moved_check: true,// 駒が動いた場合
                moveDetails: this.nowTurn+ShogiAddress+myPiece.name,
                pieceStandNum: this.pieceStandNum,
                pieceStand: this.pieceStand,
                nowTurn: this.nowTurn,
            };

        } else {// 何も駒が選択されていない状態の場合 (駒を選択する)
            if (this.nowTurn !== this.board[i][j].owner) {// クリックされた駒が自分の手番の駒でなければ
                return;// 何もせず処理を終了
            }
            this.selection.isNow = true;// 選択状態に入る
            this.selection.state = true;
            this.selection.before_i = i;// 選択した駒の元位置を記憶
            this.selection.before_j = j;
            // 盤面と持ち駒台の選択情報を初期化
            this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));
            this.selection.pieceStandSelectInfo = {
                "先手": Array(9).fill("未選択"),
                "後手": Array(9).fill("未選択")
            };
            this.selection.boardSelectInfo[i][j] = "選択状態";// 選択したマスを「選択状態」とマーク
            this.checkCanPutBoard(i, j);// 移動可能マスをハイライト表示するロジックを呼び出す
            return {
                //newBoardState: this.getBoardState(), // 変更後の盤面状態を返す
                BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                moved_check: false,// 駒が動いた場合
                moveDetails: "select",
                pieceStandNum: this.pieceStandNum,
                pieceStand: this.pieceStand,
                nowTurn: this.nowTurn
            };
        }
    }

    //与えられた駒（piece）が、現在の盤面上の位置(i, j)から、将棋のルール上、動けるマスが少なくとも一つ存在するかをチェックします。これは主に、駒を打つ際の「行き所のない駒（例: 端に歩を打つと動けなくなる）」のチェックや、成りの判定（成らなくてもまだ動けるか）に使われます。
    existCanMove(i, j, piece) {
        for (let l = 0; l < piece.dx.length; l++) {// 駒の移動方向のリストを反復
            let y = i;
            let x = j;
            y += this.nowTurn === "先手" ? piece.dy[l] : -piece.dy[l];// 駒の向きに応じて移動方向を調整
            x += this.nowTurn === "先手" ? piece.dx[l] : -piece.dx[l];
            if (0 <= y && y <= 8 && 0 <= x && x <= 8) {// 盤面内に収まるかチェック
                return true;// 少なくとも一つ動けるマスが見つかれば true を返す
            }
        }
        return false;// 全ての方向を試しても動けるマスがなければ false
    }

    //駒が成れる条件を満たしている場合、ユーザーに成るか否かを確認し、その結果に基づいて成った駒のインスタンスを返すメソッド
    checkPromote(piece, i, before_i) {
        //console.dir("checkPromoteのpromotedPieceCandidate: "+JSON.stringify(piece.getPromotedPiece()));
        //console.log(`piece：${JSON.stringify(piece)}`);
        //console.log(`typeof piece.getPromotedPiece：${typeof piece.getPromotedPiece}`);
        if (!piece.getPromotedPiece()) {// 成れる駒でなければ
            return piece;// そのまま返す
        }
        const promoteAreaMinY = piece.owner === "先手" ? 0 : 6;// 成りゾーンのY座標範囲
        const promoteAreaMaxY = piece.owner === "先手" ? 2 : 8;
        // 成りゾーンに到達した、または成りゾーンから移動した（通過した）場合
        if ((promoteAreaMinY <= i && i <= promoteAreaMaxY) || (promoteAreaMinY <= before_i && before_i <= promoteAreaMaxY)) {
            if (window.confirm('成りますか？')) {// ユーザーに確認
                return piece.getPromotedPiece()// 成った駒のインスタンスを返す
            }
        }
        return piece;// 成らない場合、元の駒のインスタンスを返す
    }

    //盤面の(i, j)に存在する駒（piece = this.board[i][j]）が移動できる全てのマスを計算し、this.selection.boardSelectInfoに"配置可能"としてマークするメソッド
    checkCanPutBoard(i, j) {
        const piece = this.board[i][j];
        for (let l = 0; l < piece.dx.length; l++) {
            let y = i;
            let x = j;
            for (let _ = 0; _ < piece.dk[l]; _++) {
                y += this.nowTurn === "先手" ? piece.dy[l] : -piece.dy[l];
                x += this.nowTurn === "先手" ? piece.dx[l] : -piece.dx[l];
                if (y < 0 || y > 8 || x < 0 || x > 8 || this.board[y][x].owner === piece.owner) {
                    break;
                }
                this.selection.boardSelectInfo[y][x] = "配置可能";
                if (!this.board[y][x].owner) {
                    continue;
                }
                break;
            }
        }
    }

    pieceStandClick(piece) {
        if (this.selection.state || this.nowTurn !== piece.owner) {//既に駒が選択されているか、自分の持ち駒でなければ
            return;//何もせず終了
        }
        this.selection.isNow = true; //選択状態に入る
        this.selection.state = true;
        this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));//盤面選択情報をリセット
        this.selection.pieceStandPiece = piece;// 選択中の駒を持ち駒として設定
        this.selection.pieceStandSelectInfo = {// 持ち駒台の選択情報をリセット
            "先手": Array(9).fill("未選択"),
            "後手": Array(9).fill("未選択")
        };
        const i = this.pieceStand[piece.owner].findIndex(p => p.name === piece.name);// クリックされた持ち駒が駒台のどこにあるか
        this.selection.pieceStandSelectInfo[this.nowTurn][i] = "選択状態";// その駒を「選択状態」とマーク
        this.checkCanPutPieceStand(piece);//持ち駒を打てるマスを計算してハイライト表示するロジックを呼び出す
    }

    //持ち駒の枚数（pieceStandNum）に基づいて、実際に表示する持ち駒の配列（pieceStand）を生成するメソッド
    makePieceStand() {
        let myPieceStand = [];
        const myPieceStandNum = this.pieceStandNum[this.nowTurn];// 現在の手番の持ち駒枚数を取得
        //console.log("makePieceStandのmyPieceStandNum"+JSON.stringify(myPieceStandNum))
        for (let name in myPieceStandNum) {// 各駒の名前について
            if (myPieceStandNum[name] > 0) {// 1枚でも持っていれば
                myPieceStand.push(Piece.getPieceByName(name, this.nowTurn));// その駒のインスタンスを追加
            }
        }
        while (myPieceStand.length < 9) {// 持ち駒が9枚に満たない場合
            myPieceStand.push(new Blank());// 空白駒で埋める (表示上の調整)
        }
        this.pieceStand[this.nowTurn] = myPieceStand;// 持ち駒台の配列を更新
    }

    //持ち駒（piece）を盤面に打つことができる合法なマスを計算し、this.selection.boardSelectInfoに"配置可能"としてマークするメソッドです。二歩、打ち歩詰め、行き所のない駒のルールを考慮しています。
    checkCanPutPieceStand(piece) {
        let pawnColMemo = Array(9).fill(true);// 各列に歩を打てるかどうかのメモ（最初は全てtrue）
        if (piece.name === "歩") {// 持ち駒が「歩」の場合のみ、二歩のチェックを行う
            for (let i = 0; i < 9; i++) {// 盤面の行 (0-8) を走査
                for (let j = 0; j < 9; j++) {// 盤面の列 (0-8) を走査
                    if (this.board[i][j].name === "歩" && this.board[i][j].owner === piece.owner) {// 現在のマスに「歩」があり、かつその「歩」が今打とうとしている駒と同じ持ち主の場合
                        pawnColMemo[j] = false;// その列 (j) にはもう歩を打てない（二歩になるため）
                    }
                }
            }
        }
        for (let i = 0; i < 9; i++) {// 盤面の行 (0-8) を走査
            for (let j = 0; j < 9; j++) {// 盤面の列 (0-8) を走査
                // 以下の3つの条件がすべて真の場合、そのマスは駒を打てるマスである
                // 1.そのマスが空マスであること（他の駒がない）
                // 2.その駒をそこに打った場合、その後の手で移動可能であること（打ち歩詰め、行き所のない駒の判定）
                // 3.(「歩」の場合のみ) その列に二歩にならないこと
                if (!this.board[i][j].owner && this.existCanMove(i, j, piece) && pawnColMemo[j]) {
                    this.selection.boardSelectInfo[i][j] = "配置可能";// そのマスを「配置可能」としてマーク
                }
            }
        }
    }

    /**
     * 与えられた (i, j) 座標を将棋の盤面の住所形式（例: "7六", "1一"）に変換します。
     * 左上が (0,0)、右下が (8,8) と仮定します。
     *
     * @param {number} i - 行のインデックス (0-8)。
     * @param {number} j - 列のインデックス (0-8)。
     * @returns {string} 将棋の盤面の住所形式の文字列。
     */
     convertToShogiAddress(i, j) {
        // 筋（列）の変換: j=0 が 9筋、j=8 が 1筋
        // 9 - j で計算できます。（例: j=0 -> 9, j=8 -> 1）
        const suji = 9 - j; 

        // 段（行）の変換: i=0 が 一段、i=8 が 九段
        // 日本語の段の文字に変換します。
        const danChars = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
        const dan = danChars[i];

        return `${suji}${dan}`;
    }

    //将棋盤は9x9の二次元配列で表現されており、それぞれのマスにある駒のデータ（owner, name）を対応するPieceクラスのインスタンスへ復元する・盤面上の駒をクラスのインスタンスに復元する(デシリアライズする)
    deserializeBoard(boardData) {
        if (!Array.isArray(boardData)) { //配列でない場合は警告を出して空の盤面を返す
            console.warn("deserializeBoard: 受信したboardDataが配列ではありません。空のボードで初期化しています。", boardData);
            //長さ9の配列を作り、各要素をnullで埋める。→ その後、mapで各null要素を、長さ9の配列（各要素はBlankの新しいインスタンス）に変換する。→ これにより、9x9の空の盤面が生成される。
            return Array(9).fill(null).map(() => Array(9).fill(new Blank()));
        }
        return boardData.map(row => {//受け取ったboardDataの各行を処理
            if (!Array.isArray(row)) { //各行が配列でない場合も警告を出して空の盤面を返す
                console.warn("deserializeBoard: 受け取った行が配列ではありません。空の行で初期化しています。", row);
                return Array(9).fill(new Blank());// その行をBlankの行で埋める
            }
            return row.map(pieceData => { // 各行の各駒データ（pieceData）を変換//各駒データをdeserializePieceでインスタンスに変換
                return this.deserializePiece(pieceData);//deserializePieceを使って駒インスタンスに変換
            });
        });
    }

    //JSON形式で受け取った持ち駒台のデータを、Pieceクラスのインスタンスを含む持ち駒台のオブジェクトに再構築する(デシリアライズする)
    deserializePieceStand(pieceStandData) {
        if (!pieceStandData) {//データが存在しない(nullやundefined)場合
            return { "先手": Array(9).fill({}), "後手": Array(9).fill({}) };//空の持ち駒台オブジェクト（先手・後手それぞれ空の配列）を返す
        }
        const deserializedStand = {};//空のオブジェクトを作成し、ここに復元された持ち駒データを格納していく
        for (const owner in pieceStandData) {//pieceStandDataオブジェクトの各プロパティ（"先手"、"後手"）をループ
            if (pieceStandData.hasOwnProperty(owner)) {// オブジェクト自身のプロパティのみを処理
                if (Array.isArray(pieceStandData[owner])) {// 各プレイヤーの持ち駒配列が配列かチェック
                    deserializedStand[owner] = pieceStandData[owner].map(pieceDataItem => {//各プレイヤーの持ち駒配列に対してmap()を使用し、それぞれの駒データ(pieceDataItem)をdeserializePieceで駒インスタンスに変換します。
                        return this.deserializePiece(pieceDataItem);//各駒データをdeserializePieceでインスタンスに変換
                    });
                } else {// 配列でない場合は警告
                    console.warn(`deserializePieceStand: pieceStandData[${owner}] は配列ではありません。空のスタンドで初期化しています。`);
                    deserializedStand[owner] = Array(9).fill({});//空配列を返して安全に動作継続
                }
            }
        }
        return deserializedStand;// 再構築された持ち駒台オブジェクトを返す
    }

    //個々の駒のデータ（{ name: "歩", owner: "先手" }のようなプレーンなオブジェクト）を受け取り、対応するPieceクラスのインスタンスを生成して返します。
    deserializePiece(pieceData) {
        //console.log("pieceData:"+JSON.stringify(pieceData))
        if (!pieceData || !pieceData.name || !pieceData.owner) {//データが不完全な場合はBlankを返す
            return new Blank();
        }
        switch (pieceData.name) {// 駒の名前（nameプロパティ）に基づいて適切なクラスのインスタンスを生成
            case "竜": return new PromotedRook(pieceData.owner);
            case "馬": return new PromotedBishop(pieceData.owner);
            case "成銀": return new PromotedSilverGeneral(pieceData.owner);
            case "成桂": return new PromotedKnight(pieceData.owner);
            case "成香": return new PromotedLance(pieceData.owner);
            case "と": return new PromotedPawn(pieceData.owner);
            case null: return new Blank();// null の名前も Blank として処理
            default:
                //console.log("pieceData.name:"+JSON.stringify(pieceData.name))
                //console.log("pieceData.owner:"+JSON.stringify(pieceData.owner))
                const pieceInstance = Piece.getPieceByName(pieceData.name, pieceData.owner);// Pieceクラスのヘルパーで非成駒を生成
                //console.log("pieceInstance:"+JSON.stringify(pieceInstance))
                return pieceInstance || new Blank();// 見つからなければ Blank
        }
    }

    //現在のBoardInfoインスタンスの全ての状態を、サーバーに送信したり、ローカルストレージに保存したりできるプレーンなJavaScriptオブジェクト形式に変換して返す(シリアライズする)
    getBoardState() {
        // 盤面の駒をシリアライズ (ownerとnameだけを抽出)
        // 各駒インスタンスをプレーンなオブジェクトに変換して返す
        const serializedBoard = this.board.map(row =>
            row.map(piece => ({
                owner: piece.owner,
                name: piece.name,
                // dx, dy, dk などはクライアント側でのみ必要な情報なので、サーバーに送る必要がない場合が多い
                // 必要であればここに含める
            }))
        );
        // 持ち駒台の駒をシリアライズ (ownerとnameだけを抽出)
        const serializedPieceStand = {};
        for (const owner in this.pieceStand) {
            serializedPieceStand[owner] = this.pieceStand[owner].map(piece => ({
                owner: piece.owner,
                name: piece.name
            }));
        }
        // selectionオブジェクトもシリアライズ (深いコピーを作成し、pieceStandPieceがあればそれもシリアライズ)
        // selectionもそのまま送るか、必要な情報だけ抽出して送る
        const serializedSelection = JSON.parse(JSON.stringify(this.selection));
        // selection.pieceStandPiece にインスタンスが入っている場合、これもシリアライズ
        if (serializedSelection.pieceStandPiece && serializedSelection.pieceStandPiece.name) {
            serializedSelection.pieceStandPiece = {
                owner: serializedSelection.pieceStandPiece.owner,
                name: serializedSelection.pieceStandPiece.name
            };
        }
        return {
            nowTurn: this.nowTurn,
            board: serializedBoard,
            selection: serializedSelection,
            pieceStandNum: JSON.parse(JSON.stringify(this.pieceStandNum)), // 駒台の数はそのまま送れる・駒台の数はそのままコピー
            pieceStand: serializedPieceStand,
        };
    }
}

class Selection {
    boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill(""))));
    isNow = false;
    state = false;
    before_i = null;
    before_j = null;
    pieceStandSelectInfo = {
        "先手": Array(9).fill("持駒"),
        "後手": Array(9).fill("持駒")
    };
    pieceStandPiece = new Blank();
}

export { BoardInfo, Selection };
