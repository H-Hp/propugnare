import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

import React from 'react'
import ReactDOM from 'react-dom/client'
import Shogi from '../components/shogi/index'

import Header from '../components/Header';

//react-rails v3 では、コンポーネントをグローバルに登録するために、require.context を使った自動登録の方法が推奨されてて、これにより、ERB内の<%= react_component...がが正しく動作する
// app/javascript/components フォルダ内の .js および .jsx ファイルを自動登録する
const componentRequireContext = require.context('components', true, /\.(js|jsx)$/);
componentRequireContext.keys().forEach((filename) => {
  // ファイル名からコンポーネント名を抽出（例: "./Header.jsx" → "Header"）
  const componentName = filename.replace(/^.*[\\\/]/, '').replace(/\.(js|jsx)$/, '');
  const componentModule = componentRequireContext(filename);
  // グローバルオブジェクト window に登録
  window[componentName] = componentModule.default || componentModule;
});

//import ReactRailsUJS from 'react_ujs';
//ReactRailsUJS.register({ Header });
//import ReactOnRails from 'react-on-rails';//ダメ
//import ReactOnRails from 'react_ujs'; // ダメ
//import { ReactOnRails } from "react-rails";// ダメ
//import { ReactOnRails } from 'react-rails/react_ujs'
//import { ReactOnRails } from '@rails/react_ujs'
//import ReactOnRails from 'react_ujs';

//ReactOnRails.register({ Header });
//ReactRailsUJS.register({ Header });// ReactRailsUJSに登録する（自動登録されない場合はこちらを明示的に行う） 


// コンポーネントを登録
//ReactOnRails({Header})
//window.ReactRailsUJS.register({ Header });

/*
// コンポーネントフォルダ内の .js, .jsx ファイルを全て自動登録する
const componentRequireContext = require.context('components', true, /\.(js|jsx)$/);
componentRequireContext.keys().forEach((filename) => {
  // ファイル名からコンポーネント名を抽出（例："./Header.jsx" → "Header"）
  const componentName = filename.replace(/^.*[\\\/]/, '').replace(/\.(js|jsx)$/, '');
  const componentModule = componentRequireContext(filename);
  // グローバルオブジェクト（window）に登録する
  window[componentName] = componentModule.default || componentModule;
});
*/
/*
// react-rails がコンポーネントを認識できるように登録
// React 18 を使っている場合は ReactDOM.createRoot を使う必要があります。
// react-rails の推奨する登録方法に沿って記述します。
// 例: window.ReactRailsUJS.mountComponents() が呼ばれる際に認識されるようにする
if (typeof window.ReactRailsUJS !== 'undefined') {
  // react-rails のデフォルトの登録方法
  // ReactRailsUJS.register があれば、それを使う
  if (typeof window.ReactRailsUJS.register === 'function') {
    window.ReactRailsUJS.register({ Header });
  } else {
    // 古いバージョンや異なる設定の場合のフォールバック
    // コンポーネントをグローバルな名前空間に直接割り当てる
    // これは React 18 の場合、ReactDOM.createRoot を使うための追加ロジックが必要になることがあります
    window.Header = Header;
  }
} else {
  // react-rails がないか、まだロードされていない場合
  // 開発環境で素早く試すための簡易的な登録
  window.Header = Header;
}
*/


Rails.start()
Turbolinks.start()
ActiveStorage.start()
//ReactRailsUJS.start()
/*
document.addEventListener('DOMContentLoaded', () => {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  root.render(<Game />);
});
*/
/*
  document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(<Shogi />);
  })
*/