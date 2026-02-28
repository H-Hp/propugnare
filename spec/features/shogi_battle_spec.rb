#機能テスト・E2Eテスト
#コマンド：bundle exec rspec spec/features/shogi_battle_spec.rb --backtrace
=begin
  RSpec.feature "将棋対戦（機能テスト）", js: true do
    scenario "2人がマッチングして対戦できる" do
      # ユーザー1 マッチング開始
      # ユーザー2 マッチング開始
      # 将棋盤が表示される
    end
    scenario "先手の手が後手に反映される" do
      # 駒をクリック
      # 移動
      # 相手画面で盤面更新を確認
    end
  end


  RSpec.feature "将棋対戦（E2E）", type: :feature, js: true do
    scenario "2人のユーザーがマッチングして対局を開始し、駒を動かす" do
      # --- ユーザー1：マッチング待機 ---
      # using_session で「User1」という名前の別ブラウザウィンドウを立ち上げるイメージ
      using_session("User1") do
        visit root_path                           # トップページへアクセス
        fill_in "ユーザー名", with: "Sente"         # フォームに名前「Sente（先手）」を入力
        click_button "対戦相手を探す"                # 検索開始。ActionCable等で待機状態へ
        expect(page).to have_content "マッチング中..." # 画面が切り替わり、待機中メッセージが出ることを確認
      end

      # --- ユーザー2：マッチング開始 ---
      # 「User2」用の新しいブラウザウィンドウに切り替える（User1は裏で待機中）
      using_session("User2") do
        visit root_path                           # トップページへアクセス
        fill_in "ユーザー名", with: "Gote"          # フォームに名前「Gote（後手）」を入力
        click_button "対戦相手を探す"                # ここでサーバー側で User1 と User2 がマッチングされる
      end

      # --- 両者が対局画面へ ---
      # 再び User1 の画面に戻って確認
      using_session("User1") do
        # マッチング成功により、/shogi/任意のID というURLにリダイレクトされたか検証
        expect(page).to have_current_path(/shogi\/.+/)
        # 対局相手（User2）の名前が画面上に表示されているか確認
        expect(page).to have_content "Gote" 
        
        # 駒を動かす（Reactコンポーネントの操作）
        # クラス名 ".square-7-7" を持つ要素をクリック（7七にある自分の駒を選択）
        find(".square-7-7").click 
        # 移動先である ".square-7-6" をクリック（7六へ移動）
        find(".square-7-6").click 
      end

      # --- ユーザー2の画面に反映されるか ---
      # User2 のブラウザに戻り、User1 の指し手が反映されているか（リアルタイム通信の確認）
      using_session("User2") do
        # User1 が動かした結果、特定のCSSクラス（7六に先手の歩がある状態）が存在するか検証
        # これにより、WebSocket (ActionCable) を通じた同期が正常かチェックできる
        expect(page).to have_css(".piece-sente-fu-7-6") # 先手の歩が7六にあるか確認
      end
    end
  end
=end

require 'rails_helper'
# type: :feature ... ブラウザ操作を伴うテストであることを指定
# js: true ... JavaScript（Reactなど）を動かすためにSelenium等のドライバを使用する設定
RSpec.feature "将棋対戦（E2E）", type: :feature, js: true do

  # 画面の解像度設定（環境に合わせて調整してください）
  screen_width = 1600
  screen_height = 1000
  half_width = screen_width / 2

  let(:redis) { $redis }

  # 各テスト実行前に必ず実行される処理
  before do
    # Redisの中身をすべて削除（前のテストの影響を消す）
    redis.flushdb

    # アプリ内で Redis.new が呼ばれたら、必ずこの redis を使うように差し替える（モック）
    allow(Redis).to receive(:new).and_return(redis)

    # キャッシュを無視してリロード（JS側で確実にするため）
    page.driver.browser.navigate.refresh
  end

  scenario "2人のユーザーがマッチングして対局を開始し、駒を動かす" do
    # テスト側でユニークなIDを生成
    #user1_id = SecureRandom.uuid
    
    # --- ユーザー1の操作 ---
    using_session("User1") do
      # ウィンドウのサイズと位置を設定
      page.driver.browser.manage.window.resize_to(half_width, screen_height)
      page.driver.browser.manage.window.move_to(0, 0)

      visit root_path # 設定したルートURL（ / ）にブラウザでアクセスします

      # 一度アクセスして、セッションCookieがセットされるのを待つ
      # 何か適当な要素が表示されるのを待つことで、通信が完了したことを保証する
      expect(page).to have_content("オンライン対戦一覧")

      # nickName入力欄が「存在する場合のみ」マッチング操作を行う(すでにマッチング待機中の場合は処理しない)
      if page.has_css?("input#nickName", wait: 3)
        fill_in "nickName", with: "ユーザー1"
        click_button "対戦相手を探す"
      end

      #sleep 1

      # 既にマッチング中 or 今開始した場合、どちらでもここに来る
      #expect(page).to have_content("マッチング待機中").or have_current_path(/shogi\/.+/)

      # 購読完了を示すUIの表示を待つ
      expect(page).to have_content("マッチング待機中", wait: 10)
      # UIに変化がない場合は、少しスリープを入れる（デバッグ用）
      #sleep 2

