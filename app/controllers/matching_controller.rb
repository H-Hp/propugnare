#require 'securerandom'

class MatchingController < ApplicationController

  # Redisクライアントのインスタンスを生成

  MATCHING_QUEUE_KEY = 'shogi:matching_queue' # Redisのリストキー
  GAME_ROOMS_HASH_KEY = 'shogi:game_rooms'    # Redisのハッシュキー

  #def game_lobby_auto_matching
  #end

  def game_lobby_matching_board
    #$redis.del(MATCHING_QUEUE_KEY)
    #$redis.ltrim(MATCHING_QUEUE_KEY, 1, 0)
    #Rails.logger.info "ああ：#{$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)}"
  end

  #このstartメソッドは、将棋のオンライン対戦における「マッチング機能」を実装しています。Redisのキューを使って2つのプレイヤーを待機させ、2人揃ったら対戦部屋を作成する仕組み
  #render json: {...}の値はJsのマッチ開始イベントのfetch内のresponse.json()で取得
  def start

    #各ユーザーは自身のユニークな識別子を持つ
    user_identifier = session.id.to_s # 現在のセッションIDをユーザー識別子として使用
    Rails.logger.info "user_identifier:#{user_identifier} "
    
    #redis_data=""
    # 既にマッチング進行中か確認
    # Redisキューにすでにいる、またはゲーム部屋に割り当てられている場合は再スタートしない

=begin
    if $redis.lrange(MATCHING_QUEUE_KEY, 0, -1).include?({ identifier: user_identifier }.to_json) || $redis.hgetall(GAME_ROOMS_HASH_KEY).values.any? do |room_data_json|
         Rails.logger.info "既にマッチング進行中か確認・Redisキューにすでにいる、またはゲーム部屋に割り当てられている場合は再スタートしない"
         room_data = JSON.parse(room_data_json).symbolize_keys
         room_data[:sente_identifier] == user_identifier || room_data[:gote_identifier] == user_identifier
         redis_data = room_data
         Rails.logger.info "@room_data:#{room_data} "
       end
      render json: { status: 'in_progress', message: '既にマッチング進行中です。' ,redis_data: redis_data}
      #render json: { status: 'in_progress', message: '既にマッチング中です。'}
      #ActionCable.server.broadcast("matching_status", { status: 'matched', redis_data: redis_data } )
      return
    end
=end

    #現在のユーザー情報をJSON文字列に変換する
    user_info_json = {
      identifier: user_identifier,
      user_agent: request.user_agent,
      timestamp: Time.current.to_i
    }.to_json
    Rails.logger.info "アクセスしてきたユーザー情報・user_info_json:#{user_info_json} "

    
    #Redis のマッチング待ちキューからすでに登録されている全データを取得する・$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)で、マッチングキュー内の全ユーザー情報（JSON文字列）を取得
    existing_queue = $redis.lrange(MATCHING_QUEUE_KEY, 0, -1)# 既存のキューから全てのデータを取得

    # identifier(セッションid)が重複しないようにユーザー情報を登録
    # 各JSON文字列をパースし、identifier部分だけを取り出す
    existing_identifiers = existing_queue.map do |json|
      JSON.parse(json)['identifier']
    end
    # もし既存キュー内に、現在のuser_identifierが含まれていなければ、Redisキューに追加する
    unless existing_identifiers.include?(user_identifier)
      $redis.rpush(MATCHING_QUEUE_KEY, user_info_json)
      Rails.logger.info "ユーザー#{user_info_json}をRedisキューに追加した。現在のキューの長さ: #{$redis.llen(MATCHING_QUEUE_KEY)}."
    else
      # 重複している場合は、ログにその旨を出力する
      Rails.logger.info "ユーザー識別子は既にキューに存在する"
    end
