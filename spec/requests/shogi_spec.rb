#単体テストと統合テストの将棋のマッチングと対戦のテスト
#コマンド：bundle exec rspec spec/requests/shogi_spec.rb --backtrace
=begin
  マッチング完了時にゲームルームのデータを作成
    # 一意な room_id を生成
    room_id = SecureRandom.uuid

    sente_identifier=session.id.to_s # 現在のセッションIDをユーザー識別子として使用
    gote_identifier=session.id.to_s
    sente_user_name="ユーザー1"
    gote_user_name="ユーザー2"
    sente_user_agent=request.user_agent
    gote_user_agent=request.user_agent
    battleType="10min"

    # ゲーム部屋の情報をRedisのHashにまとめる
    room_data = {
      sente_identifier: sente_identifier,
      gote_identifier: gote_identifier,
      sente_user_agent: sente_user_agent,
      gote_user_agent: gote_user_agent,
      sente_user_name: sente_user_name,
      gote_user_name: gote_user_name,
      status: 'active',
      battleType: battleType,
      created_at: Time.current.to_i,
    }

  redisにゲームルームデータを格納
    game_rooms_key = "game_room:#{room_id}"
    DELETE_TIME = 30 * 60 #30分を秒単位で定義・30分 * 60秒 = 1800秒
    $redis.setex(game_rooms_key, DELETE_TIME, room_data.to_json)

  将棋の対戦ページにアクセス
    /shogi/room_id
    /shogi/1f7cddc6-3008-4872-ab50-6f9fe5f1d186

  shogi_controller.rbが適切に処理しアクセスを成功させる


  アクセス
  駒が打てるか

  RSpec.describe "将棋", type: :request do
    describe "将棋の対戦ページが正しく読み込まれるか" do
      let(:room_id) { SecureRandom.uuid }
      let(:game_rooms_key) { "game_room:#{room_id}" }
      
      # ゲームルームデータのテストデータ
      let(:room_data) do
        {
          sente_identifier: "session_id_1",
          gote_identifier: "session_id_2",
          sente_user_agent: "Mozilla/5.0...",
          gote_user_agent: "Mozilla/5.0...",
          sente_user_name: "ユーザー1",
          gote_user_name: "ユーザー2",
          status: 'active',
          battleType: "10min",
          created_at: Time.current.to_i
        }
      end

      context "Redisに対局部屋データが存在する場合" do
        before do
          # 準備: テスト実行前にRedisにデータを書き込んでおく
          $redis.setex(game_rooms_key, 1800, room_data.to_json)
        end

        it "対局ページへのアクセスが成功すること" do
          get "/shogi/#{room_id}"
          
          # 期待値: 200 OK が返ってくること
          expect(response).to have_http_status(:success)
          # 画面にユーザー名が表示されているか等のチェックも可能
          expect(response.body).to include("ユーザー1")
        end
      end

      context "Redisにデータが存在しない場合（不正なIDや期限切れ）" do
        it "エラー（またはリダイレクト）が発生すること" do
          get "/shogi/invalid-uuid"
          
          # 期待値: 部屋がないのでトップへ戻される、などの仕様に合わせて記述
          expect(response).to redirect_to(root_path)
        end
      end
    end

  end
=end
require 'rails_helper'

# request spec（HTTPリクエストを使ってサーバの挙動をテストする）
RSpec.describe "将棋：マッチングと対戦（request spec）", type: :request do

  # テスト用に Redis のインスタンスを作成
  # 実際の本番Redisとは別の、テスト専用のRedis
  #let(:redis) { Redis.new }
  # 1アプリ全体で使っている $redis をそのまま使う
  # もしアプリで $redis を使っていない場合は Redis.new(url: ...) など接続先を明示する
  let(:redis) { $redis }

  # 対戦形式（10分切負け）
  # 同じ値を何度も書かないため let で定義
  let(:battle_type) { "10min" }

  let(:session_id1) { SecureRandom.uuid }
  let(:session_id2) { SecureRandom.uuid }
  let(:user_agent) { "RSpec Test Browser" }

  #  MATCHING_QUEUE_KEY = 'shogi:matching_queue' # Redisのリストキー
  let(:mATCHING_QUEUE_KEY) {"shogi:matching_queue"}

  #将棋の対戦用の変数
  #let(:room_id) { SecureRandom.uuid }
  let(:sente_id) { "sente-session-id" }
  let(:gote_id) { "gote-session-id" }

  let(:room_id) { "test_room_123" }
  let(:session_id) { SecureRandom.uuid }
  
  # Redisのキー（実装に合わせて調整）
  let(:game_room_key) { "game_room:#{room_id}" }
  let(:shogi_game_key) { "shogi_game:#{room_id}" }

  # Channel Spec の機能を Request Spec 内で無理やり使うための設定
  include ActionCable::Channel::TestCase::Behavior

  # 各テスト実行前に必ず実行される処理
  before do
    # Redisの中身をすべて削除（前のテストの影響を消す）
    redis.flushdb

    # アプリ内で Redis.new が呼ばれたら、必ずこの redis を使うように差し替える（モック）
    allow(Redis).to receive(:new).and_return(redis)

=begin
    # 1. 事前にマッチング済みのルームデータをRedisに用意（コントローラが参照するデータ）
    room_data = {
      sente_identifier: sente_id,
      gote_identifier: gote_id,
      sente_user_name: "ユーザー1",
      gote_user_name: "ユーザー2",
      status: 'active',
      battleType: '10min'
    }
    $redis.set(game_room_key, room_data.to_json)
