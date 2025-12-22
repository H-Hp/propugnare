import React from "react";

export const CoordsRanks = ({ yourRole }) => {
  const isGote =(yourRole === "後手" || yourRole === "gote" );  // 後手なら true
  return (
    <>
      <div className={`coords ranks ${isGote ? "reverse" : ""}`}　>        
        <span>一</span>
        <span>二</span>
        <span>三</span>
        <span>四</span>
        <span>五</span>
        <span>六</span>
        <span>七</span>
        <span>八</span>
        <span>九</span>
      </div>
    </>
  );
};

export default CoordsRanks;