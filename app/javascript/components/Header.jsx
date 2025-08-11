import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import ContactModal from './ContactModal';

const Header = ({ logoPath }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  return (
    <>
      <header className="bg-[#dc143c] text-white h-[30px]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* ロゴ部分：クリックでホームへ（"/"） */}
          <a href="/" className="flex items-center">
            {/* Rails から渡されたロゴ画像のパスで画像表示 */}
            <img src={logoPath} alt="Shogi Logo" className="h-[30px] mr-2" />
            <span className="font-bold text-xs">Shogi Game</span>
          </a>

          {/* お問合せボタン */}
          <button
            onClick={openModal}
            className="text-xs hover:underline focus:outline-none"
          >
            お問合せ
          </button>
        </div>
      </header>
      {isModalOpen && <ContactModal onClose={closeModal} />}
    </>
  );
};

/*
document.addEventListener('turbolinks:load', () => {//urbolinks による初回ページロード時・Turbolinks によるページ遷移時・通常のブラウザリロード時 のすべてで発生します。
  const rootElement = document.createElement('div');
  //document.body.appendChild(rootElement);//bodyタグ内の一番下に挿れる
  document.body.prepend(rootElement);//bodyタグ内の一番上に挿れる
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Header />);
})
*/

export default Header;
