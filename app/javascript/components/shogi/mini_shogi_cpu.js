/*  mini_shogi_cpu.js
 *  超軽量・擬似将棋CPU（USI/ SFEN入力 → USI指し手出力）
 *  - 依存なし・ファイル1つ
 *  - 9x9将棋/先手=black(b), 後手=white(w)
 *  - 生成するのは「擬似合法手」（王手放置など未チェック）
 *  - 簡易1手読み評価：駒取り > 前進歩 > ランダム
 *
 *  公開API: usiBestMove(sfenString) -> "bestmove"（USI指し手：例 "7g7f", "2b3c+", "P*7f"）
 */

// ============ 盤・駒定義 ============
const FILES = 9, RANKS = 9;
const INSIDE = (f, r) => f >= 0 && f < FILES && r >= 0 && r < RANKS;

// USI座標ヘルパ: (file 0..8, rank 0..8) <-> "9a..1i"
function toUSI(f, r) {
  // 将棋は file:9→1 が右→左、rank:a→i が上→下
  const file = 9 - f; // 0→9, 8→1
  const rankChar = String.fromCharCode("a".charCodeAt(0) + r); // 0→'a'
  return `${file}${rankChar}`;
}
function fromUSI(sq) {
  const file = 9 - parseInt(sq[0], 10);
  const r = sq.charCodeAt(1) - "a".charCodeAt(0);
  return [file, r];
}

// 駒表記（SFENの駒文字）: 先手=大文字, 後手=小文字
const PIECES = {
  P: "P", L: "L", N: "N", S: "S", G: "G", B: "B", R: "R", K: "K",
  p: "p", l: "l", n: "n", s: "s", g: "g", b: "b", r: "r", k: "k",
  "+P": "+P", "+L": "+L", "+N": "+N", "+S": "+S", "+B": "+B", "+R": "+R",
  "+p": "+p", "+l": "+l", "+n": "+n", "+s": "+s", "+b": "+b", "+r": "+r",
};

const PROMOTABLE = new Set(["P","L","N","S","B","R","p","l","n","s","b","r"]);
const PROMOTE = { P:"+P", L:"+L", N:"+N", S:"+S", B:"+B", R:"+R",
                  p:"+p", l:"+l", n:"+n", s:"+s", b:"+b", r:"+r" };
const UNPROMOTE = { "+P":"P", "+L":"L", "+N":"N", "+S":"S", "+B":"B", "+R":"R",
                    "+p":"p", "+l":"l", "+n":"n", "+s":"s", "+b":"b", "+r":"+r" }; // not used

const VALUES = { // 簡易評価
  P:100, L:300, N:300, S:400, G:500, B:700, R:800, K:10000,
  "+P":500, "+L":500, "+N":500, "+S":500, "+B":900, "+R":1000,
};
Object.keys(VALUES).forEach(k=>{
  if(k.toLowerCase()===k) VALUES[k]=VALUES[k.toUpperCase()];
});

const isBlack = (pc)=> pc && pc === pc.toUpperCase();
const isWhite = (pc)=> pc && pc === pc.toLowerCase();

// 先手の前進は rank+1（画面下方向）、後手は rank-1（上方向）
const DIR = { b:+1, w:-1 };

// 成りゾーン（先手: ranks 6-8, 後手: 0-2）
function inPromoZone(color, r) {
  return color==="b" ? r>=6 : r<=2;
}

// ============ 盤オブジェクト ============
function makeEmptyBoard() {
  const board = Array.from({length:RANKS}, ()=> Array(FILES).fill(null)); // [r][f]
  const hands = { b:{P:0,L:0,N:0,S:0,G:0,B:0,R:0}, w:{P:0,L:0,N:0,S:0,G:0,B:0,R:0} };
  return { board, hands, stm:"b" }; // side to move: "b" or "w"
}

// 初期配置
function setupStartPos(pos) {
  const start = [
    "lnsgkgsnl",
    "1r5b1",
    "p1ppppppp",
    "9",
    "9",
    "9",
    "P1PPPPPPP",
    "1B5R1",
    "LNSGKGSNL"
  ];
  loadBoardFromPieces(pos, start);
  pos.stm = "b";
}

