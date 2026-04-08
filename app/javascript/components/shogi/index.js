import React from 'react';
import ReactDOM from 'react-dom/client';
//import './index.css';

import { BoardInfo, Selection } from './BoardInfo';
import ShogiTimer from './ShogiTimer/ShogiTimer';
import Header from '../Header.jsx';
import LoadingOverlay from "../LoadingOverlay.jsx";
import consumer from '../../channels/consumer.js'; // Action Cableのconsumerをインポート
import { withTranslation } from 'react-i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../lang/i18n' 

import { getBestMoveFromSFEN } from "./shogiCpu.js";
import BoardInfoDebugger from './BoardInfoDebugger.js';
import { Piece } from './Pieces.js';

import CoordsFiles from './CoordsFiles.jsx';
import CoordsRanks from './CoordsRanks.jsx';

const element = document.querySelector('#game-container');
const kingPath = element.dataset.kingPath;
const gyokuPath = element.dataset.gyokuPath;
const rookPath = element.dataset.rookPath;
const bishopPath = element.dataset.bishopPath;
const goldPath = element.dataset.goldPath;
const silverPath = element.dataset.silverPath;
const knightPath = element.dataset.knightPath;
const lancePath = element.dataset.lancePath;
const pawnPath = element.dataset.pawnPath;
const dragonPath = element.dataset.dragonPath;
const horsePath = element.dataset.horsePath;
const prom_silverPath = element.dataset.prom_silverPath;
const prom_knightPath = element.dataset.prom_knightPath;
const prom_lancePath = element.dataset.prom_lancePath;
const prom_pawnPath = element.dataset.prom_pawnPath;

import { Blank, King, Gyoku, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn, PromotedRook,PromotedBishop,PromotedSilverGeneral,PromotedKnight,PromotedLance,PromotedPawn } from './Pieces';

const imgByName = {
  "王": kingPath,
  "玉": gyokuPath,
  "飛": rookPath,
  "角": bishopPath,
  "金": goldPath,
  "銀": silverPath,
  "桂": knightPath,
  "香": lancePath,
  "歩": pawnPath,
  "竜": dragonPath,
  "馬": horsePath,
  "成銀": prom_silverPath,
  "成桂": prom_knightPath,
  "成香": prom_lancePath,
  "と": prom_pawnPath
};

const imgSize={//将棋のマス(コマ)の大きさ
  width:"70px",
  height:"70px"
}

function Square(props) {
  //const { piece, selectInfo, i, j, onClick, onDragStart, onDragEnd, onDragOver, onDrop, isDraggable } = props;
  //const { piece, selectInfo, i, j, onClick, onDragStart, onDragEnd, onDragOver, onDrop, isDraggable, onMouseDown,yourRole,nowTurn } = props;
  //const { piece, selectInfo, i, j, onClick, roomOnDragStart, roomOnDragEnd, roomOnDragOver, roomOnDrop, isDraggable, roomOnMouseDown,yourRole,nowTurn } = props;
  //const { piece, selectInfo, i, j, onMouseDown, roomOnDragStart, roomOnDragEnd, roomOnDragOver, roomOnDrop, isDraggable, roomOnMouseDown,yourRole,nowTurn } = props;
  const { piece, selectInfo, i, j, roomOnDragStart, roomOnDragEnd, roomOnDragOver, roomOnDrop, isDraggable, roomOnMouseDown,yourRole,nowTurn } = props;
  
  //console.log("isDraggable:"+isDraggable)


  /*const handleMouseDown = (e) => {
    if (isDraggable && onMouseDown) {
      // マウスダウン時点で選択状態にする
      console.log("マウスダウン時点で選択状態にする")
      onMouseDown(i, j);
    }
  };
  */
  // mousedownで選択状態にする
  /*const handleMouseDown = async (e) => {
    if (isDraggable && onClick) {
      // マウスダウン時点で選択状態にする
      console.log('マウスダウンで選択:', i, j);
      await onClick();
      
      // 少し待ってからドラッグ開始処理
      setTimeout(() => {
        if (onDragStart) {
          onDragStart(i, j);
        }
      }, 10);
    }
  };*/
  // マウスダウンで選択状態にする
  const squareHandleMouseDown = async (e) => {
    const dom = e.target;//将棋のコマのimgのdom
    //dom.style.background = "none";
    //dom.style.border = "none";
    //dom.style.border = '10px solid #c24242ff;';

    //border: 0.1px solid #0c0707;
    /*const parent = e.target.parentElement; //Square(将棋のコマのimgのdomの親)
    console.log("dom:",dom); // ← これが onMouseDown された DOM
    console.log("parent:",parent);
    parent.style.opacity = "0.9";  // 透明度30%
    //parent.style.display = "none";     // 完全に非表示
    */

    //e.preventDefault(); // click発火を防ぐ

    //if (isDraggable && onMouseDown) {
    //if (isDraggable && roomOnMouseDown) {
      //console.log('マウスダウンで選択:', i, j);
      //try {
        //const result = await onMouseDown(i, j);//RoomコンポーネントのhandleMouseDownメソッド呼び出し
        const result = await roomOnMouseDown(i, j);//RoomコンポーネントのroomHandleMouseDownメソッド呼び出し
        console.log('ラップ、マウスダウン result:', result);
      /*} catch (error) {
        console.error('マウスダウンエラー:', error);
      }*/
    //}
  };

  const squareHandleDragStart = (e) => {
    if (!isDraggable) {//この駒がドラッグ可能かどうかの判定フラグ
      e.preventDefault();//ドラッグをキャンセルする・ドラッグ系イベントでのdragstartやdropなどでe.preventDefault() を呼ぶと、デフォルトのドラッグ挙動が完全に無効化される
      return;
    }

    //ドラッグしている元のSquareを非表示
    const dom = e.target;//将棋のコマのimgのdom
    //const dom = e.target.children;//将棋のコマのimgのdom
    console.log("dom:",dom); // ← これが onMouseDown された DOM
    dom.style.opacity = 0;


    console.log("ドラッグスタート：",nowTurn)
    console.log("ドラッグスタート：",yourRole)

    //後手ならドラッグ中の駒を上下逆さにする
    //if (nowTurn === "後手") {
    /*if (yourRole === "後手") {
      const img = e.target.cloneNode(true); // 駒画像をコピー
      img.style.transform = "rotate(180deg)";
      img.style.position = "absolute";
      img.style.top = "-1000px"; // 画面外に配置（見えないように）
      img.style.left = "-1000px";

      document.body.appendChild(img);

      // ドラッグ中の見た目をこの img にする
      e.dataTransfer.setDragImage(img, img.width / 5, img.height / 5);

      // ドラッグ終了後に削除
      setTimeout(() => {
        document.body.removeChild(img);
      }, 0);
    }
    */
    
    // 座標の反転処理を適用
    /* let adjustedI = i;
    console.log("adjustedI：",adjustedI)
    // 駒台からのドラッグではない、かつ、後手の駒をドラッグしている場合のみ、縦座標を反転する
    // ※ 盤の縦の座標が 0 から 8 だと仮定した場合の反転ロジック
    //if (i !== -1 && yourRole === '後手') {
    if (yourRole === '後手') {
        // i の反転: 8 - i
        adjustedI = 8 - i; 
    }
    console.log("adjustedI：",adjustedI)
    */

    /*const dom = e.target;//将棋のコマのimgのdom
    const parent = e.target.parentElement; //Square(将棋のコマのimgのdomの親)
    console.log("dom:",dom); // ← これが onMouseDown された DOM
    console.log("parent:",parent);
    const img = e.target.querySelector('img');
    // ドラッグ用の画像を複製
    //const dragImg = img.cloneNode(true);
    const dragImg = dom.cloneNode(true);
    //dragImg.style.transform = 'rotate(0deg)';//style="transform: rotate(180deg);"
    dragImg.style.transform = 'rotate(180deg)';
    dragImg.style.position = 'absolute';
    dragImg.style.width = '800px';
    dragImg.style.top = '-1000px';
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 20, 20);
    */
    
    // ドラッグデータを設定
    //dataTransferはドラッグ開始 → ドロップ完了 の間だけ保持される「伝達データ」の保管庫。ここではドラッグされている駒の情報をJSONで保存している
    //dataTransferはドラッグ&ドロップでドラッグ元からドロップ先へデータを渡すためのオブジェクト
    e.dataTransfer.setData('text/plain', JSON.stringify({
      //sourceI: adjustedI,
      sourceI: i,
      sourceJ: j,
      piece: piece,
      isFromPieceStand: i === -1
    }));
    
    e.dataTransfer.effectAllowed = 'move';

    //上下逆
    const img = e.target;//将棋のコマのimgのdom
    //const img = e.target.children;//将棋のコマのimgのdom
    const clone = img.cloneNode(true);
    //clone.style.transform = 'rotate(0deg)'; // 回転を打ち消す
    //clone.style.transform = 'rotate(1800deg)'; // 回転を打ち消す
    //clone.style.transform = 'rotate(0deg)';
    //clone.style.transform = 'scale(1, 1)';
    clone.style.transform = 'scale(1)';
    clone.style.position = 'absolute';
    clone.style.top = '-9999px';
    //clone.style.width = '50px';
    //clone.style.height = '50px';
    clone.style.width = imgSize.width;
    clone.style.height = imgSize.height;
    clone.style.border = 'none';
    //clone.style.boader = '10px solid #c24242ff;';
    clone.style.background = 'none';
    clone.style.opacity = 1;

    //clone.children.style.transform = 'scale(1, 1)';
    clone.children[0].style.transform = 'scale(1, 1)';
    clone.children[0].style.boader = 'none';

    // 元の親要素を取得
    //const parent = img.parentElement.cloneNode(false); // 子なしで clone
    // 親の style を変更
    //parent.style.backgroundColor = 'none';
    // clone を親に入れる
    //parent.appendChild(clone);
    // 親要素のスタイルを変更
    //const parent = clone.parentNode; // 親要素を取得
    //parent.style.backgroundColor = 'none'; // 例: 背景色を変更

    document.body.appendChild(clone);
    //document.body.appendChild(parent);
    // クローンをドラッグイメージに指定
    e.dataTransfer.setDragImage(clone, clone.offsetWidth / 2-2, clone.offsetHeight / 2);
    //e.dataTransfer.setDragImage(parent, parent.width / 2, parent.height / 2);

    // 少し遅らせてクローンを削除（ブラウザによっては即削除で問題ない）
    setTimeout(() => document.body.removeChild(clone), 0);
    //setTimeout(() => document.body.removeChild(parent), 0);

    //isDraggable=true

    // ドラッグ開始時に選択状態にする
    /*if (onDragStart) {
      onDragStart(i, j);
    }*/
  };

  const squareHandleDragEnd = (e) => {
    e.preventDefault();
    //ドラッグ中に非表示にしていたSquareを再表示
    const dom = e.target;//将棋のコマのimgのdom
    //const dom = e.target.children;
    dom.style.opacity = 1;
    console.log("squareHandleDragEnd")
    if (roomOnDragEnd) {
      roomOnDragEnd();//RoomコンポーネントのroomHandleDragEndメソッド呼び出し
    }
  };

  const squareHandleDragOver = (e) => {
    e.preventDefault();//ドラッグをキャンセルする・ドラッグ系イベントでのdragstartやdropなどでe.preventDefault() を呼ぶと、デフォルトのドラッグ挙動が完全に無効化される
    e.dataTransfer.dropEffect = 'move';
  };

  const squareHandleDrop = (e) => {
    e.preventDefault();//ドラッグをキャンセルする・ドラッグ系イベントでのdragstartやdropなどでe.preventDefault() を呼ぶと、デフォルトのドラッグ挙動が完全に無効化される
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (roomOnDrop) {
        roomOnDrop(dragData, i, j);//RoomコンポーネントのroomHandleDropメソッド呼び出し
      }
    } catch (error) {
      console.error('ドロップデータの解析エラー:', error);
    }
  };


  //ここから配置可能なマスのsquare側のイベント

  // 配置可能のsquareへドラッグオーバー(hover)された時の処理
  const onPlaceableSquareDragOver = (e) => {
    // デフォルトの挙動（ドロップを禁止する）をキャンセルし、ドロップを許可する
    e.preventDefault(); 
    // ホバーしているマスが「配置可能」なマスであるかチェック
    if (e.currentTarget.classList.contains('配置可能')) {
      // 一時的なホバーエフェクトクラスを追加
      e.currentTarget.classList.add('drag-hover-effect');
    }
  };
  // 配置可能のsquareからドラッグ(hover)が離れたときの処理
  const placeableSquareDragLeave = (e) => {
    // ホバーエフェクトクラスを削除し、元の色に戻す
    e.currentTarget.classList.remove('drag-hover-effect');
  };
  //配置可能のsquareへドロップされた時の配置可能のsquareのイベント
  const placeableSquareDroped = (e) => {
    console.log("placeableSquareDroped")

    e.preventDefault();//ドラッグをキャンセルする・ドラッグ系イベントでのdragstartやdropなどでe.preventDefault() を呼ぶと、デフォルトのドラッグ挙動が完全に無効化される  
    // ホバーエフェクトクラスを削除し、元の色に戻す
    e.currentTarget.classList.remove('drag-hover-effect');

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (roomOnDrop) {
        roomOnDrop(dragData, i, j);//RoomコンポーネントのroomHandleDropメソッド呼び出し
      }
    } catch (error) {
      console.error('ドロップデータの解析エラー:', error);
    }
  };

  return (
    <button 
      className={`square ${selectInfo}`} 
      //onClick={onClick}
      //onClick={onMouseDown}

      onMouseDown={squareHandleMouseDown}
      draggable={isDraggable}
      onDragStart={squareHandleDragStart}
      onDragEnd={squareHandleDragEnd}
      //onDragOver={squareHandleDragOver}
      //onDrop={squareHandleDrop}
      data-i={i}
      data-j={j}

      //配置可能なマスのsquare側のイベント
      onDragOver={selectInfo === "配置可能" ? onPlaceableSquareDragOver : undefined}
      onDragLeave={selectInfo === "配置可能" ? placeableSquareDragLeave : undefined}
      onDrop={selectInfo === "配置可能" ? placeableSquareDroped : undefined}
    >
      <img 
        id={piece.owner} 
        src={imgByName[piece.name]} 
        alt=""
        className="piece-image"
        draggable="false" // imgのデフォルトドラッグを無効化
      />
      <p>{(props.num >= 2) && props.num}</p>
    </button>
  );
  //console.log("props:"+JSON.stringify(props))
  /*return (
    <button 
      id={`square-${props.i}-${props.j}`} 
      data-i={props.i} 
      data-j={props.j}
      className={`square ${props.selectInfo}`} 
      onClick={props.onClick}
    >
      <img 
        id={props.piece.owner} 
        src={imgByName[props.piece.name]} 
        alt=""
        className="piece-image"
        draggable="false" // imgのデフォルトドラッグを無効化
      />
      <p>{(props.num >= 2) && props.num}</p>
    </button>
    */
    /*<button id={props.selectInfo} className="square" onClick={props.onClick} >
      <img id={props.piece.owner} src={imgByName[props.piece.name]} alt="" />
      <p>{(props.num >= 2) && props.num}</p>
    </button>*/
  //);
}

class Board extends React.Component {
  renderSquare(i, j) {
    const piece = this.props.board[i][j];
    //console.log("ここおthis.props.yourRole:"+this.props.yourRole)
    //console.log("ここおpiece:"+ JSON.stringify(piece))
    //const isDraggable = piece && piece.owner && piece.owner === this.props.yourRole;
    const isDraggable =  piece.owner === this.props.yourRole;
    
    return (
      <Square
        key={j}
        i={i}
        j={j}
        piece={piece}
        selectInfo={this.props.boardSelectInfo[i][j]}
        
        //onClick={() => this.props.onClick(i, j)}
        //onMouseDown={() => this.props.onMouseDown(i, j)}

        isDraggable={isDraggable}        
        roomOnMouseDown={this.props.roomOnMouseDown}
        roomOnDragStart={this.props.roomOnDragStart}
        roomOnDragEnd={this.props.roomOnDragEnd}
        roomOnDrop={this.props.roomOnDrop}

        yourRole={this.props.yourRole}
        nowTurn={this.props.nowTurn}
      />
    );
  }

  render() {
    return (
      <div className="shogi-wrapper">
        {/* 成り確認モーダル - 特定のマスに表示 */}
        {this.props.showPromoteModal && (
            <PromoteModal
                position={this.props.promoteModalPosition}
                piece={this.props.currentPiece}
                yourRole={this.props.yourRole}
                onChoice={this.props.handlePromoteOnChoice}
            />
        )}
        <CoordsFiles yourRole={this.props.yourRole} />
        <div class="board-and-ranks-wrapper">
          <div id="board">
            {
            //Array(9).fill(0)で長さ9の配列を作る（中身はすべて0）。.map((_, i) => { })で配列の要素を順番に処理する。_ は値（0）を使わないので _ という名前にしている。iは現在の行番号。iは0〜8の値
            Array(9).fill(0).map((_, i) => {
              return (
                <div className="board-row" key={i}>
                  {Array(9).fill(0).map((_, j) => {
                    return this.renderSquare(i, j);
                  })}
                </div>
              );
            })}
          </div>
          <CoordsRanks yourRole={this.props.yourRole} />
        </div>
      </div>
    );
  }
  /*renderSquare(i, j) {
    return (
      <Square
        key={j}
        i={i}
        j={j}
        piece={this.props.board[i][j]}
        selectInfo={this.props.boardSelectInfo[i][j]}
        onClick={() => this.props.onClick(i, j)}
      />
    );
  }
  
  render() {
    return (
      <div id="board">
        {Array(9).fill(0).map((_, i) => {
          return (
            <div className="board-row" key={i}>
              {Array(9).fill(0).map((_, j) => {
                return this.renderSquare(i, j);
              })}
            </div>
          );
        })}
      </div>
    );
  }*/
/*  renderSquare(i, j) {
    return (
      <Square
        key={j}
        piece={this.props.board[i][j]}
        selectInfo={this.props.boardSelectInfo[i][j]}
        onClick={() => this.props.onClick(i, j)}
      />
    );
  }
  render() {
    return (
      <div>
        {
          Array(9).fill(0).map((_, i) => {
            return (
              <div className="board-row" key={i}>
                {
                  Array(9).fill(0).map((_, j) => {
                    return (
                      this.renderSquare(i, j)
                    )
                  })
                }
              </div>
            )
          })
        }
      </div>
    );
  }*/
}

class PieceStand extends React.Component {
  renderSquare(i) {
    const piece = this.props.pieceStand[i];
    const isDraggable = piece && piece.owner && piece.owner === this.props.yourRole;
    
    return (
      <Square
        key={i}
        i={-1} // 持ち駒台の場合は-1を使用
        j={i}
        piece={piece}
        num={this.props.pieceStandNum[piece.name]}
        selectInfo={this.props.pieceStandSelectInfo[i]}
        //onClick={() => this.props.onClick(i)}
        
        isDraggable={isDraggable}
        roomOnMouseDown={this.props.roomOnMouseDown}
        roomOnDragStart={this.props.roomOnDragStart}
        roomOnDragEnd={this.props.roomOnDragEnd}
        roomOnDrop={this.props.roomOnDrop}
        //onMouseDown={this.props.onMouseDown}
        //onDragStart={this.props.onDragStart}
        //onDragEnd={this.props.onDragEnd}
        //onDrop={this.props.onDrop}

        yourRole={this.props.yourRole}
        nowTurn={this.props.nowTurn}
      />
    );
  }
  
