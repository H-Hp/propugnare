class Piece {
  constructor(owner) {
      this.owner = owner;
  }
  getPiece() {
      return null;
  }
  getPromotedPiece() {
      return null;
  }
  static getPieceByName(name, owner) {
      switch (name) {
          case "飛":
              return new Rook(owner);
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
          default:
              return null;
      }
  }
}

class Blank extends Piece {
}

class King extends Piece {
  name = "玉";
  dx = [-1, -1, -1, 0, 1, 1, 1, 0];
  dy = [-1, 0, 1, 1, 1, 0, -1, -1];
  dk = [1, 1, 1, 1, 1, 1, 1, 1];
}

class Rook extends Piece {
  name = "飛";
  dx = [-1, 0, 1, 0];
  dy = [0, 1, 0, -1];
  dk = [10, 10, 10, 10];
  getPromotedPiece() {
      return new PromotedRook(this.owner);
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

class PromotedRook extends Piece {
  name = "竜";
  dx = [-1, 0, 1, 0, -1, -1, 1, 1];
  dy = [0, 1, 0, -1, -1, 1, 1, -1];
  dk = [10, 10, 10, 10, 1, 1, 1, 1];
  getPiece() {
      return new Rook(this.owner);
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

export { Piece, Blank, King, Rook, Bishop, GoldGeneral, SilverGeneral, Knight, Lance, Pawn};
