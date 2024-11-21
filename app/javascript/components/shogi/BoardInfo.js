import { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn } from './Pieces';

class BoardInfo {

    constructor() {
        this.turn = "先手";
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
        };
    }

    boardClick(i, j) {
        if (this.selection.state) {
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