  render() {
    return (
      <div className={`piece-stand ${this.props.side}`}>
        {
        //Array(9).fill(0)で長さ9の配列を作る（中身はすべて0）。.map((_, i) => { })で配列の要素を順番に処理する。_ は値（0）を使わないので _ という名前にしている。iは現在の行番号。iは0〜8の値
        Array(9).fill(0).map((_, i) => {
          return this.renderSquare(i);
        })}
      </div>
    );
  }
  /*renderSquare(i) {
    return (
      <Square
        key={i}
        i={-1} // 持ち駒台の場合は-1を使用
        j={i}
        piece={this.props.pieceStand[i]}
        num={this.props.pieceStandNum[this.props.pieceStand[i].name]}
        selectInfo={this.props.pieceStandSelectInfo[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }
  
  render() {
    return (
      <div className={`piece-stand ${this.props.side}`}>
        {Array(9).fill(0).map((_, i) => {
          return this.renderSquare(i);
        })}
      </div>
    );
  }*/
  /*renderSquare(i) {
    return (
      <Square
        key={i}
        piece={this.props.pieceStand[i]}
        num={this.props.pieceStandNum[this.props.pieceStand[i].name]}
        selectInfo={this.props.pieceStandSelectInfo[i]}
        onClick={() => this.props.onClick(i)}
      />
    );
  }
  render() {
    return (
      <div className="board-row">
        {
          Array(9).fill(0).map((_, i) => {
            return (
              this.renderSquare(i)
            )
          })
        }
      </div>
    );
  }*/
}

// 成り確認モーダルコンポーネント
function PromoteModal(props) {
//class PromoteModal(props) {
    //console.log("props:"+JSON.stringify(props)) 
    //console.log("props.piece.name:"+JSON.stringify(props.piece.name))
    //console.log("props.yourRole"+JSON.stringify(props.yourRole))
    //console.log("props.piece.getPromotedPiece():"+JSON.stringify(props.piece.getPromotedPiece()))
    // マスの位置を計算（CSS Grid或いはflexboxの位置に基づく）
    const squareSize = 70; // 各マスのサイズ（px）
    const boardMargin = 20; // 盤面の余白
    
    const modalStyle = {
        position: 'absolute',
        left: `${boardMargin + (props.position.j * squareSize+60)}px`,
        top: `${boardMargin + (props.position.i * squareSize+40)}px`,
        backgroundColor: 'black',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 1000,
        minWidth: '120px',
        textAlign: 'center'
    };

    return (
        <div style={modalStyle} className="promote-modal bg-gradient-to-br from-black via-gray-800 to-gray-900">
            <div 
              style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>

                    <img
                      onClick={() => props.onChoice(false)}
                      id={props.piece.owner} 
                      src={imgByName[props.piece.name]} 
                      alt="" 
                      className={`w-[50px] h-[50px] cursor-pointer ${
                        (props.yourRole === "後手" || props.yourRole === "gote")
                          ? "/*transform rotate-180*/"
                          : ""
                      }`}
                    />

                    <img 
                      onClick={() => props.onChoice(true)}
                      id={props.piece.getPromotedPiece().owner} 
                      src={imgByName[props.piece.getPromotedPiece().name]} 
                      alt=""
                      className={`w-[50px] h-[50px] cursor-pointer ${
                        (props.yourRole === "後手" || props.yourRole === "gote")
                          ? "/*transform rotate-180*/"
                          : ""
                      }`}
                    />
                {/*<button
                    onClick={() => props.onChoice(true)}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                </button>
                <button
                    onClick={() => props.onChoice(false)}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                </button>*/}
            </div>
        </div>
    );
}

class Room extends React.Component {
  constructor(props) {
    super(props);

    const element = document.querySelector('#game-container');
    const gameRoomData = element.dataset.gameRoomData;
    const gameId = element.dataset.gameId;// #data-game-id属性からゲームIDを取得
    const roomId = element.dataset.roomId;// #data-game-id属性からゲームIDを取得
    const yourRole = element.dataset.yourRole;
    const enemyRole = element.dataset.enemyRole;
    const logoPath = element.dataset.logoPath;
    const gamebackPath = element.dataset.gamebackPath;
    const loadingimgPath = element.dataset.loadingimgPath;
    const audienceUser = element.dataset.audienceUser;
    const yourUsername = element.dataset.yourUsername;
    const pieceMoveSoundPath = element.dataset.piece_move_soundPath;
    const gameBgmPath = element.dataset.game_bgmPath;
    const aimode = JSON.parse(element.dataset.aimode);// 文字列 "true"/"false" を boolean の true/false に変換
    const railsEnv = element.dataset.railsEnv;

    //console.log("audienceUser: "+audienceUser)
    //console.log("プレーンなnew BoardInfo():"+JSON.stringify(new BoardInfo()))

    this.boardInfoInstance = new BoardInfo(); // BoardInfoインスタンスをクラスプロパティとして管理


    this.state = {
      logoPath: logoPath,
      gamebackPath: gamebackPath,
      loadingimgPath: loadingimgPath,
      gameBgmPath: gameBgmPath,
      pieceMoveSoundPath: pieceMoveSoundPath,

      //boardInfo: new BoardInfo(), // 初期状態では引数なしでBoardInfoコンストラクタを呼び出し、デフォルトの初期盤面を生成
      boardInfo: this.boardInfoInstance.getBoardState(), // 状態データのみ
      boardInfoHistory: [{reason:"初期化・Roomコンポーネントのコンストラクタ内でnew BoardInfo()・initialDataなし", boardInfo: this.boardInfoInstance.getBoardState() }], 
      //boardInfo: new_boardInfo, // 盤面状態を保持
      
      gameInfo: {},
      gameRoomData: gameRoomData,
      moveHistory: [],
      boardSfenHistory: [],
      /*boardSfenHistory: [ //千日手用
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 1",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL b - 2",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B4R2/LNSGKGSNL w - 3",
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B4R2/LNSGKGSNL b - 4",
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 5",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL b - 6",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B4R2/LNSGKGSNL w - 7",
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B4R2/LNSGKGSNL b - 8",
        "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 9",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL b - 10",
        "lnsgkgsnl/2r4b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B4R2/LNSGKGSNL w - 11",
      ],*/
      /*boardSfenHistory:[ //王手千日手用
        "4k2+R1/9/9/1r7/9/9/9/9/4K4 w - 1",
        "7+R1/3k5/9/1r7/9/9/9/9/4K4 b - 2",
        "9/3k2+R2/9/1r7/9/9/9/9/4K4 w - 3",
        "3k5/6+R2/9/1r7/9/9/9/9/4K4 b - 4",
        "3k5/6+R2/9/1r7/9/9/9/9/3K5 w - 5",
        "3k5/6+R2/9/3r5/9/9/9/9/3K5 b - 6",
        "3k5/6+R2/9/3r5/9/9/9/9/4K4 w - 7",
        "3k5/6+R2/9/4r4/9/9/9/9/4K4 b - 8",
        "3k5/6+R2/9/4r4/9/9/9/9/3K5 w - 9",
        "3k5/6+R2/9/3r5/9/9/9/9/3K5 b - 10",
        "3k5/6+R2/9/3r5/9/9/9/9/4K4 w - 11",
        "3k5/6+R2/9/4r4/9/9/9/9/4K4 b - 12",
        "3k5/6+R2/9/4r4/9/9/9/9/3K5 w - 13",
        "3k5/6+R2/9/3r5/9/9/9/9/3K5 b - 14",
        "3k5/6+R2/9/3r5/9/9/9/9/4K4 w - 15",
        "3k5/6+R2/9/4r4/9/9/9/9/4K4 b - 16",
        "3k5/6+R2/9/4r4/9/9/9/9/3K5 w - 17",
        "3k5/6+R2/9/3r5/9/9/9/9/3K5 b - 18",
        "3k5/6+R2/9/3r5/9/9/9/9/4K4 w - 19",
        "3k5/6+R2/9/4r4/9/9/9/9/4K4 b - 20"
      ],*/
      moveSfenHistory: {
        move: [], //指し手のSFEN履歴
        kingCheck: [], //王手の履歴
      },
      moveHistorySelectedIndex:-1,
      yourUsername: yourUsername,
      nowTurn: '先手',
      turnCount: 0,
      isCheck: false, // 王手状態を結果に追加
      isCheckmate: false ,// 詰み状態
      isSennichite: "no_sennichite", // 千日手状態
      isGameset: false,

      showPromoteModal: false,//成るかどうかのモーダル
      promoteModalPosition: { i: -1, j: -1 }, // /成り確認モーダル位置情報を追加
      promoteCallback: null,
      currentPiece: null,

      isConnected: false,
      gameId: gameId,
      roomId: roomId, // ルームIDもstateで管理
      yourRole: yourRole,
      enemyRole: enemyRole,
      isLoading: true,//ローディング状態
      loadingMessage: "データを読み込み中...", //ローディングメッセージ

      chatMessages: [], // 新しいstate: チャットメッセージを格納する配列
      currentChatMessage: '', // 新しいstate: 現在入力中のチャットメッセージ
      isChatOpen: true, //チャットが開いているかどうか

      winner: "yet",
      winReason: "yet",

      rematch_sended: false,//リクエストを送信したかどうか
      rematchRequest: false,//リクエストが来ているか
      decline_received: false,//再対戦リクエストの拒否を受け取ったかどうか
      gameStatus: 'playing', //playing, time_up, checkmate
      timeUpPlayer: null, // 時間切れになったプレイヤー

      bufferedInitialTimerState: null, //追加: 初期タイマー状態を一時的に保持する
      debugMode: false,
      shogiDebugMode: false,
      aiMode: aimode,
      audienceUser: JSON.parse(audienceUser),
      railsEnv: railsEnv
    };

    this.boardInfoRef = {
      current: null
    };
    this.subscription = null; // Action Cableのサブスクリプションをインスタンス変数で保持

    this.draggedPiece = null;

    // イベントハンドラのバインド
    this.handleChatInputChange = this.handleChatInputChange.bind(this);
    this.handleChatSubmit = this.handleChatSubmit.bind(this);
    this.toggleChat = this.toggleChat.bind(this);  

    this.handleTimeUp = this.handleTimeUp.bind(this);

    this.handleStartTimer = this.handleStartTimer.bind(this);
    this.handlePauseTimer = this.handlePauseTimer.bind(this);
    this.handleToggleTimer = this.handleToggleTimer.bind(this);
    this.handleSwitchTurn = this.handleSwitchTurn.bind(this);
    this.handleResetTimer = this.handleResetTimer.bind(this);
    //this.setupActionCable = this.setupActionCable.bind(this);
    //this.teardownActionCable = this.teardownActionCable.bind(this);
    this.handleActionCableMessage = this.handleActionCableMessage.bind(this);
    this.applyBufferedInitialTimerState = this.applyBufferedInitialTimerState.bind(this); // ⭐ 追加

    this.audioContextRef = null; // AudioContext のインスタンス
    this.notificationSoundBufferRef = null; // 通知音のオーディオバッファ
    this.setupAudio = this.setupAudio.bind(this);
    this.playNotificationSound = this.playNotificationSound.bind(this);

    // ShogiTimer コンポーネントのインスタンスを直接保持するプロパティ
    // React.createRef() は不要になります。
    this.shogiTimerInstance = null; 
    this.timerStarted = false;
    this.shogiTimerRef = React.createRef();// ShogiTimer コンポーネントへの参照を作成
    //console.log(`this.shogiTimerRef: ${JSON.stringify(this.shogiTimerRef)}`);

    //this.boardInfo = new BoardInfo();
    //console.log("Setting callback to:", this.handlePromoteConfirm);
    //this.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);// BoardInfoにコールバック関数を設定

    //this.setupBoardInfoCallback();
  }

