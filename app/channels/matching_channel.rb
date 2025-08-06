class MatchingChannel < ApplicationCable::Channel
  MATCHING_QUEUE_KEY = 'shogi:matching_queue'
  #DELETE_TIME=20
  DELETE_TIME = 30 * 60 #30分を秒単位で定義・30分 * 60秒 = 1800秒

  def subscribed
    # ユーザーごとに固有のストリームを購読

    # クライアントから送られてくる params[:room_id] をストリーム名として使用
    # これにより、同じ room_id を持つクライアントが同じチャネルを購読します。
    #room_id = params[:room_id]
    identifier = params[:identifier]

    stream_from "matching_status" #マッチングの全員共通のストリーム
    stream_from "personal_notification_#{identifier}" #個人通知用のストリーム

    Rails.logger.info "RoomChannelのdef subscribedのidentifier:#{identifier} "

    # 接続時に、もしこのセッションがまだキューにいる場合は、念のため 'in_progress' 状態をブロードキャストしてUIを更新する
    #$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)
      #MATCHING_QUEUE_KEY: マッチング待機ユーザーを管理するRedisキー
      #lrange(key, 0, -1): キューの全要素を取得
      #戻り値: JSON文字列の配列 ["{"identifier":"user1","timestamp":"..."}", "{"identifier":"user2","timestamp":"..."}"]
    #.any? { |json| JSON.parse(json).symbolize_keys[:identifier] == connection.identifier }
      #JSON解析: JSON.parse(json) で文字列をハッシュに変換
      #キーをシンボル化: symbolize_keys でアクセスしやすく
      #識別子比較: キュー内のidentifierと現在の接続identifierを比較
      #存在確認: any?で一つでも一致すればtrue
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
=begin
    # 確実な削除のため、一度キューをすべて取得し、該当要素を除外して再登録する
    all_queue_items = $redis.lrange(MATCHING_QUEUE_KEY, 0, -1).map { |json| JSON.parse(json).symbolize_keys }
    updated_queue_items = all_queue_items.reject { |item| item[:identifier] == identifier }
    
    if all_queue_items.size != updated_queue_items.size # 削除があった場合のみ更新
      $redis.del(MATCHING_QUEUE_KEY)
      updated_queue_items.each { |item| $redis.rpush(MATCHING_QUEUE_KEY, item.to_json) }
      Rails.logger.info "Redisキューから#{identifier}を削除しました。"
      ActionCable.server.broadcast("matching_status", { status: 'canceled', message: 'マッチングキャンセルじゃボケ' })
    end
=end
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
    #ActionCable.server.broadcast("personal_notification_#{user_identifier}" ,{ status: 'matched', room_id: room_id, player_role: "sente", game_room_data: room_data.to_json })
  end

  # pingを受信したときの処理（ハートビート）
  def ping(data)
    #puts "Ping受信: #{data['timestamp']}"
    # pongをクライアントに送信（接続確認）
    ActionCable.server.broadcast("personal_notification_#{data['sessionId']}", {
    #ActionCable.server.broadcast("matching_#{params[:room_id]}", {
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