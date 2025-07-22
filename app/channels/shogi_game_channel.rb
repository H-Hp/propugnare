class ShogiGameChannel < ApplicationCable::Channel
  # 購読（subscribe）時に呼び出される
  def subscribed
    # 部屋番号をパラメータから取得 (例: /cable?room_id=123)
    @room_id = params[:room_id]
    #@game_id = params[:id]
    @game_id = params[:room_id]
    reject unless @room_id.present? # 部屋番号がない場合は購読を拒否

    #redis_key = "shogi_game:#{@game_id}"
    #$redis.del(redis_key)

    # この接続を特定のストリーム（部屋）に紐付ける・Action Cableの概念で、特定のブロードキャストに対してリスナーになる
    stream_from "shogi_game_room_#{@room_id}"
    #Rails.logger.info "ShogiGameChannelにroom_idで登録: #{@room_id}"

    #残り時間
    # Redisから現在のタイマー状態を読み込み、購読を開始したクライアントに送信・これにより、後から参加したクライアントも最新の状態を受け取れる
    initial_timer_state = load_timer_from_redis(@room_id)
    # Action Cableの`transmit`メソッドは、現在の購読者に直接メッセージを送る
    transmit({ type: 'initial_timer_state', data: initial_timer_state })


    #最初のセットアップ
    init_state(@room_id,@game_id)

    # 購読者カウントを増やす
    increment_subscriber_count(@room_id)

    # RabbitMQから特定のルーティングキーのメッセージを購読する・これは通常、別途バックグラウンドジョブや常駐プロセスで行うべきだが、簡単化のため、このチャンネル内で購読処理を記述
    #start_rabbitmq_subscription(@room_id)
  end

  # 購読解除（unsubscribe）時に呼び出される・チャンネルがサブスクリプション解除された際の処理
  def unsubscribed
    # 購読者カウントを減らす
    decrement_subscriber_count(@room_id)

    # チャンネルがサブスクリプション解除された際の処理
    #stop_rabbitmq_subscription # RabbitMQの購読を停止
    Rails.logger.info "ShogiGameChannelからroom_idに関するサブスクリプションを解除: #{@room_id}"
  end

  # クライアントからメッセージを受信した時
  def board_broadcast_and_store(data)
    moveHistory_data = data['moveHistory']
    nowTurn_data = data['nowTurn']
    boardInfo = data['BoardInfo']
    @room_id = data['room_id']
    @game_id = data['game_id']
    new_board_data=data

    redis_key = "shogi_game:#{@game_id}"
    routing_key = "game.#{@room_id}.board_update"

    #Rails.logger.info "Redisに値をセット・new_data： #{new_board_data}"
    #Rails.logger.info "BoardInfo： #{boardInfo}"
    #Rails.logger.info "@room_id： #{@room_id}・@game_id： #{@game_id}・redis_key： #{redis_key}"

    $redis.set(redis_key, new_board_data.to_json)#Redisに値をセット
    
    #WebSocketで配信
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}",{data_type: "board_update",new_board_data: new_board_data})
    
    #Rails.logger.info "room_id に対応する moveHistory_data を受信しました： #{@room_id}: #{moveHistory_data}"

    new_board_state = { board: "新盤面情報のboadstate", moveHistory: moveHistory_data, nowTurn: nowTurn_data } # 実際はゲームロジックで生成
  end

  def chat_broadcast_and_store(data)
    chat_data = data['chat_data']
    room_id = data['room_id']
    game_id = data['game_id']
    redis_chat_key = "shogi_game_chat:#{game_id}"
    updated_redis_stored_data=""
    if $redis.exists?(redis_chat_key)
      # Redisにデータがある → JSON文字列をパースして返す
      #redis_stored_data = $redis.get(redis_chat_key)
      #Rails.logger.info "チャットここは通る？"
      #Rails.logger.info "チャット・chat_data： #{redichat_datas_stored_data}"
      #parsed_redis_stored_data = JSON.parse(redis_stored_data)#JSON文字列をRubyのハッシュにパース
      #parsed_redis_stored_data["chatMessages"] = chat_data# 既存のハッシュにチャットデータを追加/ここでは、chatMessagesという新しいキーでチャットデータを追加します。
      #updated_redis_stored_data = parsed_redis_stored_data.to_json#更新されたハッシュを再度JSON文字列に変換（必要に応じて）
      #$redis.set(redis_chat_key,updated_redis_stored_data)#Redisに値をセット
      $redis.rpush(redis_chat_key, chat_data)
      updated_redis_stored_data = $redis.lrange(redis_chat_key, 0, -1) #キーをリスト型としてデータ取得
    else
      $redis.rpush(redis_chat_key, chat_data)
      updated_redis_stored_data=chat_data
    end
    # 取得したデータをクライアントにブロードキャスト
    ActionCable.server.broadcast( "shogi_game_room_#{room_id}",{ data_type: "chat_update", chat_data: updated_redis_stored_data})
  end


  #再対戦のセットアップ
  #def rematch_setup(data)
  def rematch_setup(data)
    #puts "rematch_setup呼び出し: #{data}"
    
    your_role = data['yourRole']
    room_id = data['room_id']
    game_id = data['game_id']

    #相手に再対戦の依頼が来ていると通知
    # 後手のプレイヤーに再対戦の依頼が来たことを通知するメッセージをブロードキャスト
    # 同じroom_idを購読している全てのクライアントに送る
    ActionCable.server.broadcast(
      "shogi_game_room_#{room_id}",{
        data_type: 'rematch_request',
        requester_role: your_role, # 誰がリクエストしたか
        current_game_id: game_id,  # どのゲームからのリクエストか
        message: "#{your_role} から再対戦の依頼が来ています。応じますか？"
    })
    
    # 処理を続行
  rescue => e
    ActionCable.server.logger.error "rematch_setup error: #{e.message}"
  end

  def rematch_accept(data)
    room_id = data['room_id']

    redis_board_key = "shogi_game:#{@room_id}"
    redis_chat_key = "shogi_game_chat:#{@room_id}"
    redis_timer_key = "game_timer:#{room_id}"
    $redis.del(redis_timer_key, data.to_json)
    #$redis.del(redis_board_key)
    #$redis.del(redis_chat_key)

    #残り時間
    # Redisから現在のタイマー状態を読み込み、購読を開始したクライアントに送信・これにより、後から参加したクライアントも最新の状態を受け取れる
    initial_timer_state = load_timer_from_redis(@room_id)
    transmit({ type: 'initial_timer_state', data: initial_timer_state })# Action Cableの`transmit`メソッドは、現在の購読者に直接メッセージを送る

    #先手と後手を入れ替える
    #$redis.hdel(GAME_ROOMS_HASH_KEY, @room_id)#このroom_idに対応したゲームルームのデータを削除

    ActionCable.server.broadcast("shogi_game_room_#{room_id}",{
      data_type: "rematch_initialize"
    })
  end

  def decline_rematch(data)
    room_id = data['room_id']
    #your_role = data['yourRole']

    redis_board_key = "shogi_game:#{@room_id}"
    redis_chat_key = "shogi_game_chat:#{@room_id}"
    #$redis.del(redis_board_key)
    #$redis.del(redis_chat_key)

    #先手と後手を入れ替える
    #$redis.hdel(GAME_ROOMS_HASH_KEY, @room_id)#このroom_idに対応したゲームルームのデータを削除

    ActionCable.server.broadcast("shogi_game_room_#{room_id}",{
      declined_role: data['yourRole'],#拒否を選択した人
      data_type: "decline_rematch"
    })
  end


  #残り時間
  def toggle_timer(data)
    Rails.logger.debug "Received toggle_timer data: #{data.inspect}"
    server_timestamp = Time.now.to_i * 1000 # ミリ秒単位のUNIXタイムスタンプ

    # ⭐ ここを修正: キーを文字列に統一する
    timer_state = data.to_h.deep_merge({
      "isPaused" => data["isPaused"], # または data[:isPaused] でも動くはずだが、確実なのは文字列
      "senteTime" => data["senteTime"],
      "goteTime" => data["goteTime"],
      "activePlayer" => data["activePlayer"],
      "lastUpdateTime" => server_timestamp # サーバー側で生成したタイムスタンプは上書き
    })
    # data["isPaused"] のように文字列でアクセスするか、
    # data.symbolize_keys のように一旦シンボルに変換してからアクセスするか、
    # いずれかの方法でデータを取り出す必要があります。
    # `data.to_h` がすでに文字列キーのハッシュになっているので、文字列キーでアクセスするのが最も直接的です。

    # 確認のため、再度ログ出力
    Rails.logger.debug "toggle_timerの保存/ブロードキャスト前にマージされたタイマー状態: #{timer_state.inspect}"
    save_timer_to_redis(@room_id, timer_state)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_toggled', data: timer_state })
  end

  # switch_turn メソッドも同様に修正
  def switch_turn(data)
    Rails.logger.debug "Received switch_turn data: #{data.inspect}"
    server_timestamp = Time.now.to_i * 1000

    timer_state = data.to_h.deep_merge({
      "activePlayer" => data["activePlayer"],
      "isPaused" => data["isPaused"],
      "senteTime" => data["senteTime"],
      "goteTime" => data["goteTime"],
      "lastUpdateTime" => server_timestamp
    })
    Rails.logger.debug "switch_turnの保存/ブロードキャスト前にマージされたタイマー状態: #{timer_state.inspect}"
    save_timer_to_redis(@room_id, timer_state)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'turn_switched', data: timer_state })
  end

  # reset_timer メソッドも同様に修正
  def reset_timer(data)
    Rails.logger.debug "Received reset_timer data: #{data.inspect}"
    server_timestamp = Time.now.to_i * 1000

    timer_state = data.to_h.deep_merge({
      "isPaused" => data["isPaused"],
      "senteTime" => data["senteTime"],
      "goteTime" => data["goteTime"],
      "activePlayer" => data["activePlayer"],
      "lastUpdateTime" => server_timestamp
    })
    Rails.logger.debug "reset_timerの保存/ブロードキャスト前にマージされたタイマー状態: #{timer_state.inspect}"
    save_timer_to_redis(@room_id, timer_state)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_reset', data: timer_state })
  end

  # クライアントから手番交代リクエストを受け取る
