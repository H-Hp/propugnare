import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

import React from 'react'
import ReactDOM from 'react-dom/client'
import Shogi from '../components/shogi/index'
import Header from '../components/Header';

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

Rails.start()
Turbolinks.start()
ActiveStorage.start()
