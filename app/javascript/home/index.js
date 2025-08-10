document.addEventListener('turbolinks:load', () => {
  console.log("test");




const open_buttle_menu_btn = document.getElementById('open-buttle-menu-btn');
open_buttle_menu_btn.addEventListener('click', function() {
    modal.style.display = "block";
});


/*
//function t() {
  const reserve_btn = document.getElementById('reserve-btn');
  reserve_btn.addEventListener('click', function() {
    const name="名無し";
    const mode="タイピング";
    const rate="";
    const time="5:00";
        //document.getElementById('json-zu').insertAdjacentHTML('beforeend', '<div class="go-buttle-btn" onClick="go_buttle()" style="border: #87f4f6"><p style="color: white;"><span class="key">' + name + '</span>: ' + mode + '</p></div>');
        //document.getElementById('reserve_tbody').insertAdjacentHTML('beforeend', '<tr><td></td><td>プレイヤー1</td><td>85</td><td>10:30</td><td>モード1</td></tr>');
        document.getElementById('reserve_tbody').insertAdjacentHTML('beforeend', `
            <tr class="go-buttle-btn" onclick="go_buttle()">
                <td></td>
                <td>`+name+`</td>
                <td>`+rate+`</td>
                <td>`+time+`</td>
                <td>`+mode+`</td>
            </tr>`);

        //console.log("mode:", mode); 
        modal.style.display = "none";//モーダルを閉じる
  });
*/


  /*const go_buttle_btn = document.getElementById('go-buttle-btn');
  go_buttle_btn.addEventListener('click', function() {
        alert("mode:"); 
  });
  */

  function go_buttle(){
    window.location.href = "battle_test.html";
  }
// モーダル
var modal = document.getElementById("myModal");// モーダル要素を取得
//var btn = document.getElementById("openModal");// モーダルを開くボタンを取得
var span = document.getElementsByClassName("close")[0];// モーダルを閉じるための <span> 要素を取得
/*btn.onclick = function() {// ボタンがクリックされたらモーダルを開く
  modal.style.display = "block";
}*/
span.onclick = function() {// <span> (x) がクリックされたらモーダルを閉じる
  modal.style.display = "none";
}
window.onclick = function(event) {// モーダルの外側がクリックされたらモーダルを閉じる
  if (event.target == modal) {
    modal.style.display = "none";
  }
}


});