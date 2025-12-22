import React from "react";

export const CoordsFiles = ({ yourRole }) => {
  const isGote =(yourRole === "後手" || yourRole === "gote" );  // 後手なら true
  return (
    <>
      <div className={`coords files ${isGote ? "reverse" : ""}`} >
        <span>9</span>
        <span>8</span>
        <span>7</span>
        <span>6</span>
        <span>5</span>
        <span>4</span>
        <span>3</span>
        <span>2</span>
        <span>1</span>
      </div>
      {/*
        style={ (yourRole === "後手" || yourRole === "gote" ) //&& !aiMode //後手でaiモードがtrueなら回転させる・align-items:flex-startで垂直方向を上端揃え
          ? { transform: "rotate(180deg)"}
          : undefined
        }
      */}
    </>
  );
};

export default CoordsFiles;