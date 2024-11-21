import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

import React from 'react'
//import ReactDOM from 'react-dom'
import ReactDOM from 'react-dom/client'
//import PropTypes from 'prop-types'
//import HelloWorld from '../components/HelloWorld'
import Shogi from '../components/shogi/index'

Rails.start()
Turbolinks.start()
ActiveStorage.start()

/*
document.addEventListener('DOMContentLoaded', () => {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  root.render(<Game />);
});
*/
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Shogi />);
})
