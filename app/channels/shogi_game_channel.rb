class ShogiGameChannel < ApplicationCable::Channel
  # 購読（subscribe）時に呼び出される
  def subscribed
    

    # 部屋番号をパラメータから取得 (例: /cable?room_id=123)
    @room_id = params[:room_id]
    #@game_id = params[:id]
    @game_id = 2
    reject unless @room_id.present? # 部屋番号がない場合は購読を拒否

    #redis_key = "shogi_game:#{@game_id}"
    #$redis.del(redis_key)

    # この接続を特定のストリーム（部屋）に紐付ける・Action Cableの概念で、特定のブロードキャストに対してリスナーになる
    stream_from "shogi_game_room_#{@room_id}"
    Rails.logger.info "ShogiGameChannelにroom_idで登録: #{@room_id}"

    #最初のセットアップ
    #request_initial_board_state(@room_id,@game_id)
    init_state(@room_id,@game_id)

    # RabbitMQから特定のルーティングキーのメッセージを購読する・これは通常、別途バックグラウンドジョブや常駐プロセスで行うべきだが、簡単化のため、このチャンネル内で購読処理を記述
    #start_rabbitmq_subscription(@room_id)
  end

  # 購読解除（unsubscribe）時に呼び出される
  def unsubscribed
    # チャンネルがサブスクリプション解除された際の処理
    stop_rabbitmq_subscription # RabbitMQの購読を停止
    Rails.logger.info "ShogiGameChannelからroom_idに関するサブスクリプションを解除: #{@room_id}"
  end

  # クライアントからメッセージを受信した時
  #def receive(data)
  def board_broadcast_and_store(data)
    move_data = data['move']
    currentPlayer_data = data['currentPlayer']
    boardInfo = data['BoardInfo']
    @room_id = data['room_id']
    @game_id = data['game_id']
    redis_key = "shogi_game:#{@game_id}"
    new_board_data=data

    Rails.logger.info "Redisに値をセット・new_data： #{new_board_data}"
    Rails.logger.info "BoardInfo： #{boardInfo}"
    Rails.logger.info "@room_id： #{@room_id}・@game_id： #{@game_id}・redis_key： #{redis_key}"

    $redis.set(redis_key, new_board_data.to_json)#Redisに値をセット
    
    #WebSocketで配信
    #ActionCable.server.broadcast("shogi_game_room_#{@room_id}", new_data)
    ActionCable.server.broadcast(
      "shogi_game_room_#{@room_id}",
      {
        data_type: "board_update",
        new_board_data: new_board_data
      }
    )
    
    Rails.logger.info "room_id に対応する move_data を受信しました： #{@room_id}: #{move_data}"

    # ここで将棋のゲームロジックを処理する
    # 例: Game.find(@room_id).apply_move(move_data)
    # その後、新しい盤面データやイベントをRabbitMQに発行
    #new_board_state = { board: "新盤面情報のboadstate", last_move: move_data } # 実際はゲームロジックで生成
    new_board_state = { board: "新盤面情報のboadstate", last_move: move_data, currentPlayer: currentPlayer_data } # 実際はゲームロジックで生成

    routing_key = "game.#{@room_id}.board_update"
    #RabbitmqService.publish(routing_key, new_board_state)
  end

  #def send_chat_message(data)
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
      #updated_redis_stored_data = $redis.get(redis_chat_key)#キーをString型としてデータ取得
      updated_redis_stored_data = $redis.lrange(redis_chat_key, 0, -1) #キーをリスト型としてデータ取得
    else
      #$redis.set(redis_chat_key,chat_data.to_json)#Redisに値をセット
      $redis.rpush(redis_chat_key, chat_data)
      updated_redis_stored_data=chat_data
    end
    # 取得したデータをクライアントにブロードキャスト
    ActionCable.server.broadcast(
      "shogi_game_room_#{room_id}",
      {
        data_type: "chat_update",
        chat_data: updated_redis_stored_data
        #updated_redis_stored_data: updated_redis_stored_data
      }
    )
  end

  private

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
    Rails.logger.info "WebSocket初期読み込みrequest_initial_board_state: room_id:#{room_id}・game_id:#{game_id}"

    #@redis = $redis # config/initializers/redis.rb で設定したグローバル変数
    redis_key = "shogi_game:#{game_id}"
    redis_chat_key = "shogi_game_chat:#{game_id}"

    #@game_data=""
    redis_stored_board_data=""
    if $redis.exists?(redis_key)
      # Redisにデータがある → JSON文字列をパースして返す
      redis_stored_board_data = $redis.get(redis_key)
      
      #JSON.parseは形式の文字列をRubyのHash(ハッシュ)形式に変換するためのメソッド
      #@game_data = JSON.parse(redis_stored_data)
      
      #@game_data = redis_stored_data
      Rails.logger.info "Redisから取得: #{redis_stored_board_data}"
      #Rails.logger.info "Redisから取得ああああmove: #{stored_data["move"].inspect }"
      #Rails.logger.info "Redisから取得ああああmove: #{@game_data["move"].inspect }"
      #Rails.logger.info "Redisから取得ああああ: #{@game_data["BoardInfo"]}"
      
      #@game_data

      #Rails.logger.info "Redisから取得ああああmove: #{@game_data["move"].inspect }"


      # 取得したデータをクライアントにブロードキャスト
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",
        {
          data_type: "already_redis_stored_board_data",
          redis_stored_board_data: redis_stored_board_data
=begin
          #move: @game_data["move"].inspect, # 最後の指し手
          move: @game_data["move"], # 最後の指し手
          #boardInfo: @game_data["BoardInfo"].inspect,       # 盤面情報
          #boardInfo: @game_data["BoardInfo"].inspect.to_json,       # 盤面情報
          boardInfo: @game_data["BoardInfo"],       # 盤面情報
          currentPlayer: @game_data["currentPlayer"].inspect, # 現在の手番
          room_id: room_id, # 部屋ID
          game_id: room_id  # ゲームID (今回は room_id と同じと仮定)
=end
        }
      )

    else
      # 取得したデータをクライアントにブロードキャスト
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",
        {
          data_type: "initialize"
        }
      )
