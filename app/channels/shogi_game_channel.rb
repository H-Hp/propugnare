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
    Rails.logger.info "ShogiGameChannelにroom_idで登録: #{@room_id}"

    #最初のセットアップ
    init_state(@room_id,@game_id)

    # RabbitMQから特定のルーティングキーのメッセージを購読する・これは通常、別途バックグラウンドジョブや常駐プロセスで行うべきだが、簡単化のため、このチャンネル内で購読処理を記述
    #start_rabbitmq_subscription(@room_id)
  end

  # 購読解除（unsubscribe）時に呼び出される・チャンネルがサブスクリプション解除された際の処理
  def unsubscribed
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
    redis_key = "shogi_game:#{@game_id}"
    new_board_data=data

    Rails.logger.info "Redisに値をセット・new_data： #{new_board_data}"
    Rails.logger.info "BoardInfo： #{boardInfo}"
    Rails.logger.info "@room_id： #{@room_id}・@game_id： #{@game_id}・redis_key： #{redis_key}"

    $redis.set(redis_key, new_board_data.to_json)#Redisに値をセット
    
    #WebSocketで配信
    ActionCable.server.broadcast("shogi_game_room_#{@room_id}",{data_type: "board_update",new_board_data: new_board_data})
    
    Rails.logger.info "room_id に対応する moveHistory_data を受信しました： #{@room_id}: #{moveHistory_data}"

    new_board_state = { board: "新盤面情報のboadstate", moveHistory: moveHistory_data, nowTurn: nowTurn_data } # 実際はゲームロジックで生成

    routing_key = "game.#{@room_id}.board_update"
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
    redis_key = "shogi_game:#{room_id}"
    redis_chat_key = "shogi_game_chat:#{room_id}"

    redis_stored_board_data=""
    if $redis.exists?(redis_key)
      # Redisにデータがある → JSON文字列をパースして返す
      redis_stored_board_data = $redis.get(redis_key)
      
      #JSON.parseは形式の文字列をRubyのHash(ハッシュ)形式に変換するためのメソッド
      #@game_data = JSON.parse(redis_stored_data)
      
      #@game_data = redis_stored_data
      Rails.logger.info "Redisから取得: #{redis_stored_board_data}"

      # 取得したデータをクライアントにブロードキャスト
      ActionCable.server.broadcast(
        "shogi_game_room_#{room_id}",
        {
          data_type: "already_redis_stored_board_data",
          redis_stored_board_data: redis_stored_board_data
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