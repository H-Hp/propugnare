//import { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn } from './Pieces';
import { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn, PromotedRook,PromotedBishop,PromotedSilverGeneral,PromotedKnight,PromotedLance,PromotedPawn } from './Pieces';

class BoardInfo {

    // initialDataがない場合は、デフォルトの初期盤面を生成
    constructor(initialData = {}) {
        // デフォルトの初期盤面データ
        const defaultBoard = [
            [new Lance("後手"), new Knight("後手"), new SilverGeneral("後手"), new GoldGeneral("後手"), new King("後手"), new GoldGeneral("後手"), new SilverGeneral("後手"), new Knight("後手"), new Lance("後手")],
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



        // initialData.board が存在しない、または配列でない場合はデフォルトボードを使用
        // 存在する場合はデシリアライズして復元
        //console.log("initialData.board:"+initialData.board)
        //console.log("initialData.board:"+JSON.stringify(initialData.BoardInfo))
        //console.log("initialData.board.board:"+JSON.stringify(initialData.BoardInfo.board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))

        //console.log("defaultBoard:"+JSON.stringify(defaultBoard))
        //console.log("initialData:"+JSON.stringify(initialData))

        
        if (Object.keys(initialData).length === 0) {// 初期値（空オブジェクト）のとき
            //console.log("initialDataが空の時");
            this.board = this.deserializeBoard(defaultBoard);
        }else{//initialDataにデータが入っている場合
            //console.log("initialDataが空じゃない時:"+JSON.stringify(initialData.BoardInfo.board));
            //console.log("initialDataが空じゃない時:");
            //const boardData = initialData.BoardInfo.board;
            this.board = this.deserializeBoard(initialData.BoardInfo.board);
        }
        //this.board = this.deserializeBoard(initialData.board || defaultBoard);
        //this.board = this.deserializeBoard(initialData.BoardInfo || defaultBoard);
        //this.board = this.deserializeBoard(initialData.BoardInfo.board || defaultBoard);
        //this.turn = initialData.turn || "先手";
        this.turn = initialData.currentPlayer || "先手";

        // selection の復元
        // JSON.parse(JSON.stringify())でディープコピーし、必要に応じて駒を再構築
        this.selection = initialData.selection ? JSON.parse(JSON.stringify(initialData.selection)) : defaultSelection;
        if (this.selection.pieceStandPiece && this.selection.pieceStandPiece.name) {
            this.selection.pieceStandPiece = this.deserializePiece(this.selection.pieceStandPiece);
        } else {
            this.selection.pieceStandPiece = {}; // 無効な場合は空オブジェクトに設定
        }

        // pieceStandNum は通常プレーンなデータなので、ディープコピーでOK
        this.pieceStandNum = initialData.pieceStandNum ? JSON.parse(JSON.stringify(initialData.pieceStandNum)) : defaultPieceStandNum;

        // pieceStand のデシリアライズ
        this.pieceStand = this.deserializePieceStand(initialData.pieceStand || defaultPieceStand);

        // メソッドのバインド (必要に応じて)
        this.boardClick = this.boardClick.bind(this);
        this.makePieceStand = this.makePieceStand.bind(this);
        this.checkCanPutBoard = this.checkCanPutBoard.bind(this);
        this.existCanMove = this.existCanMove.bind(this);
        this.checkPromote = this.checkPromote.bind(this);
        //this.canPromote = this.canPromote.bind(this);
        this.getBoardState = this.getBoardState.bind(this);
        
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

    boardClick(i, j) {
        if (this.selection.state) {
            //console.log(`this.board[i][j].getPiece()：${this.board[i][j].getPiece()}`)
            if (this.selection.boardSelectInfo[i][j] !== "配置可能") {
                return;
            }
            let myPiece;
            if (this.selection.pieceStandPiece.name) {
                myPiece = this.selection.pieceStandPiece;
                this.pieceStandNum[this.turn][myPiece.name] -= 1;
                this.makePieceStand();
            } else {
                myPiece = this.board[this.selection.before_i][this.selection.before_j];
                this.board[this.selection.before_i][this.selection.before_j] = new Blank();
                let yourPiece = this.board[i][j];
                if (yourPiece.name) {
                    if (yourPiece.getPiece()) {
                        yourPiece = yourPiece.getPiece();
                    }
                    this.pieceStandNum[myPiece.owner][yourPiece.name] += 1;
                    this.makePieceStand();
                }
                if (this.existCanMove(i, j, myPiece)) {
                    myPiece = this.checkPromote(myPiece, i, this.selection.before_i);
                } else {
                    myPiece = myPiece.getPromotedPiece();
                }
            }
                
            this.board[i][j] = myPiece;
            this.turn = this.turn === "先手" ? "後手" : "先手";
            //return true; // コマが動いた
            return {
                //newBoardState: this.getBoardState(), // 変更後の盤面状態を返す
                BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                moved: true,// 駒が動いた場合
                //moveDetails: this.board[i][j]
                move: this.board[i][j],
                currentPlayer: this.turn
            };

        } else {
            if (this.turn !== this.board[i][j].owner) {
                return;
            }
            this.selection.isNow = true;
            this.selection.state = true;
            this.selection.before_i = i;
            this.selection.before_j = j;
            this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));
            this.selection.pieceStandSelectInfo = {
                "先手": Array(9).fill("未選択"),
                "後手": Array(9).fill("未選択")
            };
            this.selection.boardSelectInfo[i][j] = "選択状態";
            this.checkCanPutBoard(i, j);
            return {
                //newBoardState: this.getBoardState(), // 変更後の盤面状態を返す
                BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                moved: false,// 駒が動いた場合
                //moveDetails: this.board[i][j]
                move: this.board[i][j],
                currentPlayer: this.turn
            };
        }
    }

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