=begin
      expect(page).to have_css("input#nickName", wait: 10)
      #expect(page).to have_field("nickName", wait: 5) #描画を待ってから fill_in

      # ブラウザの中から以下のいずれかを探して "Sente" と入力します。
      # 1. <label>ニックネーム</label> に紐付いた <input>
      # 2. id="ニックネーム" または name="ニックネーム" の属性を持つ <input>
      # 3. placeholder="ニックネーム" の属性を持つ <input>
      fill_in "nickName", with: "Sente"

      # <button>対戦相手を探す</button> または <input type="submit" value="対戦相手を探す"> を探してクリックします。
      click_button "対戦相手を探す"

      # 画面内のどこかに「マッチング中...」というテキストが表示されるまで数秒間待ちます。
      # Reactで state が更新されて文字が表示されるのを自動で待ってくれる賢い機能です。
      expect(page).to have_content "マッチング中..."
=end
      
    end
    
    # --- ユーザー2の操作（User1が待っている間に別のブラウザで入る） ---
    using_session("User2") do
      # ウィンドウのサイズと位置を設定
      page.driver.browser.manage.window.resize_to(half_width, screen_height)
      page.driver.browser.manage.window.move_to(half_width, 0)

      visit root_path
      if page.has_css?("input#nickName", wait: 3)
        #expect(page).to have_field("nickName", wait: 5) #描画を待ってから fill_in
        #expect(page).to have_css("input#nickName", wait: 10)
        fill_in "nickName", with: "ユーザー2"
        click_button "対戦相手を探す"
      end
    end

    # 駒を動かす共通処理（関数化しておくと楽です）
    def move_piece(from_i, from_j, to_i, to_j)
      find("button.square[data-i='#{from_i}'][data-j='#{from_j}']").click
      find("button.square[data-i='#{to_i}'][data-j='#{to_j}']").click
    end

    #例えば7七歩を i=6, j=7に変換するメソッド
    def parse_shogi_move(move_str)
      # 数字と漢字を分離 (例: "2七歩" -> "2", "七")
      match = move_str.match(/([１-９1-9])([一二三四五六七八九])/)
      return nil unless match

      # 筋の数字 (2や8)
      suji = match[1].tr('１-９', '1-9').to_i
      # 段の数字 (七->7, 三->3)
      kanji_map = { '一'=>1, '二'=>2, '三'=>3, '四'=>4, '五'=>5, '六'=>6, '七'=>7, '八'=>8, '九'=>9 }
      dan = kanji_map[match[2]]

      # --- ご提示のルールに基づく変換 ---
      
      # j（列）: 9 - 筋 (2筋なら 9-2=7, 8筋なら 9-8=1)
      j = 9 - suji
      
      # i（行）: 
      # 2七歩(dan=7) -> i=6 なので dan-1
      # 2六歩(dan=6) -> i=5 なので dan-1
      # 8三歩(dan=3) -> i=2 なので dan-1
      # 8四歩(dan=4) -> i=3 なので dan-1
      i = dan - 1

      [i, j]
    end

    # --- 対局開始の確認 ---
    using_session("User1") do
      # マッチングが成功し、URLが「/shogi/123」のような対局ルームに切り替わったか判定します。
      # 「.+」は「何らかの文字（IDなど）が続く」という意味の正規表現です。
      #expect(page).to have_current_path(/shogi\/.+/)
      # wait: 10（10秒間、URLが変わるまで繰り返し判定する）
      #expect(page).to have_current_path(/shogi\/.+/, wait: 10)

      # 遷移を待つ（自動遷移が動く場合）
      # もし遷移せずボタンが出たらクリックする
      begin
        expect(page).to have_current_path(/shogi\/.+/, wait: 5)
      rescue RSpec::Expectations::ExpectationNotMetError
        if page.has_link?("ゲームを開始する") || page.has_button?("ゲームを開始する")
          click_on "ゲームを開始する"
          expect(page).to have_current_path(/shogi\/.+/, wait: 5)
        else
          raise # ボタンもなければそのままエラーを出す
        end
      end

      #将棋ページ読み込み後
      
      # 将棋ページの読み込み完了確認
      expect(page).to have_content("手番", wait: 10)
      #expect(page).to have_content("gote", wait: 30)
      
      #sleep 100

      #$stdin.gets

      # JSX側で <div className="square-7-7" ...> と定義されている要素を探してクリックします。
      # Reactで「どのマスがクリックされたか」を検知する onClick ハンドラが動きます。
      #find(".square-7-7").click # 7七の駒（自分の歩など）を選択
      #find(".square-7-6").click # 7六のマスをクリックして移動先を指定
      # 7七の駒（i=6, j=2）を選択
      #find('button.square[data-i="6"][data-j="7"]').click

      # 7六（i=6, j=3）へ移動
      #find('button.square[data-i="5"][data-j="7"]').click

    end