=begin
  def switch_turn(data)
    # data: { senteTime: ..., goteTime: ..., activePlayer: 'sente' | 'gote', isPaused: ..., lastUpdateTime: ... (これはクライアントのタイムスタンプ) }
    # サーバー側で信頼できるタイムスタンプを生成
    server_timestamp = Time.now.to_i * 1000 # ミリ秒単位のUNIXタイムスタンプ

    # Redisにタイマー状態を保存
    # クライアントから受け取った時間とサーバーのタイムスタンプを保存
    # data.to_h はシンボルキーでない場合に必要
    timer_state = data.to_h.deep_merge({
      activePlayer: data[:activePlayer], # 新しい手番
      isPaused: data[:isPaused],
      senteTime: data[:senteTime],
      goteTime: data[:goteTime],
      lastUpdateTime: server_timestamp #サーバー側のタイムスタンプ
    })
    Rails.logger.info "switch_turnのtimer_state: #{timer_state}"
    save_timer_to_redis(@room_id, timer_state)

    # 他のクライアントに手番交代をブロードキャスト（サーバーのタイムスタンプを含める）
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'turn_switched', data: timer_state })
  end

  # toggle_timer, reset_timer も同様にサーバー側でタイムスタンプを付与する
  def toggle_timer(data)
    server_timestamp = Time.now.to_i * 1000
    timer_state = data.to_h.deep_merge({
      isPaused: data[:isPaused],
      senteTime: data[:senteTime],
      goteTime: data[:goteTime],
      activePlayer: data[:activePlayer],
      lastUpdateTime: server_timestamp
    })
    Rails.logger.info "toggle_timerのtimer_state: #{timer_state}"
    save_timer_to_redis(@room_id, timer_state)
    #ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_toggled', data: timer_state })
  end

  def reset_timer(data)
    server_timestamp = Time.now.to_i * 1000
    timer_state = data.to_h.deep_merge({
      isPaused: data[:isPaused], # 通常はtrue
      senteTime: data[:senteTime],
      goteTime: data[:goteTime],
      activePlayer: data[:activePlayer], # 通常はnull
      lastUpdateTime: server_timestamp
    })
    Rails.logger.info "reset_timerのtimer_state: #{timer_state}"
    save_timer_to_redis(@room_id, timer_state)
    #ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_reset', data: timer_state })
  end

  # クライアントからタイマーの更新リクエストを受け取る
  def update_timer(data)
    Rails.logger.info "update_timer"
    # data: { senteTime: 599000, goteTime: 599000, activePlayer: 'sente', isPaused: false, lastUpdateTime: Date.now() }
    # Redisにタイマー状態を保存
    save_timer_to_redis(@room_id, data)
    # 同じゲームの他のクライアントに新しいタイマー状態をブロードキャスト
    # Action Cableの`broadcast`メソッドは、指定されたストリームの全員にメッセージを送る
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_updated', data: data })
  end
  # クライアントから手番交代リクエストを受け取る
  def switch_turn(data)
    Rails.logger.info "switch_turn"
    # data: { activePlayer: 'sente' | 'gote', lastUpdateTime: Date.now() }
    # Redisにアクティブプレイヤーと最終更新時間を保存
    save_timer_to_redis(@room_id, data) # 時間も同時に更新されることを考慮

    # 他のクライアントに手番交代をブロードキャスト
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'turn_switched', data: data })
  end
  # タイマー開始/一時停止のリクエスト
  def toggle_timer(data)
    Rails.logger.info "toggle_timer"
    save_timer_to_redis(@room_id, data)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_toggled', data: data })
  end
  # タイマーリセットのリクエスト
  def reset_timer(data)
    Rails.logger.info "reset_timer"
    save_timer_to_redis(@room_id, data)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_reset', data: data })
  end