=begin
    #user_agentsが被らないようにredisにデータ入れる
    #各JSON文字列をパースしてユーザーエージェント部分のみを取り出す
    existing_user_agents = existing_queue.map do |json|# 既存のuser_agentをチェック
      JSON.parse(json)['user_agent']
    end
    #もし既存のキュー内に、現在のリクエストのuser_agent（ブラウザ識別情報）が存在していなければ、現在のユーザー情報を Redis キューに追加する
    #既存キューのUser-Agentをチェックし、重複していなければキューに追加
    unless existing_user_agents.include?(request.user_agent)# 重複チェック
      $redis.rpush(MATCHING_QUEUE_KEY, user_info_json)
      Rails.logger.info "ユーザー#{user_info_json}をRedisキューに追加した。現在のキューの長さ: #{$redis.llen(MATCHING_QUEUE_KEY)}."
    else # 重複の場合の処理
      Rails.logger.info "ユーザーエージェントは既にキューに存在する"
    end
=end
    # Redisキューに現在のユーザーを追加
    #$redis.rpush(MATCHING_QUEUE_KEY, user_info_json)

    # マッチングロジックを同期的に実行
    # ここでは、Redis操作がアトミックであることを利用して、
    # 複数リクエストが同時に来ても整合性を保つようにします。
    # しかし、完全に競合状態を避けるにはRedisのLuaスクリプトがより適切です。
    
    #現在のマッチング待ち人数を確認・キューの長さを確認
    queue_length = $redis.llen(MATCHING_QUEUE_KEY)
    Rails.logger.info "現在のマッチング待ち人数(現在のRedisキューの長さ)：#{queue_length}"

    #キューの長さが2以上になると、「対戦相手が揃った」と判断してマッチング処理を進める
    #1人だけなら、クライアントへ 「in_progress」 を返して待機を継続させる
    if queue_length >= 2
      # 2人のプレイヤーをキューから取り出す・先入れ先出し（FIFO） の順序で、待機キューの左端から2件をLPOPで取り出し
      player1_json = $redis.lpop(MATCHING_QUEUE_KEY)
      player2_json = $redis.lpop(MATCHING_QUEUE_KEY)
      Rails.logger.info "player1_のデータ・player1_json：#{player1_json}"
      Rails.logger.info "player2_のデータ・player2_json：#{player2_json}"

      #万一、片方のデータが nil（存在しない）場合には、予期せぬ競合状態として処理する
      if player1_json.nil? || player2_json.nil?
        # 稀に、もう一方のリクエストが先に処理してしまった場合など
        Rails.logger.warn "同期マッチ中に2人の選手をキューからLPOPで取り出しできませんでした。nilでなければ再プッシュ。"
        $redis.rpush(MATCHING_QUEUE_KEY, player1_json) if player1_json
        $redis.rpush(MATCHING_QUEUE_KEY, player2_json) if player2_json
        # 再度マッチングを試すよう通知するか、in_progressを返す・render json:{...}の値はJsのマッチ開始イベントのfetch内のresponse.json()で取得
        render json: { status: 'in_progress', message: 'マッチング処理中に競合が発生しました。' }
        return
      end

      #取り出したJSON文字列をパースし、シンボルキーを用いてRubyのハッシュに変換する
      player1_info = JSON.parse(player1_json).symbolize_keys
      player2_info = JSON.parse(player2_json).symbolize_keys

      Rails.logger.info "Popped player1: #{player1_info[:identifier]}, player2: #{player2_info[:identifier]}"

      # 先手と後手を決定・true/false のランダムでどちらが先手(sente)か後手(gote)を決める
      if [true, false].sample # ランダムに振り分け
        sente_identifier = player1_info[:identifier]
        gote_identifier = player2_info[:identifier]
      else
        sente_identifier = player2_info[:identifier]
        gote_identifier = player1_info[:identifier]
      end

      # 一意な room_id を生成
      room_id = SecureRandom.uuid

      # ゲーム部屋の情報をRedisのHashにまとめる
      room_data = {
        sente_identifier: sente_identifier,
        gote_identifier: gote_identifier,
        status: 'active',
        created_at: Time.current.to_i,
        player1_user_agent: player1_info[:user_agent],
        player2_user_agent: player2_info[:user_agent]
      }
      #Redisのハッシュ（GAME_ROOMS_HASH_KEY）に対し、キーroom_idでroom_dataをJSON文字列として保存する
      $redis.hset(GAME_ROOMS_HASH_KEY, room_id, room_data.to_json)
      Rails.logger.info "RedisにGameRoom#{room_id}が作成された。"


      #マッチングのRedisデータからマッチング完了した2人だけを削除(他のマッチング中の人は消さない)
      #上の処理でlpopしてるからすでにデータから削除されてる？・LPOPを利用して先頭から2件取り出すと、自動的にリストから削除されます
      Rails.logger.info "マッチング後の2人だけを除いたマッチングのRedisデータ：#{$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)}" #キュー全体の内容を lrange で取得（0番目から最後まで）

      #マッチング成立後の通知・各プレイヤーにマッチング成立をブロードキャスト
      #player1にマッチング成立後の通知
      ActionCable.server.broadcast("personal_notification_#{player1_info[:identifier]}" ,{ status: 'matched', room_id: room_id, player_role: (player1_info[:identifier] == sente_identifier ? 'sente' : 'gote') })
      #"matching_status",
        #"matching_status_#{player1_info[:identifier]}",
      Rails.logger.info "#{player1_info[:identifier]}にブロードキャストマッチした"
      #player2にマッチング成立後の通知
      ActionCable.server.broadcast("personal_notification_#{player2_info[:identifier]}" ,{ status: 'matched', room_id: room_id, player_role: (player2_info[:identifier] == sente_identifier ? 'sente' : 'gote') })
      Rails.logger.info "#{player2_info[:identifier]}にブロードキャストマッチした"

      # このリクエストを送信したユーザーへのレスポンス
      # マッチングが成立したので、その情報を返す
      player_role_for_requester = (user_identifier == sente_identifier ? 'sente' : 'gote')
      #Jsのマッチ開始イベントのfetch内のresponse.json()で取得
      render json: { status: 'matched', room_id: room_id, player_role: player_role_for_requester }
    else
      # 2人揃わなかった場合はマッチング待機中として応答・#Jsのマッチ開始イベントのfetch内のresponse.json()で取得
      render json: { status: 'in_progress', message: '対戦相手を検索中です...' }
    end

  #Redisへの接続エラーなど、各種例外に対する処理
  rescue Redis::BaseConnectionError => e
    Rails.logger.error "MatchingController#startでのRedis接続エラー: #{e.message}"
    render json: { status: 'error', message: 'サーバーエラーが発生しました。時間を置いて再度お試しください。' }, status: :internal_server_error
  rescue JSON::ParserError => e
    Rails.logger.error "MatchingController#startでのJSON解析エラー: #{e.message}"
    render json: { status: 'error', message: 'データの処理中にエラーが発生しました。' }, status: :internal_server_error
  rescue StandardError => e
    Rails.logger.error "MatchingController#startで予期せぬエラーが発生しました。: #{e.message}\n#{e.backtrace.join("\n")}"
    render json: { status: 'error', message: '不明なエラーが発生しました。' }, status: :internal_server_error
  end


  #このcancelは、ユーザーが現在進行中のマッチングプロセスを中断し、キューから自身を削除するための処理
  #この処理は大きく分けて、ユーザー識別の取得、Redis キューからのユーザー削除、クライアントへの状態ブロードキャスト、レスポンスの返却、そしてエラーハンドリングの5つのステップ
  #render json: {...}の値はJsのマッチキャンセルイベントのfetch内のresponse.json()で取得
  def cancel
    #reset_session# ここでセッション ID が廃棄 → 次のリクエストで新しいセッション ID が発行される
    user_identifier = session.id.to_s #現在のセッション ID を取得
    
    
    # Redisのマッチングキューから、該当するユーザーを削除する
    # JSON文字列として完全に一致する要素のみ削除
    # 実際には、キューに追加する際に識別子のみを保存し、LREM identifier のように使うか、キューの全要素を読み込んで対象を削除し、再書き込みするなどの工夫が必要です。
    
    #確実な削除のため、一度キューをすべて取得し、該当要素を除外して再登録する (非効率だが確実)
    #キューの全要素を取得してRuby配列に変換・全キューアイテムを取得してパース・取得した要素はJSON文字列として格納されているため、Rubyのハッシュにパースし、キーをシンボルに変換する
    all_queue_items = $redis.lrange(MATCHING_QUEUE_KEY, 0, -1).map { |json| JSON.parse(json).symbolize_keys }
    #パースされた全キューアイテムの中から、現在のユーザーの user_identifier と一致する :identifier を持つアイテムを除外し、削除後のキューのリストupdated_queue_itemsを作成する
    updated_queue_items = all_queue_items.reject { |item| item[:identifier] == user_identifier }
    
    #もし、元々のキューのサイズと、ユーザーを削除した後のキューのサイズが異なる場合（つまり、ユーザーがキューに見つかり、削除が行われた場合）のみ・キュー要素数が変わっていれば（＝削除があったら）リストを再構築
    #キューをクリアし、更新された要素を再追加
    if all_queue_items.size != updated_queue_items.size # 削除があった場合のみ更新
      #Redisの既存のキューを完全に削除
      $redis.del(MATCHING_QUEUE_KEY)
      #ユーザーが削除された新しいキューのリストupdated_queue_itemsの各要素を、再びJSON文字列に変換してRedisキューの末尾に再追加
      updated_queue_items.each { |item| $redis.rpush(MATCHING_QUEUE_KEY, item.to_json) }
      Rails.logger.info "ユーザー#{user_identifier}はマッチングをキャンセルしました。Redisのキューから削除されました。"
    else
      Rails.logger.info "ユーザー#{user_identifier}がキャンセル待ちのRedisキューに見つかりませんでした。"
    end
    
    user_identifier = session.renew #セッション中のデータは保持しつつ、新しいセッションIDを発行

    # ユーザーにマッチングキャンセルをブロードキャスト
    #ActionCable.server.broadcast("matching_status_#{user_identifier}", { status: 'canceled', message: 'マッチングをキャンセルしました。' })
    ActionCable.server.broadcast("matching_status", { status: 'canceled', message: 'マッチングをキャンセルしました。' })

    render json: { status: 'canceled', message: 'マッチングをキャンセルしました。' }
  #Redisへの接続エラーなど、各種例外に対する処理
  rescue Redis::BaseConnectionError => e
    Rails.logger.error "MatchingController#cancelでのRedis接続エラー: #{e.message}"
    render json: { status: 'error', message: 'サーバーエラーが発生しました。時間を置いて再度お試しください。' }, status: :internal_server_error
  rescue StandardError => e
    Rails.logger.error "MatchingController#cancelで予期せぬエラーが発生しました。: #{e.message}\n#{e.backtrace.join("\n")}"
    render json: { status: 'error', message: '不明なエラーが発生しました。' }, status: :internal_server_error
  end

  def all_delete
    #reset_session  #セッションを削除・これだとアクセスしてマッチングデータを削除を操作したユーザーのセッションが削除される
    #new_token = form_authenticity_token #セッションを削除するとセッションID（クッキー）が破棄され、Railsが内部的に保持しているCSRFトークンもリセットされるので新発行して渡す
    Rails.logger.info "マッチングのデータを全て削除する"
    $redis.del(MATCHING_QUEUE_KEY)
    $redis.del(GAME_ROOMS_HASH_KEY)
    Rails.logger.info "MATCHING_QUEUE_KEYのRedisデータ：#{$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)}"
    Rails.logger.info "GAME_ROOMS_HASH_KEYのRedisデータ：#{$redis.lrange(MATCHING_QUEUE_KEY, 0, -1)}"
    render json: { status: 'delete', message: 'すべてのマッチングデータの削除完了' }
  end
end