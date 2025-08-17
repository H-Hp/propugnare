import React from "react";

const LoadingOverlay = ({ loadingimgPath, loadingMessage }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div
        id="loading-overlay"
        className={`bg-[url('${loadingimgPath}')] bg-no-repeat bg-cover bg-center w-[50%] h-[50%]`}
      >
        {/* レインボーアニメーション背景付きバージョン */}
        <div className="fixed right-5 bottom-5 z-50">
          <div className="mt-4">
            <div
              className={`
                relative px-4 py-2 rounded-full transition-all duration-300
                bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400
              `}
            >
              <p className="text-xl font-bold text-white relative z-10 drop-shadow-lg">
                Propugnare
              </p>
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 via-indigo-400 to-purple-400 rounded-full blur-sm opacity-70"></div>
            </div>
          </div>
        </div>
      </div>
      {/*        
        <div id="loading-overlay" className={`bg-[url('${loadingimgPath}')] bg-no-repeat bg-cover bg-center`}>
          <div className="spinner"></div>
          <p className="ml-4 text-xl text-white">{loadingMessage}</p>
        </div> 
      */}
    </div>
  );
};

export default LoadingOverlay;