=end
    # 2. 先手としてチャンネルに接続（サブスクライブ）
    #stub_connection current_session_id: sente_id
    #subscribe(room_id: room_id)

    # 1. 接続の準備（セッションIDをシミュレート）
    stub_connection current_session_id: session_id
  end

  # ============================
  # 単体テスト：マッチング処理
  # ============================
  # Controllerの中身を直接テストするのではなく
  # 「状態（Redis・レスポンス）」だけを見るテスト
  describe "単体テスト：マッチング処理" do

    it "1人目はマッチング待機状態になる" do
     #get root_path # ここでセッションを一度確立させる・user_identifier = session.id.to_s でセッションidをとれるようにするため

      # マッチング開始APIを呼ぶ（ユーザー1）
      # headers を設定して request.user_agent をシミュレートする
      headers = { "HTTP_USER_AGENT" => user_agent }

      post "/matching/start", params: {
        userName: "ユーザー1",   # サーバ側の params[:user_name] と一致させる
        battleType: "10min",
        session_id: session_id1
      }, headers: headers

      # レスポンスのJSONをRubyのHashに変換
      json = JSON.parse(response.body)
      #RSpec.configuration.reporter.message("マッチング開始・json:"+to_s(json))
      #RSpec.configuration.reporter.message("マッチング開始・json: #{json.inspect}")

      # HTTPステータスが200（成功）であること
      expect(response).to have_http_status(:ok)

      # マッチング中であることを示すステータス
      expect(json["status"]).to eq("in_progress")

      # Redisのマッチングキューを直接確認
      # 1人だけ登録されているはず
      #queue = redis.lrange("matching_queue:#{battle_type}", 0, -1)
      queue = redis.lrange(mATCHING_QUEUE_KEY, 0, -1)
      RSpec.configuration.reporter.message("マッチングqueue: #{queue.inspect}")

      #@matching_queue_length = $redis.llen(MATCHING_QUEUE_KEY)#現在のマッチング待ち人数を確認・キューの長さを確認
      #@matching_queue_data = $redis.lrange(MATCHING_QUEUE_KEY, 0, -1)# 既存のキューから全てのデータを取得
  
      expect(queue.size).to eq(1)
    end

    it "2人揃うとroom_dataが作成される" do
      #get root_path # ここでセッションを一度確立させる・user_identifier = session.id.to_s でセッションidをとれるようにするため

      headers = { "HTTP_USER_AGENT" => user_agent }

      # ---- ユーザー1がマッチング開始 ----
      post "/matching/start", params: {
        userName: "ユーザー1",
        battleType: "10min",
        session_id: session_id1
      }, headers: headers

      # 1人目のレスポンスを確認
      json = JSON.parse(response.body)
      #RSpec.configuration.reporter.message("1人目のレスポンスを確認・json: #{json.inspect}")

      #get root_path

      # ---- ユーザー2がマッチング開始 ----
      post "/matching/start", params: {
        userName: "ユーザー2",
        battleType: "10min",
        session_id: session_id2
      }, headers: headers

      # 2人目のレスポンスを確認
      json = JSON.parse(response.body)
      RSpec.configuration.reporter.message("2人目のレスポンスを確認・json: #{json.inspect}")

      # マッチングが成立した状態
      expect(json["status"]).to eq("matched")

      # 対局ルームIDが返ってくる
      expect(json["room_id"]).to be_present

      # Redisに保存された対局ルーム情報を取得
      room_key = "game_room:#{json['room_id']}"
      room_data = JSON.parse(redis.get(room_key))

      # 対局が有効状態であること
      expect(room_data["status"]).to eq("active")

      # 対戦形式が正しいこと
      expect(room_data["battleType"]).to eq(battle_type)

      # 先手・後手のユーザー名が正しく保存されていること
      # senteとgoteの値を配列に入れ、それが [ユーザー1, ユーザー2] と一致するか（順不同）
      expect([room_data["sente_user_name"], room_data["gote_user_name"]]).to match_array(["ユーザー1", "ユーザー2"])
    end
  end

  # ==========================================
  # 統合テスト：マッチング → 将棋ページ表示
  # ==========================================
  # Controller + Redis + Routing をまとめて確認
  describe "統合テスト：マッチング完了後の将棋ページ" do
    it "マッチング後、将棋ページにアクセスできる" do
      #get root_path

      headers = { "HTTP_USER_AGENT" => user_agent }

      # ユーザー1がマッチング開始
      post "/matching/start", params: {
        userName: "ユーザー1",
        battleType: "10min",
        session_id: session_id1
      }, headers: headers

      #get root_path

      # ユーザー2がマッチング開始（ここでマッチング成立）
      post "/matching/start", params: {
        userName: "ユーザー2",
        battleType: "10min",
        session_id: session_id2
      }, headers: headers

      RSpec.configuration.reporter.message("response: #{response.body.inspect}")

      # レスポンスから対局ルームIDを取得
      room_id = JSON.parse(response.body)["room_id"]

      # 対局ページへアクセス
      get "/shogi/#{room_id}"

      # ページが正常に表示される
      expect(response).to have_http_status(:ok)

      # 将棋ページの内容が含まれているか
      expect(response.body).to include("将棋")
    end
  end

  # ==================================
  # 単体テスト：将棋対戦処理（サーバ）
  # ==================================
  # ActionCable + Redis のみを確認
