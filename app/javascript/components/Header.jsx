import React from 'react';
import ReactDOM from 'react-dom/client';
import { useState } from 'react';
import { useEffect } from 'react'
import ContactModal from './ContactModal';
import AboutModal from './AboutModal';
import Cookies from 'js-cookie'
import { useTranslation } from 'react-i18next'
import i18n from '../lang/i18n' 

const Header = ({ logoPath }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const [lang, setLang] = useState('ja')
  const { t } = useTranslation()

  // 初期表示時に Cookie またはブラウザ言語から lang を決定
  useEffect(() => {
    let current = Cookies.get('lang')
    if (!current) {
      const browser = navigator.language
      let browserLang = 'ja'
      if (browser.startsWith('ja')) {
        browserLang = 'ja'
      } else if (browser.startsWith('en')) {
        browserLang = 'en'
      } else if (browser.startsWith('zh')) {
        browserLang = 'zh'
      }
      Cookies.set('lang', browserLang)
      current = browserLang
    }
    setLang(current)

    //ここで jsのi18n に反映
    i18n.changeLanguage(current)
  }, [])
  // セレクト変更時に Cookie に保存 → ページリロード
  const handleLangChange = (e) => {
    Cookies.set('lang', e.target.value)
    setLang(e.target.value)
    window.location.reload()
  }

  const tweetText = encodeURIComponent("Propugnare - 無料オンライン将棋アプリ | 対戦・練習・棋譜解析");
  const tweetUrl  = encodeURIComponent("https://propugnare.online");
  const shareLink = `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;

  return (
    <>
      <header className="bg-[#dc143c] text-white h-[30px]">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* ロゴ部分：クリックでホームへ（"/"） */}
          <a href="/" className="flex items-center">
            {/* Rails から渡されたロゴ画像のパスで画像表示 */}
            <img src={logoPath} alt="Shogi Logo" className="h-[30px] mr-2" />
            <span className="font-bold text-xs">Propugnare</span>
          </a>

          <button
            onClick={() => setAboutOpen(true)}
            className="text-xs hover:underline focus:outline-none"
          >
            {t('header.about')}
          </button>

          {/* お問合せボタン */}
          <button
            onClick={openModal}
            className="text-xs hover:underline focus:outline-none"
          >
            {t('header.contact')}
          </button>


          {/* 言語セレクタ */}
          <div className="flex items-center text-sm text-black bg-white rounded px-2 py-1">
            <select
              id="lang_select"
              value={lang}
              onChange={handleLangChange}
              className="bg-transparent focus:outline-none"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="md:right-14 md:top-6 text-xl text-gray hover:text-blue-600"
          >
            {/* Xの公式SVGロゴ */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
            </svg>
          </a>

          {/* ウィジェットスクリプトは必ず platform.twitter.com を指す */}
          <script
            async
            src="https://platform.twitter.com/widgets.js"
            charSet="utf-8"
          />

          <a className="text-xl text-white" href="https://github.com/H-Hp/propugnare">
              <button className="text-xl text-white github-button">
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                      <path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9a127.5 127.5 0 0 1 38.1 91v112.5c.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z">
                      </path>
                  </svg>
              </button>
          </a>
        </div>
      </header>
      {isAboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
      {isModalOpen && <ContactModal onClose={closeModal} />}
    </>
  );
};

export default Header;