    checkPromote(piece, i, before_i) {
        //console.dir("checkPromoteのpromotedPieceCandidate: "+JSON.stringify(piece.getPromotedPiece()));
        console.log(`piece：${JSON.stringify(piece)}`);
        console.log(`typeof piece.getPromotedPiece：${typeof piece.getPromotedPiece}`);

        if (!piece.getPromotedPiece()) {
            return piece;
        }
        const promoteAreaMinY = piece.owner === "先手" ? 0 : 6;
        const promoteAreaMaxY = piece.owner === "先手" ? 2 : 8;
        if ((promoteAreaMinY <= i && i <= promoteAreaMaxY) || (promoteAreaMinY <= before_i && before_i <= promoteAreaMaxY)) {
            if (window.confirm('成りますか？')) {
                return piece.getPromotedPiece()
            }
        }
        return piece;
    }

    checkCanPutBoard(i, j) {
        const piece = this.board[i][j];
        for (let l = 0; l < piece.dx.length; l++) {
            let y = i;
            let x = j;
            for (let _ = 0; _ < piece.dk[l]; _++) {
                y += this.turn === "先手" ? piece.dy[l] : -piece.dy[l];
                x += this.turn === "先手" ? piece.dx[l] : -piece.dx[l];
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
        if (this.selection.state || this.turn !== piece.owner) {
            return;
        }
        this.selection.isNow = true;
        this.selection.state = true;
        this.selection.boardSelectInfo = JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("未選択"))));
        this.selection.pieceStandPiece = piece;
        this.selection.pieceStandSelectInfo = {
            "先手": Array(9).fill("未選択"),
            "後手": Array(9).fill("未選択")
        };
        const i = this.pieceStand[piece.owner].findIndex(p => p.name === piece.name);
        this.selection.pieceStandSelectInfo[this.turn][i] = "選択状態";
        this.checkCanPutPieceStand(piece);
    }

    makePieceStand() {
        let myPieceStand = [];
        const myPieceStandNum = this.pieceStandNum[this.turn];
        for (let name in myPieceStandNum) {
            if (myPieceStandNum[name] > 0) {
                myPieceStand.push(Piece.getPieceByName(name, this.turn));
            }
        }
        while (myPieceStand.length < 9) {
            myPieceStand.push(new Blank());
        }
        this.pieceStand[this.turn] = myPieceStand;
    }

    checkCanPutPieceStand(piece) {
        let pawnColMemo = Array(9).fill(true);
        if (piece.name === "歩") {
            for (let i = 0; i < 9; i++) {
                for (let j = 0; j < 9; j++) {
                    if (this.board[i][j].name === "歩" && this.board[i][j].owner === piece.owner) {
                        pawnColMemo[j] = false;
                    }
                }
            }
        }
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (!this.board[i][j].owner && this.existCanMove(i, j, piece) && pawnColMemo[j]) {
                    this.selection.boardSelectInfo[i][j] = "配置可能";
                }
            }
        }
    }




    //新規追加した処理
    // 盤面上の駒をクラスインスタンスに再構築するヘルパーメソッド
    deserializeBoard(boardData) {
        if (!Array.isArray(boardData)) {
            console.warn("deserializeBoard: received boardData is not an array. Initializing with empty board.", boardData);
            return Array(9).fill(null).map(() => Array(9).fill(new Blank()));
        }
        return boardData.map(row => {
            if (!Array.isArray(row)) {
                console.warn("deserializeBoard: received row is not an array. Initializing with empty row.", row);
                return Array(9).fill(new Blank());
            }
            return row.map(pieceData => {
                return this.deserializePiece(pieceData);
            });
        });
    }

    // 駒台の駒をクラスインスタンスに再構築するヘルパーメソッド
    deserializePieceStand(pieceStandData) {
        if (!pieceStandData) {
            return { "先手": Array(9).fill({}), "後手": Array(9).fill({}) };
        }

        const deserializedStand = {};
        for (const owner in pieceStandData) {
            if (pieceStandData.hasOwnProperty(owner)) {
                if (Array.isArray(pieceStandData[owner])) {
                    deserializedStand[owner] = pieceStandData[owner].map(pieceDataItem => {
                        return this.deserializePiece(pieceDataItem);
                    });
                } else {
                    console.warn(`deserializePieceStand: pieceStandData[${owner}] is not an array. Initializing with empty stand.`);
                    deserializedStand[owner] = Array(9).fill({});
                }
            }
        }
        return deserializedStand;
    }

    // 個々の駒データをクラスインスタンスに変換する汎用ヘルパー
    deserializePiece(pieceData) {
        if (!pieceData || !pieceData.name || !pieceData.owner) {
            return new Blank();
        }

        switch (pieceData.name) {
            case "竜": return new PromotedRook(pieceData.owner);
            case "馬": return new PromotedBishop(pieceData.owner);
            case "成銀": return new PromotedSilverGeneral(pieceData.owner);
            case "成桂": return new PromotedKnight(pieceData.owner);
            case "成香": return new PromotedLance(pieceData.owner);
            case "と": return new PromotedPawn(pieceData.owner);
            case null: return new Blank();
            default:
                const pieceInstance = Piece.getPieceByName(pieceData.name, pieceData.owner);
                return pieceInstance || new Blank();
        }
    }



    // ... (getBoardState およびその他のゲームロジックメソッド)
    // 例えば、getBoardState メソッドは、現在の BoardInfo インスタンスの状態を
    // サーバーに送るためのプレーンなオブジェクト形式で返すようにします
    getBoardState() {
        // 各駒インスタンスをプレーンなオブジェクトに変換して返す
        const serializedBoard = this.board.map(row =>
            row.map(piece => ({
                owner: piece.owner,
                name: piece.name,
                // dx, dy, dk などはクライアント側でのみ必要な情報なので、サーバーに送る必要がない場合が多い
                // 必要であればここに含める
            }))
        );

        const serializedPieceStand = {};
        for (const owner in this.pieceStand) {
            serializedPieceStand[owner] = this.pieceStand[owner].map(piece => ({
                owner: piece.owner,
                name: piece.name
            }));
        }

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
            turn: this.turn,
            board: serializedBoard,
            selection: serializedSelection,
            pieceStandNum: JSON.parse(JSON.stringify(this.pieceStandNum)), // 駒台の数はそのまま送れる
            pieceStand: serializedPieceStand,
        };
    }
    //新規追加ここまで
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
