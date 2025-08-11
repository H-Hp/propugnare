import React from 'react';

const AboutModal = ({ onClose }) => {

    const features = [
    {
      title: "リアルタイム対局",
      description: "世界中のプレイヤーとリアルタイムで対局できます"
    },
    {
      title: "局面解析機能", 
      description: "AIによる局面分析で棋力向上をサポート"
    },
    {
      title: "ランキング・実績機能",
      description: "全国ランキングや様々な実績システム"
    }
  ];

  return (
    <div
      aria-hidden="false" //検索エンジンにモーダル内の内容をクロールさせたい場合・モーダルのラッパ要素に aria-hidden="false" を設定し、かつ Tailwind で非表示にならない状態にしておく必要があります。検索エンジンは display: none や visibility: hidden の要素は基本的にクロール対象外にする傾向があるため、見た目はモーダル風にしても DOM 的には表示状態にしておく
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ×
        </button>

        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-orange-100">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-amber-500 to-red-500 p-3 rounded-xl mr-4">
                  
                </div>
                <h2 className="text-2xl font-bold text-gray-800">このサイトPropugnareについて</h2>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl mb-6 border-l-4 border-amber-500">
                <p className="text-gray-700 leading-relaxed mb-4">
                  <span className="font-semibold text-amber-800">Propugnare</span>は、将棋を気軽に楽しめるオンラインゲームサイトです。
                  友達や全国のプレイヤーと対局し腕試しができます。初心者から上級者まで、
                  すべてのレベルのプレイヤーが楽しめる環境を提供しています。
                </p>
                <p className="text-gray-600 text-sm">
                  最新のWebテクノロジーを使用し、スムーズな対局体験と豊富な機能でお楽しみいただけます。
                </p>
              </div>

              {/* 機能一覧 */}
              <div className="grid md:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-orange-50 p-5 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <div className="flex items-center mb-3">
                      <div className="bg-gradient-to-r from-amber-500 to-red-500 text-white p-2 rounded-lg mr-3">
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        {/*<h2 className="text-lg font-bold mb-4">このサイトPropugnareについて</h2>
        <p className="text-sm mb-2">
          将棋を気軽に楽しめるオンラインゲームサイトです。
          友達や全国のプレイヤーと対局し腕試しができます。
        </p>
        <ul className="list-disc list-inside text-sm">
          <li>リアルタイム対局</li>
          <li>局面解析機能</li>
          <li>ランキング・実績機能</li>
        </ul>
        */}
      </div>
    </div>
  );
};

export default AboutModal;