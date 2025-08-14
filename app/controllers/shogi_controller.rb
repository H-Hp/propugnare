class ShogiController < ApplicationController
  MATCHING_QUEUE_KEY = 'shogi:matching_queue' # Redisのリストキー
  GAME_ROOMS_HASH_KEY = 'shogi:game_rooms'    # Redisのハッシュキー

  def index
    @game_id = params[:id]
    @room_id = params[:id]
    game_rooms_key = "game_room:#{@room_id}"

    if $redis.get(game_rooms_key).nil? # nil の場合、ゲームが終了している場合の処理
      redirect_to root_path
    else# データが存在する場合の処理
      # 特定のroom_idのデータを取得
      @game_room_data_json = $redis.get(game_rooms_key)
      Rails.logger.info "redisからデータ取得: #{@game_room_data_json}"#redisからデータ取得: {"sente_identifier":"9a407895123bef7a65202dfb165a9aff","gote_identifier":"9f63ac8f86022e04a98aa62b8be8a737","status":"active","created_at":1750569827,"player1_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","player2_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}
      
      @game_room_data_json=JSON.parse(@game_room_data_json)
      
      current_session_id = session.id.to_s
      @your_role=""
      now_player=""
      your_user_agent=""
      your_session_id=""

      battleType = @game_room_data_json["battleType"]
      #Rails.logger.info "バトルタイプ: #{battleType}"

      # セッションIDがsenteかgoteかで分岐
      if current_session_id == @game_room_data_json["sente_identifier"]
        #@your_role = "sente"
        #@enemy_role = "gote"
        @your_role = "先手"
        @enemy_role = "後手"
        your_user_agent = @game_room_data_json["sente_user_agent"]
        your_session_id = @game_room_data_json["sente_identifier"]
        @audienceUser=false
      elsif current_session_id == @game_room_data_json["gote_identifier"]
        #@your_role = "gote"
        #@enemy_role = "sente"
        @your_role = "後手"
        @enemy_role = "先手"
        your_user_agent = @game_room_data_json["gote_user_agent"]
        your_session_id = @game_room_data_json["gote_identifier"]
        @audienceUser=false
      else
        @audienceUser=true
        # どちらにも該当しない場合（不正アクセスなど）
        #render json: { error: "不正なセッションです。" }, status: :unauthorized and return
      end
      Rails.logger.info "あなたの出番: #{@your_role}"
      #Rails.logger.info "session[:opponent_identifier]: #{session[:opponent_identifier]}"

      # マッチング成立後に不要になったセッション情報をクリア
      #session.delete(:matching_in_progress)
      #session.delete(:matched_room_id)
      #session.delete(:player_role)
      #session.delete(:opponent_identifier)
    
      redis_board_key = "shogi_game:#{@room_id}"
      redis_chat_key = "shogi_game_chat:#{@room_id}"
    end
  end

  def update #移動を処理して状態を更新します
    game_id = params[:game_id]
    move = params[:move]

    Rails.logger.info "ShogiControllerのindexのgame_id: #{@game_id}"
    Rails.logger.info "ShogiControllerのindexのmove:  #{move}"

    game_state = RedisService.get_game_state(@game_id)
    Rails.logger.error "ShogiControllerのRedisServiceからの戻り値のgame_state:  #{game_state}"
  end
end