=end
  #残り時間

  #ゲームセットのブロードキャスト
  def game_set(data)
    Rails.logger.info "game_set: #{data}"
    ActionCable.server.broadcast("shogi_game_room_#{data['room_id']}", { 
      data_type: 'game_set', 
      winReason: data['winReason'],
      winner: data['winner'],
    })
  end


  private


  #サブスクライバーを増やす
  def increment_subscriber_count(room_id)
    Rails.logger.info "サブスクライバーを増やす"
    #$redis.current.incr("room_#{room_id}_subscribers")
    $redis.incr("room_#{room_id}_subscribers")
    Rails.logger.info "サブスクライバーを増やした"
  end

    #サブスクライバーを減らし、0人になったらデータ削除
  def decrement_subscriber_count(room_id)
    count = $redis.decr("room_#{room_id}_subscribers")
    
    #サブスクライバーが0になったらデータを削除
    if count <= 0
      Rails.logger.info "サブスクライバーが0になったからデータを削除"
      cleanup_room_data(room_id)
      Redis.current.del("room_#{room_id}_subscribers")
    end
  end

  #データを削除
  def cleanup_room_data(room_id)
=begin
    #データを削除
    @room_id = room_id
    redis_board_key = "shogi_game:#{@room_id}"
    redis_chat_key = "shogi_game_chat:#{@room_id}"

    begin
      $redis.del(redis_board_key)
      $redis.del(redis_chat_key)
      $redis.hdel(GAME_ROOMS_HASH_KEY, @room_id)#このroom_idに対応したゲームルームのデータを削除
    
    # Redisからゲームデータを削除
    Redis.current.del("game_state_#{room_id}")
    Redis.current.del("game_moves_#{room_id}")
