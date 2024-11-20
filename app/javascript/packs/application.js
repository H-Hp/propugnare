import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

import React from 'react'
//import ReactDOM from 'react-dom'
import ReactDOM from 'react-dom/client'
import HelloWorld from '../components/HelloWorld'

Rails.start()
Turbolinks.start()
ActiveStorage.start()

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(<HelloWorld />);
})