=begin
      # Redisにデータがない → 初期データを作ってRedisに保存
      board_data="ああがあっがあ新盤面情報のboadstate"
      move_data={ from: '2g', to: '2f' }
      currentPlayer_data="bbb先手"  
      @game_data = {
        board: board_data, 
        last_move: move_data,
        currentPlayer: currentPlayer_data
      }
      $redis.set(redis_key, @game_data.to_json)
      Rails.logger.info "Redisに初期データを保存: #{@game_data}"
      @game_data
=end
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
          #data_type: "chat",
          data_type: "already_redis_stored_chat_data",
          chat_data: redis_stored_chat_data
          #redis_stored_chat_data: redis_stored_chat_data
        }
      )
    end
=begin
    #@game_data = RedisService.fetch_or_initialize_game(@game_id)
    #Rails.logger.info "Redisのgame_data: #{@game_data}"
    #render json: game_data
    #@game_id = 2
    
    # 取得したデータをクライアントにブロードキャスト
    ActionCable.server.broadcast(
      "shogi_game_room_#{@room_id}",
      {
        type: 'initial_board_state', # クライアント側で初期データと識別するためのtype
        move: game_data[:last_move], # 最後の指し手
        board: game_data[:board],       # 盤面情報
        currentPlayer: game_data[:current_turn], # 現在の手番
        room_id: @room_id, # 部屋ID
        game_id: @room_id  # ゲームID (今回は room_id と同じと仮定)
      }
    )
    Rails.logger.info "Sent initial board state for room #{@room_id} from Redis"
  rescue => e
    Rails.logger.error "Error sending initial board state: #{e.message}"
    transmit({ error: e.message, type: 'initial_data_error' })
  end
    #routing_key = "shogi.init.request.#{@room_id}"
    #RabbitmqService.publish(routing_key, {
    #  room_id: @room_id,
    #  action: "send_initial_board"
    #})
    
    routing_key_for_this_room = "game.#{room_id}.board_update"
    
    #初期データがあるかどうか
    #Redisにそのgame_idのデータがあるかチェック
    move_data = data['move']
    currentPlayer_data = data['currentPlayer']


    rescue Bunny::Exception => e
      Rails.logger.error "RabbitMQサブスクリプションエラー: #{e.message}"
      # エラー処理

    new_board_state = { board: "あ新盤面情報のboadstate", last_move: move_data, currentPlayer: currentPlayer_data } # 実際はゲームロジックで生成
    routing_key = "game.#{@room_id}.board_update"
=end
  end


  # RabbitMQの購読を開始する
  def start_rabbitmq_subscription(room_id)
    routing_key_for_this_room = "game.#{room_id}.board_update"


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
    #Rails.logger.info "message_body: #{message_body}"
    #Rails.logger.info "received_routing_key: #{received_routing_key}"

    #Rails.logger.info "初期データリクエストをRabbitMQへ送信"
=begin
    move_data={ from: '1g', to: '1f' }
    currentPlayer_data="a先手"
    new_board_state = { board: "あ新盤面情報のboadstate", last_move: move_data, currentPlayer: currentPlayer_data } # 実際はゲームロジックで生成
    routing_key = "game.#{@room_id}.board_update"
    RabbitmqService.publish(routing_key, new_board_state)
=end

  rescue Bunny::Exception => e
    Rails.logger.error "RabbitMQサブスクリプションエラー: #{e.message}"
    # エラー処理
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