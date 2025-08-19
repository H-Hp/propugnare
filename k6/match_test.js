import http from "k6/http";
import { check, sleep } from "k6";

const jar = new http.CookieJar();//http.CookieJar を使うと、最初の GET で発行されたセッション Cookie（_yourapp_session）を次のリクエストに自動で付与できます

export const options = {
  vus: 10, // 仮想ユーザー数
  duration: "10s", // テスト時間
};


export default function () {

  //初期ページを取得してセッションCookie＋CSRFトークンを入手
  let res = http.get('http://localhost:3000/', { jar });
  check(res, { 'get /match 200': (r) => r.status === 200 });
  //レスポンスHTMLから<meta>のCSRFトークンを正規表現で抜き出す
  const match = res.body.match(/<meta name="csrf-token" content="([^"]+)"/);
  if (!match) {
    throw new Error('CSRF token not found!');
  }
  const csrfToken = match[1];
  //マッチング開始APIをPOST。ヘッダに X-CSRF-Token を付与
  const payload = JSON.stringify({
    /* 必要なパラメータ */ 
    battleType: "10min", 
    userName: "テストくん" // パラメータはアプリに合わせる
  });
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  };


  // Rails CSRFトークンが必要な場合は cookie や meta タグから取得して送信
  let postRes = http.post("http://localhost:3000/matching/start", 
    payload,
    { headers, jar }
  );

  check(postRes, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(1);
}