=begin
  describe "単体テスト：将棋の対戦データ更新" do
    #先手の手番→JSXのboardをクリックしたら、SquareコンポーネントのsquareHandleMouseDownメソッド→RoomコンポーネントのhandleBoardClick(i, j,player)メソッド→コマを選択状態にする→コマの移動先をクリック→SquareコンポーネントのsquareHandleMouseDownメソッド→RoomコンポーネントのhandleBoardClick(i, j,player)メソッドでコマを移動→ボードデータのboardInfoをActionCableのshogi_game_channel.rbにてRedisにデータ格納し、ActionCable.server.broadcastで配信→後手の手番

    # テスト用の対局ルームID
    let(:room_id) { SecureRandom.uuid }
    #game_rooms_key = "game_room:#{@room_id}"

    # 将棋盤の状態（最小構成）
    let(:board_info) do
      {
        board: Array.new(9) { Array.new(9, nil) },
        now_turn: "先手"
      }
    end

    # 対局ルームが既に存在している状態を作る
    before do
      redis.set(
        "game_room:#{room_id}",
        {
          status: "active",
          created_at: Time.current.to_i
        }.to_json
      )
    end

    it "boardInfoをRedisに保存し、broadcastされる" do
      # ActionCableのbroadcastをモック（実通信はしない）
      allow(ActionCable.server).to receive(:broadcast)

      # 駒を動かしたリクエストを送信
      post "/shogi/#{room_id}/move", params: {
        boardInfo: board_info
      }

      # Redisに保存された盤面情報を取得
      saved = JSON.parse(redis.get("shogi:#{room_id}"))

      # 手番が正しく保存されている
      expect(saved["now_turn"]).to eq("先手")

      # クライアントに通知（broadcast）が行われたこと
      expect(ActionCable.server).to have_received(:broadcast)
    end
  end
=end
=begin
  # 2. 駒移動（ActionCable経由）のテスト
  describe "#board_broadcast_and_store" do
    let(:new_board_info) do
      {
        "board" => Array.new(9) { Array.new(9, nil) }, # 簡易的な盤面データ
        "nowTurn" => "後手" # 移動後に手番が切り替わった状態
      }
    end

    let(:move_details) do
      {
        "moveHistory" => ["先手 7六歩"],
        "BoardInfo" => new_board_info, # JSのキー名 'BoardInfo' に合わせる
        "nowTurn" => "先手",           # 移動前のターン
        "room_id" => room_id,
        "game_id" => "game-123"
      }
    end

    it "盤面データをRedisに保存し、全員にブロードキャストすること" do
      # ActionCableの配信を監視
      expect {
        # JSの this.subscription.perform('board_broadcast_and_store', ...) を再現
        perform :board_broadcast_and_store, move_details
      }.to have_broadcasted_to("shogi_game_#{room_id}") # 配信先をチェック
        .with(hash_including(
          "data_type" => "board_update",
          "new_board_data" => hash_including("nowTurn" => "後手")
        ))

      # Redisにデータが格納されているか確認
      # ※チャンネル内の実装が $redis.set(board_data_key, ...) となっている前提
      saved_data_json = $redis.get(board_data_key)
      expect(saved_data_json).not_to be_nil
      
      saved_data = JSON.parse(saved_data_json)
      expect(saved_data["nowTurn"]).to eq("後手")
    end
  end

  # 3. 画面表示のテスト (Request Spec)
  describe "将棋対戦画面のアクセス", type: :request do
    it "正しい手番（ロール）が割り振られること" do
      # セッションIDを先手としてシミュレート
      allow_any_instance_of(ActionDispatch::Request).to receive(:session).and_return({ id: sente_id })
      
      get "/shogi/#{room_id}"
      
      expect(response).to have_http_status(:ok)
      # コントローラの @your_role が "先手" になっていることを検証
      expect(controller.instance_variable_get(:@your_role)).to eq("先手")
    end
  end
=end

  describe "購読（subscription）" do
    it "正しいルームIDでストリームが開始される" do
      
      stub_connection current_session_id: "abc"

      # 2. 購読を開始
      subscribe(room_id: room_id)
      

      # 購読が成功しているか確認
      expect(subscription).to be_confirmed
      
      # 3. サーバー側コードで指定された "shogi_game_room_#" という名前でストリームされているか
      expect(subscription).to am_streaming_from("shogi_game_room_#{room_id}")
    end

    it "room_idがない場合は拒否される" do
      subscribe(room_id: nil)
      expect(subscription).to be_rejected
    end
  end

  describe "盤面データの保存と配信 (board_broadcast_and_store)" do
    before do
      subscribe(room_id: room_id)
    end

    it "クライアントからの盤面情報を受け取り、Redisに保存してブロードキャストする" do
      # JSX側から perform('board_broadcast_and_store', {...}) で送られてくるデータを再現
      move_data = {
        "BoardInfo" => { "board" => [], "nowTurn" => "後手" },
        "moveHistory" => ["先手 7六歩"],
        "room_id" => room_id
      }

      # 4. メソッドの実行とブロードキャストの検証
      expect {
        perform :board_broadcast_and_store, move_data
      }.to have_broadcasted_to("shogi_game_room_#{room_id}")
        .with(hash_including(
          "data_type" => "board_update",
          "new_board_data" => hash_including("nowTurn" => "後手")
        ))

      # 5. Redisに正しく保存されたか確認
      # (キー名が shogi_game:room_id であると想定)
      saved_json = $redis.get("shogi_game:#{room_id}")
      expect(saved_json).not_to be_nil
      expect(JSON.parse(saved_json)["nowTurn"]).to eq("後手")
    end
  end
end

