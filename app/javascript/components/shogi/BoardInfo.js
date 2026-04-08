import { Piece, Blank, King, Gyoku, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn, PromotedRook,PromotedBishop,PromotedSilverGeneral,PromotedKnight,PromotedLance,PromotedPawn } from './Pieces';

class BoardInfo {
    // initialDataがない場合は、デフォルトの初期盤面を生成
    constructor(initialData = {}) {
        // デフォルトの初期配置の配列
        /*const defaultBoard = [
            [new Lance("後手"), new Knight("後手"), new SilverGeneral("後手"), new GoldGeneral("後手"), new Gyoku("後手"), new GoldGeneral("後手"), new SilverGeneral("後手"), new Knight("後手"), new Lance("後手")],
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
            [new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手"), new Pawn("後手")],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
            [new Blank(), new Bishop("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            [new Lance("先手"), new Knight("先手"), new SilverGeneral("先手"), new GoldGeneral("先手"), new King("先手"), new GoldGeneral("先手"), new SilverGeneral("先手"), new Knight("先手"), new Lance("先手")]
        ];*/ 
        //成り処理のテスト用ボード
        /*const defaultBoard = [
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Gyoku("後手"), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank() , new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
            [new Blank(), new Blank() , new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Pawn("先手"), new Pawn("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Pawn("後手"), new Pawn("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Pawn("後手"), new Pawn("後手")],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(),new Blank() , new Blank()],
            [new Blank(),new Blank() , new Blank(), new Blank(), new Blank(), new Blank(), new Blank(),new Blank() , new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new King("先手"), new Blank(), new Blank(), new Rook("先手"), new Blank()]
        ];
        */
        //詰み処理のテスト用ボード・コマ動かして詰み・持ち駒打って詰み
        /*const defaultBoard = [
            [new Blank(), new Blank(), new Blank(), new Blank(), new King("後手"), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Bishop("後手"), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new GoldGeneral("先手"), new GoldGeneral("先手"), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手"), new Pawn("先手")],
            [new Blank(), new Bishop("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            //[new Blank(), new Bishop("先手"), new Blank(), new Blank(), new SilverGeneral("後手"), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            [new Lance("先手"), new Knight("先手"), new SilverGeneral("先手"), new GoldGeneral("先手"), new King("先手"), new GoldGeneral("先手"), new SilverGeneral("先手"), new Knight("先手"), new Lance("先手")]
        ];*/
        //王手千日手の処理のテスト用ボード・飛車で王手をかけ続けて往復するループを作る
        const defaultBoard = [
            [new Blank(), new Blank(), new Blank(), new Blank(), new King("後手"), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Rook("後手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("先手"), new Blank()],
            [new Blank(), new Blank(), new Blank(), new Blank(), new King("先手"), new Blank(), new Blank(), new Blank(), new Blank()]
        ];
        const defaultSelection = new Selection();
        const defaultPieceStandNum = {
            "先手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 },
            "後手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 }
        };
        const defaultPieceStand = {
            "先手": [new Blank(), new Blank(),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            "後手": [new Blank(), new Blank(),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
        };

        // initialData.board が存在しない、または配列でない場合はデフォルトボードを使用
        // 存在する場合はデシリアライズして復元
        /*{
        //console.log("initialData.board:"+initialData.board)
        //console.log("initialData.board:"+JSON.stringify(initialData.BoardInfo))
        //console.log("initialData.board.board:"+JSON.stringify(initialData.BoardInfo.board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))
        //console.log("initialData.board.board:"+JSON.stringify(JSON.parse(initialData.BoardInfo).board))
        //console.log("defaultBoard:"+JSON.stringify(defaultBoard))
        //console.log("initialData:"+JSON.stringify(initialData))
        }*/
        // 初期値とRedisから取得したデータ構造がなぜかちょっと違うから分岐する(initialData.BoardInfo.boardで取得できるのがRedisのデータで、initialData.currentPlayerなどでアクセスするのが初期データ)
        if (Object.keys(initialData).length === 0) {
            //console.log("initialDataが空の時");
            //console.log("initialData:"+JSON.stringify(initialData))
            this.board = this.deserializeBoard(defaultBoard);
            //console.log("this.board:"+JSON.stringify(this.board))
            this.pieceStandNum = defaultPieceStandNum
            this.pieceStand = defaultPieceStand
            this.nowTurn = initialData.nowTurn || "先手";
            //this.selection = defaultSelection
        }else{//initialDataにデータが入っている場合
            //console.log("initialDataが空じゃない時:"+JSON.stringify(initialData));
            //console.log("initialDataが空じゃない時:"+JSON.stringify(initialData.BoardInfo.board));
            //const boardData = initialData.BoardInfo.board;
            this.board = this.deserializeBoard(initialData.BoardInfo.board);

            // pieceStandNum は通常プレーンなデータなので、ディープコピーでOK
            this.pieceStandNum = initialData.BoardInfo.pieceStandNum ? JSON.parse(JSON.stringify(initialData.BoardInfo.pieceStandNum)) : defaultPieceStandNum;

            // pieceStand のデシリアライズ
            this.pieceStand = this.deserializePieceStand(initialData.BoardInfo.pieceStand || defaultPieceStand);
            this.nowTurn = initialData.BoardInfo.nowTurn || "先手";

            //this.selection = initialData.BoardInfo.selection
        }


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
        //this.pieceStandNum = initialData.pieceStandNum ? JSON.parse(JSON.stringify(initialData.pieceStandNum)) : defaultPieceStandNum;
        // pieceStand のデシリアライズ
        //this.pieceStand = this.deserializePieceStand(initialData.pieceStand || defaultPieceStand);

        //console.log("initialData:"+JSON.stringify(initialData)) //console.log("initialData.pieceStandNum:"+JSON.stringify(initialData.pieceStandNum)); //console.log("initialData.pieceStand:"+JSON.stringify(initialData.pieceStand));

        // メソッドのバインド (必要に応じて)
        this.boardClick = this.boardClick.bind(this);
        this.pieceStandClick = this.pieceStandClick.bind(this);
        this.makePieceStand = this.makePieceStand.bind(this);
        this.checkCanPutBoard = this.checkCanPutBoard.bind(this);
        this.existCanMove = this.existCanMove.bind(this);
        this.checkPromote = this.checkPromote.bind(this);
        //this.canPromote = this.canPromote.bind(this);
        this.getBoardState = this.getBoardState.bind(this);
        this.convertToShogiAddress = this.convertToShogiAddress.bind(this);
        this.CreateEasyBoard= this.CreateEasyBoard.bind(this);

        //見やすいボード情報を作る //const EasyBoard = this.CreateEasyBoard(this.board) //console.log("EasyBoard:"+JSON.stringify(EasyBoard)); //console.log("EasyBoard:\n"+this.CreateEasyBoard(this.board));
        
        this.onPromoteConfirmCallback = null;// コールバック関数を保存するプロパティ
        
    }

    // 成り確認のコールバック関数を設定するメソッド
    setPromoteConfirmCallback(callback) {
        //index.jsのthis.handlePromoteConfirmをcallbackとして受け取り、this.onPromoteConfirmCallbackにセットする
        //console.log("setPromoteConfirmCallback がcallbackと共に呼び出されました:callback:"+callback);
        this.onPromoteConfirmCallback = callback;
        //console.log("設定後 - コールバックは:", this.onPromoteConfirmCallback);
    }

    //i（行）→ 横方向（左から右）
	//j（列）→ 縦方向（上から下）
    //boardClick(i, j,yourRole) {
    //async boardClick(i, j,yourRole) {
    async boardClick(i, j,yourRole,boardSfenHistory,moveSfenHistory) {
        //console.log("this.nowTurn:"+this.nowTurn)
        //console.log("yourRole:"+yourRole)
        //console.log("事前this.selection:"+JSON.stringify(this.selection))
        if(yourRole!==this.nowTurn){//自分のターンじゃなければ操作できないように
            //console.log("自分のターンじゃないので操作できない")
            return
        }
            
        //this.board[i][j]
        //console.log("this.board[i][j]:",this.board[i][j])
        if(this.selection.before_j!=null){
            //console.log("this.board[this.selection.before_i][this.selection.before_j]:",this.board[this.selection.before_i][this.selection.before_j])
        }
        /*console.log("i,j:",i,j)
        console.log("this.selection.boardSelectInfo[i][j]:",this.selection.boardSelectInfo[i][j])
        console.log("this.selection.before_i, this.selection.before_j:",this.selection.before_i,this.selection.before_j)
        console.log("this.selection.pieceStandPiece:",this.selection.pieceStandPiece)
        console.log("Object.keys(this.selection.pieceStandPiece).length > 0:",Object.keys(this.selection.pieceStandPiece).length > 0)
        */
        //if (this.selection.state && //何らかの駒が選択されている状態、かつi == this.selection.before_i && j == this.selection.before_j、もしくはthis.selection.pieceStandPieceがカラオブジェクトじゃなければ
        
        if (this.selection.state && this.selection.boardSelectInfo[i][j] =="配置可能" ) { //何らかの駒が選択されている状態の場合(駒を打つか移動する)
            //((i == this.selection.before_i && j == this.selection.before_j) || 
            //(i !== this.selection.before_i && j !== this.selection.before_j)
            //(Object.keys(this.selection.pieceStandPiece).length > 0))) {
             //(Object.keys(this.selection.pieceStandPiece).length > 0)
            //if (this.selection.state && i==this.selection.before_i && j==this.selection.before_j) {//何らかの駒が選択されている状態の場合
            //if (this.selection.state) {//何らかの駒が選択されている状態の場合
            //console.log(`何らかの駒が選択されている状態の場合・this.board[i][j].getPiece()：${this.board[i][j].getPiece()}`)
            //console.log(`this.board[i][j].getPiece()：${this.board[i][j].getPiece()}`)
            if (this.selection.boardSelectInfo[i][j] !== "配置可能") {//クリックされたマスが移動先として不適切であれば
                return;
            }
            let myPiece;
            let yourPiece;
            const originalBoardState = JSON.parse(JSON.stringify(this.board)); // 元に戻すために文字列で保持

            //let moveSfEN; // 指した手をSFEN形式で記録するための変数
            let BoardOrPiecestand; // 駒移動か駒打ちで場合分けするための変数

            if (this.selection.pieceStandPiece.name) {// 持ち駒が選択されている場合 (駒を打つ)
                myPiece = this.selection.pieceStandPiece;// 持ち駒を移動する駒(myPiece)にする

                // 打ち歩詰めのチェック
                if (myPiece.name === "歩" && this.isUchiFuZume(i, j, this.nowTurn)) {
                    alert("打ち歩詰めは禁止です！");
                    return {
                        BoardInfo: this.getBoardState(),
                        moved_check: false,
                        moveDetails: "打ち歩詰め",
                        boardSFEN: this.boardToSFEN(this.getBoardState()),
                        moveSFEN: "none",
                        pieceStandNum: this.pieceStandNum,
                        pieceStand: this.pieceStand,
                        nowTurn: this.nowTurn,
                        isCheck: false,
                        isCheckmate: false,
                        isSennichite: { result: "no_sennichite" },
                        isGameset: false,
                        winner: "yet",
                        move_status: "illegalMove"
                    };
                }

                this.pieceStandNum[this.nowTurn][myPiece.name] -= 1;// 持ち駒の数を減らす
                this.makePieceStand();// 持ち駒台の表示を更新
                myPiece = Piece.getPieceByName(myPiece.name, this.nowTurn)
                this.board[i][j] = myPiece; // 駒を新しいマスに配置
                //console.log("this.selection:"+JSON.stringify(this.selection))
                //console.log("myPieceああ:"+JSON.stringify(myPiece))
                BoardOrPiecestand="Piecestand"

            } else {// 盤上の駒が選択されている場合 (駒を動かす)
                myPiece = this.board[this.selection.before_i][this.selection.before_j]; // 選択していた盤上の駒(myPiece)にする
                this.board[this.selection.before_i][this.selection.before_j] = new Blank();// 元のマスを空白にする
                yourPiece = this.board[i][j];// 移動先にあった駒をyourPieceにする
                if (yourPiece.name) { // 移動先に相手の駒があった場合 (駒を取る)
                    if (yourPiece.getPiece()) {// 成駒だった場合、元の駒に戻す
                        yourPiece = yourPiece.getPiece();
                    }
                    
                    this.pieceStandNum[myPiece.owner][yourPiece.name] += 1;// 持ち駒として追加
                    //console.log("持ち駒として追加・this.pieceStandNum:"+JSON.stringify(this.pieceStandNum))
                    this.makePieceStand();// 持ち駒台の表示を更新
                }
                BoardOrPiecestand="Board"

                //console.log(`this.selection.before_i：${this.selection.before_i}`)

                // 成りの判定と処理
                if (this.existCanMove(i, j, myPiece)) {
                    //console.log("成りの判定と処理")
                    //console.log("myPieceの初期値:"+JSON.stringify(myPiece))
                    
                    //なぜか下のawaitでthis.selection.before_iとかが消えるので一時保存
                    const temp_selection_before_i= this.selection.before_i
                    const temp_selection_before_j= this.selection.before_j

                    myPiece = await this.checkPromote(myPiece, i, this.selection.before_i, j);

                    //[myPiece,i,j] = await this.checkPromote(myPiece, i, this.selection.before_i, j);

                    //const promoteResult = await this.checkPromote(myPiece, i, this.selection.before_i, j);
                    //this.selection.before_i=i
                    //this.selection.before_j=j
                    this.selection.before_i=temp_selection_before_i
                    this.selection.before_j=temp_selection_before_j

                    //console.log(`あとthis.selection.before_i：${this.selection.before_i}`)
                    //console.log("myPieceの変更後:"+JSON.stringify(myPiece))
                    //myPiece = this.checkPromote(myPiece, i, this.selection.before_i);// 成りを確認
                    /*const promoteResult = this.checkPromote(myPiece, i, this.selection.before_i);// 成りを確認
                    console.log("myPieceの変更後:"+JSON.stringify(myPiece))

                    if (promoteResult === null) {
                        // 非同期処理中（モーダル待ち）の場合は処理を一時停止
                        console.log("非同期処理中（モーダル待ち）の場合は処理を一時停止")
                        return;
                    } else {
                        // 同期的に結果が返された場合は移動処理を続行
                        console.log("同期的に結果が返された場合は移動処理を続行")
                        myPiece = promoteResult;
                        //this.continueBoardClick(result, clickedIndex, before_i);
                    }*/
                   /*const promoteResult = this.checkPromote(myPiece, i, this.selection.before_i, j, (finalPiece) => {
                        // 非同期完了時にここが実行される
                        myPiece = finalPiece;
                        console.log("処理続行 - myPiece:" + JSON.stringify(myPiece));
                        //console.log("finalPiece:" + JSON.stringify(finalPiece));
                   
                        //下の処理と同じここから
                        this.board[i][j] = myPiece;// 駒を新しいマスに配置
                        const ShogiAddress = this.convertToShogiAddress(i, j)
                        const tempBoard = this.deserializeBoard(originalBoardState); // originalBoardState をデシリアライズして使用
                        tempBoard[i][j] = myPiece;
                        if (!this.selection.pieceStandPiece.name) { // 盤上の駒を動かした場合
                            tempBoard[this.selection.before_i][this.selection.before_j] = new Blank();
                        }
                        if (this.isKingInCheck(tempBoard, this.nowTurn)) {
                            this.board[this.selection.before_i][this.selection.before_j] = myPiece; // 選択していた駒を元に戻す
                            this.board[i][j] = yourPiece; // 取った駒を元に戻す（またはBlank）
                            if (this.selection.pieceStandPiece.name) {
                                this.pieceStandNum[this.nowTurn][myPiece.name] += 1;
                                this.makePieceStand();
                            } else if (yourPiece.name) { // 駒を取った場合
                                this.pieceStandNum[myPiece.owner][yourPiece.name] -= 1;
                                this.makePieceStand();
                            }
                            alert("自分の玉が王手です！");
                            return { moved_check: false,  }; // 駒は動かなかった
                        }
                        const previousTurn = this.nowTurn; // 手番交代前の所有者を保持
                        //this.nowTurn = this.nowTurn === "先手" ? "後手" : "先手";
                        const isOpponentKingInCheck = this.isKingInCheck(this.board, this.nowTurn);
                        const isOpponentKingInCheckmate = isOpponentKingInCheck && this.isCheckmate(this.board, this.nowTurn, this.pieceStandNum); // pieceStandNum を渡す
                        let winner = "yet"
                        if(isOpponentKingInCheckmate){//決着が付いたら勝者の設定
                            winner=previousTurn
                        }
                        const boardSFEN = this.boardToSFEN(this.getBoardState());
                        console.log("return寸前");
                        return {
                            BoardInfo: this.getBoardState(),
                            moved_check: true,
                            moveDetails: previousTurn + ShogiAddress + myPiece.name, // 指した手は自分の手番で記録
                            boardSFEN: boardSFEN,
                            pieceStandNum: this.pieceStandNum,
                            pieceStand: this.pieceStand,
                            nowTurn: this.nowTurn,
                            isCheck: isOpponentKingInCheck, // 王手状態を結果に追加
                            isCheckmate: isOpponentKingInCheckmate, // 詰み状態
                            winner: winner // 詰み状態
                        };
                        //下の処理と同じここまで
                    });
                    */
                    //console.log("myPieceの変更後:" + JSON.stringify(myPiece));
                    //console.log("promoteResult:" + JSON.stringify(promoteResult));

                    /*if (promoteResult === null) {
                        // 非同期処理中（モーダル待ち）の場合は処理を一時停止
                        console.log("非同期処理中（モーダル待ち）の場合は処理を一時停止");
                        //return;
                        return{
                            moved_check: true,
                        };
                    } else {
                        // 同期的に結果が返された場合、既にコールバックで処理済み
                        console.log("同期的に結果が返された場合は移動処理を続行");
                        // コールバック内で処理されるので、ここでは何もしない
                    }*/
                    //console.log("あぐあああ")
                    //console.log("i:"+i+"・j:"+j)
                    
                } else {// その駒がもう動けない場合（強制的に成る）
                    myPiece = myPiece.getPromotedPiece();// 強制的に成る
                }
                this.board[i][j] = myPiece;// 駒を新しいマスに配置
            }

            //this.continueMove(myPiece, yourPiece, i, j,originalBoardState);
    
            const ShogiAddress = this.convertToShogiAddress(i, j)//(i, j)座標を将棋の盤面の住所形式（7六, 1一など）に変換
  
            //王手ここから
            // 既存の駒移動/駒打ちのロジックが完了した後、
            // myPiece を新しいマスに配置し、this.board が更新される直前または直後に

            // ここで仮の盤面を作成し、移動後の自分の王が王手にならないかチェックする
            // これは自殺手（自分が王手になる手）のチェックです。
            const tempBoard = this.deserializeBoard(originalBoardState); // originalBoardState をデシリアライズして使用
            //const tempBoard = this.deserializeBoard(originalBoardState); // originalBoardState をデシリアライズして使用

            // 移動後の駒は、myPiece を使用する (myPiece はすでにインスタンスなので再生成不要)
            tempBoard[i][j] = myPiece;

            //console.log("あmyPiece: ",myPiece);
            //console.log("tempBoard[i][j]: ",tempBoard[1][2]);
            //console.log("1tempBoardのEasyBoard:\n"+this.CreateEasyBoard(tempBoard));
            //console.log("tempBoardのmyPiece:"+JSON.stringify(myPiece))
            //console.log("tempBoard[i][j]:"+JSON.stringify(tempBoard[i][j]))
            //console.log("tempBoard[i][j]:"+JSON.stringify(tempBoard[i][j]))
            //console.log("this.selection.before_i:"+JSON.stringify(this.selection.before_i))
            //console.log("this.selection.before_j:"+JSON.stringify(this.selection.before_j))
            
            if (!this.selection.pieceStandPiece.name) { // 盤上の駒を動かした場合は、コマの元いた位置を空白にする(移動したから)
                tempBoard[this.selection.before_i][this.selection.before_j] = new Blank();
            }
            //console.log("2tempBoardのEasyBoard:\n"+this.CreateEasyBoard(tempBoard));
            
            // yourPiece も復元する必要がある
            //if (yourPiece && yourPiece.name) {
            //    tempBoard[i][j] = Piece.getPieceByName(yourPiece.name, yourPiece.owner);
            //}
            //console.log("3tempBoardのEasyBoard:\n"+this.CreateEasyBoard(tempBoard));
            

            // 自分の玉が王手にならないことを確認 (このチェックは、駒を動かす前に実施すべきです。
            // もしここで実施するなら、`this.board` を元の状態に戻すロジックが必要です。)
            // 現在のコードでは、`boardClick` の冒頭で `originalBoardState` を取得し、
            // その後 `this.board` を更新しています。
            // 自殺手チェックは、**駒を動かす前に**、その手が合法手かどうかを判断する際に必要です。
            // ここでは既に駒を動かしてしまっているので、この位置での自殺手チェックは適切ではありません。
            // `getLegalMoves` の中でシミュレーション時にチェックされています。

            // 自分の玉が王手にならないことを確認
            //console.log("あtempBoardのEasyBoard: \n"+this.CreateEasyBoard(tempBoard));

            // 自分の玉が王手になる手は指せない (自殺手の禁止)・盤面を元に戻す
            //console.log("this.isKingInCheck(tempBoard, this.nowTurn): ",this.isKingInCheck(tempBoard, this.nowTurn));
            //console.log("1isKingInCheckのtempBoard: ",tempBoard);
            if (this.isKingInCheck(tempBoard, this.nowTurn)) {//trueなら自分に王手がかかっている、falseなら自分に王手はかかっていない
                // 盤面を元に戻す処理・元のマスに駒を戻し、取った駒も戻すか、 Blank にする
                //console.log("自分の玉が王手になる手は指せない (自殺手の禁止)・盤面を元に戻す")
                //console.log("this.nowTurn:"+this.nowTurn)
                if (!this.selection.pieceStandPiece.name) { // 盤上の駒を動かした場合
                    this.board[this.selection.before_i][this.selection.before_j] = myPiece; // 選択していた駒を元に戻す
                    this.board[i][j] = yourPiece; // 取った駒を元に戻す（またはBlank）
                }

                // 持ち駒を打った場合は、持ち駒の数を戻す
                if (this.selection.pieceStandPiece.name) {
                    this.board[i][j] = new Blank();
                    this.pieceStandNum[this.nowTurn][myPiece.name] += 1;
                    this.makePieceStand();
                } else if (yourPiece.name) { // 駒を取った場合
                     // 持ち駒から取った駒を元に戻す（myPiece.owner の持ち駒）
                    this.pieceStandNum[myPiece.owner][yourPiece.name] -= 1;
                    this.makePieceStand();
                }
                //console.log("自分の玉が王手です！(自殺手)");
                //console.log("tempBoard:\n"+this.CreateEasyBoard(tempBoard));
                //console.log("あthis.CreateEasyBoard(this.board)):\n"+this.CreateEasyBoard(this.board));
                //console.log("this.getBoardState():"+JSON.stringify(this.getBoardState()));
                //console.log("this.selection:"+JSON.stringify(this.selection));

                //this.board=tempBoard
                //this.selection  = new Selection();
                //this.nowTurn = this.nowTurn === "先手" ? "後手" : "先手";

                return { 
                    //BoardInfo: this.getBoardState(),
                    BoardInfo: this.getBoardState(),
                    moved_check: false,
                    //moveDetails: previousTurn + ShogiAddress + myPiece.name, // 指した手は自分の手番で記録
                    moveDetails: "自殺手",
                    //boardSFEN: boardSFEN,
                    boardSFEN: this.boardToSFEN(this.getBoardState()),
                    moveSFEN: "none",
                    pieceStandNum: this.pieceStandNum,
                    pieceStand: this.pieceStand,
                    nowTurn: this.nowTurn,
                    isCheck: false,
                    isCheckmate: false,
                    isSennichite: { result: "no_sennichite" }, // 千日手状態
                    //isCheck: isOpponentKingInCheck, // 王手状態を結果に追加
                    //isCheckmate: isOpponentKingInCheckmate, // 詰み状態
                    //winner: winner, // 詰み状態
                    isGameset: false,
                    winner: "yet",
                    move_status: "illegalMove"
                }; // 駒は動かなかった
                
            }
            //自殺手チェックここまで

            // 自分の玉が王手にならないことが確認できたら、手番を交代
            const previousTurn = this.nowTurn; // 手番交代前の所有者を保持
            this.nowTurn = this.nowTurn === "先手" ? "後手" : "先手";
            
            // 相手（次の手番）が王手になっているかを確認
            //Opponentは(試合の)相手の意味
            //console.log("1isKingInCheckのthis.board: ",this.board);
            const isOpponentKingInCheck = this.isKingInCheck(this.board, this.nowTurn);//trueなら相手に王手がかかっている、falseなら相手に王手はかかっていない
            //alert("相手（次の手番）が王手になっているかを確認・isOpponentKingInCheck: "+isOpponentKingInCheck);
            //console.log("2isKingInCheckのthis.board: ",this.board);
    
            let isGameset=false

            //詰みチェック
            //相手（次の手番）の玉が王手になっているか、そして詰んでいるかを確認
            const isOpponentKingInCheckmate = isOpponentKingInCheck && this.isCheckmate(this.board, this.nowTurn, this.pieceStandNum); // pieceStandNum を渡す
            //alert("相手（次の手番）の玉が王手になっているか、そして詰んでいるかを確認・isOpponentKingInCheck: "+isOpponentKingInCheckmate);
            //console.log("相手（次の手番）の玉が王手になっているか、そして詰んでいるかを確認・isOpponentKingInCheck: "+isOpponentKingInCheckmate);
            let winner = "yet"
            //console.log("board:\n"+this.CreateEasyBoard(this.board));
            if(isOpponentKingInCheckmate){//決着が付いたら勝者の設定
                winner=previousTurn
                isGameset=true
            }
            //console.log("sfenに変更したいデータ"+JSON.stringify(this.getBoardState()))
            let turnCount = boardSfenHistory.length + 1; // 現在の手数（0から始まるので+1）
            const boardSFEN = this.boardToSFEN(this.getBoardState(),turnCount);
            //console.log("sfenに変更したデータ"+JSON.stringify(boardSFEN))

            let moveSFEN=this.posToMoveSfen(i, j, yourRole, myPiece.name, BoardOrPiecestand); // 駒移動のSFENを生成
            let originalName = myPiece.name;
            if (myPiece.name !== originalName) {
                moveSFEN += "+";
            }
            console.log("駒移動のmoveSFEN:"+moveSFEN);

            //千日手と王手千日手チェック
            //let isSennichite = this.checkSennichite(boardSfenHistory);
            //isSennichite.result="no_sennichite";//千日手ではない
            //isSennichite.result="sennichite";//千日手でドロー
            //isSennichite.result="oute_sennichite" isSennichite.winner
            let isSennichite = this.checkSennichite(boardSfenHistory, moveSfenHistory);
            if (isSennichite.result === "oute_sennichite") {
                winner = isSennichite.winner; // 王手千日手の場合は、王手をかけ続けた側が反則負け
                isGameset=true
            }else if(isSennichite.result==="sennichite"){
                winner = "draw"; // 千日手の場合は引き分け
                isGameset=true
            }
            //console.log("千日手・isSennichite:"+isSennichite);
            console.log("千日手・isSennichite:",JSON.stringify(isSennichite));

            return {
                BoardInfo: this.getBoardState(),
                moved_check: true,
                moveDetails: previousTurn + ShogiAddress + myPiece.name, // 指した手は自分の手番で記録
                boardSFEN: boardSFEN,
                moveSFEN: moveSFEN,
                pieceStandNum: this.pieceStandNum,
                pieceStand: this.pieceStand,
                nowTurn: this.nowTurn,
                isCheck: isOpponentKingInCheck, // 王手状態を結果に追加
                isCheckmate: isOpponentKingInCheckmate, // 詰み状態
                isSennichite: isSennichite, // 千日手状態
                isGameset: isGameset,//ゲームセットしてるか
                winner: winner, 
                move_status: "ok"
            };
            //王手ここまで

        } else {// 何も駒が選択されていない状態の場合 (駒を選択する)
            //console.log("何も駒が選択されていない状態の場合 (駒を選択する)")
            //console.log("this.board[i][j]:"+JSON.stringify(this.board[i][j]))
            if (this.nowTurn !== this.board[i][j].owner) {// クリックされた駒が自分の手番の駒でなければ
                //console.log("クリックされた駒が自分の手番の駒でなければ何もせず処理を終了")
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
            //console.log("後this.selection:"+JSON.stringify(this.selection))
            //console.log("選択状態にした")
            return {
                //newBoardState: this.getBoardState(), // 変更後の盤面状態を返す
                BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                moved_check: false,// 駒が動いた場合
                moveDetails: "select",
                boardSFEN: "select",
                moveSFEN: "select",
                pieceStandNum: this.pieceStandNum,
                pieceStand: this.pieceStand,
                nowTurn: this.nowTurn,
                move_status: "ok"
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
    //checkPromote(piece, i, before_i, j, onComplete) {
    checkPromote(piece, i, before_i, j) {
        //console.log("checkPromote開始");
        //console.log("pieceあ："+JSON.stringify(piece))
        
        //非同期処理（Promise）
        return new Promise((resolve) => { //非同期処理（Promise）を開始するための基本形
            // 成れない駒の場合は即座に解決
            if (!piece.getPromotedPiece()) {
                //console.log("成れない駒です");
                resolve(piece); //Promiseはresolve()が呼ばれたタイミングで完了する・つまり即座に処理を終わらせてpieceを返すってこと
                return;
            }
            
            //成りエリアの縦の範囲(敵陣地のエリアの縦の範囲)・先手なら0~2の範囲が成りの範囲、後手なら6~8の範囲が成りの範囲
            const promoteAreaMinY = piece.owner === "先手" ? 0 : 6; //piece.ownerが先手ならpromoteAreaMinYを0に、そうでなければ6に設定する
            const promoteAreaMaxY = piece.owner === "先手" ? 2 : 8; //piece.ownerが先手ならpromoteAreaMaxYを2に、そうでなければ8に設定する
            
            //動かしたコマの縦の座標が成りゾーンの範囲に入ったら
            if ((promoteAreaMinY <= i && i <= promoteAreaMaxY) || (promoteAreaMinY <= before_i && before_i <= promoteAreaMaxY)) {                
                //console.log("成りゾーンに入りました");               
                if (this.onPromoteConfirmCallback) { //trueなら処理を実行

                    // インデックスを(i, j)座標に変換
                    //const boardI = Math.floor(i / 9);
                    //const boardJ = i % 9;
                    
                    //モーダル表示要求
                    this.onPromoteConfirmCallback(piece, i, j, (shouldPromote)  => {
                        const finalPiece = shouldPromote ? piece.getPromotedPiece() : piece;
                        //console.log("ユーザー選択完了 - finalPiece:" + JSON.stringify(finalPiece));
                        //console.log("checkPromote2のthis.selection.before_j:"+JSON.stringify(this.selection.before_j))
                        //if (onComplete) onComplete(finalPiece);// 非同期完了後にコールバックを実行
                        resolve(finalPiece); //Promiseはresolve()が呼ばれたタイミングで完了する・つまり即座に処理を終わらせてpieceを返すってこと
                    });
                    //return null; // 非同期処理中を示す
                    //return; // ここでPromiseは保留状態のまま終了する
                    //console.log("checkPromote1のthis.selection.before_j:"+JSON.stringify(this.selection.before_j))

                    return{
                        BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
                        moved_check: false,// 駒が動いた場合
                        moveDetails: "select",
                        boardSFEN: "none",
                        pieceStandNum: this.pieceStandNum,
                        pieceStand: this.pieceStand,
                        nowTurn: this.nowTurn
                    };
                }
            }
            
            //console.log("成り確認不要");
            //if (onComplete) onComplete(piece);
            resolve(piece); //Promiseはresolve()が呼ばれたタイミングで完了する・つまり即座に処理を終わらせてpieceを返すってこと
            //return piece;
        });
    }

    /*checkPromote(piece, i, before_i) {
        console.log("=== checkPromote DEBUG ===");
        console.log("this.onPromoteConfirmCallback:", this.onPromoteConfirmCallback);
        console.log("Callback type:", typeof this.onPromoteConfirmCallback);
        //console.dir("checkPromoteのpromotedPieceCandidate: "+JSON.stringify(piece.getPromotedPiece()));
        //console.log(`piece：${JSON.stringify(piece)}`);
        //console.log(`typeof piece.getPromotedPiece：${typeof piece.getPromotedPiece}`);
        if (!piece.getPromotedPiece()) {
            return piece;
        }
        
        const promoteAreaMinY = piece.owner === "先手" ? 0 : 6;
        const promoteAreaMaxY = piece.owner === "先手" ? 2 : 8;
        
        if ((promoteAreaMinY <= i && i <= promoteAreaMaxY) || (promoteAreaMinY <= before_i && before_i <= promoteAreaMaxY)) {
            console.log("aa");
            console.log("Callback exists?", !!this.onPromoteConfirmCallback);
            console.log("Callback type:", typeof this.onPromoteConfirmCallback);
            //if (this.onPromoteConfirmCallback) {
            //if (typeof this.onPromoteConfirmCallback === 'function') {
                //console.log("bb");
                // コールバック関数を呼び出してモーダル表示をindex.jsに委託
                this.onPromoteConfirmCallback(piece, (shouldPromote) => {
                    //const finalPiece = shouldPromote ? piece.getPromotedPiece() : piece;
                    piece = shouldPromote ? piece.getPromotedPiece() : piece;
                    console.log("あpiece:"+ JSON.stringify(piece))
                    //return finalPiece;
                    return piece;
                    //this.continueBoardClick(finalPiece, i, before_i);
                });
                return null; // 非同期処理中であることを示す
            //}
        }
        
        return piece;*/
        
        /*if (!piece.getPromotedPiece()) {// 成れる駒でなければ
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
        */
    //}

    //盤面の(i, j)に存在する駒（piece = this.board[i][j]）が移動できる全てのマスを計算し、this.selection.boardSelectInfoに"配置可能"としてマークするメソッド
    checkCanPutBoard(i, j) {
        // (i, j) に存在する駒オブジェクトを取得
        const piece = this.board[i][j];//データ{ owner: "先手", name: "歩", dx: [...], dy: [...], dk: [...] }
        //console.log("piece: "+JSON.stringify(piece))

        for (let l = 0; l < piece.dx.length; l++) {// 駒が持つ全ての移動方向（dx, dy の組）を順番に処理する
            let y = i;// 現在位置のY座標（行）
            let x = j;// 現在位置のX座標（列）

            // dk[l] は「その方向に何マス進めるか」を表す・ 歩や金などは1、飛や角は8など
            for (let _ = 0; _ < piece.dk[l]; _++) {
                y += this.nowTurn === "先手" ? piece.dy[l] : -piece.dy[l];// 先手ならそのまま dy、後手なら上下反転して移動
                x += this.nowTurn === "先手" ? piece.dx[l] : -piece.dx[l];// 先手ならそのまま dx、後手なら左右反転して移動
                
                // 盤面外、または自分の駒があるマスならこれ以上進めないので終了
                if (y < 0 || y > 8 || x < 0 || x > 8 || this.board[y][x].owner === piece.owner) {
                    break;
                }

                // 移動可能なマスとしてマーク
                this.selection.boardSelectInfo[y][x] = "配置可能";
                //console.log("this.selection.boardSelectInfo[y][x]: "+JSON.stringify(this.selection.boardSelectInfo[y][x]))
                
                // そのマスが空マスなら、さらに先へ進める可能性がある
                if (!this.board[y][x].owner) {
                    continue;
                }

                // 相手の駒があった場合は取れるが、それ以上先には進めない
                break;
            }
        }
    }

    pieceStandClick(piece) {
        //console.log("BoardInfoのpieceStandClick(piece)のpiece:",piece)
        //console.log("BoardInfoのpieceStandClick(piece)のthis.nowTurn:",this.nowTurn)
        //console.log("BoardInfoのpieceStandClick(piece)のthis.selection.state:",this.selection.state)
        /*if (this.selection.state || this.nowTurn !== piece.owner) {//既に駒が選択されているか、自分の持ち駒でなければ
            console.log("BoardInfoのpieceStandClick(piece)で既に駒が選択されているか、自分の持ち駒でなければ処理を終了")
            return;//何もせず終了
        }*/
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
        //console.log("1 BoardInfoの更新したthis.selection：",this.selection)

        this.checkCanPutPieceStand(piece);//持ち駒を打てるマスを計算して、this.selection.boardSelectInfoに"配置可能"としてマークするメソッドを呼び出す
        //console.log("持ちコマ台のコマを選択")
        //console.log("2 BoardInfoの更新したthis.selection：",this.selection)
        /*return{
            selection: this.selection
        }*/
       //console.log("持ちコマ台のコマを選択")
        return {
            BoardInfo: this.getBoardState(), // 変更後の盤面状態を返す
            moved_check: false,// 駒が動いた場合
            moveDetails: "pieceStandClickSelect",
            boardSFEN: "none",
            move_status: "ok"
        };
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
                // isDroppable を使用して、より正確なチェックを行う
                if (this.isDroppable(this.board, this.nowTurn, piece, i, j)) {
                    this.selection.boardSelectInfo[i][j] = "配置可能";// そのマスを「配置可能」としてマーク
                }
            }
        }
    }

    /**
     * 与えられた (i, j) 座標を将棋の盤面の住所形式（例: 7六, 1一）に変換します。
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
        //console.log("BoardInfoのgetBoardStateでBoardInfoデータ確認：this.board:"+JSON.stringify(this.board))
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



    //王手の処理
    /**
     * 指定された盤面 (board) 上の特定の駒 (pieceI, pieceJ)が、どのマスに攻撃できるか（利きがあるか）を計算し、そのマスのリストを返します。
     * このメソッドは、checkCanPutBoard とは異なり、state の更新を行いません。
     *
     * @param {Array<Array<Piece>>} currentBoard - 評価対象の盤面配列
     * @param {string} pieceOwner - 攻撃側の駒の所有者 ("先手" または "後手")
     * @param {number} pieceI - 攻撃側駒の現在の行インデックス
     * @param {number} pieceJ - 攻撃側駒の現在の列インデックス
     * @returns {Array<{i: number, j: number}>} 攻撃可能なマスの配列
     */
    getPieceAttackMoves(currentBoard, pieceOwner, pieceI, pieceJ) {
        const piece = currentBoard[pieceI][pieceJ];//敵のコマオブジェクトを取得
        //console.log(`getPieceAttackMovesのpiece : ${JSON.stringify(piece)}`);
        //console.log("currentBoard :" ,currentBoard);
        if (!piece || !piece.name || piece.owner !== pieceOwner) {
            console.log("駒がないか、所有者が異なる場合は空配列・piece："+piece)
            return []; // 駒がないか、所有者が異なる場合は空配列
        }

        const attackMoves = [];

        //敵の駒の持つ方向リスト（dx, dy, dk）をループする。たとえば角なら斜め4方向など
        for (let l = 0; l < piece.dx.length; l++) {
            let y = pieceI;
            let x = pieceJ;
            //その方向に何マス進めるか（dk[l]）回だけ繰り返す（例：香車なら10歩まで、金なら1歩だけ）
            for (let _ = 0; _ < piece.dk[l]; _++) { // dk は移動できる歩数を表すと仮定
                //「先手」と「後手」で進行方向が逆なので、dy/dx の符号を変えて進める
                y += pieceOwner === "先手" ? piece.dy[l] : -piece.dy[l];
                x += pieceOwner === "先手" ? piece.dx[l] : -piece.dx[l];

                //盤面（9x9）から外れたらループ終了
                if (y < 0 || y > 8 || x < 0 || x > 8) {
                    break; // 盤面外に出たら終了
                }

                //console.log(`currentBoard[y][x] : ${JSON.stringify(currentBoard[y][x])}`);
                //console.log(`y : ${y}`);
                //console.log(`x : ${x}`);
                if (currentBoard[y][x] === undefined) {
                    break;
                }
                
                //味方の駒があるマスには攻撃できない（移動できない）
                //駒が空（Blank）だったり、名前がない（不正な駒）だったり、所有者が違う（例：「先手」のはずが「後手」）場合は、攻撃できないので空配列を返す。
                if (currentBoard[y][x].owner === pieceOwner ) {
                    break;
                }

                attackMoves.push({ i: y, j: x });

                // 敵の駒を取ったら、それ以上は進めない（貫通しない）
                if (currentBoard[y][x].name) { 
                    break;
                }
            }
        }
        return attackMoves;
    }

    // findKingPosition(owner)特定の所有者の王の位置を見つける
    /**
     * 指定された所有者の王（玉）の位置を盤面から検索します。
     * @param {string} owner - 検索する王の所有者 ("先手" または "後手")。
     * @param {Array<Array<Piece>>} currentBoard - 検索対象の盤面配列 (オプション, デフォルトは this.board)。
     * @returns {{i: number, j: number} | null} 王の位置の {i, j} オブジェクト、見つからなければ null。
     */
    findKingPosition(owner, currentBoard = this.board) {
        //console.log("findKingPositionのcurrentBoard:",currentBoard)
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const piece = currentBoard[i][j];
                // King と Gyoku の両方をチェック（初期盤面でGyokuを使用しているため）
                if (piece && (piece.name === "王" || piece.name === "玉") && piece.owner === owner) {
                    return { i, j };
                }
            }
        }
        return null;
    }


    // isKingInCheck(board, kingOwner) 特定の王が王手されているかを判定する
    /**
     * 指定された盤面 (board) 上で、特定の王 (kingOwner) が王手されているかを判定します。
     * @param {Array<Array<Piece>>} currentBoard - 評価対象の盤面配列。
     * @param {string} kingOwner - 王手されているかを確認する王の所有者 ("先手" または "後手")。
     * @returns {boolean} 王手されている場合は true、そうでない場合は false。
     */
    isKingInCheck(currentBoard, kingOwner) {
        //console.log("isKingInCheckのcurrentBoard:",currentBoard)
        const kingPos = this.findKingPosition(kingOwner, currentBoard);
        //console.log("kingPos:"+JSON.stringify(kingPos))
        if (!kingPos) {
            // 王様が見つからない場合は王手ではない（またはゲーム終了状態）
            console.log("王様が見つからない場合は王手ではない（またはゲーム終了状態）")
            return false; 
        }

        const opponentOwner = kingOwner === "先手" ? "後手" : "先手";//相手、敵対者
        //console.log("相手、敵対者・opponentOwner："+opponentOwner)

        // 相手の全ての駒を走査し、王に利きがあるかをチェック
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const piece = currentBoard[i][j];
                if (piece && piece.name && piece.owner === opponentOwner) {
                    const attackMoves = this.getPieceAttackMoves(currentBoard, opponentOwner, i, j);
                    // 攻撃可能なマスの中に王の位置が含まれているかをチェック
                    if (attackMoves.some(move => move.i === kingPos.i && move.j === kingPos.j)) {
                        //console.log("相手の全ての駒を走査した結果、攻撃可能なマスの中に王の位置が含まれている・王手がかかっている")
                        return true; // 王手がかかっている
                    }
                }
            }
        }
        return false; // 王手はかかっていない
    }
    //王手の処理ここまで


    /**
     * 持ち駒を盤面の指定されたマスに打てるかどうかを判定します。
     * 二歩、行き所のない駒のルールを考慮します。打ち歩詰めは `isCheckmate` で最終的に判断されます。
     * @param {Array<Array<Piece>>} currentBoard - 評価対象の盤面配列。
     * @param {string} owner - 駒を打つ手番の所有者 ("先手" または "後手")。
     * @param {Piece} piece - 打とうとしている持ち駒のインスタンス。
     * @param {number} targetI - 打つ先の行インデックス。
     * @param {number} targetJ - 打つ先の列インデックス。
     * @returns {boolean} 持ち駒を打てる場合は true、そうでない場合は false。
     */
    isDroppable(currentBoard, owner, piece, targetI, targetJ) {
        // 1. そのマスが空マスであること
        if (currentBoard[targetI][targetJ].name) { // name があれば駒がある
            return false;
        }

        // 2. 行き所のない駒にならないこと
        let canMoveAfterDrop = false;
        for (let l = 0; l < piece.dx.length; l++) {
            let y = targetI;
            let x = targetJ;
            // 駒の向きに応じて移動方向を調整
            y += owner === "先手" ? piece.dy[l] : -piece.dy[l];
            x += owner === "先手" ? piece.dx[l] : -piece.dx[l];
            if (0 <= y && y <= 8 && 0 <= x && x <= 8) {
                canMoveAfterDrop = true;
                break;
            }
        }
        if (!canMoveAfterDrop) {
            return false;
        }

        // 3. 二歩のチェック (歩の場合のみ)
        if (piece.name === "歩") {
            for (let i = 0; i < 9; i++) {
                if (currentBoard[i][targetJ].name === "歩" && currentBoard[i][targetJ].owner === owner) {
                    return false; // その列に既に自分の歩がある (二歩)
                }
            }
        }

        // 打ち歩詰めは、この `isDroppable` の中では直接判定しません。
        // `getLegalMoves` が生成した手の中から、最終的に `isCheckmate` が判断します。

        return true; // 上記のルールに違反しなければ打てる
    }


    //詰み・決着の処理ここから
    /**
     * 指定された盤面 (board) 上で、特定の所有者 (owner) が指せる全ての合法手のリストを生成します。
     * 各手は、その手を指した後の盤面が自分の王にとって安全である (王手にならない) ことを確認します。
     *
     * @param {Array<Array<Piece>>} currentBoard - 評価対象の盤面配列。
     * @param {string} owner - 合法手を検索する手番の所有者 ("先手" または "後手")。
     * @param {Object} pieceStandNum - 現在の持ち駒の数 ({ "先手": { "歩": 1, ... }, "後手": { ... } })
     * @returns {Array<{
     * piece: Piece,      // 動かす駒のインスタンス
     * fromI?: number,    // 動かす前の行 (盤上の駒の場合)
     * fromJ?: number,    // 動かす前の列 (盤上の駒の場合)
     * toI: number,       // 動かす先の行
     * toJ: number,       // 動かす先の列
     * isDrop: boolean,   // 持ち駒を打つ手かどうか
     * promotedTo?: string // 成った場合の成駒の名前 (例: "竜")
     * }>} 合法手のリスト。
     */
    getLegalMoves(currentBoard, owner, pieceStandNum) { // pieceStandNum を引数に追加
        const legalMoves = [];

        // 1. 盤上の駒の移動をシミュレーション
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const piece = currentBoard[i][j];
                //console.log("getLegalMovesのpiece:"+piece)
                if (piece && piece.name && piece.owner === owner) {
                    // その駒が移動できる全てのマス (通常の利き) を取得
                    const possibleMoves = this.getPieceAttackMoves(currentBoard, owner, i, j);

                    for (const move of possibleMoves) {
                        const toI = move.i;
                        const toJ = move.j;

                        // --- 成らない場合（または成れない場合）のチェック ---
                        const tempBoardNoPromote = this.deserializeBoard(JSON.parse(JSON.stringify(currentBoard))); // 新しい盤面をコピー
                        const movingPieceNoPromote = Piece.getPieceByName(piece.name, piece.owner); // 元の駒のインスタンスを再生成

                        tempBoardNoPromote[toI][toJ] = movingPieceNoPromote; // 駒を仮に移動
                        tempBoardNoPromote[i][j] = new Blank(); // 元のマスを空白にする

                        if (!this.isKingInCheck(tempBoardNoPromote, owner)) {
                            legalMoves.push({
                                piece: piece, // 元の駒の情報
                                fromI: i, fromJ: j,
                                toI: toI, toJ: toJ,
                                isDrop: false
                            });
                        }

                        // --- 成る選択肢がある場合、成った手も合法手として追加 ---
                        const promoteAreaMinY = owner === "先手" ? 0 : 6;
                        const promoteAreaMaxY = owner === "先手" ? 2 : 8;
                        const canPromote = piece.getPromotedPiece(); // 成れる駒かどうか

                        // 移動元または移動先が成りゾーンにある場合
                        const inPromoteZone = (promoteAreaMinY <= toI && toI <= promoteAreaMaxY) || (promoteAreaMinY <= i && i <= promoteAreaMaxY);

                        if (canPromote && inPromoteZone) {
                            const promotedPiece = piece.getPromotedPiece(); // 成った駒のインスタンス（またはその名前）
                            
                            const tempBoardPromoted = this.deserializeBoard(JSON.parse(JSON.stringify(currentBoard))); // 新しい盤面をコピー
                            const promotedPieceInstance = Piece.getPieceByName(promotedPiece.name, promotedPiece.owner); // 成った駒のインスタンスを再生成

                            tempBoardPromoted[toI][toJ] = promotedPieceInstance; // 成った駒を仮に移動
                            tempBoardPromoted[i][j] = new Blank(); // 元のマスを空白にする

                            if (!this.isKingInCheck(tempBoardPromoted, owner)) {
                                legalMoves.push({
                                    piece: piece, // 元の駒の情報
                                    fromI: i, fromJ: j,
                                    toI: toI, toJ: toJ,
                                    isDrop: false,
                                    promotedTo: promotedPiece.name // 成った駒の名前
                                });
                            }
                        }
                    }
                }
            }
        }

        // 2. 持ち駒を打つ手をシミュレーション
        for (const pieceName in pieceStandNum[owner]) { // pieceStandNum を引数として受け取るように変更
            if (pieceStandNum[owner][pieceName] > 0) { // 持ち駒がある場合
                const pieceInstance = Piece.getPieceByName(pieceName, owner); // 駒のインスタンスを取得

                for (let i = 0; i < 9; i++) {
                    for (let j = 0; j < 9; j++) {
                        // 持ち駒を打てる通常の条件をチェック (二歩、行き所のない駒など)
                        if (this.isDroppable(currentBoard, owner, pieceInstance, i, j)) {
                            // 仮に駒を打った盤面を作成
                            const tempBoard = this.deserializeBoard(JSON.parse(JSON.stringify(currentBoard)));
                            tempBoard[i][j] = pieceInstance;

                            // 打った後に自分の王が王手にならないかチェック
                            if (!this.isKingInCheck(tempBoard, owner)) {
                                legalMoves.push({
                                    piece: pieceInstance,
                                    toI: i, toJ: j,
                                    isDrop: true
                                });
                            }
                        }
                    }
                }
            }
        }
        return legalMoves;
    }

