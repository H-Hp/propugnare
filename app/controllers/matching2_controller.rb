class Matching2Controller < ApplicationController
  #def top
  def game_lobby_auto_matching

  end

  def game_lobby_matching_board

  end

=begin
  def matching_start
    render json: { status: 'matching_started', message: 'マッチングを開始しました。' }

    # 例: ダミーのマッチング処理
    # 実際にはここで他のユーザーを探したり、部屋を作成したりするロジック
    sleep(2) # 5秒間待機するフリ

    # マッチング成功をクライアントに通知 (Action Cableを使用)
    # ここでroom_idなどを生成し、クライアントに渡す
    room_id = SecureRandom.uuid
    #ActionCable.server.broadcast("matching_channel_#{user_id}", { status: 'matched', room_id: room_id, message: '対戦相手が見つかりました！' })

    # 別のユーザーが見つかった場合、そのユーザーにも通知をブロードキャストする
    # ActionCable.server.broadcast("matching_channel_#{opponent_user.id}", { status: 'matched', room_id: room_id, message: '対戦相手が見つかりました！' })
    #render json: { status: 'matching_success', message: 'マッチングが成功しました。' }

  end
=end

  # NOTE: これはシンプルなインメモリキュー・これらはメモリ上にデータを持つため、サーバー再起動で失われます。
  # 複数プロセス/サーバー環境では共有されない
  # 実際のプロダクション環境では、複数のRailsプロセス間で共有できるRedisなどの永続的なストアを利用してキューを管理すべき
  @@matching_queue = [] # マッチング待機中のユーザー情報を保持
  @@game_rooms = {}   # 生成されたゲーム部屋の情報を保持 { room_id: { sente_identifier: '...', gote_identifier: '...' } }
  @@queue_mutex = Mutex.new # キュー操作のスレッドセーフのため
  
  def matching_start
    # 現在のセッションIDをユーザー識別子として使用
    user_identifier = session.id.to_s # セッションIDを文字列として取得

    # ユーザーエージェントなど、マッチングに必要な情報を収集
    user_info = {
      identifier: user_identifier,
      user_agent: request.user_agent, # リクエストからユーザーエージェントを取得
      timestamp: Time.current # キューに入った時刻
    }

    @@queue_mutex.synchronize do
      # 既にキューにいる場合は追加しない
      unless @@matching_queue.any? { |item| item[:identifier] == user_identifier }
        @@matching_queue << user_info
        Rails.logger.info "User #{user_identifier} added to queue. Queue size: #{@@matching_queue.size}"
      else
        Rails.logger.info "User #{user_identifier} is already in the matching queue."
      end

      # 2人以上のユーザーがキューにいるか確認
      if @@matching_queue.size >= 2
        # キューから2人のユーザーを取り出す
        player1_info = @@matching_queue.shift
        player2_info = @@matching_queue.shift
        Rails.logger.info "Matched User #{player1_info[:identifier]} and User #{player2_info[:identifier]}."

        # 先手と後手を決定するロジック（ランダムに振り分け）
        # ここではユーザーエージェントは情報の収集用としていますが、
        # 先手後手の決定には完全にランダムな方法を推奨します。
        if [true, false].sample
          sente_identifier = player1_info[:identifier]
          gote_identifier = player2_info[:identifier]
        else
          sente_identifier = player2_info[:identifier]
          gote_identifier = player1_info[:identifier]
        end

        # 一意な room_id を生成
        room_id = SecureRandom.uuid
        game_id = SecureRandom.uuid
        # ゲーム部屋の情報をメモリに保存
        @@game_rooms[room_id] = {
          sente_identifier: sente_identifier,
          gote_identifier: gote_identifier,
          status: 'active'
        }
        Rails.logger.info "GameRoom（メモリ内）を作成した: #{room_id}"


        # ゲーム部屋を作成（Userモデルの代わりにセッションIDを使用するため修正）
        # NOTE: この`GameRoom`モデルは、ログインユーザーではなく、セッションIDを直接持つように変更が必要です。
        # または、セッションIDに対応する一時的なUserレコードを作成するなどの工夫が必要です。
        # 以下は便宜上、`sente_identifier`と`gote_identifier`をそのまま保存する仮定です。

        #game_room = GameRoom.create!(
        #  sente_identifier: sente_identifier, # User IDの代わりに識別子を保存
        #  gote_identifier: gote_identifier,   # User IDの代わりに識別子を保存
        #  status: 'active'
        #)
        #Rails.logger.info "Created GameRoom with ID: #{game_room.id}"

        # 現在のセッションがマッチした情報を保存
        #session[:matched_room_id] = game_room.id
        session[:matched_room_id] = room_id
        #session[:matched_room_id] = SecureRandom.uuid
        session[:matched_game_id] = game_id
        session[:player_role] = (user_identifier == sente_identifier ? 'sente' : 'gote')
        session[:opponent_identifier] = (user_identifier == sente_identifier ? gote_identifier : sente_identifier)

        #player_role = user_identifier == sente_identifier ? 'sente' : 'gote'
        #render json: { status: 'matched', room_id: game_room.id, player_role: session[:player_role] }
        render json: { status: 'matched', game_id: session[:matched_game_id], room_id: session[:matched_room_id], player_role: session[:player_role] }
        #render json: { status: 'matched', room_id: 1, player_role: player_role }

      else
        # キューに追加されたことを示す（マッチング待機中）
        session[:matching_in_progress] = true # マッチング中であることをセッションに保存
        render json: { status: 'in_progress', message: '対戦相手を検索中です...' }
      end
    end
  end

  def matching_status
    user_identifier = session.id.to_s

    @@queue_mutex.synchronize do
      if session[:matched_room_id].present?
        # 既にマッチングが成立している場合
        room_id = session[:matched_room_id]
        game_id = session[:matched_game_id]
        player_role = session[:player_role]
        # セッションからマッチング情報をクリア (一度通知したらクリアする)

        session.delete(:matched_room_id)
        session.delete(:player_role)
        session.delete(:opponent_identifier)
        session.delete(:matching_in_progress)

        #render json: { status: 'matched', room_id: room_id, player_role: player_role }
        render json: { status: 'matched', room_id: room_id, game_id: game_id, player_role: player_role }

      elsif @@matching_queue.any? { |item| item[:identifier] == user_identifier }
        # キューにいるがまだマッチングしていない場合
        render json: { status: 'in_progress', message: '対戦相手を検索中です...' }
      else
        # キューにいない、またはマッチングがキャンセルされた場合
        session.delete(:matching_in_progress)
        render json: { status: 'not_matching', message: 'マッチングしていません。' }
      end
    end
  end

  def matching_cancel
    user_identifier = session.id.to_s

    @@queue_mutex.synchronize do
      @@matching_queue.delete_if { |item| item[:identifier] == user_identifier }
      session.delete(:matching_in_progress)
      session.delete(:matched_room_id)
      session.delete(:player_role)
      session.delete(:opponent_identifier)
      Rails.logger.info "User #{user_identifier} cancelled matching."
      render json: { status: 'canceled', message: 'マッチングをキャンセルしました。' }
    end
  end


end