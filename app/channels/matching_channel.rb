class MatchingChannel < ApplicationCable::Channel
  MATCHING_QUEUE_KEY = 'shogi:matching_queue'
  #DELETE_TIME=20
  DELETE_TIME = 30 * 60 #30分を秒単位で定義・30分 * 60秒 = 1800秒

  def subscribed
    identifier = params[:identifier]
    stream_from "matching_status" #マッチングの全員共通のストリーム
    stream_from "personal_notification_#{identifier}" #個人通知用のストリーム
    Rails.logger.info "RoomChannelのdef subscribedのidentifier:#{identifier} "
    # 接続時に、もしこのセッションがまだキューにいる場合は、念のため 'in_progress' 状態をブロードキャストしてUIを更新する
    if $redis.lrange(MATCHING_QUEUE_KEY, 0, -1).any? { |json| JSON.parse(json).symbolize_keys[:identifier] == identifier }
      ActionCable.server.broadcast("matching_status", { status: 'in_progress', message: 'マッチング待機中です...' })
    end
  rescue => e
    puts "接続エラー: #{e.message}"
    reject # 接続を拒否
  end

  #クライアントが切断された場合の処理・例えばマッチングキューから削除する
  def unsubscribed
    Rails.logger.info "MatchingStatusChannel が解除されました。#{params[:identifier]}"
  end

  def chat_save_and_broadcast(data)
    chat_data = data['chat_data']
    @comment = LobbyComment.new( content: chat_data )
    if @comment.save
      #レコードは10件まで保存でき、データが追加されると古いものから順に消す
      comments_record_count = LobbyComment.count # 現在のレコード数を取得
      if comments_record_count > 30 # レコード数が10件を超えた場合
        #oldest_comments = LobbyComment.order(created_at: :asc).offset(10) # 作成日時が古いものから数えて、余分なレコードを取得・ oldest_commentsは、created_atで昇順に並べたレコードの11件目以降を取得
        oldest_comments = LobbyComment.order(created_at: :desc).offset(30) # 作成日時が古いものから数えて、余分なレコードを取得・ oldest_commentsは、created_atで昇順に並べたレコードの11件目以降を取得
        puts "oldest_comments: #{oldest_comments}"
        oldest_comments.each do |comment| # 取得したレコードをすべて削除
          puts "oldest_comment: #{comment}"
          comment.destroy
        end
      end
      updated_db_stored_data = LobbyComment.order(created_at: :desc)
      ActionCable.server.broadcast( "matching_status",{ data_type: "chat_update", chat_data: updated_db_stored_data.to_json}) # 取得したデータをクライアントにブロードキャスト
    else
      Rails.logger.info "チャットセーブ失敗"
    end
  end

  #相手に一応マッチ成功の通知
  def reNotificationEnemy(data)
    game_room_data = data['game_room_data']
    enemyRole = data['enemyRole']
    enemyIdentifier = data['enemyIdentifier']
    roomId = data['roomId']
    puts "相手に一応マッチ成功の通知reNotificationEnemy"
    puts "game_room_data: #{game_room_data}"
    puts "enemyRole: #{enemyRole}"
    puts "enemyIdentifier: #{enemyIdentifier}"
    puts "roomId: #{roomId}"
    ActionCable.server.broadcast("personal_notification_#{enemyIdentifier}" ,{ status: 'matched', room_id: roomId, player_role: enemyRole, game_room_data: game_room_data.to_json })
  end

  # pingを受信したときの処理（ハートビート）
  def ping(data)
    #puts "Ping受信: #{data['timestamp']}"
    # pongをクライアントに送信（接続確認）
    ActionCable.server.broadcast("personal_notification_#{data['sessionId']}", {
      type: 'pong', # メッセージタイプ
      timestamp: Time.current.to_i, # サーバーの現在時刻
      client_timestamp: data['timestamp'] # クライアントから受信した時刻
    })
  end

  def test(data)
    ActionCable.server.broadcast("matching_status", { status: 'test', message: 'あほ' })
  end

  def matchedTest(data)
    userName = data['userName']
    battleType = data['battleType']
    sessionId = data['sessionId']
    userAgent = data['userAgent']
    #user_identifier = session.id.to_s # 現在のセッションIDをユーザー識別子として使用
    user_identifier =sessionId
    room_id = SecureRandom.uuid # 一意な room_id を生成

    # ゲーム部屋の情報をRedisのHashにまとめる
    room_data = {
      sente_identifier: user_identifier,
      gote_identifier: user_identifier,
      sente_user_agent: userAgent,
      gote_user_agent: userAgent,
      sente_user_name: "先手の#{userName}",
      gote_user_name: "後手の#{userName}",
      status: 'active',
      battleType: battleType,
      created_at: Time.current.to_i,
    }
    game_rooms_key = "game_room:#{room_id}"
    #Redisのハッシュ（GAME_ROOMS_HASH_KEY）に対し、キーroom_idでroom_dataをJSON文字列として保存する
    #$redis.hset(GAME_ROOMS_HASH_KEY, room_id, room_data.to_json)
    $redis.setex(game_rooms_key, DELETE_TIME, room_data.to_json)
    #$redis.expire(GAME_ROOMS_HASH_KEY, 30) # 30秒後に削除
    Rails.logger.info "RedisにGameRoom#{room_id}が作成された。"
    Rails.logger.info "Redisに入れたデータ：#{room_data.to_json}"
    ActionCable.server.broadcast("personal_notification_#{user_identifier}" ,{ status: 'matched', room_id: room_id, player_role: "sente", game_room_data: room_data.to_json })
  end

end