    /* 詰み判定
     * 指定された盤面 (board) 上で、特定の王 (kingOwner) が詰んでいるかを判定
     * 詰みとは、王が王手されており、かつ合法手が一つも存在しない状態
     *
     * @param {Array<Array<Piece>>} currentBoard - 評価対象の盤面配列。
     * @param {string} kingOwner - 詰んでいるかを確認する王の所有者 ("先手" または "後手")。
     * @param {Object} pieceStandNum - 現在の持ち駒の数 ({ "先手": { "歩": 1, ... }, "後手": { ... } })
     * @returns {boolean} 詰んでいる場合は true、そうでない場合は false。
     */
    isCheckmate(currentBoard, kingOwner, pieceStandNum) { // pieceStandNum を引数に追加
        // まず、王手されているかを確認
        if (!this.isKingInCheck(currentBoard, kingOwner)) {
            return false; // 王手されていなければ詰みではない
        }

        // 王手されている場合、合法手が一つも存在しないかを確認
        const legalMoves = this.getLegalMoves(currentBoard, kingOwner, pieceStandNum); // pieceStandNum を渡す

        // 打ち歩詰めは、getLegalMoves の中で自分の王が王手にならない手のみを返すため、ここで特別な処理は不要
        // 打ち歩詰めは、相手の王を詰ませる手であって、自分の王の合法手とは直接関係ありません。

        return legalMoves.length === 0; // 合法手が一つもなければ詰み
    }
    //詰み・決着の処理ここまで