function loadBoardFromPieces(pos, rows) {
  for(let r=0; r<RANKS; r++){
    const row = rows[r];
    let f=0;
    for(let i=0;i<row.length;i++){
      const ch=row[i];
      if(ch>='1' && ch<='9'){ f += parseInt(ch,10); continue; }
      if(ch==='+'){ // promoted
        i++;
        const p = '+'+row[i];
        pos.board[r][f] = p;
        f++;
        continue;
      }
      pos.board[r][f] = ch;
      f++;
    }
  }
}

// SFEN 文字列 → 盤へ
function parseSFEN(sfen, pos) {
  // "startpos ..." or "sfen <pieces> <stm> <hands> <moveNumber> ..."
  if (sfen.startsWith("startpos")) {
    setupStartPos(pos);
    const idx = sfen.indexOf("moves");
    if (idx !== -1) {
      const movesStr = sfen.slice(idx + 5).trim();
      applyMovesUSI(pos, movesStr.split(/\s+/));
    }
    return;
  }
  // "sfen ..." 形式
  const parts = sfen.replace(/^sfen\s+/,"").trim().split(/\s+/);
  const pieces = parts[0].split('/');
  loadBoardFromPieces(pos, pieces);
  pos.stm = parts[1]; // 'b' or 'w'

  // hands
  const hands = parts[2];
  parseHands(hands, pos);

  // moves (任意)
  const movesIdx = sfen.indexOf("moves");
  if (movesIdx !== -1) {
    const movesStr = sfen.slice(movesIdx + 5).trim();
    applyMovesUSI(pos, movesStr.split(/\s+/));
  }
}

function parseHands(hstr, pos){
  pos.hands = { b:{P:0,L:0,N:0,S:0,G:0,B:0,R:0}, w:{P:0,L:0,N:0,S:0,G:0,B:0,R:0} };
  if (hstr === "-") return;
  let i=0;
  while(i<hstr.length){
    let num="";
    while(i<hstr.length && /[0-9]/.test(hstr[i])){ num+=hstr[i++]; }
    const cnt = num===""?1:parseInt(num,10);
    const ch = hstr[i++];
    const owner = ch===ch.toUpperCase() ? "b":"w";
    const k = ch.toUpperCase();
    pos.hands[owner][k] += cnt;
  }
}

// ============ 指し手適用（簡易） ============
function applyMove(pos, moveUSI){
  // drop: "P*7f"
  if (moveUSI[1]==='*'){
    const k = moveUSI[0]; // piece
    const [f,r] = fromUSI(moveUSI.slice(2,4));
    const color = pos.stm;
    const pc = color==="b"? k : k.toLowerCase();
    if (!pos.board[r][f] && pos.hands[color][k]>0){
      pos.board[r][f]=pc;
      pos.hands[color][k]--;
      pos.stm = color==="b" ? "w" : "b";
    }
    return;
  }
  // normal: "7g7f" or "7g7f+" (promotion)
  const from = moveUSI.slice(0,2), to = moveUSI.slice(2,4);
  const promote = moveUSI.length===5 && moveUSI[4]==='+';
  const [ff,fr] = fromUSI(from);
  const [tf,tr] = fromUSI(to);
  const pc = pos.board[fr][ff];
  if (!pc) return;

  // capture -> add to hands (簡易: 取ったら非成駒として持ち駒化)
  const cap = pos.board[tr][tf];
  if (cap){
    const k = cap.replace('+','').toUpperCase();
    const owner = isBlack(cap) ? "w":"b"; // 取った側に入る
    pos.hands[owner][k] = (pos.hands[owner][k]||0)+1;
  }

  let npc = pc;
  if (promote && PROMOTABLE.has(pc)) npc = PROMOTE[pc];

  pos.board[tr][tf]=npc;
  pos.board[fr][ff]=null;
  pos.stm = pos.stm==="b" ? "w" : "b";
}

function applyMovesUSI(pos, moves){
  for(const m of moves){ if(!m) continue; applyMove(pos, m); }
}

// ============ 擬似合法手生成 ============
function genMoves(pos){
  const color = pos.stm;
  const out = [];
  for(let r=0;r<RANKS;r++){
    for(let f=0;f<FILES;f++){
      const pc = pos.board[r][f];
      if(!pc) continue;
      if(color==="b" && !isBlack(pc)) continue;
      if(color==="w" && !isWhite(pc)) continue;
      genPieceMoves(pos, f, r, pc, out);
    }
  }
  // 打ち駒
  genDrops(pos, out);
  return out;
}

