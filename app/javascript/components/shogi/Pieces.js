class Piece {// 駒の基底クラス
  constructor(owner) {
      this.owner = owner;// 駒の所有者（"先手" or "後手"）・駒の所有者（"先手"または"後手"）を初期化する
  }
  getPiece() {// 成り駒を元の駒に戻す
      //console.log("PieceクラスのgetPiece()メソッド");
      return null;//基底クラスではnullを返す（具体的な駒のクラスで実装されることを想定）
      
  }
  getPromotedPiece() { // 成り駒を取得
      //console.log("PieceクラスのgetPromotedPiece()メソッド");
      return null;// 基底クラスではnullを返す（具体的な駒のクラスで実装されることを想定）
  }

  // staticキーワードが付いているため、このメソッドはクラスのインスタンスではなく、クラス自体から直接呼び出される (例: Piece.getPieceByName(...))
  // 駒の名前 (name) と所有者 (owner) を受け取り、対応する駒の新しいインスタンスを生成して返す「ファクトリーメソッド」
  static getPieceByName(name, owner) { // 駒の名前から対応する駒のインスタンスを生成
      switch (name) {// switch文でnameの値に基づいて処理を分岐
          case "飛":
              return new Rook(owner);// 新しいRook（飛車）のインスタンスを作成して返す
          case "角":
              return new Bishop(owner);
          case "金":
              return new GoldGeneral(owner);
          case "銀":
              return new SilverGeneral(owner);
          case "桂":
              return new Knight(owner);
          case "香":
              return new Lance(owner);
          case "歩":
              return new Pawn(owner);
          //default:return null;
          default: return new Blank();
      }
  }
}

class Blank extends Piece {// それぞれの駒の種類と移動ルールを定義
}

/* 
各駒のクラス
Piece クラスを継承し、それぞれの駒に固有のプロパティ（名前、移動ルール）を定義
name: 駒の表示名（例: "玉"、"飛"）
dx: 移動可能な横方向の差分（x座標の変化量）
dy: 移動可能な縦方向の差分（y座標の変化量）
dk: その方向に何マス動けるか（1は1マス、10はどこまでも）
*/

class King extends Piece {
  name = "玉";
  dx = [-1, -1, -1, 0, 1, 1, 1, 0];// 8方向に1マスずつ
  dy = [-1, 0, 1, 1, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1, 1, 1];
}

class Rook extends Piece {
  name = "飛";
  dx = [-1, 0, 1, 0]; // 上下左右
  dy = [0, 1, 0, -1];
  dk = [10, 10, 10, 10];// 何マスでも動ける
  getPromotedPiece() {// 成り駒を取得するメソッドをオーバーライド（飛車は成ることができるため）
      return new PromotedRook(this.owner); // 成り飛車（竜）のインスタンスを返す
  }
}

class Bishop extends Piece {
  name = "角";
  dx = [-1, -1, 1, 1];
  dy = [-1, 1, 1, -1];
  dk = [10, 10, 10, 10];
  getPromotedPiece() {
      return new PromotedBishop(this.owner);
  }
}

class GoldGeneral extends Piece {
  name = "金";
  dx = [-1, -1, 0, 1, 1, 0];
  dy = [-1, 0, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1];
}

class SilverGeneral extends Piece {
  name = "銀";
  dx = [-1, -1, 1, 1, 0];
  dy = [-1, 1, 1, -1, -1];
  dk = [1, 1, 1, 1, 1];
  getPromotedPiece() {
      return new PromotedSilverGeneral(this.owner);
  }
}

class Knight extends Piece {
  name = "桂";
  dx = [-1, 1];
  dy = [-2, -2];
  dk = [1, 1];
  getPromotedPiece() {
      return new PromotedKnight(this.owner);
  }
}

class Lance extends Piece {
  name = "香";
  dx = [0];
  dy = [-1];
  dk = [10];
  getPromotedPiece() {
      return new PromotedLance(this.owner);
  }
}

class Pawn extends Piece {
  name = "歩";
  dx = [0];
  dy = [-1];
  dk = [1];
  getPromotedPiece() {
      return new PromotedPawn(this.owner);
  }
}


//成り駒のクラス
//成った後の駒の移動ルールを定義。これらのクラスもPieceを継承
//また、getPiece() メソッドをオーバーライドして、元の駒に戻る機能を提供
class PromotedRook extends Piece {
  name = "竜";
  dx = [-1, 0, 1, 0, -1, -1, 1, 1];
  dy = [0, 1, 0, -1, -1, 1, 1, -1];
  dk = [10, 10, 10, 10, 1, 1, 1, 1];
  getPiece() {// 成り駒を元の駒に戻すメソッドをオーバーライド
      return new Rook(this.owner);// 元の飛車のインスタンスを返す
  }
}

class PromotedBishop extends Piece {
  name = "馬";
  dx = [-1, -1, 1, 1, -1, 0, 1, 0];
  dy = [-1, 1, 1, -1, 0, 1, 0, -1];
  dk = [10, 10, 10, 10, 1, 1, 1, 1];
  getPiece() {
      return new Bishop(this.owner);
  }
}

class PromotedSilverGeneral extends Piece {
  name = "成銀";
  dx = [-1, -1, 0, 1, 1, 0];
  dy = [-1, 0, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1];
  getPiece() {
      return new SilverGeneral(this.owner);
  }
}

class PromotedKnight extends Piece {
  name = "成桂";
  dx = [-1, -1, 0, 1, 1, 0];
  dy = [-1, 0, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1];
  getPiece() {
      return new Knight(this.owner);
  }
}

class PromotedLance extends Piece {
  name = "成香";
  dx = [-1, -1, 0, 1, 1, 0];
  dy = [-1, 0, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1];
  getPiece() {
      return new Lance(this.owner);
  }
}

class PromotedPawn extends Piece {
  name = "と";
  dx = [-1, -1, 0, 1, 1, 0];
  dy = [-1, 0, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1];
  getPiece() {
      return new Pawn(this.owner);
  }
}

//export文: 他のJavaScriptファイルからこれらのクラスをインポートして利用できるようにする。これにより別のファイルで import { King, Rook } from './piece_classes.js'; のように記述して利用できる
//export { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn};
export { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn, PromotedRook,PromotedBishop,PromotedSilverGeneral,PromotedKnight,PromotedLance,PromotedPawn};