    // 打ち歩詰めのチェック
    isUchiFuZume(i, j, nowTurn) {
        // 仮想ボードを作成：歩を置く
        const tempBoard = this.deserializeBoard(this.board); // 現在のボードをコピー
        const pawn = Piece.getPieceByName("歩", nowTurn);
        tempBoard[i][j] = pawn;

        // 相手のターン
        const opponentTurn = nowTurn === "先手" ? "後手" : "先手";

        // 相手の王が詰んでいるかチェック
        return this.isCheckmate(tempBoard, opponentTurn, this.pieceStandNum);
    }

    //見やすいボード情報を作る
    CreateEasyBoard(board){
        //const newBoard = this.board.map(row =>
        const newBoard = board.map(row =>
            row.map(cell =>
                cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」"
            )
        );
        // []ごとに改行して表示
        const EasyBoard = newBoard.map(row => row.join(", ")).join("\n");
        return EasyBoard
    }


    //ボードデータをsfenに変換
      /**
     * 将棋盤の情報をSFEN形式の文字列に変換します。
     * @param {Array<Array<Object>>} board - 将棋盤の2次元配列。
     * @returns {string} SFEN文字列。
     */
    boardToSFEN(data,turnCount) {
        // 駒の日本語名とSFEN記号のマッピング
        const pieceMap = {
            '香': 'l', '桂': 'n', '銀': 's', '金': 'g', '角': 'b', '飛': 'r', '王': 'k', '玉': 'k', '歩': 'p',
            'と': '+p','成香': '+l','成桂': '+n','成銀': '+s','馬': '+b','竜': '+r'
        };

        // 1. 盤面の変換
        let boardString = '';
        data.board.forEach(row => {
            let emptyCount = 0;
            row.forEach(square => {
            // 空のマスの場合、またはnameプロパティがない場合
            if (!square.name) {
                emptyCount++;
            } else {
                // 空きマスがあれば、その数を文字列に追加してから駒を追加
                if (emptyCount > 0) {
                boardString += emptyCount;
                emptyCount = 0;
                }
                
                // 駒の記号を取得
                let piece = pieceMap[square.name];
                
                // pieceがundefinedの場合（pieceMapにない名前の場合）に備えてチェック
                if (piece === undefined) {
                console.error(`SFEN変換エラー：不明な駒名 "${square.name}"`);
                piece = ''; // エラーを回避するために空文字列を設定
                }

                // 先手の場合は大文字に変換
                if (square.owner === '先手') {
                piece = piece.toUpperCase();
                }

                // 成駒の判定（データにpromotedプロパティがある場合を想定）
                if (square.promoted) {
                boardString += '+';
                }

                boardString += piece;
            }
            });
            // 行の終わりに空きマスが残っていれば追加
            if (emptyCount > 0) {
            boardString += emptyCount;
            }
            boardString += '/';
        });
        // 最後のスラッシュを削除
        boardString = boardString.slice(0, -1);

        // 2. 手番の変換
        const turn = data.nowTurn === '先手' ? 'b' : 'w';

        // 3. 持ち駒の変換
        let handString = '-'; // 持ち駒がない場合のデフォルト
        const handPieces = [];
        const handPieceOrder = ['飛', '角', '金', '銀', '桂', '香', '歩'];

        ['先手', '後手'].forEach(owner => {
            const handNum = data.pieceStandNum[owner];
            for (const piece of handPieceOrder) {
            if (handNum[piece] > 0) {
                let pieceChar = pieceMap[piece];
                if (owner === '先手') {
                pieceChar = pieceChar.toUpperCase();
                }
                if (handNum[piece] > 1) {
                handPieces.push(`${handNum[piece]}${pieceChar}`);
                } else {
                handPieces.push(pieceChar);
                }
            }
            }
        });

        if (handPieces.length > 0) {
            handString = handPieces.join('');
        }
        
        // 4. 手数の変換
        //const moveCount = 1;
        //const moveCount = turnCount+1;
        const moveCount = turnCount;

        // 全ての要素を結合してSFEN文字列を完成させる
        return `${boardString} ${turn} ${handString} ${moveCount}`;
    }

