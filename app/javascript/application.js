import Rails from "@rails/ujs"
//import Turbolinks from "turbolinks"
import "@hotwired/turbo-rails"
//import "controllers" // Stimulusを使用する場合
import * as ActiveStorage from "@rails/activestorage"
import "./channels/index.js";

import React from 'react'
import ReactDOM from 'react-dom/client'
import Shogi from './components/shogi/index.js';
import Matching from './matching.js';
import Header from './components/Header.jsx';
import './lang/i18n'

Rails.start()
//Turbolinks.start()
ActiveStorage.start()


