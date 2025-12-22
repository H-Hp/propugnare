import React, { useState } from 'react';

// アイコンコンポーネント（Lucide Reactがない場合の代替）
const ChevronDown = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9"></polyline>
  </svg>
);

const ChevronRight = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9,18 15,12 9,6"></polyline>
  </svg>
);

const BoardInfoDebugger = ({ boardInfoHistory, boardInfo, title = "BoardInfo デバッガー", className = "" }) => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // JSONを整形して表示する関数
  const formatJSON = (data, section_key ,depth = 0) => {
    //console.log("section_key:"+section_key)
    if (data === null || data === undefined) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof data === 'string') {
      return <span className="text-green-600">"{data}"</span>;
    }

    if (typeof data === 'number') {
      return <span className="text-blue-600">{data}</span>;
    }

    if (typeof data === 'boolean') {
      return <span className="text-purple-600">{data.toString()}</span>;
    }

    if (Array.isArray(data)) {
      return (
        <span className="ml-4">
        {/*<div className="ml-4">*/}
          {(section_key === 'selection') && <br />}<span className="text-gray-600">[</span>{(section_key !== 'selection') && <br />}
          {data.map((item, index) => (
            <span key={index} className="ml-2">
            {/*<div key={index} className="ml-2">*/}
              {/*<span className="text-gray-500">{index}: </span>*/}
              {/*formatJSON(item, depth + 1)*/}
              {formatJSON(item, section_key, depth + 1)}
              {index < data.length - 1 && <span className="text-gray-600 ml-2">,</span>}{(section_key === 'board' || section_key === 'pieceStand') && <br />}
            </span>
          ))}
          <span className="text-gray-600 ml-2"> ]</span>
        </span>
      );
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      return (
        <span className="ml-4"> 
        {/*<div className="ml-4">*/}
          <span className="text-gray-600">{' {'}</span>
          {entries.map(([key, value], index) => (
            <span key={key} className="ml-2">
            {/* <div key={key} className="ml-2"> */}
              <span className="text-red-600">"{key}"</span>
              <span className="text-gray-600">: </span>
              {/*formatJSON(value, depth + 1)*/}
              {formatJSON(value,section_key, depth + 1)}
              {index < entries.length - 1 && <span className="text-gray-600">,</span>}{(section_key === 'selection') && <br />}
            </span>
          ))}
          <span className="text-gray-600">{'}'}</span>
        </span>
      );
    }

    return <span className="text-gray-800">{String(data)}</span>;
  };

  // 配列の要素数を取得する関数
  const getArrayInfo = (arr) => {
    if (!Array.isArray(arr)) return '';
    return `(${arr.length} items)`;
  };

  // オブジェクトのプロパティ数を取得する関数
  const getObjectInfo = (obj) => {
    if (typeof obj !== 'object' || obj === null) return '';
    return `(${Object.keys(obj).length} properties)`;
  };

  // 単一のboardInfoを表示する関数
  const renderBoardInfo = (boardInfoData, prefix = '') => {
    if (!boardInfoData) {
      return (
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No BoardInfo data available</p>
        </div>
      );
    }

    const sections = [
      { key: 'nowTurn', label: 'nowTurn', icon: '🔄' },
      { key: 'board', label: 'board', icon: '🏁' },
      { key: 'selection', label: 'selection', icon: '👆' },
      { key: 'pieceStand', label: 'pieceStand', icon: '🎯' },
      { key: 'pieceStandNum', label: 'pieceStandNum', icon: '🔢' },
      { key: 'onPromoteConfirmCallback', label: 'onPromoteConfirmCallback', icon: '⚙️' },
      { key: 'other', label: 'その他', icon: '📋' }
    ];

    const knownKeys = ['nowTurn', 'board', 'selection', 'pieceStand', 'pieceStandNum', 'onPromoteConfirmCallback'];
    const otherKeys = Object.keys(boardInfoData).filter(key => !knownKeys.includes(key));

    return (
      <div className="space-y-2">
        {sections.map(({ key, label, icon }) => {
          const sectionKey = `${prefix}${key}`;
          
          // "other" セクションの特別処理
          if (key === 'other') {
            if (otherKeys.length === 0) return null;
            
            return (
              <div key={sectionKey} className="border border-gray-200 rounded-lg text-black">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="font-medium">{label}</span>
                    <span className="text-sm text-gray-500">({otherKeys.length} properties)</span>
                  </div>
                  {openSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                
                {openSections[sectionKey] && (
                  <div className="p-3 bg-gray-50 border-t">
                    <div className="font-mono text-xs bg-white p-2 rounded border overflow-auto max-h-60">
                      {otherKeys.map(otherKey => (
                        <div key={otherKey} className="mb-1">
                          <span className="text-red-600 font-semibold">"{otherKey}"</span>
                          <span className="text-gray-600">: </span>
                          {formatJSON(boardInfoData[otherKey],key) }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // 通常のセクション
          if (!(key in boardInfoData)) return null;

          const data = boardInfoData[key];
          let infoText = '';
          
          if (key === 'board' && Array.isArray(data)) {
            infoText = `${getArrayInfo(data)} - ${data[0] ? data[0].length : 0}x${data.length}`;
          } else if (Array.isArray(data)) {
            infoText = getArrayInfo(data);
          } else if (typeof data === 'object' && data !== null) {
            infoText = getObjectInfo(data);
          } else if (typeof data === 'function') {
            infoText = 'function';
          } else if (typeof data === 'string') {
            infoText = `"${data}"`;
          }

          return (
            <div key={sectionKey} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="w-full px-4 py-2 text-left bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="font-medium text-black">{label}</span>
                  <span className="text-sm text-gray-500">{infoText}</span>
                </div>
                {openSections[sectionKey] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {openSections[sectionKey] && (
                <div className="p-3 bg-gray-50 border-t">
                  {/* この中がデータの中身で、boardだったらその配列データが入ってる*/}
                  <div className="font-mono text-xs bg-white p-2 rounded border overflow-auto max-h-60">
                    {key === 'onPromoteConfirmCallback' && typeof data === 'function' ? (
                      <div>
                        <span className="text-purple-600">function</span>
                        <span className="text-gray-600"> (piece, i, j, callback) =＞ {'{'}</span>
                        <div className="ml-4 text-gray-500">// 成り確認のコールバック関数</div>
                        <span className="text-gray-600">{'}'}</span>
                      </div>
                    ) : (
                      formatJSON(data,label)
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 履歴が渡された場合は履歴表示、そうでなければ単一のboardInfo表示
  if (boardInfoHistory && Array.isArray(boardInfoHistory)) {
    return (
      <div className={`w-full max-w-6xl mx-auto p-4 bg-white shadow-lg rounded-lg ${className}`}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title} 履歴</h2>
        <div className="text-sm text-gray-600 mb-4">
          {boardInfoHistory.length} 件の履歴があります
        </div>
        
        {boardInfoHistory.map((historyItem, index) => {
          const historyKey = `history-${index}`;
          const reason = historyItem.reason || `履歴 ${index + 1}`;
          const boardInfoData = historyItem.boardInfo;
          
          return (
            <div key={historyKey} className="mb-3 border-2 border-blue-200 rounded-lg">
              <button
                onClick={() => toggleSection(historyKey)}
                className="w-full px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">📋</span>
                  <div>
                    <div className="font-semibold text-blue-800">
                      {index === boardInfoHistory.length - 1 && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">最新</span>
                      )}
                      {reason}
                    </div>
                    <div className="text-sm text-gray-600">
                      履歴 #{index + 1} - {boardInfoData ? `Turn: ${boardInfoData.nowTurn || 'N/A'}` : 'データなし'}
                    </div>
                  </div>
                </div>
                {openSections[historyKey] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              {openSections[historyKey] && (
                <div className="p-4 bg-blue-50 border-t-2 border-blue-200">
                  {renderBoardInfo(boardInfoData, `${historyKey}-`)}
                  
                  {/* Raw JSONセクション */}
                  <div className="mt-4 border border-gray-300 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${historyKey}-raw`)}
                      className="w-full px-3 py-2 text-left bg-yellow-50 hover:bg-yellow-100 flex items-center justify-between transition-colors text-sm "
                    >
                      <div className="flex items-center gap-2 text-black">
                        <span>🔍</span>
                        <span className="font-medium">Raw JSON</span>
                        <span className="text-sm text-gray-500">完全なデータ構造</span>
                      </div>
                      {openSections[`${historyKey}-raw`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    
                    {/*データの中身*/}
                    {openSections[`${historyKey}-raw`] && (
                      <div className="p-3 bg-yellow-50 border-t">
                        <div className="font-mono text-xs bg-white p-2 rounded border overflow-auto max-h-80 text-black">
                          {/*JSON.stringify(boardInfoData, null, 2)*/}
                          {formatJSON(boardInfoData,"board")}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
};

export default BoardInfoDebugger;