=begin
    #ループ化して自動で指させる
    # --- ユーザー1の操作 ---
    Capybara.using_session("user1") do
      # 自分が「先手(sente)」かつ ターンが「先手」になるのを待つ
      # デバッグエリアなどの表示を利用して待機
      expect(page).to have_content("yourRole: sente")
      expect(page).to have_content("nowTurn: sente")
      
      move_piece(6, 2, 6, 3) # 7七歩 -> 7六歩
    end

    # --- ユーザー2の操作 ---
    Capybara.using_session("user2") do
      # 自分が「後手(gote)」かつ ターンが「後手」になるのを待つ
      expect(page).to have_content("yourRole: gote")
      expect(page).to have_content("nowTurn: gote")
      
      move_piece(2, 6, 2, 5) # 3三歩 -> 3四歩
    end
=end

    # --- 同期確認 ---
    using_session("User2") do
      #sleep 80
      # 【解説】have_css(".piece-sente-fu-7-6")
      # User1が動かした結果、User2の画面でも駒が動いたかを「クラス名」で判定します。
      # JSX例: <div className="piece-sente-fu-7-6" /> 
      # サーバー経由（ActionCableなど）でデータが届き、Reactが再描画されたことを証明します。
      #expect(page).to have_css(".piece-sente-fu-7-6") 
      #expect(page).to have_content("gote", wait: 60)

      # 将棋ページの読み込み完了確認
      expect(page).to have_content("手番", wait: 10)
    end

    # 1. どちらが先手（最初のターン）か判定する
    sente_session = nil
    gote_session = nil

    # 両方のブラウザを開いた状態で判定
    ["User1", "User2"].each do |session_name|
      Capybara.using_session(session_name) do
        # 5秒以内に「あなたの手番です」があれば、その人が先手
        if page.has_content?("あなたの手番です", wait: 5)
          sente_session = session_name
          gote_session = (session_name == "User1" ? "User2" : "User1")
        end
      end
      break if sente_session # 先手が見つかればループ終了
    end

    puts "判定結果: 先手=#{sente_session}, 後手=#{gote_session}"

    # 棋譜データ
=begin
    kifu_steps = [
      ["7七歩", "7六歩"], # 1手目：先手
      ["3三歩", "3四歩"], # 2手目：後手
      ["7六歩", "7五歩"], # 3手目：先手
      ["3四歩", "3五歩"]  # 4手目：後手
    ]

    # 棋譜データ (先手勝利の最短ルート)
    kifu_steps = [
      ["2七歩", "2六歩"], # 1手目：先手（飛車先を突く）
      ["8三歩", "8四歩"], # 2手目：後手
      ["2六歩", "2五歩"], # 3手目：先手（さらに突く）
      ["8四歩", "8五歩"], # 4手目：後手
      ["2五歩", "2四歩"], # 5手目：先手（歩のぶつかり）
      ["2三歩", "2四歩"], # 6手目：後手（同歩：二歩回避のためここで取り込む）
      ["2八飛", "2四飛"], # 7手目：先手（同飛：飛車で取り返す）
      ["8五歩", "8六歩"], # 8手目：後手
      ["2四飛", "2三飛"], # 9手目：先手（飛車が敵陣へ成る前段階）
      ["3一金", "3二金"], # 10手目：後手（守りを固める）
      ["2三飛", "2二飛"]  # 11手目：先手（王の隣へ。実際はここで「成る」を選択して龍に）
    ]
