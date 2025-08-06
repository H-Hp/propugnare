// Load all the channels within this directory and all subdirectories.
// Channel files must be named *_channel.js.

//const channels = require.context('.', true, /_channel\.js$/)
//channels.keys().forEach(channels)

import './consumer'; // Action Cable の consumer をインポート (通常はここ)
//import './matching'; // matching.js をインポート