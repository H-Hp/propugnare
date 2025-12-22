class ShogiGameChannel < ApplicationCable::Channel
  #DELETE_TIME=10
  #DELETE_TIME = 30 * 60 #30分を秒単位で定義・30秒 x 60秒 = 1800秒
  DELETE_TIME = 60 * 500 #8時間20分・500分・60秒 x 500秒 = 30000秒

  # 購読（subscribe）時に呼び出される
  def subscribed
    # 部屋番号をパラメータから取得 (/?room_id=123)
    @room_id = params[:room_id]
    #@game_id = params[:room_id]
    reject unless @room_id.present? # 部屋番号がない場合は購読を拒否

    # この接続を特定のストリーム（部屋）に紐付ける・Action Cableの概念で、特定のブロードキャストに対してリスナーになる
    stream_from "shogi_game_room_#{@room_id}"
    #Rails.logger.info "ShogiGameChannelにroom_idで登録: #{@room_id}"

    #残り時間
    # Redisから現在のタイマー状態を読み込み、購読を開始したクライアントに送信・これにより、後から参加したクライアントも最新の状態を受け取れる
    initial_timer_state = load_timer_from_redis(@room_id)
    # Action Cableのtransmitメソッドは、現在の購読者に直接メッセージを送る
    transmit({ type: 'initial_timer_state', data: initial_timer_state })

    #最初のセットアップ
    #init_state(@room_id,@game_id)
    init_state(@room_id)

    # 購読者カウントを増やす
    #increment_subscriber_count(@room_id)

    # RabbitMQから特定のルーティングキーのメッセージを購読する・これは通常、別途バックグラウンドジョブや常駐プロセスで行うべきだが、簡単化のため、このチャンネル内で購読処理を記述
    #start_rabbitmq_subscription(@room_id)
  end

  # 購読解除（unsubscribe）時に呼び出される・チャンネルがサブスクリプション解除された際の処理
  def unsubscribed
    # 購読者カウントを減らす
    #decrement_subscriber_count(@room_id)

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

    #redis_key = "shogi_game:#{@game_id}"
    redis_key = "shogi_game:#{@room_id}"
    routing_key = "game.#{@room_id}.board_update"
    $redis.set(redis_key, new_board_data.to_json)#Redisに値をセット
    #$redis.expire(redis_key, 10) #時間経過後に自動削除
    $redis.expire(redis_key, DELETE_TIME) #時間経過後に自動削除

    #WebSocketで配信
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}",{data_type: "board_update",new_board_data: new_board_data})
    #Rails.logger.info "room_id に対応する moveHistory_data を受信しました： #{@room_id}: #{moveHistory_data}"
    new_board_state = { board: "新盤面情報のboadstate", moveHistory: moveHistory_data, nowTurn: nowTurn_data } # 実際はゲームロジックで生成
  end

  def chat_broadcast_and_store(data)
    chat_text = data['chat_data']
    yourUsername = data['yourUsername']
    room_id = data['room_id']
    game_id = data['game_id']
    redis_chat_key = "shogi_game_chat:#{game_id}"
    chat_data = {
      username: yourUsername,
      chat_text:  chat_text
    }
    updated_redis_stored_data=""
    if $redis.exists?(redis_chat_key)
      $redis.rpush(redis_chat_key, chat_data.to_json)
      $redis.expire(redis_chat_key, DELETE_TIME)#時間経過後に自動削除
      updated_redis_stored_data = $redis.lrange(redis_chat_key, 0, -1) #キーをリスト型としてデータ取得
    else
      $redis.rpush(redis_chat_key, chat_data.to_json)
      $redis.expire(redis_chat_key, DELETE_TIME)#時間経過後に自動削除
      updated_redis_stored_data=chat_data
    end
    # 取得したデータをクライアントにブロードキャスト
    puts "updated_redis_stored_data: #{updated_redis_stored_data}"
    ActionCable.server.broadcast( "shogi_game_room_#{room_id}",{ data_type: "chat_update", chat_data: updated_redis_stored_data})
  end

  #再対戦のセットアップ
  def rematch_setup(data)    
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

    timer_state = data.to_h.deep_merge({
      "isPaused" => data["isPaused"], # または data[:isPaused] でも動くはずだが、確実なのは文字列
      "senteTime" => data["senteTime"],
      "goteTime" => data["goteTime"],
      "activePlayer" => data["activePlayer"],
      "lastUpdateTime" => server_timestamp # サーバー側で生成したタイムスタンプは上書き
    })
    # data["isPaused"] のように文字列でアクセスするか、data.symbolize_keys のように一旦シンボルに変換してからアクセスするか、いずれかの方法でデータを取り出す
    # data.to_hがすでに文字列キーのハッシュになっているので、文字列キーでアクセスするのが最も直接的です。

    # 確認のため、再度ログ出力
    Rails.logger.debug "toggle_timerの保存/ブロードキャスト前にマージされたタイマー状態: #{timer_state.inspect}"
    save_timer_to_redis(@room_id, timer_state)
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}", { type: 'timer_toggled', data: timer_state })
  end

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
  #残り時間ここまで

  #ゲームセットのブロードキャスト
  def game_set(data)
    #Rails.logger.info "game_set: #{data}"
    #game room dataのstatudをfinishedに変更
    game_rooms_key = "game_room:#{data['room_id']}"
    game_room_data = $redis.get(game_rooms_key)
    new_room_data = JSON.parse(game_room_data, symbolize_names: true) #JSONをパースしてハッシュに変換
    new_room_data[:status] = 'finished' #statusを変更
    remaining_ttl = $redis.ttl(game_rooms_key)# TTLを取得（残り時間を保持するため）
    # 変更されたデータを再保存（TTLも保持）
    if remaining_ttl > 0
      $redis.setex(game_rooms_key, remaining_ttl, new_room_data.to_json)
    else
      $redis.set(game_rooms_key, new_room_data.to_json)
    end

    ActionCable.server.broadcast("shogi_game_room_#{data['room_id']}", { 
      data_type: 'game_set', 
      winReason: data['winReason'],
      winner: data['winner'],
    })
  end

  private

  #データを削除(RedisにTTL設定したから不要)
  def cleanup_room_data(room_id)
    Rails.logger.info "部屋のデータをクリーンアップ: #{room_id}"
  end

  #初期設定
  #def init_state(room_id,game_id)
  def init_state(room_id)
    Rails.logger.info "WebSocket初期読み込みrequest_initial_board_state: room_id:#{room_id}"

    redis_key = "shogi_game:#{room_id}"
    redis_chat_key = "shogi_game_chat:#{room_id}"

    redis_stored_board_data=""
    if $redis.exists?(redis_key) # Redisにデータがある場合 → JSON文字列をパースして返す
      redis_stored_board_data = $redis.get(redis_key)
      Rails.logger.info "init_stateでredisにデータがある場合: redis_stored_board_data:#{redis_stored_board_data}"

      ActionCable.server.broadcast( # 取得したデータをクライアントにブロードキャスト
        "shogi_game_room_#{room_id}",{
          data_type: "already_redis_stored_board_data",
          redis_stored_board_data: redis_stored_board_data
        })
    else
      Rails.logger.info "init_stateでredisにデータがない場合"
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
      #Rails.logger.info "load_timer_from_redis: #{parsed_data}"
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
    #Rails.logger.error "Redisからルームのタイマーを読み込めませんでした: #{room_id}: #{e.message}"
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
    $redis.expire(redis_timer_key, DELETE_TIME) #時間経過後に自動削除
  rescue StandardError => e
    Rails.logger.error "Failed to save timer to Redis for room #{room_id}: #{e.message}"
  end
  #残り時間


  # RabbitMQ購読を管理するためのインスタンス変数
  @rabbitmq_consumer_thread = nil

  # RabbitMQの購読を開始する
  def start_rabbitmq_subscription(room_id)
    routing_key_for_this_room = "game.#{room_id}.board_update"

    #Action Cableチャンネル内で直接subscribeすると、接続ごとに新しいスレッド/プロセスが起動し、負荷が高まる可能性がある
    # 理想的には、単一のバックグラウンドワーカーがRabbitMQを購読し、Action CableのActionCable.server.broadcastを呼び出す形がいい
    @rabbitmq_consumer_thread = Thread.new do
      RabbitmqService.subscribe(routing_key_for_this_room) do |message_body, received_routing_key|
        # RabbitMQからメッセージを受け取ったら、Action Cableを通じてクライアントにブロードキャスト
        ActionCable.server.broadcast(
          "shogi_game_room_#{room_id}", # この部屋を購読している全クライアントへ
          message_body # 受信した盤面データをそのまま送信
        )
      end
    end
    #Rails.logger.info "RabbitMQのサブスクリプションをルーティングキー用に開始: #{routing_key_for_this_room}"
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