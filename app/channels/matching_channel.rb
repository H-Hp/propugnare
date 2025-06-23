class MatchingChannel < ApplicationCable::Channel
  MATCHING_QUEUE_KEY = 'shogi:matching_queue'

  def subscribed
    # ユーザーごとに固有のストリームを購読

    # クライアントから送られてくる params[:room_id] をストリーム名として使用
    # これにより、同じ room_id を持つクライアントが同じチャネルを購読します。
    #room_id = params[:room_id]
    identifier = params[:identifier]

    stream_from "matching_status" #マッチングの全員共通のストリーム
    stream_from "personal_notification_#{identifier}" #個人通知用のストリーム

    Rails.logger.info "RoomChannelのdef subscribedのidentifier:#{identifier} "

    # 接続時に、もしこのセッションがまだキューにいる場合は、
    # 念のため 'in_progress' 状態をブロードキャストしてUIを更新する
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

  end

  def unsubscribed
    #Rails.logger.info "MatchingStatusChannel unsubscribed by #{connection.identifier}"

    # クライアントが切断された場合の処理
    # 例えばマッチングキューから削除する
    
    # 確実な削除のため、一度キューをすべて取得し、該当要素を除外して再登録する
    all_queue_items = $redis.lrange(MATCHING_QUEUE_KEY, 0, -1).map { |json| JSON.parse(json).symbolize_keys }
    updated_queue_items = all_queue_items.reject { |item| item[:identifier] == identifier }
    
    if all_queue_items.size != updated_queue_items.size # 削除があった場合のみ更新
      $redis.del(MATCHING_QUEUE_KEY)
      updated_queue_items.each { |item| $redis.rpush(MATCHING_QUEUE_KEY, item.to_json) }
      Rails.logger.info "Redisキューから#{identifier}を削除しました。"
    end
  end
end