    //盤面の座標 (i, j) を将棋の手のSFEN形式（例: 7g, 2b）に変換する
    posToMoveSfen(i, j, yourRole, myPieceName, BoardOrPiecestand, isPromoted = false){
        //i,jは盤面の座標で、左上が(0,0)、右下が(8,8)
        //pieceType //"BoardPiece"はボードのコマ、"pieceStandPiece"は持ち駒のコマ
        //myPieceName //飛、角、金、銀、桂、香、歩などの駒の名前
        //yourRoleは"先手"か"後手"
        //myPieceNameとpieceTypeを組み合わせて、駒の種類を特定する（例: "先手の飛"）

        const destFile = String(9 - i);
        const destRank = String.fromCharCode(97 + j); // 'a' + j
        if (BoardOrPiecestand === "Piecestand") {//持ち駒から打つ時は*をつける
            const pieceSFEN = this.getPieceSFEN(myPieceName, yourRole);
            return pieceSFEN + "*" + destFile + destRank;
        } else {//ボードの駒を動かすときは、移動元と移動先を両方表記する
            const srcFile = String(9 - this.selection.before_i);
            const srcRank = String.fromCharCode(97 + this.selection.before_j);
            const promoteStr = isPromoted ? "+" : "";
            return srcFile + srcRank + destFile + destRank + promoteStr;
        }
    }