=end
    Rails.logger.info "Cleaned up data for room: #{room_id}"
  end



  # RabbitMQ購読を管理するためのインスタンス変数
  @rabbitmq_consumer_thread = nil


  #最初のセットアップ配信・クライアントから perform('request_initial_board_state') が来た時に呼ばれる
  #def request_initial_board_state(room_id)
=begin
    #Redisにデータがあるかチェック
    redis_data=1
    if redis_data==1
        #Rails.logger.info "Redisにデータある"
        move_data={ from: '1g', to: '1f' }
        currentPlayer_data="a先手"  
        initial_data = {
          board: "ううあ新盤面情報のboadstate", 
          last_move: move_data,
          currentPlayer: currentPlayer_data
        }
        #receive(initial_data) # receiveメソッドを内部的に呼び出す（同じ処理を再利用）
        #ActionCable.server.broadcast("shogi_game_room_#{@room_id}", initial_data)
    end
=end
  #end

  #初期設定
  #def request_initial_board_state(room_id,game_id)
  def init_state(room_id,game_id)
    #Rails.logger.info "WebSocket初期読み込みrequest_initial_board_state: room_id:#{room_id}・game_id:#{game_id}"

    #@redis = $redis # config/initializers/redis.rb で設定したグローバル変数
    redis_key = "shogi_game:#{room_id}"
    redis_chat_key = "shogi_game_chat:#{room_id}"

    redis_stored_board_data=""
    if $redis.exists?(redis_key)
      # Redisにデータがある → JSON文字列をパースして返す
      redis_stored_board_data = $redis.get(redis_key)
      
      #JSON.parseは形式の文字列をRubyのHash(ハッシュ)形式に変換するためのメソッド
      #@game_data = JSON.parse(redis_stored_data)
      
      #@game_data = redis_stored_data
      #Rails.logger.info "Redisから取得: #{redis_stored_board_data}"

      # 取得したデータをクライアントにブロードキャスト
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",{
          data_type: "already_redis_stored_board_data",
          redis_stored_board_data: redis_stored_board_data
        })
    else
      # 取得したデータをクライアントにブロードキャスト
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",{
          data_type: "initialize"
        })
    end

    if $redis.exists?(redis_chat_key)
      #redis_stored_chat_data = $redis.get(redis_chat_key) #指定したキーに保存されているデータの型と、実行しようとしているコマンドの型が一致しない場合にエラー発生
        #$redis.rpush(redis_chat_key, chat_data)  # ← これは Redis に「リスト型」で保存
        #$redis.get(redis_chat_key)               # ← これは Redis に「文字列型」として読み込もうとしている
        # すべてのチャットメッセージを取得（0から-1は全件）
      redis_stored_chat_data = $redis.lrange(redis_chat_key, 0, -1) #キーをリスト型としてデータ取得
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",
        {
          data_type: "already_redis_stored_chat_data",
          chat_data: redis_stored_chat_data
        }
      )
    end
  end


  #残り時間
  def load_timer_from_redis(room_id)
    key = "game_timer:#{room_id}"
    json_data = $redis.get(key)
    if json_data.present?
      parsed_data = JSON.parse(json_data)
      Rails.logger.info "load_timer_from_redis: #{parsed_data}"

      # Redisに保存されているデータにlastUpdateTimeが欠けている場合に備える
      parsed_data["lastUpdateTime"] ||= Time.now.to_i * 1000
      parsed_data
    else
      Rails.logger.info "load_timer_from_redis: Redisにデータがない場合の初期値"

      # Redisにデータがない場合の初期値
      initial_minutes = 10
      {
        "senteTime" => initial_minutes * 60 * 1000,
        "goteTime" => initial_minutes * 60 * 1000,
        "activePlayer" => nil, # 初期状態では手番は確定していない
        "isPaused" => true,    # 初期状態ではタイマーは一時停止中
        "lastUpdateTime" => Time.now.to_i * 1000 # 最初の初期化時刻
      }
    end
  rescue StandardError => e
    Rails.logger.error "Failed to load timer from Redis for room #{room_id}: #{e.message}"
    initial_minutes = 10
    {
      "senteTime" => initial_minutes * 60 * 1000,
      "goteTime" => initial_minutes * 60 * 1000,
      "activePlayer" => nil,
      "isPaused" => true,
      "lastUpdateTime" => Time.now.to_i * 1000
    }
  end

  def save_timer_to_redis(room_id, data)
    redis_timer_key = "game_timer:#{room_id}"
    $redis.set(redis_timer_key, data.to_json)
  rescue StandardError => e
    Rails.logger.error "Failed to save timer to Redis for room #{room_id}: #{e.message}"
  end
