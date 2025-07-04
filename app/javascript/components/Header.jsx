import React from 'react';
import ReactDOM from 'react-dom/client';

const Header = ({ logoPath }) => {
  return (
    <header className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* ロゴ部分：クリックでホームへ（"/"） */}
        <a href="/" className="flex items-center">
          {/* Rails から渡されたロゴ画像のパスで画像表示 */}
          <img src={logoPath} alt="Shogi Logo" className="h-8 mr-2" />
          <span className="font-bold text-xs">Shogi Game</span>
        </a>
        {/* ナビゲーション（必要に応じて編集） */}
        <nav>
          <ul className="flex space-x-4">
            <li>
              <a href="/about" className="hover:underline">About</a>
            </li>
            <li>
              <a href="/rules" className="hover:underline">Rules</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

document.addEventListener('turbolinks:load', () => {//urbolinks による初回ページロード時・Turbolinks によるページ遷移時・通常のブラウザリロード時 のすべてで発生します。
  const rootElement = document.createElement('div');
  //document.body.appendChild(rootElement);//bodyタグ内の一番下に挿れる
  document.body.prepend(rootElement);//bodyタグ内の一番上に挿れる
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Header />);
})

export default Header;
