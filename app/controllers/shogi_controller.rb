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

    # マッチング成立後に不要になったセッション情報をクリア
    session.delete(:matching_in_progress)
    session.delete(:matched_room_id)
    session.delete(:player_role)
    session.delete(:opponent_identifier)

    # 部屋データをビューに渡す（ここでは`@room_data`を使用）
  
    @redis = $redis # config/initializers/redis.rb で設定したグローバル変数
    redis_key = "shogi_game:#{@game_id}"
    redis_chat_key = "shogi_game_chat:#{@game_id}"
  end

  def destroy
      @room_id = params[:id]
      redis_key = "shogi_game:#{@room_id}"
      redis_chat_key = "shogi_game_chat:#{@room_id}"

      begin
        $redis.del(redis_key)
        $redis.del(redis_chat_key)
        $redis.hdel(GAME_ROOMS_HASH_KEY, @room_id)#このroom_idに対応したゲームルームのデータを削除

        render json: { message: "room_id #{@room_id} 削除成功" }, status: :ok
      rescue Redis::CannotConnectError => e
        Rails.logger.error "APIからの削除時にRedis接続エラーが発生: #{e.message}"
        render json: { error: "Redisの接続に失敗" }, status: :service_unavailable
      rescue StandardError => e
        Rails.logger.error "IDのゲームデータの削除に失敗 #{@room_id}: #{e.message}"
        render json: { error: "予期せぬエラーが発生" }, status: :internal_server_error
      end
  end

  def update #移動を処理して状態を更新します
    game_id = params[:game_id]
    move = params[:move]

    Rails.logger.error "ShogiControllerのindexのgame_id: #{@game_id}"
    Rails.logger.error "ShogiControllerのindexのmove:  #{move}"

    game_state = RedisService.get_game_state(@game_id)
    Rails.logger.error "ShogiControllerのRedisServiceからの戻り値のgame_state:  #{game_state}"
  end
end