  roomHandleMouseDown = async (i, j) => {
    this.canselSelection(i, j, this.state.nowTurn);

    //配置可能ポイントに相手のコマがあったら別の背景色にするのを初期化
    //console.log("初期化・配置可能ポイントに相手のコマがあったら別の背景色にする");
    const board = document.getElementById("board");//board を取得
    //const imgs = board.querySelectorAll('button.square.配置可能 img');//square 配置可能 の中にあるimgをすべて取得
    const squares = board.querySelectorAll('button.square.enemy-attack');//square 配置可能 の中にあるimgをすべて取得 
    squares.forEach(square => {
      //square.style.backgroundColor = 'transparent';
      square.classList.remove('enemy-attack');
    });

  //handleMouseDown = async (i, j, e) => {
    //マウスダウン時に選択状態にする
    //console.log('マウスダウン:', i, j);
      //const dom = e.target;
      //console.log(dom); // ← これが onMouseDown された DOM

    //try {
      // 選択処理を実行
      //let result;
      if (i === -1) {// 持ち駒台からのドラッグかクリック配置の場合
        //console.log("this.state.boardInfo.selection:",this.state.boardInfo.selection)

        /*this.setState(prevState => {
          // 更新後の boardInfo を事前に作成
          const updatedBoardInfo = {
            ...prevState.boardInfo,
            board: prevState.boardInfo.board,
            nowTurn: prevState.boardInfo.nowTurn,
            pieceStand: prevState.boardInfo.pieceStand,
            pieceStandNum: prevState.boardInfo.pieceStandNum,
            //selection: result.BoardInfo.selection
            
            selection: {
              ...prevState.boardInfo.selection, // result 側の selection を展開
              boardSelectInfo: JSON.parse(JSON.stringify((new Array(9)).fill((new Array(9)).fill("")))),
              isNow: false,
              state: false,
              before_i: null,
              before_j: null
              /
              pieceStandSelectInfo: {
                  "先手": Array(9).fill("持駒"),
                  "後手": Array(9).fill("持駒")
              },
              pieceStandPiece: new Blank()*
              /
            }
          };
          console.log("this.state.boardInfo・持ち駒台のコマをマウスダウン時に更新:",updatedBoardInfo)
          console.log("prevState.boardInfo:",prevState.boardInfo)

          return {
            boardInfoHistory: [
              ...prevState.boardInfoHistory,
              {
                reason: "持ち駒台のコマをマウスダウン時に更新",
                boardInfo: updatedBoardInfo   // ← 更新後の boardInfo を履歴に追加
              }
            ],
            boardInfo: updatedBoardInfo
          };
        //});
        }, () => {*/
            //setState 完了後に実行される処理
            //console.log("this.state.boardInfo.board[i][j]:",this.state.boardInfo.board[i][j])
            /*if(this.state.boardInfo.selection.pieceStandPiece !=null){
              console.log("おthis.state.boardInfo.selection.pieceStandPiece:",this.state.boardInfo.selection.pieceStandPiece)
            }
            if(this.state.boardInfo.pieceStand[this.state.yourRole][j] !=null){
              console.log("えthis.state.boardInfo.pieceStand[this.state.yourRole][j]:",this.state.boardInfo.pieceStand[this.state.yourRole][j])
            }*/

            // 既に選択状態の場合は何もしない
            /*if (this.state.boardInfo.selection.state  ) {
              console.log('持ち駒、既に選択状態なのでスキップ');
              return;
            }*/
            // 自分の駒かチェック
            /*
            if (!piece || piece.owner !== this.state.yourRole) {
              console.log('自分の駒ではないためスキップ');
              return;
            }*/

            let piece = this.state.boardInfo.pieceStand[this.state.yourRole][j];
            //myPiece = Piece.getPieceByName(myPiece.name, this.nowTurn)
            //pieceが単に{owner: '先手', name: '銀'}となってるとエラーになる・右みたいにdxなどがないとダメ{owner: '先手', name: '金', dx: Array(6), dy: Array(6), dk: Array(6)}
            //piece = this.state.boardInfo.pieceStand[this.state.yourRole][j].getPieceByName(piece.name, this.state.nowTurn)
            piece = Piece.getPieceByName(this.state.boardInfo.pieceStand[this.state.yourRole][j].name, this.state.nowTurn)

            console.log("dx,dyとかあるpiece:",piece)
            //result = this.pieceStandClick(this.state.boardInfo.pieceStand[this.state.yourRole][j]);
            //result = await this.pieceStandClick(this.state.boardInfo.pieceStand[this.state.yourRole][j]);
            let result = await this.pieceStandClick(piece);
            // コールバックを async 関数でラップ
            /*(async () => {
              const piece = this.state.boardInfo.pieceStand[this.state.yourRole][j];
              const result = await this.pieceStandClick(piece);
              console.log("pieceStandClick result:", result);
            })();
            */
            console.log('これこれ持ち駒マウスダウン選択結果:', result);
            
            //if(result!==undefined && result.moved_check){
            if(result!==undefined ){
              // boardとnowTurnを新しい値で更新する例
              this.setState(prevState => {
                // 更新後の boardInfo を事前に作成
                const updatedBoardInfo = {
                  ...prevState.boardInfo,
                  //board: result.BoardInfo.board,
                  //nowTurn: result.BoardInfo.nowTurn,
                  //pieceStand: result.BoardInfo.pieceStand,
                  //pieceStandNum: result.BoardInfo.pieceStandNum,
                  //selection: result.BoardInfo.selection
                  board: result.result.BoardInfo.board,
                  nowTurn: result.result.BoardInfo.nowTurn,
                  pieceStand: result.result.BoardInfo.pieceStand,
                  pieceStandNum: result.result.BoardInfo.pieceStandNum,
                  selection: result.result.BoardInfo.selection
                };
                console.log("this.state.boardInfo・持ち駒台のコマをマウスダウン時に更新:",updatedBoardInfo)

                return {
                  boardInfoHistory: [
                    ...prevState.boardInfoHistory,
                    {
                      reason: "持ち駒台のコマをマウスダウン時に更新",
                      boardInfo: updatedBoardInfo   // ← 更新後の boardInfo を履歴に追加
                    }
                  ],
                  boardInfo: updatedBoardInfo
                };
              });
              /*this.setState(prevState => ({
                boardInfoHistory: [
                  ...prevState.boardInfoHistory,
                  {
                    reason: "初期化時",
                    boardInfo: prevState.boardInfo   // 更新前の boardInfo を履歴に追加
                  }
                ],
    
                boardInfo: {
                  ...prevState.boardInfo,  // 既存のboardInfoを展開
                  board: result.BoardInfo.board,         // 新しいboardに置き換え
                  nowTurn: result.BoardInfo.nowTurn,        // 新しいnowTurnに置き換え
                  pieceStand: result.BoardInfo.pieceStand,
                  pieceStandNum: result.BoardInfo.pieceStandNum,
                  selection: result.BoardInfo.selection
                }
              }, () => {
                console.log("変更後:",this.state.boardInfo)
              }));*/
            }
       // });



        /*if (result && result.BoardInfo) {
          this.setState({ boardInfo: result.BoardInfo });
        }*/
      } else {//ボードのコマのドラッグかクリック移動の場合
        /*console.log("this.state.boardInfo:",this.state.boardInfo)
        console.log("this.state.boardInfo.board[i][j]:",this.state.boardInfo.board[i][j])
        if(this.state.boardInfo.selection.before_i!=null){
          console.log("this.state.boardInfo.board[this.state.boardInfo.selection.before_i][this.state.boardInfo.selection.before_j]:",this.state.boardInfo.board[this.state.boardInfo.selection.before_i][this.state.boardInfo.selection.before_j])
        }*/
        // 既に選択状態の場合は何もしない
        //if (this.state.boardInfo.selection.state) {
        /*if (this.state.boardInfo.selection.state && this.state.boardInfo.board[i][j]==this.state.boardInfo.board[this.state.boardInfo.selection.before_i][this.state.boardInfo.selection.before_j] ) {
          console.log('既に選択状態なのでスキップ');
          return;
        }*/
        // 自分の駒かチェック
        /*const piece = this.state.boardInfo.board[i][j];
        if (!piece || piece.owner !== this.state.yourRole) {
          console.log('自分の駒ではないためスキップ');
          return;
        }*/
        // 盤面からのドラッグ
        this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "SquareコンポーネントのsquareHandleMouseDown→RoomコンポーネントのroomOnMouseDown→handleBoardClick呼び出し", boardInfo: this.boardInfoInstance.getBoardState() }] }));
        //console.log('RoomコンポーネントのroomHandleMouseDownからhandleBoardClick呼び出し・i:'+i+" j:"+j+" yourRole:"+this.state.yourRole);
        let result = await this.handleBoardClick(i, j, this.state.yourRole);
        //result = this.handleBoardClick(i, j, this.state.yourRole);
        //console.log('マウスダウン選択結果:', result);

        /*if (result && result.clickResult.BoardInfo) {
          //this.setState({ boardInfo: result.clickResult.BoardInfo });

          this.setState(prevState => {
            // 更新後の boardInfo を事前に作成
            const updatedBoardInfo = {
              ...prevState.boardInfo,
              board: result.clickResult.BoardInfo.board,
              nowTurn: result.clickResult.BoardInfo.nowTurn,
              pieceStand: result.clickResult.BoardInfo.pieceStand,
              pieceStandNum: result.clickResult.BoardInfo.pieceStandNum,
              selection: result.clickResult.BoardInfo.selection
            };
            console.log("this.state.boardInfo・ボードのコマをマウスダウン時に更新:",updatedBoardInfo)

            return {
              boardInfoHistory: [...prevState.boardInfoHistory,{reason: "ボードのコマをマウスダウン時に更新",boardInfo: updatedBoardInfo }],
              boardInfo: updatedBoardInfo
            };
          });
        }else */if(result && result.BoardInfo){
          return new Promise((resolve) => {
            let updatedBoardInfo
            this.setState(prevState => {
              updatedBoardInfo = {
                ...prevState.boardInfo,
                board: result.BoardInfo.board,
                nowTurn: result.BoardInfo.nowTurn,
                pieceStand: result.BoardInfo.pieceStand,
                pieceStandNum: result.BoardInfo.pieceStandNum,
                selection: result.BoardInfo.selection
              };
              //console.log("this.state.boardInfo・ボードのコマをマウスダウン時に更新:",updatedBoardInfo)

              return {
                //boardInfoHistory: [...prevState.boardInfoHistory,{reason: "ボードのコマをマウスダウン時に更新",boardInfo: updatedBoardInfo }],
                boardInfo: updatedBoardInfo
              };
            //});
            }, () => {//setStateが完了した（Stateが反映された）後にここが実行される
              /*const prevBoardInfo = this.state.boardInfo;
              updatedBoardInfo = {
                ...prevBoardInfo,
                board: result.BoardInfo.board,
                nowTurn: result.BoardInfo.nowTurn,
                pieceStand: result.BoardInfo.pieceStand,
                pieceStandNum: result.BoardInfo.pieceStandNum,
                selection: result.BoardInfo.selection
              };
              //stateじゃなくrefで保存する
              //ドラッグ中にstateを更新すると再レンダリングが行われ、ドラッグのdraggableがfalseになってドラッグが壊れるから
              this.boardInfoRef.current = updatedBoardInfo;
              */

              if(result.BoardInfo.selection.isNow){
                //console.log("配置可能ポイントに相手のコマがあったら別の背景色にする");
                //配置可能ポイントに相手のコマがあったら別の背景色にする
                const board = document.getElementById("board");//board を取得
                const imgs = board.querySelectorAll('button.square.配置可能 img');//square 配置可能 の中にあるimgをすべて取得
                const enemyPiecesImgs = Array.from(imgs).filter(img => img.id === this.state.enemyRole);//敵の役割とidが一致するimgだけに絞る
                console.log("enemyPiecesImgs:",enemyPiecesImgs); // 敵のコマのimgのDOMの配列
                if (enemyPiecesImgs || enemyPiecesImgs.length !== 0) {
                  enemyPiecesImgs.forEach(img => {
                    const square = img.parentElement;
                    console.log("配置可能ポイントimg:"+img);
                    if (square) {
                      //parent.style.backgroundColor = '#c24242ff';
                      square.classList.add('enemy-attack');
                    }
                  });
                }
              }
 

              //console.log("this.state.boardInfo・ボードのコマをマウスダウン時に更新:",updatedBoardInfo)
              resolve({ BoardInfo: updatedBoardInfo });
              //return { boardInfo: updatedBoardInfo };
            });

          });
        }
      }
      //return result;
    /*} catch (error) {
      console.error('マウスダウン選択エラー:', error);
    }*/
    
    /*
    let result;
    if (i === -1) {
      result = this.pieceStandClick(this.state.boardInfo.pieceStand[this.state.yourRole][j]);
    } else {
      result = await this.handleBoardClick(i, j, this.state.yourRole);
      console.log("result:"+ JSON.stringify(result))
    }

    if (result && result.BoardInfo) {
      this.setState({ boardInfo: result.BoardInfo });
    }
  };

  render() {
    const { yourRole } = this.state;
    
    return (
      <div>
        <Board
          board={this.state.boardInfo.board}
          boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
          onClick={(i, j) => this.handleBoardClick(i, j, yourRole)}
          onMouseDown={this.handleMouseDown}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onDrop={this.handleDrop}
          yourRole={yourRole}
        />
      </div>
    );*/
  }
  // ドラッグ開始時の処理
  roomHandleDragStart = async (i, j) => {
    //console.log('ドラッグ開始:', i, j);

    /*
    let result;
    if (i === -1) {
      // 持ち駒台からのドラッグ
      result = this.pieceStandClick(this.state.boardInfo.pieceStand[this.state.yourRole][j]);
    } else {
      // 盤面からのドラッグ
      result = await this.handleBoardClick(i, j, this.state.yourRole);
    }
    }*/
   
    
    this.draggedPiece = { i, j };
  };
  // ドラッグ終了時の処理
  roomHandleDragEnd = () => {
    console.log("roomHandleDragEnd")
    // ドラッグ状態をクリア
    setTimeout(() => {
      this.draggedPiece = null;
    }, 100);
  };
  // ドロップ時の処理
  roomHandleDrop = async (dragData, dropI, dropJ) => {
    console.log('ドロップ:', dragData, 'to', dropI, dropJ);
   
  //try {
    // 盤面上のマスにドロップした場合のみ移動処理
    if (dropI >= 0 && dropJ >= 0) {
      //console.log("this.state.boardInfo.selection"+ JSON.stringify(this.state.boardInfo.selection))
      
      // 現在のboardInfoを取得（常に最新のstateから）
      /*const currentBoardInfo = this.state.boardInfo;
      
      // boardInfoが存在し、必要なメソッドを持っているかチェック
      if (!currentBoardInfo) {
        console.error('boardInfo が存在しません');
        return { success: false, reason: "no_boardinfo" };
      }
      
      if (typeof currentBoardInfo.boardClick !== 'function') {
        this.debugBoardInfo();
        console.error('boardInfo.boardClick が関数ではありません:', typeof currentBoardInfo.boardClick);
        console.log('currentBoardInfo:', currentBoardInfo);
        return { success: false, reason: "invalid_boardinfo" };
      }
      
      // selection情報をチェック
      console.log("currentBoardInfo.selection:", JSON.stringify(currentBoardInfo.selection));
      
      // 選択状態がない場合はエラー
      if (!currentBoardInfo.selection || !currentBoardInfo.selection.state) {
        console.log('選択状態がありません');
        return { success: false, reason: "no_selection" };
      }
      
      // 移動可能かチェック（安全にアクセス）
      let selectInfo = null;
      try {
        if (currentBoardInfo.selection.boardSelectInfo && 
            currentBoardInfo.selection.boardSelectInfo[dropI] && 
            currentBoardInfo.selection.boardSelectInfo[dropI][dropJ] !== undefined) {
          selectInfo = currentBoardInfo.selection.boardSelectInfo[dropI][dropJ];
        }
      } catch (e) {
        console.warn('selectInfo取得エラー:', e);
      }
      
      console.log("selectInfo:", selectInfo);
      */

      // 移動可能かチェック
      //const selectInfo = this.state.boardInfo.selection.boardSelectInfo[dropI][dropJ];
      //const selectInfo = this.boardInfoInstance.selection.boardSelectInfo[dropI][dropJ];
      //console.log("this.boardInfoInstance.selection"+ JSON.stringify(this.boardInfoInstance.selection))
      //console.log("selectInfo"+ JSON.stringify(selectInfo))

      //if (selectInfo === "移動可能") {
        // 移動処理を実行
        //this.handleBoardClick(dropI, dropJ, this.state.yourRole);
        const result = await this.handleBoardClick(dropI, dropJ, this.state.yourRole);

        //console.log('マウスダウン選択結果:', result);
      //} else {
        // 移動不可能な場合は選択をリセット
        //this.resetSelection();
      //}
      } else {
        // 盤面外にドロップした場合は選択をリセット
        this.resetSelection();
        console.log('盤面外へのドロップのため処理なし');
        //return { success: false, reason: "out_of_board" };
      }
    //} catch (error) {
      //console.error('handleDrop エラー:', error);
      //return { success: false, reason: "exception", error };
    //}
  };
  // 選択状態をリセット
  resetSelection = () => {
    //console.log('選択をリセット');
    
    // 既存の選択リセットロジックに合わせて実装
    const updatedBoardInfo = { ...this.state.boardInfo };
    updatedBoardInfo.selection.state = false;
    updatedBoardInfo.selection.isNow = false;
    
    // 選択情報を初期化
    updatedBoardInfo.selection.boardSelectInfo = Array(9).fill().map(() => Array(9).fill("未選択"));
    updatedBoardInfo.selection.pieceStandSelectInfo = {
      "先手": Array(9).fill("未選択"),
      "後手": Array(9).fill("未選択")
    };
    
    this.setState({ boardInfo: updatedBoardInfo });
  };
  /*
  //コマのドラッグ移動
  destroyDraggable() {
    if (this.draggableInstance) {
      this.draggableInstance.destroy();
      this.draggableInstance = null;
    }
  }
  initializeDraggable() {
    // 駒が存在し、自分の手番の駒のみドラッグ可能にする
    const draggableElements = document.querySelectorAll('.square img[id]:not([id=""])');
    const validElements = Array.from(draggableElements).filter(img => {
      const square = img.closest('.square');
      const i = parseInt(square.dataset.i);
      const j = parseInt(square.dataset.j);
      
      //console.log("square:"+String(square))
      //console.log("square:", square, "i:", i, "j:", j);

      // 盤面の駒の場合
      if (i >= 0 && j >= 0 && this.state.boardInfo.board[i] && this.state.boardInfo.board[i][j]) {
        //return this.state.boardInfo.board[i][j].owner === this.state.yourRole;
        return this.state.boardInfo.board[i][j].owner ;
      }
      
      // 持ち駒台の駒の場合
      if (i === -1) {
        const pieceStandSide = square.closest('.piece-stand').classList.contains('先手') ? '先手' : '後手';
        return pieceStandSide === this.state.yourRole;
      }
      
      return false;
    });

    console.log("validElements:"+validElements)
    console.log("draggableElements:"+String(draggableElements))

    if (validElements.length > 0) {
      //this.draggableInstance = new Draggable.Draggable(validElements, {
      this.draggableInstance = new Draggable(validElements, {
        draggable: '.square',
        delay: 100, // ドラッグ開始の遅延
      });
      //this.draggableInstance = new Draggable(validElements)

      setTimeout(() => {
        const King = document.getElementById('King');// ドラッグしたい要素を取得
        if (King) {
          new Draggable(King);// Draggable.js のインスタンスを作成し、要素をドラッグ可能にする// 'new Draggable()' の引数にドラッグ対象の要素を渡します。
        }
      }, 100);

      // ドラッグ開始イベント
      this.draggableInstance.on('drag:start', (event) => {
        const square = event.source;
        const i = parseInt(square.dataset.i);
        const j = parseInt(square.dataset.j);
        
        console.log('ドラッグ開始:', i, j);
        
        // 盤面の駒の場合
        if (i >= 0 && j >= 0) {
          // 選択状態にする（既存のboardClickロジックを使用）
          this.handleBoardClick(i, j, this.state.yourRole);
        } else if (i === -1) {
          // 持ち駒台の場合
          const pieceStandSide = square.closest('.piece-stand').classList.contains('先手') ? '先手' : '後手';
          this.pieceStandClick(this.state.boardInfo.pieceStand[pieceStandSide][j]);
        }
      });

      // ドラッグ終了イベント
      this.draggableInstance.on('drag:stop', (event) => {
        const dropTarget = document.elementFromPoint(event.data.sensorEvent.clientX, event.data.sensorEvent.clientY);
        const targetSquare = dropTarget ? dropTarget.closest('.square') : null;
        
        if (targetSquare) {
          const targetI = parseInt(targetSquare.dataset.i);
          const targetJ = parseInt(targetSquare.dataset.j);
          
          console.log('ドロップ先:', targetI, targetJ);
          
          // 盤面上のマスにドロップした場合のみ移動処理
          if (targetI >= 0 && targetJ >= 0) {
            // 移動可能かチェック
            const selectInfo = this.state.boardInfo.selection.boardSelectInfo[targetI][targetJ];
            if (selectInfo === "移動可能") {
              // 移動処理を実行
              this.handleBoardClick(targetI, targetJ, this.state.yourRole);
            } else {
              // 移動不可能な場合は選択をリセット
              this.resetSelection();
            }
          } else {
            // 盤面外にドロップした場合は選択をリセット
            this.resetSelection();
          }
        } else {
          // 有効なドロップ先が見つからない場合は選択をリセット
          this.resetSelection();
        }
      });
    }
  }
  resetSelection() {
    // 選択状態をリセットする処理
    // この部分は既存のリセットロジックに合わせて実装
    console.log('選択をリセット');
    // 例: 選択状態を初期化するメソッドを呼び出し
    this.clearSelection();
  }*/
  //コマのドラッグ移動

  //BoardInfoにsetPromoteConfirmCallbackコールバックを設定
  setupBoardInfoCallback = (boardInfoInstance = null) => {
    const targetBoardInfo = boardInfoInstance || this.state.boardInfo;
    
    if (targetBoardInfo) {
      // setPromoteConfirmCallbackメソッドが存在するかチェック
      if (typeof targetBoardInfo.setPromoteConfirmCallback === 'function') {
        //console.warn("BoardInfo.setPromoteConfirmCallbackがコールバックとして設定されているのでOK");
        //console.log("コールバックを設定中...");
        targetBoardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
        //console.log("BoardInfoにsetPromoteConfirmCallbackコールバック設定完了:", !!targetBoardInfo.onPromoteConfirmCallback);
        this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "setupBoardInfoCallbackでBoardInfoにsetPromoteConfirmCallbackコールバックを設定", boardInfo: targetBoardInfo }] }));
      } else {
        console.warn("setPromoteConfirmCallback メソッドが存在しません");
        /*this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "前・setupBoardInfoCallbackでBoardInfoにsetPromoteConfirmCallbackコールバックを設定する前", boardInfo: targetBoardInfo }] }));
        targetBoardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
        console.log("BoardInfoにsetPromoteConfirmCallbackコールバック設定完了:", !!targetBoardInfo.onPromoteConfirmCallback);
        this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "後・setupBoardInfoCallbackでBoardInfoにsetPromoteConfirmCallbackコールバックを設定した後", boardInfo: targetBoardInfo }] }));
        */
      }
      
      // 直接プロパティを設定する場合（フォールバック）
      if (!targetBoardInfo.onPromoteConfirmCallback) {
        console.log("BoardInfo.onPromoteConfirmCallback直接プロパティにコールバックを設定");
        targetBoardInfo.onPromoteConfirmCallback = this.handlePromoteConfirm;
      }else{
        console.log("BoardInfo.onPromoteConfirmCallbackは存在するのでOK");
      }
    } else {
      console.error("targetBoardInfo が存在しません");
    }
    /*setupBoardInfoCallback = () => {
      console.log("コールバックの設定");
      //this.state.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
      
      // BoardInfoにコールバック関数を設定
      // 重要：stateのboardInfoに対してコールバックを設定
      //this.state.boardInfo.setPromoteConfirmCallback(this.handlePromoteConfirm);
      this.boardInfoInstance.setPromoteConfirmCallback(this.handlePromoteConfirm);
      //console.log("BoardInfo instance in state:", this.state.boardInfo);
      //console.log("Callback set to:", this.state.boardInfo.onPromoteConfirmCallback);
      */
  }

  // 成り確認のコールバック関数
  handlePromoteConfirm = (piece, i, j, callback) => {
      //console.log("成り確認のコールバック関数呼ばれた");
      console.log(`成り確認要求: piece=${piece.name}, position=(${i}, ${j})`);
      //console.log("handlePromoteConfirm called with piece:", piece);
      //i（行）→ 横方向（左から右）
	    //j（列）→ 縦方向（上から下）
      //console.log("yourRole:"+this.state.yourRole)
      
      /*if(this.state.yourRole=="後手"){//後手の時は座標を逆にする
        //console.log("後手の時は座標を逆にする:")
        i = 8 - i; // 後手用の横座標
        j = 8 - j; // 後手用の縦座標
      }*/

      this.setState({
          promoteCallback: callback,
          showPromoteModal: true,
          currentPiece: piece,
          promoteModalPosition: { i, j }
      });

      if (this.state.aiMode && this.state.nowTurn==this.state.enemyRole ) { //ai対戦モードでaiのターンならtrueで自動成り
        console.log("成り判定でai対戦モードでaiのターンならtrueで自動成り")
        callback(true);
        this.setState({
          showPromoteModal: false,
          promoteCallback: null,
          currentPiece: null,
          promoteModalPosition: { i: -1, j: -1 }
        });
      }
  }
  // モーダルでの選択処理
  handlePromoteChoice = (shouldPromote) => {
      //console.log("ユーザーの選択:", shouldPromote ? "成る" : "成らない");
      //console.log("shouldPromote:"+shouldPromote)

      if (this.state.promoteCallback) {
          this.state.promoteCallback(shouldPromote);
      }
      this.setState({
          showPromoteModal: false,
          promoteCallback: null,
          currentPiece: null,
          promoteModalPosition: { i: -1, j: -1 }
      });
  }


  // デバッグ用：BoardInfoの状態をチェックするメソッド
  debugBoardInfo = () => {
    const boardInfo = this.state.boardInfo;
    console.log('=== BoardInfo Debug ===');
    console.log('boardInfo exists:', !!boardInfo);
    console.log('boardInfo type:', typeof boardInfo);
    console.log('boardInfo constructor:', boardInfo?.constructor?.name);
    console.log('boardClick method exists:', typeof boardInfo?.boardClick);
    console.log('selection exists:', !!boardInfo?.selection);
    console.log('board exists:', !!boardInfo?.board);
    
    if (boardInfo) {
      console.log('boardInfo keys:', Object.keys(boardInfo));
      console.log('boardInfo methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(boardInfo)));
    }
    
    // this.boardInfoInstanceも確認
    if (this.boardInfoInstance) {
      console.log('this.boardInfoInstance exists:', !!this.boardInfoInstance);
      console.log('this.boardInfoInstance === this.state.boardInfo:', this.boardInfoInstance === this.state.boardInfo);
    }
    console.log('========================');
  }

  // BoardInfoインスタンスを安全に取得するヘルパーメソッド
  getSafeBoardInfo = () => {
    const boardInfo = this.state.boardInfo;
    
    if (!boardInfo) {
      console.error('boardInfo が存在しません');
      return null;
    }
    
    if (typeof boardInfo.boardClick !== 'function') {
      console.error('boardInfo.boardClick が関数ではありません');
      console.log('利用可能なメソッド:', Object.getOwnPropertyNames(Object.getPrototypeOf(boardInfo)));
      return null;
    }
    
    return boardInfo;
  }

  // セットアップ時やエラー時にBoardInfoを再初期化するメソッド
  /*reinitializeBoardInfo = () => {
    console.log('BoardInfo を再初期化します');
    
    try {
      // 現在のゲーム状態を保持してBoardInfoを再作成
      const currentState = this.state;
      
      if (!currentState.boardInfo) {
        console.error('現在のboardInfoが存在しないため再初期化できません');
        return false;
      }
      
      // 既存のデータを使って新しいBoardInfoインスタンスを作成
      const gameData = {
        moveDetails: null, // 再初期化時は移動詳細なし
        boardSFEN: currentState.boardInfo.boardSFEN || currentState.boardInfo.getBoardSFEN?.(),
        BoardInfo: currentState.boardInfo.board,
        pieceStandNum: currentState.boardInfo.pieceStandNum,
        pieceStand: currentState.boardInfo.pieceStand,
        nowTurn: currentState.nowTurn,
        isCheck: currentState.isCheck,
        isCheckmate: currentState.isCheckmate,
        winner: currentState.winner
      };
      
      const newBoardInfo = new BoardInfo(gameData);
      
      // コールバックを再設定
      this.setupBoardInfoCallback();
      
      this.setState({
        boardInfo: newBoardInfo
      });
      
      console.log('BoardInfo の再初期化が完了しました');
      return true;
      
    } catch (error) {
      console.error('BoardInfo の再初期化中にエラー:', error);
      return false;
    }
  }*/





  // コンポーネントがマウントされた後に一度だけ実行される
  componentDidMount() {
    this.initializeRoom();
    this.setupAudio()
    //this.initializeDraggable();

    //this.setupBoardInfoCallback();

    //デバッグモード
    window.addEventListener('keydown', (event) => { if (event.key === 'd' || event.key === 'D') { 
      event.preventDefault(); //dでブックマーク登録を防ぐ
      this.debugModeOn()
    } });
  }

  //prevProps と prevState を引数として明示的に受け取る
  componentDidUpdate(prevProps, prevState) {
    // stateが更新されたらDraggableを再初期化
    //this.destroyDraggable();
    //this.initializeDraggable();

    // stateが更新されたときにコールバックが失われていないかチェック
    if (prevState.boardInfo !== this.state.boardInfo) {
        //console.log("BoardInfoインスタンスが変更されました。コールバックをリセットします。");
        this.setupBoardInfoCallback();
    }

    // shogiTimerRef.current が null から非nullになった、かつ bufferedInitialTimerState が存在する場合に適用を試みる
    if (this.shogiTimerRef.current && this.state.bufferedInitialTimerState) {
        this.applyBufferedInitialTimerState();
    }
    // bufferedInitialTimerState が null から非nullになった場合（データがバッファされた）
    else if (!prevState.bufferedInitialTimerState && this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        this.applyBufferedInitialTimerState();
    }
    if (!this.timerStarted && this.shogiTimerRef.current) {
      this.timerStarted = true;
      //console.log(`this.timerStarted: ${this.timerStarted}`);
      this.handleToggleTimer();
    }
  }

  // AudioContextと音源の準備
  async setupAudio() {
    /*if (!this.audioContextRef) {
      this.audioContextRef = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!this.notificationSoundBufferRef) {
      try {
        const response = await fetch('/assets/notification.mp3');
        const arrayBuffer = await response.arrayBuffer();
        this.notificationSoundBufferRef = await this.audioContextRef.decodeAudioData(arrayBuffer);
        console.log("通知音源をロードしました。");
      } catch (e) {
        console.error("通知音源のロードまたはデコードに失敗しました:", e);
      }
    }*/
  }

  // 通知音を再生する処理
  playNotificationSound() {
    if (this.audioContextRef && this.notificationSoundBufferRef) {
      const source = this.audioContextRef.createBufferSource();
      source.buffer = this.notificationSoundBufferRef;
      source.connect(this.audioContextRef.destination);
      source.start(0);
      console.log("通知音を再生しました。");
    } else {
      console.warn("通知音を再生できません。オーディオコンテキストまたはバッファが未準備です。");
    }
  }

  //バッファされた初期状態を ShogiTimer に適用するメソッド
  applyBufferedInitialTimerState() {
    if (this.state.bufferedInitialTimerState && this.shogiTimerRef.current) {
        //console.log("ShogiTimerにバッファされた初期タイマーの状態を適用する:", this.state.bufferedInitialTimerState);
        this.shogiTimerRef.current.initializeTimerState(this.state.bufferedInitialTimerState);
        this.setState({ bufferedInitialTimerState: null }); // 適用したらクリア
    }
  }

  // コンポーネントがアンマウントされる前に実行される（クリーンアップ）
  componentWillUnmount() {
    //this.destroyDraggable();

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  initializeRoom = () => {
    // URLから部屋番号を取得
    const pathSegments = window.location.pathname.split('/');
    const roomId = pathSegments[pathSegments.length - 1];

    if (!roomId) {
      console.error("URLにルームIDが見つかりません");
      return;
    }

    this.setState({ roomId }); // ルームIDをstateに保存 
    this.subscription = consumer.subscriptions.create(
      { channel: "ShogiGameChannel", room_id: roomId },
      {
        connected: () => {
          //console.log(`ShogiGameChannelに接続されています（ルームID: ${roomId}）`);
          this.setState({ isConnected: true });
          //console.log("subscribe RoomChannel");
        },
        disconnected: () => {
          //console.log(`ShogiGameChannelからroom_idで接続が切断されました。: ${roomId}`);
          this.setState({ isConnected: false });
        },
        received: (data) => {
          if(data.data_type!=="board_update"){
            this.handleActionCableMessage(data);//残り時間
          }
          //console.log(`room_id のデータを取得しました。 ${roomId}:`, data);
          if(data.data_type=="initialize"){//Redisにデータがないから初期データのまま
            this.setState({ isLoading: false, boardInfo: new BoardInfo()});//ローディングを終了
            //console.log("aiMode:"+this.state.aiMode)
            //console.log("enemyRole:"+this.state.enemyRole)
            //console.log("nowTurn:"+this.state.nowTurn)
            if( this.state.aiMode && this.state.enemyRole==this.state.nowTurn && !this.state.isCheckmate && !this.state.shogiDebugMode){ 
              console.log("initializeRoomのreceivedのdata=initializeのaiAct")
              console.log("this.state.aiMode:"+JSON.stringify(this.state.aiMode))
              this.aiAct(new BoardInfo())
            } //Ai対戦モードで、現在のターンがaiのターンだったら
            return
          }else if(data.data_type=="rematch_initialize"){
            this.setState({
                boardInfo: new BoardInfo(),
                nowTurn: "先手", // BoardInfoのturnをstateに反映
                moveHistory: [],
                isLoading: false,
                loadingMessage: "",
                isCheckmate: false ,// 詰み状態
                winner: "yet",
                rematch_sended: false,//リクエストを送信したかどうか
                rematchRequest: false,//リクエストが来ているか
                decline_received: false,
                gameStatus: 'playing', // 例: 'playing', 'time_up', 'checkmate'
                timeUpPlayer: null, // 時間切れになったプレイヤー
                bufferedInitialTimerState: null,
              }, () => {
                // ここにタイマーのリセット処理を追加・リマッチが初期化されたら、タイマーもリセットする
                this.handleToggleTimer();
              });
          }else if(data.data_type=="already_redis_stored_board_data"){
            data=JSON.parse(data.redis_stored_board_data);

            //moveHistory取得
            let moveHistory_redis = data.moveHistory; //moveHistoryを取り出し ["後手8六と"]
            moveHistory_redis = moveHistory_redis.filter(Boolean); //空文字列の要素を除去する (先頭のカンマによる空要素のため)
            let boardSfenHistory_redis = data.boardSfenHistory.filter(Boolean); 
            //let moveSfenHistory_redis = data.moveSfenHistory.filter(Boolean); 
            const turnCount = boardSfenHistory_redis.length;//現在の手数
            console.log("これだあああdata.moveSfenHistory:"+JSON.stringify(data.moveSfenHistory) )


            console.log("already_redis_stored_board_dataのmoveHistory_redis:"+moveHistory_redis)
            const boardDataFromServer = data;
            if (boardDataFromServer) {
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              //this.setState({
              this.setState(prevState => ({
                boardInfo: newBoardInfoInstance,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                moveHistory: moveHistory_redis,
                boardSfenHistory: boardSfenHistory_redis,
                //moveSfenHistory: moveSfenHistory_redis,
                moveSfenHistory: data.moveSfenHistory,
                turnCount: turnCount,
                isLoading: false,
                loadingMessage: "",
                boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "initializeRoomのreceivedのdata_type==already_redis_stored_board_dataでサーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成", boardInfo: newBoardInfoInstance }]
              }), () => {
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }
            //this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "initializeRoomのreceivedのdata_type==already_redis_stored_board_dataでサーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成", boardInfo: newBoardInfoInstance }] }));        
          }else if(data.data_type=="board_update"){
            //console.log("ActionCableのboard_update")

            if (this.state.nowTurn===this.state.yourRole) {
              console.log("piece_move_sound");
              this.piece_move_sound()
            }
            const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
            let moveHistory_redis = boardDataFromServer.moveHistory.filter(Boolean); //moveHistoryを取り出し ["後手8六と"]・filter(Boolean)で空文字列の要素を除去する (先頭のカンマによる空要素のため)
            let boardSfenHistory_redis = boardDataFromServer.boardSfenHistory.filter(Boolean); 
            //let moveSfenHistory_redis = boardDataFromServer.moveSfenHistory.filter(Boolean); 
            const turnCount = boardSfenHistory_redis.length;//現在の手数

            console.log("これだあああdata.moveSfenHistory:" + JSON.stringify(boardDataFromServer.moveSfenHistory) );
            console.log("これだあああboardDataFromServer:" + JSON.stringify(boardDataFromServer) );


            if (boardDataFromServer) {
              //console.log("boardDataFromServer:"+JSON.stringify(boardDataFromServer))
              //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
              const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
              //const newBoardInfoInstance = this.boardInfoInstance(boardDataFromServer);
              //const newBoardInfoInstance = this.state.boardInfo(boardDataFromServer);
              //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
              console.log("redisからのデータnewBoardInfoInstanceを取得時(盤面更新後)boardInfoを更新")
              this.setState(prevState => ({
                boardInfo: newBoardInfoInstance,
                moveHistory: moveHistory_redis,
                boardSfenHistory: boardSfenHistory_redis,
                //moveSfenHistory: moveSfenHistory_redis,
                moveSfenHistory: boardDataFromServer.moveSfenHistory,
                turnCount: turnCount,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                isLoading: false,
                loadingMessage: "",
                boardInfoHistory: [ ...prevState.boardInfoHistory,{reason: "shogi_game_channel.rbのboard_broadcast_and_storeメソッドのActionCable.server.broadcastでサブスクライバー全員がデータ受け取り、新しくBoardInfoインスタンス作ってstateのboardデータ更新", boardInfo: newBoardInfoInstance } ]
                //this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "shogi_game_channel.rbのboard_broadcast_and_storeメソッドのActionCable.server.broadcastからデータ受け取り新しくBoardInfoインスタンス作ってstateのboardデータ更新", boardInfo: boardData }] }));
              /*this.setState({
                boardInfo: newBoardInfoInstance,
                moveHistory: moveHistory_redis,
                nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
                isLoading: false,
                loadingMessage: "",
              */
              }), () => {
                //console.log("aiMode:"+this.state.aiMode)
                //console.log("enemyRole:"+this.state.enemyRole)
                //console.log("nowTurn:"+this.state.nowTurn)
                if( this.state.aiMode && this.state.enemyRole==this.state.nowTurn && !this.state.isCheckmate && !this.state.shogiDebugMode){
                  console.log("initializeRoomのreceivedのdata=board_updateのaiAct")
                  console.log("this.state.aiMode:"+JSON.stringify(this.state.aiMode))
                  this.aiAct(newBoardInfoInstance)
                }
                //console.log(`BoardInfo instance reconstructed:`, this.state.boardInfo);
              });
            }
          }else if(data.data_type=="already_redis_stored_chat_data" || data.data_type=="chat_update"){
            if (data.data_type=="already_redis_stored_chat_data"){ 
              this.setState({ isLoading: false, loadingMessage: "" });//ローディングを終了 
            }
            //console.log(`data.chat_data:`, data.chat_data);
            if (Array.isArray(data.chat_data)) {//配列かどうかチェック
              //最初はdata.chat_dataが"aaa"みたいに配列になっていないので配列に変換してchatMessageに入れる
              //console.log("data.chat_data: ",data.chat_data)
              this.setState({ chatMessages: data.chat_data }, () => {
                  //console.log("state 更新後:", this.state.chatMessages);
              });
            }else{
              this.setState({ chatMessages: data.chat_data }, () => {
                //console.log("state 更新後:", this.state.chatMessages);
              });
            }
            //console.log(`this.state.chatMessages：`, this.state.chatMessages);
            return
          }else if (data.data_type === 'game_set'){
              console.log("ゲームセット")
              this.setState({
                //isCheckmate: true ,// 詰み状態
                isGameset: true ,// 詰み状態
                winner: data.winner,
                winReason: data.winReason,
                //gameStatus: 'time_up',
                //timeUpPlayer: player,
              });

              //マッチングデータも消す
              const MATCH_STATUS_KEY = 'shogi_matching_status';
              const MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
              const MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
              const SESSION_ID_KEY = 'shogi_session_id'; // localStorageにセッションIDを保存するキー

              // ローカルストレージのマッチング状態をクリア
              localStorage.removeItem(MATCH_STATUS_KEY);
              localStorage.removeItem(MATCH_ROOM_ID_KEY);
              localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);
              localStorage.removeItem(SESSION_ID_KEY);
          }else if (data.data_type === 'rematch_request') {
            const requesterRole = data.requester_role;
            const message = data.message;
            if (this.state.yourRole !== requesterRole) {
              // 後手のプレイヤーの場合：再対戦依頼の通知を表示
              //displayRematchRequest(message, data.current_game_id);
              //console.log("再対戦依頼の通知を表示"+message+" "+data.current_game_id);
              this.setState({ rematchRequest: true });
            } else {
              // 先手のプレイヤーの場合：自分がリクエストしたことの確認メッセージを表示（任意）
              console.log("あなたが再対戦をリクエストしました。相手の返答をお待ちください。");
              // または、リクエスト中であることを示すUI（例: ボタンを無効にする）
            }
          }else if (data.data_type === 'decline_rematch') {
            const declinedRole = data.declined_role;
            if (this.state.yourRole !== declinedRole) {
                this.setState({ decline_received: true ,rematch_sended: false});
              } else {
                // 先手のプレイヤーの場合：自分がリクエストしたことの確認メッセージを表示（任意）
                console.log("あなたが再対戦をリクエストしました。相手の返答をお待ちください。");
                // または、リクエスト中であることを示すUI（例: ボタンを無効にする）
              }
          }
        },
        //shogi_game_channel.rbのboard_broadcast_and_store呼び出し
        // クライアントからサーバーにメッセージを送るメソッド
        board_update: (boardData) => {
          // ここで boardData は getBoardState() から返されるプレーンなオブジェクトであることを想定
          this.subscription.perform('board_broadcast_and_store', { 
            moveHistory: this.state.moveHistory, 
            boardSfenHistory: this.state.boardSfenHistory, 
            moveSfenHistory: this.state.moveSfenHistory, 
            //moveHistory: [], 
            BoardInfo: boardData,
            nowTurn: this.state.nowTurn,
            room_id: this.state.roomId,
            game_id: this.state.gameId
           });
          this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "initializeRoomメソッドからshogi_game_channel.rbのboard_broadcast_and_storeメソッド呼び出してredisにデータ格納してブロードキャスト", boardInfo: boardData }] }));
        },
        // サーバーにメッセージを送信するためのカスタムメソッド
        sendChatMessage: (chat_data)=> {//
          //console.log(`sendChatMessageメソッド・chat_data:${chat_data}`);
          this.subscription.perform('chat_broadcast_and_store', { 
            chat_data: chat_data,
            yourUsername: this.state.yourUsername,
            room_id: this.state.roomId,
            game_id: this.state.gameId 
          });
        //再対戦
        },
        rematch_send: (yourRole)=> {
          this.subscription.perform('rematch_setup', {
              yourRole: yourRole, // キーが'yourRole'
              room_id: this.state.roomId,   // キーが'room_id'
              game_id: this.state.gameId    // キーが'game_id'
          });
        //再戦を承諾
        },
        // サーバーにアクションを送信するヘルパーメソッドを定義 (ShogiTimerから呼び出される)
        // これらはShogiTimerから参照されるため、bindする必要がある
        // Action Cable performsメソッドはPromiseを返さないため、同期的な呼び出し
        sendToggleTimer: (timerState) => {
          this.subscription.perform('toggle_timer', timerState);
        },
        sendSwitchTurn: (turnState) => {
          this.subscription.perform('switch_turn', turnState);
        },
        sendResetTimer: (resetState) => {
          this.subscription.perform('reset_timer', resetState);
        }
      }
    );
  };

  canselSelection(i,j,nowTurn) {
  //canselSelection() {
    console.log("canselSelectionで選択解除")
    console.log("canselSelectionのnowTurn:"+nowTurn)
    console.log("canselSelectionのthis.state.yourRole:"+this.state.yourRole)

    if (i === -1) {// 持ち駒台の場合
      console.log("持ち駒台の場合のcanselSelection")
      //if(this.state.boardInfo.selection.pieceStandSelectInfo[i][j]!=="配置可能" && nowTurn===this.state.yourRole){//配置可能じゃなく、自分のターンなら
        //console.log("pieceStandのcanselSelectionで配置可能じゃなく、自分のターンなのでselectionを初期化する")
        //console.log("pieceStandのcanselSelectionで更新前のboardInfo.selection:", this.state.boardInfo.selection);

        // boardInfo全体をコピーしつつ、一部だけ書き換える
        const newBoardInfo = {
          ...this.state.boardInfo,       // 現在のboardInfoを全て展開
          selection: new Selection()     // selectionだけ新しい値で上書き
        };

        //this.setState({ boardInfo: newBoardInfo });
        this.setState(
          { boardInfo: newBoardInfo },
          () => {//↓state更新後の処理
            console.log("canselSelectionで更新後のboardInfo.selection:", this.state.boardInfo.selection);
          }
        );
      //}else{
        //console.log("canselSelectionで配置可能か、自分のターンじゃないのでselectionを初期化しない")
      //}
    }else{//ボードのコマの場合
      //console.log("canselSelectionでthis.BoardInfo"+JSON.stringify(this.state.boardInfo))
      console.log("boardのcanselSelectionでthis.BoardInfo.selection.boardSelectInfo"+JSON.stringify(this.state.boardInfo.selection.boardSelectInfo[i][j]))
      console.log("boardのcanselSelectionでthis.BoardInfo.selection.boardSelectInfo"+JSON.stringify(this.state.boardInfo.selection.boardSelectInfo[j][i]))

      //if(this.state.boardInfo.selection.boardSelectInfo[i][j]!=="配置可能" && nowTurn==this.state.yourRole){//配置可能じゃなく、自分のターンなら
      if(this.state.boardInfo.selection.boardSelectInfo[i][j]!=="配置可能" && nowTurn===this.state.yourRole){//配置可能じゃなく、自分のターンなら
          //this.state.boardInfo.selection.isNow = false;// 選択状態を解除
          //this.state.boardInfo.selection = new Selection();
          console.log("canselSelectionで配置可能じゃなく、自分のターンなのでselectionを初期化する")

          console.log("canselSelectionで更新前のboardInfo.selection:", this.state.boardInfo.selection);

          // boardInfo全体をコピーしつつ、一部だけ書き換える
          const newBoardInfo = {
            ...this.state.boardInfo,       // 現在のboardInfoを全て展開
            //selection: false               // selectionだけ新しい値で上書き
            selection: new Selection()               // selectionだけ新しい値で上書き
          };

          //this.setState({ boardInfo: newBoardInfo });
          this.setState(
            { boardInfo: newBoardInfo },
            () => {//↓state更新後の処理
              console.log("canselSelectionで更新後のboardInfo.selection:", this.state.boardInfo.selection);
            }
          );

      }else{
        console.log("canselSelectionで配置可能か、自分のターンじゃないのでselectionを初期化しない")
      }
      //this.BoardInfo.selection.boardSelectInfo(1,j)

      /*if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
      const nextBoardInfo = this.state.boardInfo;// 現在のboardInfoの状態を取得
      if (nextBoardInfo.selection.isNow) {// 既に何か選択されている状態の場合
        nextBoardInfo.selection.isNow = false;// 選択状態を解除
      } else {//何も選択されてない状態の場合
        nextBoardInfo.selection = new Selection();//selectionオブジェクトを初期状態に戻す (新しいSelectionインスタンスを作成し、選択状態を完全に初期化する)
      }
      //nextBoardInfo.selection = new Selection();//selectionオブジェクトを初期状態に戻す (新しいSelectionインスタンスを作成し、選択状態を完全に初期化する)

      //stateにぶちこまないといけない？
      //this.setState({boardInfo: nextBoardInfo});//盤面情報の更新
      this.setState(prevState => ({
        boardInfo: nextBoardInfo,
        boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "canselSelectionで選択解除でboardInfoを更新", boardInfo: nextBoardInfo }]
      }));
      */
    }
    
    //成りモーダルの非表示して初期化処理
    if(this.state.showPromoteModal){
      console.log("成りモーダルの非表示して初期化処理")
      this.setState({
        showPromoteModal: false,
        promoteCallback: null,
        currentPiece: null,
        promoteModalPosition: { i: -1, j: -1 }
      });
    }

  }




  //ユーザーが盤面上のi行、j列をクリックしたときに呼ばれるメソッド
  async handleBoardClick(i, j,player) {
  //handleBoardClick(i, j,player) {
    //console.log(`handleBoardClick:player=${player}, i=${i}, j=${j} `);
    //console.log("Current BoardInfo:", this.state.boardInfo);
    //console.log("BoardInfo callback exists?", !!this.state.boardInfo.onPromoteConfirmCallback);

    //console.log("handleBoardClick起動、i , j :" +i+","+j);
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
    const { boardInfo, isConnected, yourRole, aiMode } = this.state;
    //const clickResult = boardInfo.boardClick(i, j,yourRole);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている

    // BoardInfoがクラスインスタンスでない場合、再構築する
    let boardInstance = boardInfo; // 元のboardInfoを変数に格納
    if (typeof boardInfo.boardClick !== 'function') {
      //console.log('BoardInfoインスタンスを再構築します');
      // 現在のデータから新しいBoardInfoインスタンスを作成
      //console.log('boardInfo:'+JSON.stringify(boardInfo));
      const dataForBoardInfo = {
        board: boardInfo.board,
        nowTurn: boardInfo.nowTurn,
        //turnCount: boardInfo.turnCount,
        selection: boardInfo.selection,
        pieceStandNum: boardInfo.pieceStandNum,
        pieceStand: boardInfo.pieceStand,
      };
      
      // BoardInfoのコンストラクタが`{ BoardInfo: {...} }`という形式を期待しているため、それに合わせてデータを整形
      boardInstance = new BoardInfo({
        BoardInfo: dataForBoardInfo,
      });

      //this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "BoardInfoがクラスインスタンスでない場合、再構築する", boardInfo: boardInstance }] }));
      
      /*boardInstance = new BoardInfo({
        board: boardInfo.board,
        nowTurn: boardInfo.nowTurn,
        selection: boardInfo.selection,
        pieceStandNum: boardInfo.pieceStandNum,
        pieceStand: boardInfo.pieceStand,
        // 必要に応じて他のプロパティを追加
      });*/
      //boardInstance = new BoardInfo(boardInfo);
      /*boardInstance = new BoardInfo({
        moveDetails: boardInfo.moveDetails || null,
        boardSFEN: boardInfo.boardSFEN || null,
        BoardInfo: boardInfo.board, // オブジェクトのキーを修正しました
        pieceStandNum: boardInfo.pieceStandNum,
        pieceStand: boardInfo.pieceStand,
        nowTurn: boardInfo.nowTurn || this.state.nowTurn,
        isCheck: this.state.isCheck,
        isCheckmate: this.state.isCheckmate,
        winner: this.state.winner
      });*/

      if (!boardInstance.onPromoteConfirmCallback) {//boardInstance.onPromoteConfirmCallbackが存在しないなら再設定
        // コールバックを設定（再構築したインスタンスに対して）
        this.setupBoardInfoCallback(boardInstance);

        // デバッグ：コールバックが正しく設定されているか確認
        //console.log("boardInstance.onPromoteConfirmCallbackが存在しないなら再設定");
        //console.log("再構築後のコールバック:", !!boardInstance.onPromoteConfirmCallback);
        //console.log("再構築後のsetPromoteConfirmCallbackメソッド:", typeof boardInstance.setPromoteConfirmCallback);
      }
      
    

      // 選択状態を復元（存在する場合）
      if (boardInfo.selection) {
        boardInstance.selection = boardInfo.selection;
      }

      //boardInstance.setPromoteConfirmCallback(this.handlePromoteConfirm);
      //this.setupBoardInfoCallback(boardInstance);
      /*if (!this.state.boardInfo.onPromoteConfirmCallback) {
        console.log("コールバックが欠落・リセット中...");
        this.setupBoardInfoCallback();
      }*/
      //this.setupBoardInfoCallback(boardInstance); // ここで新しいインスタンスにコールバックを設定
      //this.setupBoardInfoCallback();
      //this.setState({ boardInfo: boardInstance });
      
      this.setState(prevState => {
        return {
          boardInfoHistory: [ ...prevState.boardInfoHistory,{ reason: "handleBoardClickでBoardInfoがクラスインスタンスでない場合、再構築するときに更新", boardInfo: boardInstance } ],
          boardInfo: boardInstance
        };
      });
    }

    // 念のため、呼び出し前にコールバックが存在するかチェック
    if (!this.state.boardInfo.onPromoteConfirmCallback) {
      //console.log("コールバックが欠落・リセット中...");
      this.setupBoardInfoCallback();
    }
  
    //const clickResult = boardInfo.boardClick(i, j,player);// BoardInfoインスタンスのboardClickメソッドを呼び出す・この呼び出しで boardInfo インスタンス内部の状態が更新される・戻り値clickResultに移動情報などがまとまっている
    //const clickResult = await boardInfo.boardClick(i, j, player);
    //const clickResult = await boardInstance.boardClick(i, j, player);
    const clickResult = await boardInstance.boardClick(i, j, player,this.state.boardSfenHistory ,this.state.moveSfenHistory);

    //const clickResult = await this.boardInfoInstance.boardClick(i, j, player);
    //console.log("clickResult:"+JSON.stringify(clickResult));
    //console.log("clickResult:",clickResult);
    //console.log("clickResult.moved_check:"+clickResult.moved_check);
    
    //console.log("clickResult.moveDetails:"+clickResult.moveDetails)
    //if(clickResult.moveDetails==undefined){
    /*if (!clickResult || clickResult.moveDetails === undefined) {
      console.log("選択したコマを動かさなかった場合・moveDetailsがundefined"); 
      this.resetSelection();//選択状態をリセット
      //return
    }*/

    try {
      //if( clickResult.move_status=="illegalMove" && aiMode){//aiモードで自殺手ならaiの手番をやり直す
      if( clickResult.move_status=="illegalMove" && aiMode && !this.state.shogiDebugMode){
        //console.log("aiモードで自殺手ならaiの手番をやり直す"); 
        //console.log("boardInfo:"+JSON.stringify(boardInfo));
        //console.log("boardInfo.selection:"+JSON.stringify(boardInfo.selection));
        //const EasyBoardData = this.state.boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
        //const EasyBoardData = boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
        //console.log("EasyBoardData:\n"+this.CreateEasyBoard(boardInfo.board));
        //console.log("boardInfoのseen:"+this.boardToSFEN(boardInfo.board));
        //this.aiAct(boardInfo)
        this.aiAct(boardInstance);
      }
    } catch (error) {
      console.error('エラーaiモードで自殺手ならaiの手番をやり直す:', error);
    }


    //console.log("clickResult.moveDetails:"+clickResult.moveDetails);
    if(clickResult!==undefined && clickResult.moved_check){//ちゃんとコマが移動すれば
      //新しいボードデータ作るためのデータを作成
      const game_data = {
        moveDetails: clickResult.moveDetails,
        boardSFEN: clickResult.boardSFEN,
        moveSFEN: clickResult.moveSFEN,
        BoardInfo: clickResult.BoardInfo,
        pieceStandNum: clickResult.pieceStandNum,
        pieceStand: clickResult.pieceStand,
        nowTurn: clickResult.nowTurn,
        isCheck: clickResult.isCheck, // 王手状態を結果に追加
        isCheckmate: clickResult.isCheckmate ,// 詰み状態
        isSennichite: clickResult.isSennichite, // 千日手状態
        winner: clickResult.winner,
        isGameset: clickResult.isGameset, // ゲームセット状態
      };
      
      const newBoardInfoInstance = new BoardInfo(game_data); // clickResult.newBoardState には、boardClick 後の BoardInfo 内部の最新状態が返される・これを基に、新しい BoardInfo インスタンスを生成して React の state を更新する
      //this.setupBoardInfoCallback(newBoardInfoInstance); // 新しいインスタンスにコールバックを設定
      /*if (!this.state.boardInfo.onPromoteConfirmCallback) {
        console.log("コールバックが欠落・リセット中...");
        this.setupBoardInfoCallback();
      }*/
      //const newBoardInfoInstance = boardInfo(game_data);
      //const newBoardInfoInstance = this.boardInfoInstance(game_data);
      this.setState(prevState => {
        let newMoveHistory;
        if (prevState.moveHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            newMoveHistory = [clickResult.moveDetails];
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            newMoveHistory = [...prevState.moveHistory, clickResult.moveDetails];
        }

        let newBoardSfenHistory;
        if (prevState.boardSfenHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            newBoardSfenHistory = [clickResult.boardSFEN];
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            newBoardSfenHistory = [...prevState.boardSfenHistory, clickResult.boardSFEN];
        }

        let newMoveSfenHistory;
        if (prevState.moveSfenHistory === undefined) { // prevState.moveHistory が undefined なら、新しい配列を作成して最初の要素として clickResult.moveDetails を入れる
            //newMoveSfenHistory = [clickResult.moveSFEN];
            newMoveSfenHistory = {
              move: [clickResult.moveSFEN],
              kingCheck: [clickResult.isCheck]
            };
        } else {
            // そうでなければ、既存の配列に clickResult.moveDetails を追加する
            //newMoveSfenHistory = [...prevState.moveSfenHistory, clickResult.moveSFEN]
            newMoveSfenHistory = {
              move: [...prevState.moveSfenHistory.move , clickResult.moveSFEN],
              kingCheck: [...prevState.moveSfenHistory.kingCheck, clickResult.isCheck]
            };
        }
        console.log("これこれnewMoveSfenHistory:"+JSON.stringify(newMoveSfenHistory))
        //console.log("this.state.boardSfenHistory:"+this.state.boardSfenHistory)
        //console.log("clickResult.boardSFEN:"+clickResult.boardSFEN)
        //console.log("this.state.moveHistory:"+this.state.moveHistory)
        
        //将棋デバッグモードがtrueならコマが動くか打った後にロールを自動でチェンジ
        if(this.state.shogiDebugMode){
          this.chengeRoleDebug()
        }



        return {
            boardInfoHistory: [ ...prevState.boardInfoHistory,{ reason: "handleBoardClickでコマが移動すれば更新", boardInfo: newBoardInfoInstance }],
            boardInfo: newBoardInfoInstance, // 新しいインスタンスでstateを更新
            moveHistory: newMoveHistory,     // 修正した moveHistory
            boardSfenHistory : newBoardSfenHistory,
            moveSfenHistory : newMoveSfenHistory,
            nowTurn: clickResult.nowTurn,    // BoardInfoインスタンスで手番を交代し取得して更新
            isCheck: clickResult.isCheck, // 王手状態を結果に追加
            isCheckmate: clickResult.isCheckmate, // 詰み状態
            isSennichite: clickResult.isSennichite, // 千日手状態
            isGameset: clickResult.isGameset, // ゲームセット状態
            winner: clickResult.winner,
        };
      }, () => {
        
        //打った最新の手の背景色を変える
        const board = document.getElementById('board');
        const square = board.querySelector(`button.square[data-i="${i}"][data-j="${j}"]`);
        square.classList.add('lastMoveByMe');

        if(clickResult.isGameset){
          console.log("ゲームセット")
          let winReason;
          if(clickResult.isCheckmate){
            winReason = "Tumi";
          } else if (clickResult.isSennichite.result === "sennichite") {
            winReason = "sennichite";
          } else if (clickResult.isSennichite.result === "oute_sennichite") {
            winReason = "oute_sennichite";
          } else {
            winReason = "unknown";
          }
          this.subscription.perform('game_set', {
            room_id: this.state.roomId,
            winReason: winReason, 
            winner: clickResult.winner,
          });

          /*
          //詰みで勝敗がついてたら
          if(clickResult.isCheckmate){
            //console.log("勝敗がついている")
            this.subscription.perform('game_set', {
              room_id: this.state.roomId,
              winReason: "Tumi", 
              winner: clickResult.winner,
            });
          }

          //千日手で勝敗がついてたら
          //isSennichite.result="no_sennichite";//千日手ではない
          //isSennichite.result="sennichite";//千日手でドロー
          //isSennichite.result="oute_sennichite" isSennichite.winner
          if(clickResult.isSennichite.result==="sennichite"){
              // 千日手の場合は引き分け
              this.subscription.perform('game_set', {
                room_id: this.state.roomId,
                winReason: "sennichite", 
                winner: clickResult.winner,
              });
          } else if (clickResult.isSennichite.result === "oute_sennichite") {
              //王手をかけ続けた側が反則負けとなるルール
              this.subscription.perform('game_set', {
                room_id: this.state.roomId,
                winReason: "oute_sennichite", 
                winner: clickResult.winner,
              });
          }else if(clickResult.isSennichite.result === "no_sennichite"){
              // 千日手でない場合は勝者の変更なし
          }*/
        }

        //console.log("moveHistory:"+this.state.moveHistory[0])
        // stateの更新が完了した後、WebSocketでサーバーに送信
        if (isConnected && this.subscription && clickResult.moved_check) { // 駒が動いた場合
          this.handleSwitchTurn({ // ShogiTimerが呼び出すメソッドではなく、RoomがActionCableに送信するメソッドを呼ぶ
            senteTime: this.shogiTimerRef.current?.getSenteTime(), // 現在の時間を取得して送る
            goteTime: this.shogiTimerRef.current?.getGoteTime(),   // getSenteTime/getGoteTime はShogiTimerで公開する必要がある
            activePlayer: clickResult.nowTurn, // 次の手番
            isPaused: false, // 駒を動かしたら一時停止を解除
            lastUpdateTime: Date.now()
          });
          //console.log("盤面状態が変更されました。サーバーに送信します。", newBoardInfoInstance.getBoardState());
          //getBoardState() を呼び出し、サーバーに送るためにプレーンなオブジェクトに変換
          this.subscription.board_update(
            //newBoardInfoInstance.getBoardState(),
            newBoardInfoInstance,
            clickResult.moveDetails
          )//,() => {
            //this.piece_move_sound()

        } else if (clickResult.moved_check) {
          console.warn("WebSocket接続が確立されていないため、盤面更新を送信できません。");
        }
      });
    }else if(clickResult===undefined){
      //console.log(`clickResultがundefined`);
      return "clickResultがundefined"
    }else if(!clickResult.moved_check){
      console.log(`選択状態などでclickResult.moved_checkがfalse:${clickResult.moved_check}`);
      /*return { 
        success: true, 
        reason: "piece_selected", 
        clickResult,
        selection: clickResult.selection || this.state.boardInfo.selection
      };*/
      return new Promise((resolve) => {
        let updatedBoardInfo
        /*this.setState(prevState => {
          // 更新後の boardInfo を事前に作成
          updatedBoardInfo = {
            ...prevState.boardInfo,
            board: clickResult.BoardInfo.board,
            nowTurn: clickResult.BoardInfo.nowTurn,
            pieceStand: clickResult.BoardInfo.pieceStand,
            pieceStandNum: clickResult.BoardInfo.pieceStandNum,
            selection: clickResult.BoardInfo.selection
          };

          return {
            boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "ボードのコマをマウスダウン時に更新", boardInfo: updatedBoardInfo }],
            boardInfo: updatedBoardInfo
          };
        //});
        }, () => {//setStateが完了した（Stateが反映された）後にここが実行される
        */
        const prevBoardInfo = this.state.boardInfo;

        updatedBoardInfo = {
          ...prevBoardInfo,
          board: clickResult.BoardInfo.board,
          nowTurn: clickResult.BoardInfo.nowTurn,
          pieceStand: clickResult.BoardInfo.pieceStand,
          pieceStandNum: clickResult.BoardInfo.pieceStandNum,
          selection: clickResult.BoardInfo.selection
        };

        this.setState(prevState => ({ boardInfoHistory: [ ...prevState.boardInfoHistory, { reason: "選択状態にしてboardInfo更新", boardInfo: updatedBoardInfo }] }));

        // state ではなく ref に保存
        this.boardInfoRef.current = updatedBoardInfo;
        //console.log("this.state.boardInfo・ボードのコマをマウスダウン時に更新:",updatedBoardInfo)

        
        // 呼び出し側の await handleBoardClick() にこのオブジェクトが返る
        resolve({ BoardInfo: updatedBoardInfo });

        //return { boardInfo: updatedBoardInfo };

      //});

      });
    }else{
      console.error(`その他エラー`);
      return "その他エラー"
    }
  }

  async pieceStandClick(piece) {
  //pieceStandClick(piece) {
    if(this.state.isCheckmate){ console.log("ゲームセットしているので操作できない"); return }//ゲームセット状態なら操作できないように
    const { boardInfo, isConnected, yourRole, aiMode } = this.state;

    // BoardInfoがクラスインスタンスでない場合、再構築する
    /*let boardInstance = boardInfo; // 元のboardInfoを変数に格納
    if (typeof boardInfo.pieceStandClick !== 'function') {
      console.log('pieceStandClick・BoardInfoインスタンスを再構築します');
      // 現在のデータから新しいBoardInfoインスタンスを作成
      //console.log('boardInfo:'+JSON.stringify(boardInfo));
      const dataForBoardInfo = {
        board: boardInfo.board,
        nowTurn: boardInfo.nowTurn,
        selection: boardInfo.selection,
        pieceStandNum: boardInfo.pieceStandNum,
        pieceStand: boardInfo.pieceStand,
      };
      boardInstance = new BoardInfo({ BoardInfo: dataForBoardInfo }); // BoardInfoのコンストラクタが`{ BoardInfo: {...} }`という形式を期待しているため、それに合わせてデータを整形
      this.setupBoardInfoCallback(boardInstance);// コールバックを設定（重要：再構築したインスタンスに対して）
      
      // デバッグ：コールバックが正しく設定されているか確認
      console.log("再構築後のコールバック:", !!boardInstance.onPromoteConfirmCallback);
      console.log("再構築後のsetPromoteConfirmCallbackメソッド:", typeof boardInstance.setPromoteConfirmCallback);
  
      // 選択状態を復元（存在する場合）
      if (boardInfo.selection) {
        boardInstance.selection = boardInfo.selection;
      }
      this.setState({ boardInfo: boardInstance });
    }

    // 念のため、呼び出し前にコールバックが存在するかチェック
    if (!this.state.boardInfo.onPromoteConfirmCallback) {
      console.log("コールバックが欠落・リセット中...");
      this.setupBoardInfoCallback();
    }*/

    console.log("pieceStandClickのthis.state.boardInfo",this.state.boardInfo);
    console.log("this.state.boardInfo.pieceStandClick(piece)に送るpiece",piece);
    //console.log("pieceStandClickのpiece:"+JSON.stringify(piece))
    //this.state.boardInfo.pieceStandClick(piece);
    const result = await this.state.boardInfo.pieceStandClick(piece);
    console.log("持ち駒pieceStandClickのresult:",result)

    if(result!==undefined && result.moved_check){//ちゃんとコマを打てたら
      // boardとnowTurnを新しい値で更新する
      this.setState(prevState => ({
        boardInfoHistory: [
          ...prevState.boardInfoHistory,{
            reason: "pieceStandClickでちゃんとコマを打てたら更新",
            boardInfo: result.BoardInfo   // ← 更新後の boardInfo を履歴に追加
          }
        ],
        boardInfo: {
          ...prevState.boardInfo,  // 既存のboardInfoを展開
          board: result.BoardInfo.board,         // 新しいboardに置き換え
          nowTurn: result.BoardInfo.nowTurn,        // 新しいnowTurnに置き換え
          pieceStand: result.BoardInfo.pieceStand,
          pieceStandNum: result.BoardInfo.pieceStandNum,
          selection: result.BoardInfo.selection
        }
      }, () => {
        console.log("変更後:",this.state.boardInfo)
      }));
    }else if(result===undefined){
      console.log(`持ち駒resultがundefined`);
    }else if(!result.moved_check){
      console.log(`持ち駒選択状態などでresult.moved_checkがfalse:${result.moved_check}`);
      return { 
        success: true, 
        reason: "piece_selected", 
        result: result,
        selection: result.selection || this.state.boardInfo.selection
      };
    }else{
      console.error(`その他エラー`);
    }
    /*moveDetails: clickResult.moveDetails,
    boardSFEN: clickResult.boardSFEN,
    BoardInfo: clickResult.BoardInfo,
    pieceStandNum: clickResult.pieceStandNum,
    pieceStand: clickResult.pieceStand,
    nowTurn: clickResult.nowTurn,
    isCheck: clickResult.isCheck, // 王手状態を結果に追加
    isCheckmate: clickResult.isCheckmate ,// 詰み状態
    winner: clickResult.winner*/
    return result
  }

  piece_move_sound(){
    const audio = new Audio(this.state.pieceMoveSoundPath);
    audio.volume = 0.8; // 無音で開始
    audio.play()
  }

  async aiAct(newBoardInfoInstance){
  //aiAct(newBoardInfoInstance){
    //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
    //CPUにSFEN文字列を渡したら、合法手を取り出してランダムに1つ選び、指し手として返す
    //const boardSfenString = this.boardToSFEN(boardInfo.board);
    //const piecesSfenString = this.piecesToSFEN(boardInfo.pieceStandNum);
    //const turnSfenString = this.turnToSFEN(boardInfo.nowTurn);
    const boardSfenString = this.boardToSFEN(newBoardInfoInstance.board);
    //console.log("newBoardInfoInstance:"+JSON.stringify(newBoardInfoInstance))
    const piecesSfenString = this.piecesToSFEN(newBoardInfoInstance.pieceStandNum);
    //const turnSfenString = this.turnToSFEN(newBoardInfoInstance.nowTurn);
    //const ai_turn="b"
    //const ai_turn = this.state.enemyRole === "先手" ? "w" : "b";//this.state.enemyRoleが"先手"だったらconst ai_turn="w"で、"後手"だったらconst ai_turn="b"に
    //const ai_turn = this.state.enemyRole === "先手" ? "w" : "b";//this.state.enemyRoleが"先手"だったらconst ai_turn="w"で、"後手"だったらconst ai_turn="b"に
    //const nowTurn = this.state.nowTurn === "先手" ? "w" : "b";//enemyRoleが"先手"だったらai_turn="w"で、"後手"だったらai_turn="b"に
    const nowTurn = this.state.nowTurn === "先手" ? "b" : "w";//enemyRoleが"先手"だったらai_turn="b"で、"後手"だったらai_turn="w"に

    const move_count=this.state.moveHistory.length+1;//手数・初期局面なら「1」//SFEN形式の手数は次に指す手の番号を表す。初期局面（先手番）: "...b - 1"  ← 1手目を指す前、先手が指した後（後手番）: "...w - 2"  ← 2手目を指す前  、後手が指した後（先手番）: "...b - 3"  ← 3手目を指す前・SFEN形式における手数は、初期局面では1で、後手の手番では1つ増えた数になる
    //const sfen = boardSfenString+" "+turnSfenString+" "+piecesSfenString+" 1";
    //const sfen = boardSfenString+" "+ai_turn+" "+piecesSfenString+" - "+move_count;
    const sfen = boardSfenString+" "+nowTurn+" "+piecesSfenString+" "+move_count;
    
    //const sfen = "9/1r3+P1b1/4+P1ppp/PPPP2PPP/9/pp1ppp1pp/PP+pP1P+p1P/1B5R1/4K4 b 2p 6" //K(後手の王が消えてるからetBestMoveFromSFEN(sfen)でnullになってしまう)
    //const sfen = "4k4/1r5b1/+P5ppp/P1PPPPPPP/9/pp3pppP/PP2+pPP2/3+p5/B8 w 2P2pr 11" //K(後手の王が消えてるからetBestMoveFromSFEN(sfen)でnullになってしまう)
    //const sfen = "4k4/1r3+P1b1/4+P1ppp/PPPP2PPP/9/pp1ppp1pp/PP+pP1P+p1P/1B5R1/4K4 b 2p 6"
    //console.log("sfen:"+sfen); // 例：sfen:lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1

    let move;
    try {
        const response = await fetch("http://168.138.215.52:5000/move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                //sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
                sfen: sfen,
                think_time: 1000,
            }),
        });
        if (!response.ok) {
            throw new Error("HTTP error " + response.status);
        }
        const response_data = await response.json();
        console.log("AIの応答:", response_data);
        move=response_data.move
        //let move = getBestMoveFromSFEN(sfen); //自作cpu
        //let move ="P*2d"
        console.log("CPUの差し手・move:"+move);//例：6g6f
        const regex = /^[1-9][a-i][1-9][a-i](?:\+)?$/;
        let i=0
        /*if (!regex.test(move) && 10>i) {
          console.warn(`無効なSFEN move: "${move}", 再試行中…`);
          i++;
          //return getBestValidMove(sfen);
          return getBestMoveFromSFEN(sfen);
          //if(i>10){ break}
        }*/
        
        /*
        while (!regex.test(move) && i < 10) {
          console.warn(`無効なSFEN move: "${move}", 再試行中…`);
          move = getBestMoveFromSFEN(sfen); // ← return せず代入
          i++;
        }
        */

        //console.log("最終決定したCPUの手: " + move);
        //console.log("boardInfo:"+JSON.stringify(boardInfo.pieceStandNum))
        //const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/P1PPPPPPP/1B5R1/LNSGKGSNL b - 1";

        //const {i, j} = this.sfenPosToCoord(move)
        const data = this.sfenMoveToCoords(move)
        //const data = this.sfenMoveToCoords(newBoardInfoInstance)
        //console.log("data", data);
        const { from: { i: fromI, j: fromJ }, to: { i: toI, j: toJ } } = data;
        //console.log(fromI, fromJ); // 7, 8
        //console.log(toI, toJ);     // 8, 6
        //this.yourRole = this.state.yourRole === "先手" ? "後手" : "先手";
        //console.log("あ："+this.state.yourRole)
        //this.setState(prevState => ({ yourRole: prevState.yourRole === "先手" ? "後手" : "先手" }));
              
        this.setState(
          prevState => ({
            //yourRole: prevState.yourRole === "先手" ? "後手" : "先手"
          }),
          () => {
            //console.log("い：" + this.state.yourRole); // 更新後に出力
            //this.handleBoardClick(fromI, fromJ)
            if (move.includes("*")) {
              console.log("*があるから持ち駒を打つ");
              //const moveTest = "P*2d"
              const pieceCode = move.split("*")[0]; // "*" の前が駒種
              const pieceMap = { P: "歩", L: "香", N: "桂", S: "銀", G: "金", B: "角", R: "飛" };
              let pieceName = pieceMap[pieceCode]
              //let piece ="歩"
              //this.state.boardInfo.pieceStand["後手"][i]
              //console.log("this.state.boardInfo.pieceStand['後手'][i]"+JSON.stringify(this.state.boardInfo.pieceStand["後手"][0]))
              console.log("this.state.boardInfo.pieceStand['後手']"+JSON.stringify(this.state.boardInfo.pieceStand["後手"]))
              const foundPiece = this.state.boardInfo.pieceStand[this.state.enemyRole].find(p => p.name === pieceName); // name === "歩" のオブジェクトを探す
              console.log("foundPiece:", foundPiece); // => {"owner":"後手","name":"歩","dx":[0],"dy":[-1],"dk":[1]}
              this.pieceStandClick(foundPiece)
              /*
              const pieceCode = move.split("*")[0]; // "*" の前が駒種
              const pieceMap = { P: "歩", L: "香", N: "桂", S: "銀", G: "金", B: "角", R: "飛" };
              let pieceName = pieceMap[pieceCode]
              //let piece ="歩"
              this.state.boardInfo.pieceStand["後手"][i]
              this.pieceStandClick()
              */
            }else{
              this.handleBoardClick(fromI, fromJ, this.state.enemyRole)
            }
            //this.handleBoardClick(fromJ, fromI)
            //this.handleBoardClick(0, 3)
            
            setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
              //console.log("アクト")
              //this.handleBoardClick(toI, toJ)
              this.handleBoardClick(toI, toJ, this.state.enemyRole)
              //this.handleBoardClick(toJ,toI)
              //this.handleBoardClick(1, 3)
              //this.handleBoardClick(3, 1)
            }, 1000);
            

          });
        //console.log("い："+this.state.yourRole)
        //this.setState((prevState) => ({ nowTurn: prevState.nowTurn === "先手" ? "後手" : "先手" }));
        //this.setState((prevState) => ({ yourRole: prevState.yourRole === "先手" ? "後手" : "先手" }));

        //console.log("pos", pos);
        //console.log("i, j:"+i+","+j);
    /*
        const matches = str.match(/\d/g);
        let a = null;
        let b = null;
        if (matches && matches.length >= 1) {
            a = parseInt(matches[0], 10);
        }
        if (matches && matches.length >= 2) {
            b = parseInt(matches[1], 10);
        }
        console.log("a , b :" +a+","+b);
        handleBoardClick(a, b)
        */
      //};
        //return data;
    } catch (err) {
        console.error("エラー:", err);
    }
  }

  deleteData = async () => { // async/await を使用
    console.log('データを削除する');
    const { roomId } = this.state; // stateからroomIdを取得
    if (!roomId) {
      console.log("ルームIDが不明");
      return;
    }
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch(`/shogi/${roomId}/destroy`, { // await を使う
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
      });

      const data = await response.json(); // await を使う
      const MATCH_STATUS_KEY = 'shogi_matching_status';
      const MATCH_ROOM_ID_KEY = 'shogi_matched_room_id';
      const MATCH_PLAYER_ROLE_KEY = 'shogi_player_role';
      const SESSION_ID_KEY = 'shogi_session_id'; // localStorageにセッションIDを保存するキー
      localStorage.removeItem(MATCH_STATUS_KEY);
      localStorage.removeItem(MATCH_ROOM_ID_KEY);
      localStorage.removeItem(MATCH_PLAYER_ROLE_KEY);

      if (response.ok) {
        console.log('削除成功:', data.message);
        //window.location.href = '/'; // トップページへ戻る
      } else {
        console.error('削除失敗:', data.error || data.message);
      }
    } catch (error) {
      console.error('リクエストエラー:', error);
    }
  };

  //チャット入力フィールドの値が変更された時にstateを更新
  handleChatInputChange(event) {
    this.setState({ currentChatMessage: event.target.value });
  }
  //チャットフォームが送信された時（「送信」ボタンクリックまたはEnterキー）
  handleChatSubmit(event) {
    event.preventDefault(); // フォームのデフォルト送信（ページリロード）を防止
    const { currentChatMessage } = this.state;
    if (currentChatMessage.trim() === '') {
      return; // 空のメッセージは送信しない
    }
    if (this.subscription && this.state.isConnected) {
      //非同期送信: WebSocketを通じてサーバーへメッセージを送信
      this.subscription.sendChatMessage(currentChatMessage);
      this.setState({ currentChatMessage: '' }); // 入力フィールドをクリア

      setTimeout(() => {// 少し遅延させてDOMの更新を待ってチャットをスクロールして一番下のメッセージを表示
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }, 100);
      console.log("チャットメッセージを送信しました:", currentChatMessage);
    } else {
      console.warn("WebSocket接続が確立されていないため、メッセージを送信できません。");
      alert("チャットサーバーに接続されていません。");
    }
  }
  //チャットの開閉の表示を切り替えるメソッド
  toggleChat() {
    this.setState(prevState => ({
      isChatOpen: !prevState.isChatOpen // 現在の状態を反転させる
    }));
  }

  rematch(){
    //console.log("再戦する");
    this.subscription.rematch_send(this.state.yourRole);
    this.setState({ rematch_sended: true ,decline_received:false}); 
  }
  acceptRematch() {
    //console.log("再対戦を承諾しました。");
    this.setState({ rematchRequest: false, isCheckmate: false, winner: "yet" }); //再戦リクエストモーダルを非表示、勝敗をついていないことにし、勝者もyetに
    // サーバーに承諾したことを通知するAction Cableメッセージを送る
    this.subscription.perform('rematch_accept', {
      room_id: this.state.roomId // キーが'room_id'
    });
  }
  declineRematch() {
    console.log("再対戦を拒否しました。");
    //window.location.href = '/';
    // サーバーに拒否したことを通知するAction Cableメッセージを送る
    this.setState({ rematchRequest: false});//再戦リクエストモーダルを非表示
    this.subscription.perform('decline_rematch', {
        yourRole: this.state.yourRole, // キーが'yourRole'
        room_id: this.state.roomId,   // キーが'room_id'
    });
  }

  // 時間切れ時に実行されるコールバック関数
  handleActionCableMessage(data) {
    //console.log("handleActionCableMessage(data):", data); // JSON.stringify(data) はオブジェクトを見にくくするので直接 data をログに出す
    switch (data.type) {
      case 'initial_timer_state':
        // ShogiTimerに初期状態を渡す (ShogiTimerが自身で状態を更新するように)
        // ShogiTimerRefがまだ利用できない場合、状態をバッファする
        if (this.shogiTimerRef.current) {
          this.shogiTimerRef.current.initializeTimerState(data.data);
          // 適用したらバッファをクリア（念のため）
          this.setState({ bufferedInitialTimerState: null });
        } else {
          //console.warn("ShogiTimerRef.current is null for initial_timer_state. Buffering data.", data.data);
          this.setState({ bufferedInitialTimerState: data.data });
        }
        break;
      case 'timer_updated':
      case 'turn_switched':
      case 'timer_toggled':
      case 'timer_reset':
        // ShogiTimerにサーバーからの最新の状態を渡し、UIを更新させる
        if (this.shogiTimerRef.current) {
          this.shogiTimerRef.current.syncTimerState(data.data);
        }
        break;
      // 他のゲームイベント (例: 駒の移動、チャットなど) のハンドリング
      default:
        //console.log("Unknown message type:", data.type);
    }
  }
  handleTimeUp(player) {
    //console.log(`${player} の時間切れです！ゲームを終了します。`);
    const winner = player === 'sente' ? '後手' : '先手';//値がsenteならgoteにして、goteならsenteに
    this.subscription.perform('game_set', {
      room_id: this.state.roomId,
      winReason: "TimeUp", // キーが'yourRole'
      winner: winner,
    });
  }
  // ShogiTimer の startTimer メソッドを呼び出す
  handleStartTimer = () => {
    //console.log("handleStartTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.start(); // ShogiTimer で公開した 'start' メソッドを呼び出す
    }
       // this.shogiTimerInstance が null でないことを確認
  };
  // ShogiTimer の pauseTimer メソッドを呼び出す
  handlePauseTimer = () => {
    //console.log("handlePauseTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.pause(); // ShogiTimer で公開した 'pause' メソッドを呼び出す
    }
  };
  // ShogiTimer の toggleStartPause メソッドを呼び出す
  handleToggleTimer = () => {
    //console.log("handleToggleTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.toggle(); // ShogiTimer で公開した 'toggle' メソッドを呼び出す
    }
  };
  // ShogiTimer の switchTurn メソッドを呼び出す
  handleSwitchTurn = () => {
    //console.log("handleSwitchTurn呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.switchTurn(); // ShogiTimer で公開した 'switchTurn' メソッドを呼び出す
    }
  };
  // ShogiTimer の resetTimer メソッドを呼び出す
  handleResetTimer = () => {
    console.log("handleResetTimer呼び出された"+JSON.stringify(this.shogiTimerRef.current))
    if (this.shogiTimerRef.current) {
      this.shogiTimerRef.current.reset(); // ShogiTimer で公開した 'reset' メソッドを呼び出す
    }
  };

  gameFinishTest = () => {
    this.setState({ isCheckmate: true, winner:"あなた" });
    this.handleTimeUp(this.state.yourRole)
  };

  debugModeOn = () => {
    if(this.state.debugMode){
      this.setState({ debugMode: false });
    }else if(!this.state.debugMode){
      this.setState({ debugMode: true });
      setTimeout(() => {// 少し遅延させてDOMの更新を待ってチャットをスクロールして一番下のメッセージを表示
        const debugArea = document.getElementById('debugArea');// ドラッグしたい要素を取得
        if (debugArea) {
            new Draggable(debugArea);// Draggable.js のインスタンスを作成し、要素をドラッグ可能にする// 'new Draggable()' の引数にドラッグ対象の要素を渡します。
            /*new Draggable(debugArea, {
              handle: '.debug-handle',
              //draggable: '.debug-content', // 必要なら指定
              distance: 5  // 5px 以上動かないとドラッグ開始しない
            });*/

            //中をドラッグしてコピーなどできるようにする
            const content = debugArea.querySelector('.debug-content');
            //Draggable にイベントを渡さない
            content.addEventListener('mousedown',(e) => {
                e.stopPropagation();
              },
              true //capture フェーズ
            );
            content.addEventListener('mousemove',(e) => {
                e.stopPropagation();
              },
              true
            );
        }
      }, 100);
    }
  };
  //stateのshogiDebugModeのtrueとfalseの切り替えメソッド
  handleShogiDebugModeChange = (e) => {
    this.setState({ shogiDebugMode: e.target.checked });
  };
  chengeRoleDebug(){
    //setStateを呼び出す前に、nowTurnとyourRoleを決定する
    let newNowTurn;

    // yourRole に応じてyourRoleとenemyRoleを決定・もしthis.stateが既に存在し、yourRoleの値が格納されているなら、それを使う・ここでは、新しい対局の開始を想定して、this.propsか何かしらの初期値からyourRoleが渡されると仮定
    let newYourRole;
    let newEnemyRole;
    if (this.state.yourRole === "先手") {
      newYourRole= "後手"
      newEnemyRole = "先手";
    } else {
      newYourRole= "先手"
      newEnemyRole = "後手";
    }
    // 最終的な状態をセット
    this.setState({
      yourRole: newYourRole,
      enemyRole: newEnemyRole,
    });
  }

  aiTest(){
    //console.log("a")
    //const boardInfo = this.state.boardInfo
    const { boardInfo, } = this.state;
    //const sfenString = this.convertToSfen(boardInfo.board);
    
    const boardSfenString = this.boardToSFEN(boardInfo.board);
    const piecesSfenString = this.piecesToSFEN(boardInfo.pieceStandNum);
    const turnSfenString = this.turnToSFEN(boardInfo.nowTurn);
    
    //const sfen = sfenString+" w - 1";
    const sfen = boardSfenString+" "+turnSfenString+" "+piecesSfenString+" 1";
    const move = getBestMoveFromSFEN(sfen);
    //const move = getBestMoveFromSFEN(sfenString);
    //console.log("boardInfo:"+JSON.stringify(boardInfo.board))
    //console.log("boardInfo:"+JSON.stringify(boardInfo))
    //console.log("boardInfo:"+JSON.stringify(boardInfo.pieceStandNum))

    
    //console.log(sfen); // lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL
    //const sfen = "lnsgkgsnl/1r5b1/p1ppppppp/9/9/9/P1PPPPPPP/1B5R1/LNSGKGSNL b - 1";
    //console.log("bestmove", move);
    // 例: "bestmove 7g7f"

    //7g7fのような表記は SFEN表記（座標ベースの記法）マス目の対応・7g → (7筋, g段)、7f → (7筋, f段)・段は「a=1段, b=2段 ... i=9段」に対応するので、g = 7段f = 6段よって「7g7f」 = 7筋7段の駒を 7筋6段へ動かす
    //平手初期局面の盤上のSFEN文字列は「lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL」
    //手番・1文字で表記し、先手は「b」、後手は「w」
    //持ち駒「(先手の持ち駒)(後手の持駒)」の形式で表記する。どちらも持ち駒がないときはハイフン(-)と表記する。持ち駒は駒の種類+その枚数(1枚の場合は省略)で表記する。例として先手側が銀１枚歩２枚、後手側が角１枚歩３枚であれば、「S2Pb3p」と表記する。
    //手数・次の指し手の手数をそのまま数字で記載する。初期局面なら「1」となる。

  }
  /**
   * 将棋盤の情報をSFEN形式の文字列に変換します。
   * @param {Array<Array<Object>>} board - 将棋盤の2次元配列。
   * @returns {string} SFEN文字列。
   */
  boardToSFEN(board) {
    //console.log("board: "+JSON.stringify(board))
    const pieceMap = {
      "歩": "P",
      "香": "L",
      "桂": "N",
      "銀": "S",
      "金": "G",
      "角": "B",
      "飛": "R",
      "王": "K",
      "玉": "k",
      "と": "+P",
      "竜": "+R",
      "馬": "+B",
      "成銀": "+S",
      "成桂": "+K",
      "成香": "+L",
    };

    return board.map(row => {
      let sfenRow = "";
      let emptyCount = 0;

      row.forEach(cell => {
        if (!cell || !cell.name) {
          // 空マス
          emptyCount++;
        } else {
          // 空マスを数字に変換
          if (emptyCount > 0) {
            sfenRow += emptyCount;
            emptyCount = 0;
          }
          let piece = pieceMap[cell.name];
          //console.log("piece: "+piece)
          if (!piece) throw new Error(`Unknown piece: ${cell.name}`);
          // 後手は小文字に
          if (cell.owner === "後手") {
            piece = piece.toLowerCase();
          }
          sfenRow += piece;
        }
      });

      // 残りの空マスを数字に
      if (emptyCount > 0) {
        sfenRow += emptyCount;
      }

      return sfenRow;
    }).join("/");
  }
  piecesToSFEN(pieces) {
    const map = { "歩": "P", "香": "L", "桂": "N", "銀": "S", "金": "G", "角": "B", "飛": "R" };
    
    let sfen = "";

    // 先手（大文字）
    for (const [jp, en] of Object.entries(map)) {
      const count = pieces["先手"][jp];
      if (count > 0) {
        sfen += (count > 1 ? count : "") + en;
      }
    }

    // 後手（小文字）
    for (const [jp, en] of Object.entries(map)) {
      const count = pieces["後手"][jp];
      if (count > 0) {
        sfen += (count > 1 ? count : "") + en.toLowerCase();
      }
    }

    return sfen === "" ? "-" : sfen;
  }
  turnToSFEN(turn){
    if(turn=="先手"){
      return "w"
    }else if(turn=="後手") {
      return "b"
    }
  }
  // SFEN位置を (x, y) の座標に変換
  sfenPosToCoord(pos) {
    const file = parseInt(pos[0], 10); // 筋 (9〜1)
    const rank = pos[1];              // 段 (a〜i)

    // y = 9筋を0に
    const j = 9 - file;

    // x = a段を0に
    const i = rank.charCodeAt(0) - "a".charCodeAt(0);

    return { i, j };
  }
  //将棋盤を左上から0,0、その右のマスが0,1のような座標表記とした時に、2h2gなどSFEN文字列を座標表記に書き換えるメソッド
  // 移動を座標変換
  sfenMoveToCoords(sfenMove) {
    const from = sfenMove.slice(0, 2);
    const to = sfenMove.slice(2, 4);
    return {
      from: this.sfenPosToCoord(from),
      to: this.sfenPosToCoord(to)
    };
  }

  //差し手一覧から過去の盤面に戻せる
  backHistory(History,index){
    //if ( !this.state.isCheckmate ){ return } //試合終了してないならまだ差し手履歴からボードを更新できないように
    
    //moveHistorySelectedIndex
    //console.log("index: "+index)

    //console.log("backHistory:"+History)
    // 利用例
    //const sfen = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL w - 1';
    const forBoardInfoData = this.parseSFEN(History);
    //const forBoardInfoData = this.parseSFEN(sfen);
    //console.log("おきんたま:"+JSON.stringify(forBoardInfoData));
    //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
    const newBoardInfoInstance = new BoardInfo(forBoardInfoData);

    this.setState({
      boardInfo: newBoardInfoInstance,
      moveHistorySelectedIndex: index
      //moveHistory: moveHistory_redis,
      //nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
      //isLoading: false,
      //loadingMessage: "",
    });
  }

  //SFEN文字列をBoardInfoに渡すデータに変形
  // 駒種から動きパターンを定義（先手視点：dy=-1 が前進）
  movePatterns = {
    '歩': { dx: [0],        dy: [-1],                       dk: [1] },
    '香': { dx: [0],        dy: [-1],                       dk: [10] },
    '桂': { dx: [-1, 1],    dy: [-2, -2],                   dk: [1, 1] },
    '銀': { dx: [-1, -1, 1, 1, 0], dy: [-1, 1, 1, -1, -1],   dk: [1, 1, 1, 1, 1] },
    '金': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] },
    '王': { dx: [-1, -1, -1, 0, 1, 1, 1, 0], dy: [-1, 0, 1, 1, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1, 1, 1] },
    '角': { dx: [-1, -1, 1, 1], dy: [-1, 1, 1, -1],           dk: [10, 10, 10, 10] },
    '飛': { dx: [-1, 0, 1, 0],   dy: [0, 1, 0, -1],         dk: [10, 10, 10, 10] },
    // 成り駒
    'と': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // と金＝金
    '成香': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成香＝金
    '成桂': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成桂＝金
    '成銀': { dx: [-1, -1, 0, 1, 1, 0], dy: [-1, 0, 1, 0, -1, -1], dk: [1, 1, 1, 1, 1, 1] }, // 成銀＝金
    '馬': { 
      dx: [-1, -1, 1, 1, -1, -1, 1, 1], 
      dy: [-1, 1, 1, -1, 0, 1, 0, -1], 
      dk: [10, 10, 10, 10, 1, 1, 1, 1] 
    }, // 馬＝角＋王の縦横一歩
    '竜': { 
      dx: [-1, 0, 1, 0, -1, -1, 1, 1], 
      dy: [0, 1, 0, -1, -1, 1, 1, -1], 
      dk: [10, 10, 10, 10, 1, 1, 1, 1] 
    }  // 竜＝飛＋王の斜め一歩
  };
  // SFEN文字 → 駒名マッピング
  pieceNameMap = {
    p: '歩', l: '香', n: '桂', s: '銀', g: '金',
    k: '王', b: '角', r: '飛',
    '+p': 'と', '+l': '成香', '+n': '成桂', '+s': '成銀',
    '+b': '馬', '+r': '竜'
  };
  /**
   * SFEN文字列を解析し、ボード情報オブジェクトを返す
   * @param {string} sfen - 例: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/7P1/PPPPPPP1P/1B5R1/LNSGKGSNL w - 1'
   *
  */
  parseSFEN(sfen) {
    const [boardPart, activeSide, standInfo] = sfen.split(' ');
    const ranks = boardPart.split('/');
    const board = ranks.map((rank, i) => {
      const row = [];
      for (let j = 0; j < rank.length; j++) {
        //console.log("rank:"+rank)
        let ch = rank[j];
        if (ch === "+") {// 成駒（+駒）の場合
            j++; // 次の文字を読み込む
            ch = "+" + rank[j]; // 例: "+p"
        }
        //console.log("ch:"+ch)
        if (/\d/.test(ch)) {
          // 空マスを n 個追加
          const count = parseInt(ch, 10);
          for (let k = 0; k < count; k++) row.push({});
        } else {
          // 駒文字。大文字＝先手, 小文字＝後手
          const isUpper = ch === ch.toUpperCase();
          const key = ch.toLowerCase();
          //console.log("key:"+key)
          const owner = isUpper ? '先手' : '後手';
          const name  = this.pieceNameMap[key];
          //console.log("name:"+name)
          const { dx, dy, dk } = this.movePatterns[name];
          row.push({ owner, name, dx, dy, dk });
        }
      }
      return row;
    });

    // 持駒情報（この例では '-' のためすべて 0）
    const emptyStandNum = { 歩: 0, 香: 0, 桂: 0, 銀: 0, 金: 0, 角: 0, 飛: 0 };
    const pieceStandNum = { 先手: { ...emptyStandNum }, 後手: { ...emptyStandNum } };
    const emptyStand = Array(9).fill({}); 
    const pieceStand = { 先手: emptyStand.slice(), 後手: emptyStand.slice() };

    // セレクション初期状態
    const boardSelectInfo = Array(9).fill(null)
      .map(() => Array(9).fill(''));
    const pieceStandSelectInfo = {
      先手: Array(9).fill('持駒'),
      後手: Array(9).fill('持駒')
    };

    /*return {
      board,
      pieceStandNum,
      pieceStand,
      nowTurn: activeSide === 'b' ? '先手' : '後手',
      selection: {
        boardSelectInfo,
        isNow: false,
        state: false,
        before_i: null,
        before_j: null,
        pieceStandSelectInfo,
        pieceStandPiece: {}
      }
    };*/
    return {
      "BoardInfo":{
        board,
        pieceStandNum,
        pieceStand,
        nowTurn: activeSide === 'b' ? '先手' : '後手',
        selection: {
          boardSelectInfo,
          isNow: false,
          state: false,
          before_i: null,
          before_j: null,
          pieceStandSelectInfo,
          pieceStandPiece: {}
        }
      }
    };
  }

  //見やすいボード情報を作る
  CreateEasyBoard(board){
      const newBoard = board.map(row =>
          row.map(cell =>
              cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」"
          )
      );
      // []ごとに改行して表示
      const EasyBoard = newBoard.map(row => row.join(", ")).join("\n");
      return EasyBoard
  }

  //さまざまな局面にボードデータを編集
  debugChengeBoard( caseName ){ 

    const boardDataFromServer={
      "moveHistory":["先手3八飛"],
      "boardSfenHistory":["4k4/9/9/1r7/9/9/9/6R2/4K4 w - 1"],
      "moveSfenHistory":{"move":["2h2g"],"kingCheck":[false]},
      "BoardInfo":{
        "board":[
          [{},{},{},{},{"owner":"後手","name":"王","dx":[-1,-1,-1,0,1,1,1,0],"dy":[-1,0,1,1,1,0,-1,-1],"dk":[1,1,1,1,1,1,1,1]},{},{},{},{}],
          [{},{},{},{},{},{},{},{},{}],
          [{},{},{},{},{},{},{},{},{}],
          [{},{"owner":"後手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],"dk":[10,10,10,10]},{},{},{},{},{},{},{}],
          [{},{},{},{},{},{},{},{},{}],
          [{},{},{},{},{},{},{},{},{}],
          [{},{},{},{},{},{},{},{},{}],
          [{},{},{},{},{},{},{"owner":"先手","name":"飛","dx":[-1,0,1,0],"dy":[0,1,0,-1],"dk":[10,10,10,10]},{},{}],
          [{},{},{},{},{"owner":"先手","name":"王","dx":[-1,-1,-1,0,1,1,1,0],"dy":[-1,0,1,1,1,0,-1,-1],"dk":[1,1,1,1,1,1,1,1]},{},{},{},{}]
        ],
        "pieceStandNum":{
          "先手":{"歩":0,"香":0,"桂":0,"銀":0,"金":0,"角":0,"飛":0},
          "後手":{"歩":0,"香":0,"桂":0,"銀":0,"金":0,"角":0,"飛":0}
        },
        "pieceStand":{
          "先手":[{},{},{},{},{},{},{},{},{}],
          "後手":[{},{},{},{},{},{},{},{},{}]
        },
        "nowTurn":"先手",
        "selection":{
          "boardSelectInfo":[
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""],
            ["","","","","","","","",""]
          ],
          "isNow":false,
          "state":false,
          "before_i":null,
          "before_j":null,
          "pieceStandSelectInfo":{
            "先手":["持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒"],
            "後手":["持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒","持駒"]},
          "pieceStandPiece":{}}
      },
      "nowTurn":"後手",
      "room_id":"ai_ffc1b87e-f0b7-4be1-abe8-11e765c1a918",
      "game_id":"","action":"board_broadcast_and_store"
    }
    
    if(caseName=="default"){
      console.log("初期局面に変更")
      boardDataFromServer.BoardInfo.board=[
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
    }else if(caseName=="tumi"){
      console.log("詰みの局面に変更")
      boardDataFromServer.BoardInfo.board=[
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
      ];
      boardDataFromServer.BoardInfo.pieceStandNum = {
          "先手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 2, "角": 0, "飛": 0 },
          "後手": { "歩": 0, "香": 0, "桂": 0, "銀": 0, "金": 2, "角": 0, "飛": 0 }
      };
      boardDataFromServer.BoardInfo.pieceStand = {
          "先手": [new GoldGeneral("先手"), new GoldGeneral("先手"),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
          "後手": [new GoldGeneral("後手"), new GoldGeneral("後手"),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
      };
    }else if(caseName=="nari"){
      console.log("成りの局面に変更")
      boardDataFromServer.BoardInfo.board=[
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
    }else if(caseName=="sennichite"){
      console.log("千日手の局面に変更")
    }else if(caseName=="oute_sennichite"){
      console.log("王手千日手の局面に変更")
      boardDataFromServer.BoardInfo.board=[
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
    }else if (caseName=="uchifuzume"){
        console.log("打ち歩詰めの局面に変更")

        boardDataFromServer.BoardInfo.board=[
              [new King("後手"), new Blank(), new GoldGeneral("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
              [new GoldGeneral("先手"), new Blank(), new Blank(), new Blank(), new Blank(),new Blank() , new Blank(), new Blank(), new Blank()],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
              [new Blank(), new Blank(), new Rook("先手"), new Blank(), new Blank(), new Blank(), new Blank(), new Rook("後手"), new Blank()],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new GoldGeneral("後手")],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
              [new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new GoldGeneral("後手"), new Blank(), new King("先手")]
        ];
        boardDataFromServer.BoardInfo.pieceStandNum = {
            "先手": { "歩": 1, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 },
            "後手": { "歩": 1, "香": 0, "桂": 0, "銀": 0, "金": 0, "角": 0, "飛": 0 }
        };
        boardDataFromServer.BoardInfo.pieceStand = {
            "先手": [new Pawn("先手"), new Blank(),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()],
            "後手": [new Pawn("後手"), new Blank(),new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank(), new Blank()]
        };
    } 

    //console.log("ActionCableのboard_update")
    if (this.state.nowTurn===this.state.yourRole) {
      console.log("piece_move_sound");
      this.piece_move_sound()
    }
    //const boardDataFromServer = data.new_board_data; // サーバーから来たプレーンなデータ
    let moveHistory_redis = boardDataFromServer.moveHistory.filter(Boolean); //moveHistoryを取り出し ["後手8六と"]・filter(Boolean)で空文字列の要素を除去する (先頭のカンマによる空要素のため)
    let boardSfenHistory_redis = boardDataFromServer.boardSfenHistory.filter(Boolean); 
    //let moveSfenHistory_redis = boardDataFromServer.moveSfenHistory.filter(Boolean); 
    const turnCount = boardSfenHistory_redis.length;//現在の手数
    console.log("これだあああdata.moveSfenHistory:" + JSON.stringify(boardDataFromServer.moveSfenHistory) );
    console.log("これだあああboardDataFromServer:" + JSON.stringify(boardDataFromServer) );

    if (boardDataFromServer) {
      //console.log("boardDataFromServer:"+JSON.stringify(boardDataFromServer))
      //サーバーから受け取ったデータ（プレーンオブジェクト）を引数に渡し、新しいBoardInfoインスタンスを生成
      const newBoardInfoInstance = new BoardInfo(boardDataFromServer);
      console.log("redisからのデータnewBoardInfoInstanceを取得時(盤面更新後)boardInfoを更新")
      this.setState(prevState => ({
        boardInfo: newBoardInfoInstance,
        moveHistory: moveHistory_redis,
        boardSfenHistory: boardSfenHistory_redis,
        moveSfenHistory: boardDataFromServer.moveSfenHistory,
        turnCount: turnCount,
        nowTurn: newBoardInfoInstance.nowTurn, // BoardInfoのturnをstateに反映
        isLoading: false,
        loadingMessage: "",
        boardInfoHistory: [ ...prevState.boardInfoHistory,{reason: "shogi_game_channel.rbのboard_broadcast_and_storeメソッドのActionCable.server.broadcastでサブスクライバー全員がデータ受け取り、新しくBoardInfoインスタンス作ってstateのboardデータ更新", boardInfo: newBoardInfoInstance } ]
      }), () => {
        if( this.state.aiMode && this.state.enemyRole==this.state.nowTurn && !this.state.isCheckmate && !this.state.shogiDebugMode){
          console.log("initializeRoomのreceivedのdata=board_updateのaiAct")
          console.log("this.state.aiMode:"+JSON.stringify(this.state.aiMode))
          this.aiAct(newBoardInfoInstance)
        }
      });
    }
  }

  render() {
    const { logoPath,gamebackPath,gameBgmPath,loadingimgPath, boardInfo, gameInfo, gameRoomData, moveHistory, boardSfenHistory, moveHistorySelectedIndex, nowTurn, isConnected, isLoading, loadingMessage, chatMessages, currentChatMessage, isChatOpen, yourRole, enemyRole, isCheck, isCheckmate,isGameset,winner, winReason,rematch_sended,rematchRequest,decline_received,gameStatus, timeUpPlayer,debugMode ,aiMode ,audienceUser, railsEnv} = this.state;
    const roomId = this.state.roomId; // renderメソッド内でstateからroomIdを取得

    // Action Cable の送信メソッド群を ShogiTimer に渡すオブジェクトを作成・gameChannel がまだ null の可能性があるので ?. (オプショナルチェイニング) を使用
    const sendActions = {
      sendToggleTimer: (...args) => this.subscription?.sendToggleTimer(...args),
      sendSwitchTurn: (...args) => this.subscription?.sendSwitchTurn(...args),
      sendResetTimer: (...args) => this.subscription?.sendResetTimer(...args),
    };

    const { t } = this.props;

    //senteだったら"先手"に、goteだったら"後手"に

    setTimeout(() => {// 少し遅延させてスクロールさせてチャットの一番下のメッセージを表示
      if (document.getElementById('chat-messages') && document.getElementById('chat-messages').scrollHeight !== undefined){
        document.getElementById('chat-messages').scrollTop = document.getElementById('chat-messages').scrollHeight;
      }
    }, 100);

    //背景・tailwindのclass名を変数化して再利用
    const myDarkGradient = "bg-gradient-to-br from-black via-gray-800 to-gray-900";

    //見やすいボードのデータを作る
    const EasyBoardData = this.state.boardInfo.board.map(row =>row.map(cell => cell && cell.name ? "「"+cell.owner+"の"+cell.name+"」" : "「　　　　」")).map(row => row.join(", ")).join("\n");
    
    if (isLoading) { //isLoading が true の間はローディング表示
      return (
        <LoadingOverlay loadingimgPath={loadingimgPath} loadingMessage={loadingMessage} />
      );
    }
    //console.log("railsEnv:"+railsEnv)
    //console.log("boardSfenHistory:"+boardSfenHistory)
    
    //let moveHistorySelectedIndex=1

    return (
      <div className=" h-full">
        <Header logoPath={logoPath}  className="w-full"/>
        <div className={`main-container h-[calc(100%-30px)] bg-no-repeat bg-cover bg-center bg-[url('${gamebackPath}')]`}>
          <div className="menu-container column">
            <div className={`menu-div ${myDarkGradient} text-white`}>
              {isGameset && ( //isCheckmate && ( //勝敗に決着が着いたら
                  <div className="rounded-lg shadow-lg p-6 max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-[1.2rem] font-bold text-white mb-2">
                        {winner === yourRole && !audienceUser ? ( "あなたの勝ち！"
                        ) : winner !== yourRole && !audienceUser ? ( "あなたの負け"
                        ) : ( winner+"の勝ち！" )}
                      </h2>
                      {winReason==="TimeUp" && (
                        <>時間切れ</>
                      )}
                      {winReason==="Tumi" && (
                        <>詰み</>
                      )}
                      <div className="w-16 h-1 bg-blue-500 mx-auto rounded"></div>
                    </div>
                    { winner === yourRole && !audienceUser &&(
                      <div className="mt-4 flex justify-center">
                        <div className="text-4xl">🎉</div>
                      </div>
                    )}
                    {!rematch_sended && !aiMode &&  ( //再選リクエストを送信していないなら
                      <div className="space-y-3">
                          { !audienceUser && (
                            <button
                              onClick={() => this.rematch()}
                              className="w-full bg-[#dc143c] hover:bg-[#b80f33] text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                              再対戦する
                            </button>
                          )}
                          <a href="/">
                            <button
                              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                            >
                              ロビーに戻る
                            </button>                      
                          </a>
                      </div>
                    )}{rematch_sended && (
                      <div className="space-y-3">
                          再対戦リクエストを送信しました。
                      </div>
                    )}
                    {decline_received && (
                      <div className="space-y-3">
                          再対戦リクエストが拒否されました。
                      </div>
                    )}
                </div>
              )}

              {!isGameset && ( //!isCheckmate && ( //ゲームセットしていないなら
                <div>
                  <ShogiTimer
                    initialMinutes={10}
                    onTimeUp={this.handleTimeUp}
                    ref={this.shogiTimerRef}
                    yourRole={yourRole}
                    roomId={roomId} 
                    sendActionCableMessage={sendActions} // Action Cable の送信メソッド群を props として渡す
                    debugMode={debugMode}
                  />

                  <div style={ nowTurn !== yourRole
                      ? { display: "none" }
                      : undefined
                    }>
                  </div>
                  <div className={`${myDarkGradient} rounded-lg shadow-lg p-2`}>
                    <div className="relative">
                      {nowTurn === yourRole && !audienceUser ? (
                        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-500/20 animate-pulse"></div>
                          <div className="relative z-10 text-center">
                            <div className="inline-block animate-bounce text-4xl mb-2">⚡</div>
                            <div className="text-1xl font-bold mb-1"> {t('shogi.yourturn')} </div>
                          </div>
                          <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full animate-ping"></div>
                        </div>
                      ) : nowTurn !== yourRole  && !audienceUser ?(
                        <div className="text-center py-6 px-6 bg-gray-100 border border-gray-300 rounded-xl">
                          <div className="text-xl text-gray-600 mb-1"> {t('shogi.enemyturn')} </div>
                          <div className="text-sm text-gray-500"> {t('shogi.turnwaiting')} </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 px-6 bg-gray-100 border border-gray-300 rounded-xl">
                          <div className="text-xl text-gray-600 mb-1">{nowTurn}の手番</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
        </div>
          </div>

          {/*<div className="game-container column" onClick={() => this.canselSelection()}*/}
          <div className="game-container column" 
            style={ ( yourRole === "後手" || yourRole === "gote") //&& !aiMode//後手でaiモードがtrueなら回転させる・align-items:flex-startで垂直方向を上端揃え
                    ? { alignItems: "center" /*alignItems: "flex-start"*/ }
                    : undefined
                  }
          >

            {/* 成り確認モーダル - 特定のマスに表示 */}
            {/*this.state.showPromoteModal && (
                <PromoteModal
                    position={this.state.promoteModalPosition}
                    piece={this.state.currentPiece}
                    yourRole={this.state.yourRole}
                    onChoice={this.handlePromoteChoice}
                />
            )*/}

            <div className="game-board"
                style={ (yourRole === "後手" || yourRole === "gote" ) //&& !aiMode //後手でaiモードがtrueなら回転させる・align-items:flex-startで垂直方向を上端揃え
                    ? { transform: "rotate(180deg)"}
                    : undefined
                  }
            >

              <PieceStand
                side="後手"
                pieceStand={this.state.boardInfo.pieceStand["後手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
                roomOnMouseDown={this.roomHandleMouseDown}
                roomOnDragStart={this.roomHandleDragStart}
                roomOnDragEnd={this.roomHandleDragEnd}
                roomOnDrop={this.roomHandleDrop}
                yourRole={yourRole}
                nowTurn={nowTurn}
              />
              <br />
              <Board
                board={this.state.boardInfo.board}
                boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
                
                //onClick={(i, j) => this.handleBoardClick(i, j, yourRole)}
                //onMouseDown={(i, j) => this.handleBoardClick(i, j, yourRole)}
                
                roomOnMouseDown={this.roomHandleMouseDown}
                roomOnDragStart={this.roomHandleDragStart}
                roomOnDragEnd={this.roomHandleDragEnd}
                roomOnDrop={this.roomHandleDrop}
                yourRole={yourRole}
                nowTurn={nowTurn}

                showPromoteModal={this.state.showPromoteModal}
                promoteModalPosition={this.state.promoteModalPosition}
                currentPiece={this.state.currentPiece}
                handlePromoteOnChoice={this.handlePromoteChoice}
              />

              <br />
              <PieceStand
                side="先手"
                pieceStand={this.state.boardInfo.pieceStand["先手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
                roomOnMouseDown={this.roomHandleMouseDown}
                roomOnDragStart={this.roomHandleDragStart}
                roomOnDragEnd={this.roomHandleDragEnd}
                roomOnDrop={this.roomHandleDrop}
                yourRole={yourRole}
                nowTurn={nowTurn}
              />
              {/*<PieceStand
                side="後手"
                pieceStand={this.state.boardInfo.pieceStand["後手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
              />
              <br />
              <Board
                board={this.state.boardInfo.board}
                boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
                onClick={(i, j) => this.handleBoardClick(i, j, yourRole)}
              />
              <br />
              <PieceStand
                side="先手"
                pieceStand={this.state.boardInfo.pieceStand["先手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
              />
              
              <PieceStand
                pieceStand={this.state.boardInfo.pieceStand["後手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["後手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["後手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["後手"][i])}
              />
              <br />
              <Board
                board={this.state.boardInfo.board}
                boardSelectInfo={this.state.boardInfo.selection.boardSelectInfo}
                onClick={(i, j) => this.handleBoardClick(i, j, yourRole)}
              />

              <br />
              <PieceStand
                pieceStand={this.state.boardInfo.pieceStand["先手"]}
                pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
                pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
                onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
              />
              */}
            </div>
          </div>

          <div className={`chat-and-setting-container column`}>
            <div className={`setting-container column ${myDarkGradient}`}>
                {/* 差し手履歴*/ }
                <div className="h-[90%] overflow-y-auto p-2.5 overflow-y-auto text-white">
                  {/*moveHistory.map((move, index) => (*/}
                  {/*moveHistory.forEach((move, index) =>  ( */}
                  {(moveHistory || []).map((move, index) => (
                    //console.log(`${idx} 手目: ${move}`
                    <p 
                      key={index}
                      className={`cursor-pointer p-1 rounded 
                        ${moveHistorySelectedIndex === index ? "bg-blue-600" : "hover:bg-gray-700"}`}
                      /*onClick={() => this.backHistory(boardSfenHistory[index])}*/
                      onClick={() => {
                        if (!this.state.isCheckmate) return;
                        this.backHistory(boardSfenHistory[index],index);
                      }}
                    >
                      {index + 1}: {move}
                    </p>
                  ))}
                </div>
                <div className="flex justify-between mb-2">
                  <button
                    className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    disabled={!this.state.isCheckmate}
                    onClick={() => { this.backHistory(boardSfenHistory[moveHistorySelectedIndex-1],moveHistorySelectedIndex-1); }}
                  >
                    ←
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
                    disabled={!this.state.isCheckmate}
                    onClick={() => { this.backHistory(boardSfenHistory[moveHistorySelectedIndex+1],moveHistorySelectedIndex+1); }}
                  >
                    →
                  </button>
                </div>
            </div>
              { !aiMode &&( 
                <div className={`chat-container ${myDarkGradient} ${isChatOpen ? '' : 'closed'}`} > {/* isChatOpen の状態に応じてクラスを適用 */}
                  {/* 開閉ボタン */}
                  <button
                    className={`chat-toggle-button bg-[#18181b] hover:bg-[#27272a] ${isChatOpen ? '' : 'pointer-events-auto'}`}
                    onClick={this.toggleChat} // クリックで開閉メソッドを呼び出す
                    aria-expanded={isChatOpen} // アクセシビリティのため
                    aria-controls="chat-messages-container" // 対象となるコンテナのID (chat-containerにIDを追加する場合)
                  >
                    {isChatOpen ? '>' : '<'} {/* isChatOpen の状態に応じてボタンのテキストを切り替える */}
                  </button>
                  
                  <div id="chat-messages" className="chat-messages">
                    {(() => {
                      // もしchatMessagesが文字列の場合、配列に変換
                      let messages = chatMessages;
                      //console.log("messages:",messages)
                      //console.log("typeof chatMessages:",typeof chatMessages)
                      /*if (typeof chatMessages === 'string') {
                        messages = chatMessages.split(',').map(msg => msg.trim());// カンマ区切りで文字列を分割
                        return Array.isArray(messages) ? (
                          messages.map((message, index) => (
                            <div key={index} className="chat-message p-2 mb-2 rounded">
                              <strong>{JSON.parse(message).username}</strong>: {JSON.parse(message).chat_text}
                            </div>
                          ))
                        ) : (
                          <p className="text-red-500">メッセージがありません</p>
                        );
                      }else if (typeof messages === "object" && messages !== null) {
                          console.log("messagesgg:"+messages)
                          // 単一オブジェクトの場合
                          return (
                            <div className="chat-message p-2 mb-2 rounded bg-gray-100">
                              <strong>{messages.username}</strong>: {messages.chat_text}
                            </div>
                          );
                      }*/
                      let parsedMessages = [];
                      if (typeof messages === "string") {
                        try {
                          parsedMessages = JSON.parse(messages); // 文字列ならパース
                        } catch (e) {
                          console.error("JSONパース失敗:", e);
                          return null;
                        }
                      } else if (Array.isArray(messages)) {
                        parsedMessages = messages; // すでに配列ならそのまま
                      } else {
                        parsedMessages = [messages]; // 単一オブジェクトなら配列に変換
                      }
                      //console.log("parsedMessages:",parsedMessages)

                      return (
                        <>
                          {parsedMessages.map((msg, index) => {
                              // msgが文字列ならパース、オブジェクトならそのまま使う
                              const data = typeof msg === "string" ? JSON.parse(msg) : msg;
                            return (
                            <div key={index} className="chat-message p-2 mb-2 rounded text-white">
                              <strong>{data.username}</strong>: {data.chat_text}
                            </div>
                            );
                        })}
                        </>
                      );

                    })()}
                  </div>
                  <form id="chat-form" className="chat-form" onSubmit={this.handleChatSubmit}>
                    <input
                      type="text"
                      id="chat-input"
                      autoComplete="off"
                      placeholder="メッセージを送信"
                      className="chat-input text-white"
                      value={currentChatMessage}
                      onChange={this.handleChatInputChange}
                    />
                    {/*<button type="submit" className="chat-button">Send</button>*/}
                  </form>
                </div>
              )}
          </div>
        </div>

        {rematchRequest && ( //再戦リクエストが来たら
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                !rematchRequest ? 'opacity-0' : 'opacity-50'
              }`}
            ></div>

            <div className={`
              relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 
              transform transition-all duration-300 
              ${!rematchRequest ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
            `}>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg">
                <h2 className="text-xl font-bold text-center">再戦リクエスト</h2>
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">⚔️</div>
                  <p className="text-gray-700 text-lg">
                    相手から再戦の申し込みがあります
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => this.acceptRematch()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    承諾
                  </button>
                  <button
                    onClick={() => this.declineRematch()}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    拒否
                  </button>
                </div>
              </div>

              <button
                className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* BGM */}
        <audio 
          src={gameBgmPath}
          id="game_bgm" 
          controls 
          loop
          className="fixed bottom-4 left-25 hidden"
        />
        <div
          className="fixed left-4 bottom-4 z-50"
        >
          <button
            onClick={() =>
              document.getElementById("game_bgm")?.classList.toggle("hidden")
            }
            className={`w-full h-full bg-white rounded-full shadow-2xl p-3 flex items-center justify-center transform transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 "
              aria-hidden
            >
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </button>
        </div>


        {/*debugMode  && railsEnv=="development" && (*/}
        {debugMode && (railsEnv === "development" || railsEnv === "test") && (
          <div id="debugArea"
            className="w-[90%] h-[80%] fixed top-7 right-4 z-50 opacity-95 border bg-gray-500 items-center justify-center overflow-auto whitespace-pre-line"
          >
              <div class="debug-handle fixed cursor-move bg-gray-800 text-white px-2 py-1 select-none">
                ドラッグ移動
              </div>

              <div className='debug-content'>
                <h3>Version1</h3>

                <div>
                  <br/>
                  <label>
                    <input
                      type="checkbox"
                      checked={this.state.shogiDebugMode}
                      onChange={this.handleShogiDebugModeChange}
                    />
                    将棋デバッグモード・チェックを入れるとaiの手番でも自分で打てる
                  </label>

                  {this.state.shogiDebugMode && <div>将棋デバッグモードオン中</div>}
                </div>

                <span className="font-semibold m-5 p-2">あなたは{yourRole}</span>

                <br/>

                <button
                  onClick={() => this.chengeRoleDebug()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  自分の役割の手番を変更
                </button>

                <br/>

                <button
                  onClick={() => this.piece_move_sound()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  コマの打つ音鳴らす
                </button>

                <br/>

                <button
                  onClick={this.deleteData}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  試合が終わったのでデータ削除
                </button>

                <br/>

                <button
                  onClick={this.gameFinishTest}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  試合が終わらせる
                </button>

                <br/>

                <button
                  onClick={() => this.aiTest()}
                  className="m-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  AI
                </button>

                <br/>

                {/* さまざまな局面にボードデータを編集 default、tumi、nari、sennichite、oute_sennichite */ }
                <button
                  onClick={() => this.debugChengeBoard("default")}
                  className="m-5 mr-4 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  デフォルトの局面にする
                </button>
                <button
                  onClick={() => this.debugChengeBoard("tumi")}
                  className="m-5 mr-4 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  詰みの局面にする
                </button>
                <button
                  onClick={() => this.debugChengeBoard("nari")}
                  className="m-5 mr-4 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  成りの局面にする
                </button>
                <button
                  onClick={() => this.debugChengeBoard("oute_sennichite")}
                  className="m-5 mr-4 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  王手千日手の局面にする
                </button>
                <button
                  onClick={() => this.debugChengeBoard("uchifuzume")}
                  className="m-5 mr-4 mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  打ち歩詰めの局面にする
                </button>


                <br/>

                <div className="mb-3">
                  <span className="font-semibold">接続状態: </span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    isConnected ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {isConnected ? '接続中' : '未接続'}
                  </span>
                </div>

                {/* state全体を表示 */}
                <div className="debug-content mb-3 text-white whitespace-pre font-mono text-sm bg-black p-3 border border-gray-200 overflow-x-auto">
                  <p>stateデータ: </p>
                  <pre>
                    {(() => {
                      // stateからboardInfoを除外し、残りを表示用オブジェクトにする
                      const { boardInfo,boardInfoHistory, ...otherState } = this.state;
                      return JSON.stringify(otherState, null, 2);
                    })()}
                  </pre>
                </div>

                <div
                 className="debug-content mb-3 text-white whitespace-pre font-mono text-sm bg-black p-3 border border-gray-200 overflow-x-auto"
                >
                  <p>ボードデータ: </p>
                  {EasyBoardData}
                </div>

                <div
                 className="mb-3 text-white whitespace-pre font-mono text-sm bg-black p-3 border border-gray-200 overflow-x-auto"
                >
                  <BoardInfoDebugger boardInfoHistory={this.state.boardInfoHistory} />
                    
                    {/*JSON.stringify(this.state.boardInfo)*/}

                    {/*
                    <BoardInfoDebugger boardInfo={this.state.boardInfo} />
                    <p>this.state.boardInfo: </p><br/>

                    <details>
                        <summary>board</summary>
                        <pre>{JSON.stringify(boardInfo.board, null, 1)}</pre>
                    </details>
                    <details>
                        <summary>pieceStandNum</summary>
                        <pre>{JSON.stringify(boardInfo.pieceStandNum, null, 3)}</pre>
                    </details>
                    <details>
                        <summary>pieceStand</summary>
                        <pre>{JSON.stringify(boardInfo.pieceStand, null, 10)}</pre>
                    </details>
                    <details>
                        <summary>selection</summary>
                        <pre>{JSON.stringify(boardInfo.selection, null, 2)}</pre>
                    </details>
                    <details>
                        <summary>nowTurn</summary>
                        <pre>{JSON.stringify(boardInfo.nowTurn, null, 2)}</pre>
                    </details>
                      */}
                </div>


                <div>
                  gameRoomData: {gameRoomData}
                </div>
                </div>
          </div>
        )}

      </div>
    );
  }
}

// withTranslationでコンポーネントをラップ
const RoomWithTranslation = withTranslation()(Room);

document.addEventListener('turbo:load', () => {
  const shogiBoardElement = document.getElementById('game-container');
  if (shogiBoardElement) {
    const rootElement = document.createElement('div');
    rootElement.className = 'h-full';
    document.body.appendChild(rootElement);
    const root = ReactDOM.createRoot(rootElement);
    //root.render(<Room />);
    root.render(
      <I18nextProvider i18n={i18n}>
        <RoomWithTranslation />
      </I18nextProvider>
    );    
  } else {
    // shogi-board要素が見つからない場合は、このページが将棋ページではないと判断
    //console.log("将棋ゲームコンポーネントは、このページでは初期化されませんでした（#shogi-board要素なし）。");
  }
})

export default Room;