    //駒の日本語名と所有者から、その駒のSFEN記号を取得する
    getPieceSFEN(name, owner) {
        const map = {
            "王": "K",
            "玉": "K",
            "飛": "R",
            "角": "B",
            "金": "G",
            "銀": "S",
            "桂": "N",
            "香": "L",
            "歩": "P",
            "竜": "+R",
            "馬": "+B",
            "成銀": "+S",
            "成桂": "+N",
            "成香": "+L",
            "と": "+P"
        };
        let sfen = map[name];
        if (owner === "後手") sfen = sfen.toLowerCase();
        return sfen;
    }

    /*getBoardState() {   
        // 現在の盤面状態を返す
        return {
            board: this.board,
            selection: this.selection,
            pieceStand: this.pieceStand,
            pieceStandNum: this.pieceStandNum,
            nowTurn: this.nowTurn
        };
    }*/


    /**
     * 千日手＋王手千日手を判定
     * @param {string[]} boardSfenHistory
     * @param {boolean[]} isCheckHistory
     * @returns {object}
     */
    checkSennichite(boardSfenHistory, moveSfenHistory) {
        console.log("千日手チェック・checkSennichiteメソッドのmoveSfenHistory:",JSON.stringify(moveSfenHistory))
        const isCheckHistory= moveSfenHistory.kingCheck
        console.log("千日手チェック・isCheckHistory:",JSON.stringify(isCheckHistory))

        const map = new Map();

        for (let i = 0; i < boardSfenHistory.length; i++) {
            const sfen = boardSfenHistory[i];
            if (!sfen) continue;

            // 手数除去
            const key = sfen.trim().split(" ").slice(0, 3).join(" ");
            const turn = sfen.split(" ")[1]; // b or w

            const data = map.get(key) || {
                count: 0,
                checkSeq: [] // この局面に至る履歴インデックス
            };

            data.count++;
            data.checkSeq.push({
                index: i,
                turn,
                isCheck: isCheckHistory[i]
            });

            map.set(key, data);

            // 同一局面4回
            if (data.count >= 4) {

                //王手千日手チェック
                const last4 = data.checkSeq.slice(-4);

                const allCheck = last4.every(x => x.isCheck);
                const sameTurn = last4.every(x => x.turn === last4[0].turn);

                if (allCheck && sameTurn) {
                    //const loser= last4[0].turn // 王手してた側が負け
                    //const winner = loser === "b" ? "w" : "b";
                    const loserTurn = last4[0].turn; // "b" or "w"
                    const loser = loserTurn === "b" ? "先手" : "後手";
                    const winner = loserTurn === "b" ? "後手" : "先手";
                    return {
                        result: "oute_sennichite",
                        loser: loser, // 王手してた側が負け
                        winner: winner
                    };
                }

                return { result: "sennichite" };
            }
        }

        return { result: "no_sennichite" };
        //return false;
    }
    /**
     * 千日手を判定するメソッド
     * 同じ局面（SFEN）が4回以上繰り返された場合にtrueを返す。
     * @param {Array<string>} boardSfenHistory - SFEN形式の盤面履歴の配列。
     * @returns {boolean} 千日手の場合true、そうでない場合false。
     */
    /*checkSennichite(boardSfenHistory, moveSfenHistory) {
        const sfenCount = new Map();

        for (const sfen of boardSfenHistory) {
            // 手数を除去（盤面 + 手番 + 持ち駒）
            const key = sfen.split(" ").slice(0, 3).join(" ");

            sfenCount.set(key, (sfenCount.get(key) || 0) + 1);

            if (sfenCount.get(key) >= 4) {
                return true;
            }
        }

        return false;
    }
    */
    /*checkSennichite(boardSfenHistory) {
        const sfenCount = new Map();
        for (const sfen of boardSfenHistory) {
            sfenCount.set(sfen, (sfenCount.get(sfen) || 0) + 1);
            if (sfenCount.get(sfen) >= 4) {
                return true;
            }
        }
        return false;
    }*/
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