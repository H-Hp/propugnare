import Rails from "@rails/ujs"
//import Turbolinks from "turbolinks"
import "@hotwired/turbo-rails"
//import "controllers" // Stimulusを使用する場合
import * as ActiveStorage from "@rails/activestorage"
//import "channels"
import "./channels/index.js";

import React from 'react'
import ReactDOM from 'react-dom/client'
//import Shogi from '../components/shogi/index'
import Shogi from './components/shogi/index.js';
import Matching from './matching.js';
//import Header from '../components/Header';
import Header from './components/Header.jsx';

import './lang/i18n'

/*
//react-rails v3では、コンポーネントをグローバルに登録するために、require.context を使った自動登録の方法が推奨されてて、これにより、ERB内の<%= react_component...がが正しく動作する
//app/javascript/componentsフォルダ内の.js および.jsx ファイルを自動登録する
const componentRequireContext = require.context('components', true, /\.(js|jsx)$/);
componentRequireContext.keys().forEach((filename) => {
  // ファイル名からコンポーネント名を抽出（例えば./Header.jsx → Headerなど）
  const componentName = filename.replace(/^.*[\\\/]/, '').replace(/\.(js|jsx)$/, '');
  const componentModule = componentRequireContext(filename);
  // グローバルオブジェクト window に登録
  window[componentName] = componentModule.default || componentModule;
});
*/

Rails.start()
//Turbolinks.start()
ActiveStorage.start()