=begin
  def load_timer_from_redis(room_id)
    key = "game_timer:#{room_id}"
    json_data = Redis.current.get(key)
    if json_data.present?
      parsed_data = JSON.parse(json_data) # シンボルに変換せず、文字列キーのまま
      # lastUpdateTime が存在しない場合に備える (文字列キーでアクセス)
      parsed_data["lastUpdateTime"] ||= Time.now.to_i * 1000
      parsed_data
    else
      initial_minutes = 10
      {
        "senteTime" => initial_minutes * 60 * 1000,
        "goteTime" => initial_minutes * 60 * 1000,
        "activePlayer" => nil,
        "isPaused" => true,
        "lastUpdateTime" => Time.now.to_i * 1000 # 初期状態でもタイムスタンプを付ける
      }
    end
  rescue StandardError => e
    Rails.logger.error "Failed to load timer from Redis for room #{room_id}: #{e.message}"
    initial_minutes = 10
    {
      "senteTime" => initial_minutes * 60 * 1000,
      "goteTime" => initial_minutes * 60 * 1000,
      "activePlayer" => nil,
      "isPaused" => true,
      "lastUpdateTime" => Time.now.to_i * 1000
    }
  end

  def save_timer_to_redis(room_id, data)
    key = "game_timer:#{room_id}"
    Redis.current.set(key, data.to_json) # data は文字列キーのハッシュ
  rescue StandardError => e
    Rails.logger.error "Failed to save timer to Redis for room #{room_id}: #{e.message}"
  end

  def load_timer_from_redis(room_id)
    Rails.logger.info "load_timer_from_redis: #{room_id}"
    key = "game_timer:#{room_id}"
    json_data = $redis.get(key)
    if json_data.present?
      parsed_data = JSON.parse(json_data).transform_keys(&:to_sym)
      # lastUpdateTime が存在しない場合に備える
      parsed_data[:lastUpdateTime] ||= Time.now.to_i * 1000
      parsed_data
    else
      initial_minutes = 10
      {
        senteTime: initial_minutes * 60 * 1000,
        goteTime: initial_minutes * 60 * 1000,
        activePlayer: nil,
        isPaused: true,
        lastUpdateTime: Time.now.to_i * 1000 # 初期状態でもタイムスタンプを付ける
      }
    end
  rescue StandardError => e
    Rails.logger.error "Failed to load timer from Redis for room #{room_id}: #{e.message}"
    initial_minutes = 10
    {
      senteTime: initial_minutes * 60 * 1000,
      goteTime: initial_minutes * 60 * 1000,
      activePlayer: nil,
      isPaused: true,
      lastUpdateTime: Time.now.to_i * 1000
    }
  end

  def save_timer_to_redis(room_id, data)
    key = "game_timer:#{room_id}"
    $redis.set(key, data.to_json)
  rescue StandardError => e
    Rails.logger.error "Failed to save timer to Redis for room #{room_id}: #{e.message}"
  end

  # Redisからタイマー状態を読み込むヘルパーメソッド
  def load_timer_from_redis(room_id)
    # Redisのキーを定義 (例: "game_timer:room_123")
    key = "game_timer:#{room_id}"
    json_data = $redis.get(key)
    if json_data.present?
      JSON.parse(json_data).transform_keys(&:to_sym) # シンボルに変換
    else
      # 初期状態を返す (例: 10分)
      initial_minutes = 10
      {
        senteTime: initial_minutes * 60 * 1000,
        goteTime: initial_minutes * 60 * 1000,
        activePlayer: nil,
        isPaused: true,
        lastUpdateTime: nil # 最終更新時間は保存しないか、クライアントが初期化時に設定
      }
    end
  rescue StandardError => e
    Rails.logger.error "Failed to load timer from Redis for room #{room_id}: #{e.message}"
    # エラー時のフォールバック処理
    initial_minutes = 10
    {
      senteTime: initial_minutes * 60 * 1000,
      goteTime: initial_minutes * 60 * 1000,
      activePlayer: nil,
      isPaused: true,
      lastUpdateTime: nil
    }
  end

  # Redisにタイマー状態を保存するヘルパーメソッド
  def save_timer_to_redis(room_id, data)
    key = "game_timer:#{room_id}"
    $redis.set(key, data.to_json)
    # Redisの有効期限を設定することも検討 (例: ゲームが一定時間活動がなければ削除)
    # Redis.current.expire(key, 1.day)
  rescue StandardError => e
    Rails.logger.error "Failed to save timer to Redis for room #{room_id}: #{e.message}"
  end
