class ShogiController < ApplicationController



  MATCHING_QUEUE_KEY = 'shogi:matching_queue' # Redisのリストキー
  GAME_ROOMS_HASH_KEY = 'shogi:game_rooms'    # Redisのハッシュキー

  def index
    @game_id = params[:id]
    @room_id = params[:id]

    #a=$redis.get(MATCHING_QUEUE_KEY)
    # 特定のroom_idのデータを取得
    room_data_json = $redis.hget(GAME_ROOMS_HASH_KEY, @room_id)
    Rails.logger.info "redisからデータ取得: #{room_data_json}"#redisからデータ取得: {"sente_identifier":"9a407895123bef7a65202dfb165a9aff","gote_identifier":"9f63ac8f86022e04a98aa62b8be8a737","status":"active","created_at":1750569827,"player1_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","player2_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}
    

    Rails.logger.info "session[:player_role]: #{session[:player_role]}"
    Rails.logger.info "session[:opponent_identifier]: #{session[:opponent_identifier]}"
    #if session[:player_role]=="sente"
    @your_sente_gote = session[:player_role]
    @opponent_identifier = session[:opponent_identifier]

    user_identifier = session.id.to_s

    # メモリ上の @@game_rooms から部屋情報を取得
    #@room_data = @@game_rooms[room_id]
    #@room_data = @@game_rooms[@room_id]

=begin
    if @room_data.nil?
      redirect_to root_path, alert: "指定された対戦部屋は見つかりませんでした。"
      return
    end

    # 現在のセッションがこの部屋のどちらかのプレイヤーであるかを確認
    unless @room_data[:sente_identifier] == user_identifier || @room_data[:gote_identifier] == user_identifier
      redirect_to root_path, alert: "この部屋にはアクセスできません。"
      return
    end


    # セッションからプレイヤーの役割を取得（MatchingControllerでセットされたもの）
    @player_role = session[:player_role]

    # フォールバック（セッションが失われた場合など）
    if @player_role.blank?
      @player_role = if @room_data[:sente_identifier] == user_identifier
                      'sente'
                    else
                      'gote'
                    end
    end
=end

    # マッチング成立後に不要になったセッション情報をクリア
    session.delete(:matching_in_progress)
    session.delete(:matched_room_id)
    session.delete(:player_role)
    session.delete(:opponent_identifier)

    # 部屋データをビューに渡す（ここでは`@room_data`を使用）
  
    #else session[:player_role]=="gote"
    #end
    @redis = $redis # config/initializers/redis.rb で設定したグローバル変数
    redis_key = "shogi_game:#{@game_id}"
    redis_chat_key = "shogi_game_chat:#{@game_id}"

  
    #$redis.del("shogi_game:#{@game_id}")
    #$redis.del("shogi_game_chat:#{@game_id}")

    
=begin
    if @redis.exists?(redis_key)
      # Redisにデータがある → JSON文字列をパースして返す
      stored_data = @redis.get(redis_key)
      @game_data = JSON.parse(stored_data)
      Rails.logger.info "Redisから取得: #{@game_data}"
      @game_data
    else
      # Redisにデータがない → 初期データを作ってRedisに保存
      board_data="ああがあっがあ新盤面情報のboadstate"
      move_data={ from: '2g', to: '2f' }
      currentPlayer_data="bbb先手"  
      @game_data = {
        board: board_data, 
        last_move: move_data,
        currentPlayer: currentPlayer_data
      }
      @redis.set(redis_key, @game_data.to_json)
      Rails.logger.info "Redisに初期データを保存: #{@game_data}"
      @game_data
    end

    #@game_data = RedisService.fetch_or_initialize_game(@game_id)
    #Rails.logger.info "Redisのgame_data: #{@game_data}"
    #render json: game_data
    #@game_id = 2
=end

=begin
    # クライアント接続時に RabbitMQ に a=1 を publish
    #RabbitmqService.publish("shogi.room.#{room_id}", { a: 1 })
    routing_key_for_this_room = "game.#{@room_id}.board_update"
    message_body={ a: 1 }

    # 注意: Action Cableチャンネル内で直接subscribeすると、接続ごとに新しいスレッド/プロセスが起動し、負荷が高まる可能性があります。
    # 理想的には、単一のバックグラウンドワーカーがRabbitMQを購読し、Action Cableの `ActionCable.server.broadcast` を呼び出す形が良いです。
    # ここでは概念を分かりやすくするために簡易的に記述しています。
    @rabbitmq_consumer_thread = Thread.new do
      RabbitmqService.subscribe(routing_key_for_this_room) do |message_body, received_routing_key|
        #Rails.logger.info "message_body: #{message_body}"
        #Rails.logger.info "received_routing_key: #{received_routing_key}"
        # RabbitMQからメッセージを受け取ったら、Action Cableを通じてクライアントにブロードキャスト
        ActionCable.server.broadcast(
          "shogi_game_room_#{room_id}", # この部屋を購読している全クライアントへ
          message_body # 受信した盤面データをそのまま送信
        )
      end
    end
    Rails.logger.info "RabbitMQのサブスクリプションをルーティングキー用に開始: #{routing_key_for_this_room}"
=end
  end

  def destroy
      @room_id = params[:id]
      redis_key = "shogi_game:#{@room_id}"
      redis_chat_key = "shogi_game_chat:#{@room_id}"

      begin
        $redis.del(redis_key)
        $redis.del(redis_chat_key)
        $redis.hdel(GAME_ROOMS_HASH_KEY, @room_id)#このroom_idに対応したゲームルームのデータを削除

        #if deleted_count > 0
          render json: { message: "room_id #{@room_id} 削除成功" }, status: :ok
        #else
          #render json: { message: "Game ID #{room_id} 見つからない" }, status: :not_found
        #end
      rescue Redis::CannotConnectError => e
        Rails.logger.error "APIからの削除時にRedis接続エラーが発生: #{e.message}"
        render json: { error: "Redisの接続に失敗" }, status: :service_unavailable
      rescue StandardError => e
        Rails.logger.error "IDのゲームデータの削除に失敗 #{@room_id}: #{e.message}"
        render json: { error: "予期せぬエラーが発生" }, status: :internal_server_error
      end
  end

  def update #移動を処理して状態を更新します
    # Optional: Save drawing state to database
    game_id = params[:game_id]
    move = params[:move]

    Rails.logger.error "ShogiControllerのindexのgame_id: #{@game_id}"
    Rails.logger.error "ShogiControllerのindexのmove:  #{move}"


    # Update game state in Redis
    game_state = RedisService.get_game_state(@game_id)
    Rails.logger.error "ShogiControllerのRedisServiceからの戻り値のgame_state:  #{game_state}"
    # Update game state logic here...

    # Publish move to RabbitMQ
    #RabbitmqService.publish(move)

    #render json: { success: true }

  end
end
