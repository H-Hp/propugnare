import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import imgKing from "./img/玉.png";
import imgRook from "./img/飛.png";
import imgBishop from "./img/角.png";
import imgGoldGeneral from "./img/金.png";
import imgSilverGeneral from "./img/銀.png";
import imgKnight from "./img/桂.png";
import imgLance from "./img/香.png";
import imgPawn from "./img/歩.png";
import imgPromotedRook from "./img/竜.png";
import imgPromotedBishop from "./img/馬.png";
import imgPromotedSilverGeneral from "./img/成銀.png";
import imgPromotedKnight from "./img/成桂.png";
import imgPromotedLance from "./img/成香.png";
import imgPromotedPawn from "./img/と.png";
//import { BoardInfo, Selection } from './components/BoardInfo';
import { BoardInfo, Selection } from './BoardInfo';


const imgByName = {
  "玉": imgKing,
  "飛": imgRook,
  "角": imgBishop,
  "金": imgGoldGeneral,
  "銀": imgSilverGeneral,
  "桂": imgKnight,
  "香": imgLance,
  "歩": imgPawn,
  "竜": imgPromotedRook,
  "馬": imgPromotedBishop,
  "成銀": imgPromotedSilverGeneral,
  "成桂": imgPromotedKnight,
  "成香": imgPromotedLance,
  "と": imgPromotedPawn
};

function Square(props) {
  return (
    <button id={props.selectInfo} className="square" onClick={props.onClick} >
      <img id={props.piece.owner} src={imgByName[props.piece.name]} alt="" />
      <p>{(props.num >= 2) && props.num}</p>
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i, j) {
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
  }
}

class PieceStand extends React.Component {
  renderSquare(i) {
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
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      boardInfo: new BoardInfo()
    };
  }

  canselSelection() {
    const nextBoardInfo = this.state.boardInfo;
    if (nextBoardInfo.selection.isNow) {
      nextBoardInfo.selection.isNow = false;
    } else {
      nextBoardInfo.selection = new Selection();
    }
    this.setState({
      boardInfo: nextBoardInfo
    });
  }

  boardClick(i, j) {
    this.state.boardInfo.boardClick(i, j);
  }

  pieceStandClick(piece) {
    this.state.boardInfo.pieceStandClick(piece);
  }

  render() {

    return (
      <div className="game" onClick={() => this.canselSelection()}>
        <div className="game-board">
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
            onClick={(i, j) => this.boardClick(i, j)}
          />
          <br />
          <PieceStand
            pieceStand={this.state.boardInfo.pieceStand["先手"]}
            pieceStandNum={this.state.boardInfo.pieceStandNum["先手"]}
            pieceStandSelectInfo={this.state.boardInfo.selection.pieceStandSelectInfo["先手"]}
            onClick={(i) => this.pieceStandClick(this.state.boardInfo.pieceStand["先手"][i])}
          />
        </div>
      </div>
    );
  }
}

// ========================================

//const root = ReactDOM.createRoot(document.getElementById("root"));
//root.render(<Game />);
//root.render(<Shogi />);


export default Game