=begin
  RSpec.describe "マッチング", type: :request do
    #describe "POST /matching/start" do

      it "starts matching successfully" do
        post "/matching/start", params: { battleType: "10min", userName: "テストちゃん"  }
        expect(response).to have_http_status(:success) # レスポンスのHTTPステータスが成功(2xx)であることを検証・200なら成功
        #expect(json["status"]).to eq("started") # レスポンスボディ(JSON)の "status" フィールドが "started" であることを検証
      end
      
    #end
  end


  #bing
  RSpec.describe 'Shogi: matching and game', type: :request do
    # 前提：
    # - MatchingController#start に POST /matching/start 相当のルートがある（ここでは start_matching_path を仮定）
    # - Redis のキューキーは "queue:#{battle_type}"、room_data は "room:#{room_id}:data" に格納する想定
    # - ActionCable のブロードキャスト先は "matching_#{session_id}" や "room:#{room_id}" のようなチャネル名を使う想定
    # - Board/Matcher 等のロジックはアプリ内に存在する想定
    #
    # 必要なGem:
    # - factory_bot_rails
    # - actioncable-testing (have_broadcasted_to を使う場合)
    #
    # テスト環境の Redis はテスト用インスタンスを使うか、Redis.new を直接使って flushdb することを推奨

    let(:redis) { Redis.new } # テスト環境の Redis 接続（必要に応じて設定）
    before do
      redis.flushdb
    end

    after do
      redis.flushdb
    end

    # --- 単体的な振る舞い検証（モデル/サービスに相当） ---
    describe 'Matcher logic (unit-like)' do
      # FactoryBot で player を作る前提
      let(:player_a) { build(:player, session_id: 's_a', name: 'Alice', elo: 1500) }
      let(:player_b) { build(:player, session_id: 's_b', name: 'Bob', elo: 1520) }

      describe '.enqueue' do
        it 'adds session to redis queue when not present' do
          # Matcher.enqueue(player, battle_type) を想定
          expect {
            Matcher.enqueue(player_a, 'ranked') # 実装に合わせてメソッド名を調整
          }.to change { redis.lrange('queue:ranked', 0, -1).size }.from(0).to(1)

          expect(redis.lrange('queue:ranked', 0, -1)).to include('s_a')
        end

        it 'does not enqueue if already present' do
          redis.rpush('queue:ranked', 's_a')
          # 既にいる場合は nil を返す等の仕様を想定
          expect(Matcher.enqueue(player_a, 'ranked')).to be_nil
        end
      end

      describe '.find_opponent' do
        it 'returns opponent within elo tolerance' do
          # 実装が DB を参照するなら create を使う。ここでは簡潔に想定メソッドを呼ぶ
          create(:player, session_id: 's_b', elo: 1520)
          opponent = Matcher.find_opponent(player_a, tolerance: 50)
          expect(opponent).not_to be_nil
          expect(opponent.elo).to be_within(50).of(player_a.elo)
        end

        it 'handles nil/invalid queue entries gracefully' do
          # キューに nil 相当の不正データが入った場合の挙動を検証
          redis.rpush('queue:ranked', '') # 空文字を不正データと仮定
          expect { Matcher.process_queue('ranked') }.not_to raise_error
          # 仕様に応じて nil を返す、ログを残す等を期待
        end
      end
    end

    # --- 統合テスト：コントローラ→Redis→ActionCable の連携 ---
    describe 'Matching controller integration' do
      # ルートやパス名は実装に合わせて変更してください
      let(:start_path) { start_matching_path } # routes に合わせる

      it 'returns in_progress when first user starts matching and adds to redis queue' do
        post start_path, params: { session_id: 's1', battle_type: 'ranked', name: 'Alice' }
        expect(response).to have_http_status(:ok)

        body = JSON.parse(response.body)
        expect(body['status']).to eq('in_progress')

        # Redis に追加されていることを確認
        queue = redis.lrange('queue:ranked', 0, -1)
        expect(queue).to include('s1')
      end

      it 'matches two users, creates room_data in redis and broadcasts via ActionCable' do
        # 1人目が start
        post start_path, params: { session_id: 's1', battle_type: 'ranked', name: 'Alice' }
        expect(JSON.parse(response.body)['status']).to eq('in_progress')

        # 2人目が start したときにマッチング成立する想定
        # ActionCable の broadcast を検証するために matcher を使う
        # actioncable-testing の have_broadcasted_to を使う場合の例
        # room_id はコントローラ側で生成されるため、ブロードキャスト先をワイルドカードで検証する
        expect {
          post start_path, params: { session_id: 's2', battle_type: 'ranked', name: 'Bob' }
        }.to change { redis.keys("room:*:data").size }.by(1)

        # room_data が Redis に格納されていること
        room_keys = redis.keys("room:*:data")
        expect(room_keys.size).to eq(1)
        room_key = room_keys.first
        room_json = JSON.parse(redis.get(room_key))
        expect(room_json['players'].map { |p| p['session_id'] }.sort).to eq(['s1', 's2'])

        # ActionCable のブロードキャストを検証
        # 実装により broadcast 先が異なるため、ここでは ActionCable.server に対する spy を使う例
        # 事前に allow/expect を設定する場合はコントローラ呼び出し前に行う必要がある
      end

      it 'handles race condition when one queue entry is missing (nil) gracefully' do
        # 不正データを入れてから start を呼ぶ
        redis.rpush('queue:ranked', '') # nil 相当
        post start_path, params: { session_id: 's3', battle_type: 'ranked', name: 'Carol' }
        # 仕様に応じてエラーコードや特別なステータスを返す想定
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(['in_progress', 'error']).to include(body['status'])
      end
    end

    # --- 統合テスト：ActionCable チャネル（将棋の手の配信） ---
    describe 'ShogiGameChannel integration' do
      # チャネル名や perform アクション名は実装に合わせてください
      # ここでは perform :send_move を想定し、Redis に boardInfo を保存して broadcast する流れを検証
      it 'broadcasts board update and stores boardInfo in redis' do
        room_id = 'room123'
        # subscribe を使う場合（actioncable-testing gem が必要）
        subscribe_params = { room_id: room_id }
        # テスト用にチャネルのサブスクライブを行う（channel spec では subscribe を使うが、request spec では直接 perform を呼べないため、ここは統合的な検証）
        # 代替として、ActionCable.server.broadcast を直接呼ぶコントローラ/サービスを叩くか、チャネルの perform を unit-test することを推奨

        # ここではチャネルの perform を直接呼ぶ想定の pseudo-code:
        # perform :send_move, { from: [6,4], to: [5,4], player: 'sente', room_id: room_id }
        # expect(ActionCable.server).to have_broadcasted_to("room:#{room_id}").with(hash_including('boardInfo'))

        # 実装に合わせて channel spec に分離することを推奨します
        skip "チャネルの直接検証は channel spec に分離してください（actioncable-testing を利用）"
      end
    end
  end

  #Gemini
  RSpec.describe "将棋システム統合テスト", type: :request do
    include ActionCable::TestHelper

    let(:user1_name) { "ユーザー1" }
    let(:user2_name) { "ユーザー2" }
    let(:battle_type) { "10min" }

    before do
      $redis.flushdb # テストごとにRedisを初期化
    end

    describe "マッチング処理" do
      it "一連のマッチングフロー（待機から成立まで）が正しく動作すること" do
        # 1. ユーザー1がマッチング開始
        post "/matching/start", params: { user_name: user1_name, battleType: battle_type }
        
        expect(response).to have_http_status(:ok)
        json_res = JSON.parse(response.body)
        expect(json_res["status"]).to eq "in_progress"
        expect($redis.llen("matching_queue:#{battle_type}")).to eq 1

        # 2. ユーザー2がマッチング開始
        # ここでActionCableが放送されることを期待する
        expect {
          post "/matching/start", params: { user_name: user2_name, battleType: battle_type }
        }.to have_broadcasted_to("matching_channel") # 実際のアナウンス先に合わせる

        expect(response).to have_http_status(:ok)
        
        # 3. マッチング完了後のRedisデータの整合性（単体テスト的検証）
        room_key = $redis.keys("game_room:*").first
        expect(room_key).to be_present
        
        room_data = JSON.parse($redis.get(room_key))
        expect(room_data["sente_user_name"]).to eq user1_name
        expect(room_data["gote_user_name"]).to eq user2_name
        expect(room_data["status"]).to eq "active"
      end

      it "競合状態でデータがnilの場合にエラー処理が行われること" do
        # キューには入っているが中身が消えているような異常系
        $redis.lpush("matching_queue:#{battle_type}", "invalid_id")
        
        post "/matching/start", params: { user_name: user2_name, battleType: battle_type }
        # 内部でエラーハンドリングされ、リトライやエラーレスポンスが返ることを確認
        expect(response).to have_http_status(:internal_server_error)
      end
    end

    describe "対戦処理（駒の移動と同期）" do
      let(:room_id) { SecureRandom.uuid }
      let(:room_key) { "game_room:#{room_id}" }
      let(:initial_board) { { board: [], nowTurn: 'sente', selection: nil }.to_json }

      before do
        # 事前にRedisにルームデータを入れておく（前提条件のセットアップ）
        $redis.set(room_key, initial_board)
      end

      it "駒の移動リクエストによりRedisが更新され、ActionCableで配信されること" do
        move_params = {
          room_id: room_id,
          from: [7, 7],
          to: [7, 6],
          player: 'sente'
        }

        # ActionCableで新しい盤面が放送されることを検証（統合テスト）
        expect {
          post "/shogi/move", params: move_params
        }.to have_broadcasted_to("shogi_game_channel_#{room_id}")

        expect(response).to have_http_status(:ok)

        # Redisのデータが更新されているか（単体・統合テスト）
        updated_data = JSON.parse($redis.get(room_key))
        expect(updated_data["nowTurn"]).to eq 'gote' # 手番が入れ替わっているか
      end

      it "不正な手（二歩など）の場合、Redisは更新されずエラーを返すこと" do
        # 二歩をシミュレートするパラメータ
        invalid_move = { room_id: room_id, from: [8, 8], to: [8, 7], piece: 'FU' }
        
        # ロジック側でバリデーションがある前提
        post "/shogi/move", params: invalid_move
        
        expect(response).to have_http_status(:unprocessable_entity)
        # Redisが書き換わっていないことを確認
        expect(JSON.parse($redis.get(room_key))["nowTurn"]).to eq 'sente'
      end
    end
  end

  #Claude
  RSpec.describe '将棋システム（マッチング + 対戦）', type: :request do
    
    # ==========================================
    # ヘルパーメソッド
    # ==========================================
    
    def create_initial_board
      board = Array.new(9) { Array.new(9, nil) }
      
      # 先手の駒配置
      board[6] = ['歩'] * 9
      board[7] = [nil, '角', nil, nil, nil, nil, nil, '飛', nil]
      board[8] = ['香', '桂', '銀', '金', '王', '金', '銀', '桂', '香']
      
      # 後手の駒配置
      board[2] = ['歩_'] * 9
      board[1] = [nil, '飛_', nil, nil, nil, nil, nil, '角_', nil]
      board[0] = ['香_', '桂_', '銀_', '金_', '王_', '金_', '銀_', '桂_', '香_']
      
      board
    end
    
    def clear_redis
      Redis.current.flushdb
    end
    
    before(:each) do
      clear_redis
    end
    
    # ==========================================
    # 単体テスト：マッチング処理
    # ==========================================
    
    describe 'マッチング処理の単体テスト' do
      
      describe 'POST /matching/start（マッチング開始）' do
        
        context '初回アクセス（キューが空）' do
          it 'Redisキューにユーザー情報を追加し、in_progressを返す' do
            post '/matching/start', 
                params: { user_name: 'Player1', battle_type: 'normal' },
                session: { session_id: 'session_1' }
            
            expect(response).to have_http_status(:success)
            
            json = JSON.parse(response.body)
            expect(json['status']).to eq('in_progress')
            expect(json['message']).to include('対戦相手を探しています')
            
            # Redisキューに追加されているか確認
            queue_length = Redis.current.llen('matching_queue:normal')
            expect(queue_length).to eq(1)
            
            # キューの内容を確認
            queue_data = JSON.parse(Redis.current.lindex('matching_queue:normal', 0))
            expect(queue_data['session_id']).to eq('session_1')
            expect(queue_data['user_name']).to eq('Player1')
            expect(queue_data['battle_type']).to eq('normal')
          end
        end
        
        context 'すでにマッチング中の場合' do
          before do
            # 事前にキューに追加
            user_data = {
              session_id: 'session_1',
              user_name: 'Player1',
              battle_type: 'normal',
              timestamp: Time.current.to_i
            }
            Redis.current.rpush('matching_queue:normal', user_data.to_json)
          end
          
          it '重複してキューに追加されない' do
            post '/matching/start',
                params: { user_name: 'Player1', battle_type: 'normal' },
                session: { session_id: 'session_1' }
            
            json = JSON.parse(response.body)
            expect(json['status']).to eq('already_in_queue')
            
            # キューの長さが増えていない
            queue_length = Redis.current.llen('matching_queue:normal')
            expect(queue_length).to eq(1)
          end
        end
        
        context 'キューに1人待機している場合' do
          before do
            # Player1を待機させる
            user1_data = {
              session_id: 'session_1',
              user_name: 'Player1',
              battle_type: 'normal',
              timestamp: Time.current.to_i
            }
            Redis.current.rpush('matching_queue:normal', user1_data.to_json)
          end
          
          it 'マッチングが成立し、matchedを返す' do
            post '/matching/start',
                params: { user_name: 'Player2', battle_type: 'normal' },
                session: { session_id: 'session_2' }
            
            expect(response).to have_http_status(:success)
            
            json = JSON.parse(response.body)
            expect(json['status']).to eq('matched')
            expect(json['room_id']).to be_present
            expect(json['player1']['name']).to eq('Player1')
            expect(json['player2']['name']).to eq('Player2')
            expect(json['redirect_url']).to include('/game/')
          end
          
          it 'room_dataがRedisに格納される' do
            post '/matching/start',
                params: { user_name: 'Player2', battle_type: 'normal' },
                session: { session_id: 'session_2' }
            
            json = JSON.parse(response.body)
            room_id = json['room_id']
            
            # Redisからroom_dataを取得
            room_data_json = Redis.current.get("room:#{room_id}")
            expect(room_data_json).to be_present
            
            room_data = JSON.parse(room_data_json)
            
            # room_dataの内容を検証
            expect(room_data['room_id']).to eq(room_id)
            expect(room_data['player1']['name']).to eq('Player1')
            expect(room_data['player1']['session_id']).to eq('session_1')
            expect(room_data['player2']['name']).to eq('Player2')
            expect(room_data['player2']['session_id']).to eq('session_2')
            expect(room_data['board']).to be_present
            expect(room_data['board'].length).to eq(9)
            expect(room_data['now_turn']).to eq('black')
            expect(room_data['piece_stand']).to eq({ 'black' => [], 'white' => [] })
            expect(room_data['selection']).to be_nil
          end
          
          it 'マッチング成立後、キューがクリアされる' do
            post '/matching/start',
                params: { user_name: 'Player2', battle_type: 'normal' },
                session: { session_id: 'session_2' }
            
            # キューが空になっている
            queue_length = Redis.current.llen('matching_queue:normal')
            expect(queue_length).to eq(0)
          end
          
          it '初期盤面が正しく設定される' do
            post '/matching/start',
                params: { user_name: 'Player2', battle_type: 'normal' },
                session: { session_id: 'session_2' }
            
            json = JSON.parse(response.body)
            room_id = json['room_id']
            room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            
            board = room_data['board']
            
            # 先手の駒配置を確認
            expect(board[6][0]).to eq('歩')
            expect(board[7][1]).to eq('角')
            expect(board[7][7]).to eq('飛')
            expect(board[8][0]).to eq('香')
            expect(board[8][4]).to eq('王')
            
            # 後手の駒配置を確認
            expect(board[2][0]).to eq('歩_')
            expect(board[1][1]).to eq('飛_')
            expect(board[1][7]).to eq('角_')
            expect(board[0][4]).to eq('王_')
          end
        end
        
        context '片方のデータがnilの場合（競合状態）' do
          before do
            # 不正なデータをキューに追加
            Redis.current.rpush('matching_queue:normal', 'null')
          end
          
          it 'エラーを返し、不正なデータを削除する' do
            post '/matching/start',
                params: { user_name: 'Player2', battle_type: 'normal' },
                session: { session_id: 'session_2' }
            
            json = JSON.parse(response.body)
            expect(json['status']).to eq('error')
            expect(json['message']).to include('競合状態')
            
            # 不正なデータが削除されている
            queue_length = Redis.current.llen('matching_queue:normal')
            expect(queue_length).to eq(0)
          end
        end
      end
      
      describe 'DELETE /matching/cancel（マッチングキャンセル）' do
        before do
          user_data = {
            session_id: 'session_1',
            user_name: 'Player1',
            battle_type: 'normal',
            timestamp: Time.current.to_i
          }
          Redis.current.rpush('matching_queue:normal', user_data.to_json)
        end
        
        it 'キューから自分を削除できる' do
          delete '/matching/cancel',
                params: { battle_type: 'normal' },
                session: { session_id: 'session_1' }
          
          expect(response).to have_http_status(:success)
          
          json = JSON.parse(response.body)
          expect(json['status']).to eq('cancelled')
          
          # キューが空になっている
          queue_length = Redis.current.llen('matching_queue:normal')
          expect(queue_length).to eq(0)
        end
        
        it 'キューにいない場合はエラーを返す' do
          delete '/matching/cancel',
                params: { battle_type: 'normal' },
                session: { session_id: 'session_999' }
          
          json = JSON.parse(response.body)
          expect(json['status']).to eq('not_found')
        end
      end
    end
    
    # ==========================================
    # 単体テスト：対戦処理
    # ==========================================
    
    describe '対戦処理の単体テスト' do
      let(:room_id) { 'test_room_123' }
      let(:board) { create_initial_board }
      let(:room_data) do
        {
          room_id: room_id,
          player1: { name: 'Player1', session_id: 'session_1' },
          player2: { name: 'Player2', session_id: 'session_2' },
          board: board,
          now_turn: 'black',
          piece_stand: { black: [], white: [] },
          piece_stand_num: { black: {}, white: {} },
          selection: nil,
          move_history: []
        }
      end
      
      before do
        Redis.current.set("room:#{room_id}", room_data.to_json)
      end
      
      describe 'POST /game/handle_board_click（駒の選択）' do
        
        context '先手が自分の駒を選択' do
          it '駒を選択状態にする' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 6, j: 4, player: 'black' }
            
            expect(response).to have_http_status(:success)
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['action']).to eq('select')
            expect(json['selection']).to eq([6, 4])
            
            # Redisが更新されている
            updated_room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            expect(updated_room_data['selection']).to eq([6, 4])
          end
        end
        
        context '相手の駒を選択しようとする' do
          it 'エラーを返す' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 2, j: 4, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('相手の駒')
          end
        end
        
        context '空きマスを選択' do
          it 'エラーを返す' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 4, j: 4, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('駒がありません')
          end
        end
        
        context '手番でないプレイヤーが選択' do
          it 'エラーを返す' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 2, j: 4, player: 'white' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('手番ではありません')
          end
        end
      end
      
      describe 'POST /game/handle_board_click（駒の移動）' do
        
        before do
          # 駒を選択状態にする
          room_data[:selection] = [6, 4]
          Redis.current.set("room:#{room_id}", room_data.to_json)
        end
        
        context '有効な移動（歩を1マス前）' do
          it '駒が移動し、手番が変わる' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 5, j: 4, player: 'black' }
            
            expect(response).to have_http_status(:success)
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['action']).to eq('move')
            expect(json['board'][5][4]).to eq('歩')
            expect(json['board'][6][4]).to be_nil
            expect(json['now_turn']).to eq('white')
            expect(json['selection']).to be_nil
            
            # Redisが更新されている
            updated_room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            expect(updated_room_data['board'][5][4]).to eq('歩')
            expect(updated_room_data['board'][6][4]).to be_nil
            expect(updated_room_data['now_turn']).to eq('white')
            expect(updated_room_data['selection']).to be_nil
          end
          
          it '指し手履歴に追加される' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 5, j: 4, player: 'black' }
            
            updated_room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            
            expect(updated_room_data['move_history'].length).to eq(1)
            last_move = updated_room_data['move_history'].last
            expect(last_move['from']).to eq([6, 4])
            expect(last_move['to']).to eq([5, 4])
            expect(last_move['piece']).to eq('歩')
            expect(last_move['player']).to eq('black')
          end
        end
        
        context '不正な移動（歩を2マス前）' do
          it 'エラーを返す' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 4, j: 4, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('不正な移動')
            
            # 盤面が変わっていない
            updated_room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            expect(updated_room_data['board'][6][4]).to eq('歩')
          end
        end
        
        context '駒を取る' do
          before do
            # 敵の駒を配置
            room_data[:board][5][4] = '歩_'
            room_data[:selection] = [6, 4]
            Redis.current.set("room:#{room_id}", room_data.to_json)
          end
          
          it '駒を取り、持ち駒に追加される' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 5, j: 4, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['captured']).to eq('歩')
            expect(json['piece_stand']['black']).to include('歩')
            
            # Redisが更新されている
            updated_room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
            expect(updated_room_data['piece_stand']['black']).to include('歩')
          end
        end
        
        context '飛車の移動（縦）' do
          before do
            # 飛車の前の歩を除去
            room_data[:board][6][7] = nil
            room_data[:selection] = [7, 7]
            Redis.current.set("room:#{room_id}", room_data.to_json)
          end
          
          it '縦方向に移動できる' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 4, j: 7, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['board'][4][7]).to eq('飛')
            expect(json['board'][7][7]).to be_nil
          end
        end
        
        context '飛車の移動（横）' do
          before do
            # 飛車周辺をクリア
            room_data[:board][7] = [nil, nil, nil, nil, nil, nil, nil, '飛', nil]
            room_data[:selection] = [7, 7]
            Redis.current.set("room:#{room_id}", room_data.to_json)
          end
          
          it '横方向に移動できる' do
            post '/game/handle_board_click',
                params: { room_id: room_id, i: 7, j: 3, player: 'black' }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['board'][7][3]).to eq('飛')
          end
        end
      end
      
      describe 'POST /game/drop_piece（持ち駒を打つ）' do
        before do
          # 持ち駒を追加
          room_data[:piece_stand][:black] = ['歩']
          Redis.current.set("room:#{room_id}", room_data.to_json)
        end
        
        context '有効な位置に打つ' do
          it '持ち駒が盤面に配置され、持ち駒から削除される' do
            post '/game/drop_piece',
                params: { 
                  room_id: room_id, 
                  piece: '歩', 
                  i: 5, 
                  j: 5, 
                  player: 'black' 
                }
            
            expect(response).to have_http_status(:success)
            
            json = JSON.parse(response.body)
            expect(json['success']).to be true
            expect(json['board'][5][5]).to eq('歩')
            expect(json['piece_stand']['black']).to be_empty
            expect(json['now_turn']).to eq('white')
          end
        end
        
        context '二歩（同じ筋に歩がある）' do
          before do
            room_data[:board][6][4] = '歩'
            Redis.current.set("room:#{room_id}", room_data.to_json)
          end
          
          it 'エラーを返す' do
            post '/game/drop_piece',
                params: { 
                  room_id: room_id, 
                  piece: '歩', 
                  i: 5, 
                  j: 4, 
                  player: 'black' 
                }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('二歩')
          end
        end
        
        context '駒があるマスに打とうとする' do
          it 'エラーを返す' do
            post '/game/drop_piece',
                params: { 
                  room_id: room_id, 
                  piece: '歩', 
                  i: 6, 
                  j: 4, 
                  player: 'black' 
                }
            
            json = JSON.parse(response.body)
            expect(json['success']).to be false
            expect(json['error']).to include('すでに駒があります')
          end
        end
      end
    end
    
    # ==========================================
    # 統合テスト：マッチング〜対戦の流れ
    # ==========================================
    
    describe 'マッチングから対戦までの統合テスト' do
      
      it 'ユーザー1が待機→ユーザー2がマッチング→対戦開始→交互に指し手を進める' do
        # ===== ステップ1: ユーザー1がマッチング開始 =====
        post '/matching/start',
            params: { user_name: 'Player1', battle_type: 'normal' },
            session: { session_id: 'session_1' }
        
        json1 = JSON.parse(response.body)
        expect(json1['status']).to eq('in_progress')
        
        # キューに1人いることを確認
        queue_length = Redis.current.llen('matching_queue:normal')
        expect(queue_length).to eq(1)
        
        # ===== ステップ2: ユーザー2がマッチング開始（マッチング成立）=====
        post '/matching/start',
            params: { user_name: 'Player2', battle_type: 'normal' },
            session: { session_id: 'session_2' }
        
        json2 = JSON.parse(response.body)
        expect(json2['status']).to eq('matched')
        expect(json2['room_id']).to be_present
        
        room_id = json2['room_id']
        
        # room_dataが作成されている
        room_data_json = Redis.current.get("room:#{room_id}")
        expect(room_data_json).to be_present
        
        # キューがクリアされている
        queue_length = Redis.current.llen('matching_queue:normal')
        expect(queue_length).to eq(0)
        
        # ===== ステップ3: 先手（Player1）が76歩を指す =====
        
        # 駒を選択
        post '/game/handle_board_click',
            params: { room_id: room_id, i: 6, j: 6, player: 'black' }
        
        json3 = JSON.parse(response.body)
        expect(json3['success']).to be true
        expect(json3['action']).to eq('select')
        
        # 駒を移動
        post '/game/handle_board_click',
            params: { room_id: room_id, i: 5, j: 6, player: 'black' }
        
        json4 = JSON.parse(response.body)
        expect(json4['success']).to be true
        expect(json4['action']).to eq('move')
        expect(json4['board'][5][6]).to eq('歩')
        expect(json4['now_turn']).to eq('white')
        
        # ===== ステップ4: 後手（Player2）が34歩を指す =====
        
        # 駒を選択
        post '/game/handle_board_click',
            params: { room_id: room_id, i: 2, j: 6, player: 'white' }
        
        json5 = JSON.parse(response.body)
        expect(json5['success']).to be true
        
        # 駒を移動
        post '/game/handle_board_click',
            params: { room_id: room_id, i: 3, j: 6, player: 'white' }
        
        json6 = JSON.parse(response.body)
        expect(json6['success']).to be true
        expect(json6['board'][3][6]).to eq('歩_')
        expect(json6['now_turn']).to eq('black')
        
        # ===== ステップ5: 指し手履歴を確認 =====
        room_data = JSON.parse(Redis.current.get("room:#{room_id}"))
        
        expect(room_data['move_history'].length).to eq(2)
        
        # 1手目
        move1 = room_data['move_history'][0]
        expect(move1['from']).to eq([6, 6])
        expect(move1['to']).to eq([5, 6])
        expect(move1['player']).to eq('black')
        
        # 2手目
        move2 = room_data['move_history'][1]
        expect(move2['from']).to eq([2, 6])
        expect(move2['to']).to eq([3, 6])
        expect(move2['player']).to eq('white')
      end
      
      it '複数組が同時にマッチングして対戦できる' do
        # ===== 第1組 =====
        post '/matching/start',
            params: { user_name: 'PlayerA1', battle_type: 'normal' },
            session: { session_id: 'session_a1' }
        
        post '/matching/start',
            params: { user_name: 'PlayerA2', battle_type: 'normal' },
            session: { session_id: 'session_a2' }
        
        json_a = JSON.parse(response.body)
        expect(json_a['status']).to eq('matched')
        room_id_a = json_a['room_id']
        
        # ===== 第2組 =====
        post '/matching/start',
            params: { user_name: 'PlayerB1', battle_type: 'normal' },
            session: { session_id: 'session_b1' }
        
        post '/matching/start',
            params: { user_name: 'PlayerB2', battle_type: 'normal' },
            session: { session_id: 'session_b2' }
        
        json_b = JSON.parse(response.body)
        expect(json_b['status']).to eq('matched')
        room_id_b = json_b['room_id']
        
        # 異なるroom_idが発行されている
        expect(room_id_a).not_to eq(room_id_b)
        
        # 両方のroom_dataが存在する
        expect(Redis.current.get("room:#{room_id_a}")).to be_present
        expect(Redis.current.get("room:#{room_id_b}")).to be_present
        
        # 第1組で対局
        post '/game/handle_board_click',
            params: { room_id: room_id_a, i: 6, j: 4, player: 'black' }
        
        post '/game/handle_board_click',
            params: { room_id: room_id_a, i: 5, j: 4, player: 'black' }
        
        json_move_a = JSON.parse(response.body)
        expect(json_move_a['success']).to be true
        
        # 第2組で対局
        post '/game/handle_board_click',
            params: { room_id: room_id_b, i: 6, j: 5, player: 'black' }
        
        post '/game/handle_board_click',
            params: { room_id: room_id_b, i: 5, j: 5, player: 'black' }
        
        json_move_b = JSON.parse(response.body)
        expect(json_move_b['success']).to be true
        
        # 互いに影響していないことを確認
        room_a = JSON.parse(Redis.current.get("room:#{room_id_a}"))
        room_b = JSON.parse(Redis.current.get("room:#{room_id_b}"))
        
        expect(room_a['board'][5][4]).to eq('歩')
        expect(room_a['board'][5][5]).to be_nil
        
        expect(room_b['board'][5][5]).to eq('歩')
        expect(room_b['board'][5][4]).to eq('歩')
      end
    end
  end
=end