=end
  #残り時間


  # RabbitMQの購読を開始する
  def start_rabbitmq_subscription(room_id)
    routing_key_for_this_room = "game.#{room_id}.board_update"

    # 注意: Action Cableチャンネル内で直接subscribeすると、接続ごとに新しいスレッド/プロセスが起動し、負荷が高まる可能性があります。
    # 理想的には、単一のバックグラウンドワーカーがRabbitMQを購読し、Action CableのActionCable.server.broadcastを呼び出す形が良いです。
    @rabbitmq_consumer_thread = Thread.new do
      RabbitmqService.subscribe(routing_key_for_this_room) do |message_body, received_routing_key|
        # RabbitMQからメッセージを受け取ったら、Action Cableを通じてクライアントにブロードキャスト
        ActionCable.server.broadcast(
          "shogi_game_room_#{room_id}", # この部屋を購読している全クライアントへ
          message_body # 受信した盤面データをそのまま送信
        )
      end
    end
    Rails.logger.info "RabbitMQのサブスクリプションをルーティングキー用に開始: #{routing_key_for_this_room}"
    #Rails.logger.info "初期データリクエストをRabbitMQへ送信"
  rescue Bunny::Exception => e
    Rails.logger.error "RabbitMQサブスクリプションエラー: #{e.message}"
  end

  # RabbitMQの購読を停止する
  def stop_rabbitmq_subscription
    if @rabbitmq_consumer_thread && @rabbitmq_consumer_thread.alive?
      # Threadを終了させる安全な方法を探すか、単にGCに任せる
      # Bunnyのsubscribeは通常ブロッキングされるため、スレッドを直接killするのは推奨されない
      # 実際のアプリケーションでは、Bunnyの接続とキューの管理をより慎重に行う
      Rails.logger.info "RabbitMQのroom_idに対するサブスクリプションスレッドを停止する: #{@room_id}"
    end
  end
end