=end
    # 棋譜データ (先手勝利のルート)
    kifu_steps = [
      ["2七歩", "2六歩"], # 1手目：先手
      ["8三歩", "8四歩"], # 2手目：後手
      ["2六歩", "2五歩"], # 3手目：先手
      ["8四歩", "8五歩"], # 4手目：後手
      ["2五歩", "2四歩"], # 5手目：先手
      ["2三歩", "2四歩"], # 6手目：後手（同歩：これで2筋の歩が消えるので二歩を回避）
      ["2八飛", "2四飛"], # 7手目：先手（同飛）
      ["4一玉", "3二玉"], # 8手目：後手（玉が逃げ始める）
      ["2四飛", "2二飛"], # 9手目：先手（敵陣突入：ここで「成る(龍)」を選択）
      ["3二玉", "4二玉"], # 10手目：後手
      ["2二飛", "4二飛"]  # 11手目：先手（王を取って詰み。実際はここで「成る(龍)」を選択）
    ]

    # 3. ループで実行
    kifu_steps.each_with_index do |(from_str, to_str), index|
      # 符号を座標 (i, j) に変換
      from_i, from_j = parse_shogi_move(from_str)
      to_i, to_j = parse_shogi_move(to_str)

      current_session = index.even? ? sente_session : gote_session

      Capybara.using_session(current_session) do
        puts "#{index + 1}手目: #{from_str} -> #{to_str} (Session: #{current_session})"
        
        #expect(page).to have_content("あなたの手番です", wait: 15)

        # 変換した i, j を使ってクリック
        find("button.square[data-i='#{from_i}'][data-j='#{from_j}']").click
        find("button.square[data-i='#{to_i}'][data-j='#{to_j}']").click

        # 「成る・成らない」モーダルが出現した場合の処理
        if page.has_css?(".promote-modal", wait: 2)
          # 2番目の画像（龍やと金など、成った後の駒）をクリックする
          # HTML構造上、1番目が「成らない(飛)」、2番目が「成る(龍)」と推測されます
          all(".promote-modal img")[1].click
          puts "モーダルで『成る』を選択しました"
        end

        # モーダルが消えて着手が完了するのを待つ        
        expect(page).to have_no_content("あなたの手番です", wait: 10)

        #puts "差したらEnter"
        #$stdin.gets
      end
    end

=begin
        kifu_steps.each_with_index do |(f_i, f_j, t_i, t_j), index|
      # 奇数手目(index 0, 2...)は先手のセッション、偶数手目(index 1, 3...)は後手のセッション
      current_session = index.even? ? sente_session : gote_session

      Capybara.using_session(current_session) do
        puts "#{index + 1}手目実行中 (Session: #{current_session})"
        
        # 自分の手番表示が出るまで待つ
        expect(page).to have_content("あなたの手番です", wait: 15)
        
        # 駒を動かす
        find("button.square[data-i='#{f_i}'][data-j='#{f_j}']").click
        find("button.square[data-i='#{t_i}'][data-j='#{t_j}']").click
        
        # 手番が切り替わったことを確認
        expect(page).to have_no_content("あなたの手番です", wait: 10)
      end
    end
=end
=begin
    # 1. 棋譜データ（動かす順序どおりに定義）
    # [セッション名, from_i, from_j, to_i, to_j]
    kifu = [
      ["user1", 6, 7, 5, 7], # 1手目：先手 7七歩 -> 7六歩
      ["user2", 2, 1, 3, 1], # 2手目：後手 3三歩 -> 3四歩
      ["user1", 5, 7, 4, 7], # 3手目：先手 7六歩 -> 7五歩
      ["user2", 3, 1, 4, 1]  # 4手目：後手 3四歩 -> 3五歩
    ]

    # 2. ループで実行
    kifu.each_with_index do |(session_name, f_i, f_j, t_i, t_j), index|

      Capybara.using_session(session_name) do

        $stdin.gets

        puts "#{index + 1}手目実行中: #{session_name}"
        
        # 自分の手番になるのを待ってから動かす
        expect(page).to have_content("あなたの手番です", wait: 10)
        
        find("button.square[data-i='#{f_i}'][data-j='#{f_j}']").click
        find("button.square[data-i='#{t_i}'][data-j='#{t_j}']").click
        
        # 動かした後は、自分の手番表示が消えるのを待つ（連打・誤作動防止）
        expect(page).to have_no_content("あなたの手番です", wait: 5)
      end
    end
=end
    puts "全ての棋譜の再現が完了しました。"
    $stdin.gets
  end
end