function pushMove(out, f1,r1,f2,r2, pc, capture, allowPromote, mustPromote=false){
  // 同一色の駒がいる場所には行けない
  if (capture && ((isBlack(pc) && isBlack(capture)) || (isWhite(pc) && isWhite(capture)))) return;
  if (!capture && capture!==null && capture!==undefined){} // no-op

  let u = toUSI(f1,r1)+toUSI(f2,r2);
  const color = isBlack(pc) ? "b":"w";
  // 成り判定（移動前後のいずれかが敵陣）
  if (PROMOTABLE.has(pc)) {
    const promo = (inPromoZone(color,r1) || inPromoZone(color,r2));
    if (mustPromote && promo) {
      u += "+";
      out.push(u);
      return;
    }
    if (promo && allowPromote) {
      out.push(u+"+"); // 成り
    }
  }
  out.push(u); // 不成
}

function slideDirsFor(pc){
  const P = pc.toUpperCase();
  if (P==="R" || P==="+B" || P==="+R") return [[1,0],[-1,0],[0,1],[0,-1]];
  if (P==="B" || P==="+B" || P==="+R") return [[1,1],[1,-1],[-1,1],[-1,-1]];
  if (P==="L") return null; // 別扱い
  return null;
}

function stepMovesFor(pc, color){
  const P = pc.toUpperCase();
  const d = color==="b"? +1 : -1;
  if (P==="P") return [[0,d]];
  if (P==="G" || P==="+P" || P==="+L" || P==="+N" || P==="+S")
    return [[0,d],[1,0],[-1,0],[0,-1],[1,d],[-1,d]];
  if (P==="S") return [[0,d],[1,-d],[-1,-d],[1,d],[-1,d]];
  if (P==="K") return [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  if (P==="+B") return [[1,0],[-1,0],[0,1],[0,-1]]; // 斜め滑走+王の十字
  if (P==="+R") return [[1,1],[1,-1],[-1,1],[-1,-1]]; // 十字滑走+王の斜め
  return [];
}

function genPieceMoves(pos, f, r, pc, out){
  const color = isBlack(pc) ? "b":"w";
  const enemy = color==="b" ? isWhite : isBlack;
  const P = pc.toUpperCase();
  const d = color==="b"? +1 : -1;

  // 歩
  if (P==="P"){
    const nf=f, nr=r+d;
    if (INSIDE(nf,nr) && !pos.board[nr][nf]){
      const mustProm = (color==="b" && nr===8) || (color==="w" && nr===0);
      pushMove(out, f,r,nf,nr, pc, null, true, mustProm);
    }
    // 斜めの成駒取りはなし（将棋は前斜めに取れない）
    return;
  }

  // 香
  if (P==="L"){
    let nf=f, nr=r+d;
    while(INSIDE(nf,nr)){
      const occ = pos.board[nr][nf];
      if (occ){
        if (enemy(occ)){
          const mustProm = (color==="b" && nr===8) || (color==="w" && nr===0);
          pushMove(out, f,r,nf,nr, pc, occ, true, mustProm);
        }
        break;
      }else{
        const mustProm = (color==="b" && nr===8) || (color==="w" && nr===0);
        pushMove(out, f,r,nf,nr, pc, null, true, mustProm);
      }
      nr += d;
    }
    return;
  }

  // 桂
  if (P==="N"){
    const ks = color==="b" ? [[-1,2],[1,2]] : [[-1,-2],[1,-2]];
    for (const [dx,dy] of ks){
      const nf=f+dx, nr=r+dy;
      if (!INSIDE(nf,nr)) continue;
      const occ=pos.board[nr][nf];
      if (!occ || enemy(occ)){
        const mustProm = (color==="b" && nr>=7) || (color==="w" && nr<=1);
        pushMove(out, f,r,nf,nr, pc, occ||null, true, mustProm);
      }
    }
    return;
  }

  // スライディング（飛/角/龍/馬）
  const slides = slideDirsFor(pc);
  if (slides){
    for (const [dx,dy] of slides){
      let nf=f+dx, nr=r+dy;
      while(INSIDE(nf,nr)){
        const occ = pos.board[nr][nf];
        if (occ){
          if (enemy(occ)) pushMove(out, f,r,nf,nr, pc, occ, true, false);
          break;
        }else{
          pushMove(out, f,r,nf,nr, pc, null, true, false);
        }
        nf+=dx; nr+=dy;
      }
    }
  }

  // 歩・香・桂以外のステップ移動
  const steps = stepMovesFor(pc, color);
  for(const [dx,dy] of steps){
    const nf=f+dx, nr=r+dy;
    if (!INSIDE(nf,nr)) continue;
    const occ = pos.board[nr][nf];
    if (!occ || enemy(occ)){
      const mustProm = false;
      pushMove(out, f,r,nf,nr, pc, occ||null, true, mustProm);
    }
  }
}

// 打ち駒（簡易：二歩のみ禁止）
function genDrops(pos, out){
  const color = pos.stm;
  const hand = pos.hands[color];
  const dir = color==="b" ? +1 : -1;

  // 二歩チェック用：同筋に自分の歩があるか
  function hasPawnOnFile(f){
    for(let r=0;r<RANKS;r++){
      const pc = pos.board[r][f];
      if (!pc) continue;
      if (color==="b" && pc==="P") return true;
      if (color==="w" && pc==="p") return true;
    }
    return false;
  }

  const stock = Object.entries(hand).filter(([k,v])=>v>0);
  for(const [K, cnt] of stock){
    for(let r=0;r<RANKS;r++){
      for(let f=0;f<FILES;f++){
        if (pos.board[r][f]) continue;
        // 禁止マス（簡易）
        if (K==="P"){
          // 相手陣最奥段には打てない（前進不可）
          if ((color==="b" && r===8) || (color==="w" && r===0)) continue;
          if (hasPawnOnFile(f)) continue; // 二歩
        }
        const pc = color==="b" ? K : K.toLowerCase();
        out.push(`${K}*${toUSI(f,r)}`); // 例: "P*7f"
      }
    }
  }
}

// ============ 簡易評価と手の選択 ============
function materialValue(pc){
  if (!pc) return 0;
  const key = pc.toUpperCase();
  return VALUES[key] || 0;
}

function pickMove(pos, moves){
  if (moves.length===0) return "resign";

  // 1) 駒得（単純に取る手を優先）
  for(const m of moves){
    if (m.includes("*")) continue; // 打ちはキャプチャではない
    const from = m.slice(0,2), to = m.slice(2,4);
    const [tf,tr] = fromUSI(to);
    const cap = pos.board[tr][tf];
    if (cap){ return m; }
  }

  // 2) 前進歩（先手: rank+1 / 後手: rank-1）
  for(const m of moves){
    if (m.includes("*")) continue;
    const from = m.slice(0,2), to = m.slice(2,4);
    const [ff,fr] = fromUSI(from);
    const [tf,tr] = fromUSI(to);
    const pc = pos.board[fr][ff];
    if (!pc) continue;
    const P = pc.toUpperCase();
    const forward = isBlack(pc) ? +1 : -1;
    if (P==="P" && tr-fr===forward && tf===ff) return m;
  }

  // 3) ランダム
  return moves[Math.floor(Math.random()*moves.length)];
}

// ============ 公開API ============
function usiBestMove(sfenOrStartposLine){
  const pos = makeEmptyBoard();
  const s = sfenOrStartposLine.trim();
  // "startpos moves ..." にも対応
  if (s.startsWith("startpos")) {
    parseSFEN(s, pos);
  } else if (s.startsWith("sfen")) {
    parseSFEN(s, pos);
  } else {
    // 純SFENのみだったら頭に "sfen " を付けて扱う
    parseSFEN("sfen " + s, pos);
  }

  const moves = genMoves(pos);
  const m = pickMove(pos, moves);
  return m || "resign";
}

// Node.js で CLI テスト用
if (typeof require !== "undefined" && require.main === module) {
  const fsfen = process.argv.slice(2).join(" ") || "startpos";
  console.log(usiBestMove(fsfen));
}

// ブラウザ用にグローバル公開
if (typeof window !== "undefined") {
  window.usiBestMove = usiBestMove;
}

// モジュール用
if (typeof module !== "undefined") {
  module.exports = { usiBestMove };
}
