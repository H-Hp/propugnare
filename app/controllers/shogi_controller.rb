class ShogiController < ApplicationController
  MATCHING_QUEUE_KEY = 'shogi:matching_queue' # Redisのリストキー
  GAME_ROOMS_HASH_KEY = 'shogi:game_rooms'    # Redisのハッシュキー

  #DELETE_TIME = 30 * 60 #30分を秒単位で定義・30秒 x 60秒 = 1800秒
  DELETE_TIME = 60 * 500 #8時間20分・500分・60秒 x 500秒 = 30000秒

  def index
    @rails_env = Rails.env
    puts "@rails_env:#{@rails_env}"
    #@game_id = params[:id]
    @room_id = params[:id]
    game_rooms_key = "game_room:#{@room_id}"

    if $redis.get(game_rooms_key).nil? # nil の場合、ゲームが終了している場合の処理
      #Aiモードの時
      #if @room_id == "ai"
      if @room_id.include?("ai_")#含まれてたら
        ai_state="ai"
        player_identifier=session.id.to_s
        player_user_agent=request.user_agent
        user_roll_for_ai = params[:user_roll_for_ai]
        puts "user_roll_for_ai: #{user_roll_for_ai}"

        @your_user_name="あなた"
        if user_roll_for_ai == "先手"
          #この場合はplayer1が先手でplayer2が後手
          sente_identifier = player_identifier; sente_user_agent = player_user_agent; sente_user_name = @your_user_name;
          gote_identifier = ai_state; gote_user_agent = ai_state; gote_user_name = ai_state;
          @your_role = "先手"
          @enemy_role = "後手"
        elsif user_roll_for_ai == "後手"
          #この場合はplayer2が先手でplayer1が後手
          sente_identifier = ai_state; sente_user_agent = ai_state; sente_user_name = ai_state;
          gote_identifier = player_identifier; gote_user_agent = player_user_agent; gote_user_name = @your_user_name;
          @your_role = "後手"
          @enemy_role = "先手"
        end

        if user_roll_for_ai == "ランダム"
          if [true, false].sample # ランダムに振り分け
            #この場合はplayer1が先手でplayer2が後手
            sente_identifier = player_identifier; sente_user_agent = player_user_agent; sente_user_name = @your_user_name;
            gote_identifier = ai_state; gote_user_agent = ai_state; gote_user_name = ai_state;
            @your_role = "先手"
            @enemy_role = "後手"
          else
            #この場合はplayer2が先手でplayer1が後手
            sente_identifier = ai_state; sente_user_agent = ai_state; sente_user_name = ai_state;
            gote_identifier = player_identifier; gote_user_agent = player_user_agent; gote_user_name = @your_user_name;
            @your_role = "後手"
            @enemy_role = "先手"
          end
        end
        # 一意な room_id を生成
        #room_id = SecureRandom.uuid
        # ゲーム部屋の情報をRedisのHashにまとめる
        @game_room_data_json = {
          sente_identifier: sente_identifier,
          gote_identifier: gote_identifier,
          sente_user_agent: sente_user_agent,
          gote_user_agent: gote_user_agent,
          sente_user_name: sente_user_name,
          gote_user_name: gote_user_name,
          status: 'active',
          battleType: '10min',
          created_at: Time.current.to_i,
        }
        #game_rooms_key = "game_room:#{room_id}"
        game_rooms_key = "game_room:#{@room_id}"
        #Redisのハッシュ（GAME_ROOMS_HASH_KEY）に対し、キーroom_idでroom_dataをJSON文字列として保存する
        #$redis.setex(game_rooms_key, DELETE_TIME, room_data.to_json)
        #$redis.setex(game_rooms_key, DELETE_TIME, @game_room_data_json)
        $redis.setex(game_rooms_key, DELETE_TIME, @game_room_data_json.to_json)
        @ai_mode=true
        @audienceUser=false
      #対人モードの時
      else
        redirect_to root_path #リダイレクト
      end
    else# データが存在する場合の処理
      # 特定のroom_idのデータを取得
      @game_room_data_json = $redis.get(game_rooms_key)
      puts "redisからデータ取得: #{@game_room_data_json}"#redisからデータ取得: {"sente_identifier":"9a407895123bef7a65202dfb165a9aff","gote_identifier":"9f63ac8f86022e04a98aa62b8be8a737","status":"active","created_at":1750569827,"player1_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36","player2_user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"}
      @game_room_data_json=JSON.parse(@game_room_data_json)
      #current_session_id = session.id.to_s
      current_session_id =(Rails.env.test? && session[:test_user_id]) ? session[:test_user_id] : session.id.to_s
      @your_role=""
      now_player=""
      your_user_agent=""
      your_session_id=""
      battleType = @game_room_data_json["battleType"]
      #Rails.logger.info "バトルタイプ: #{battleType}"
      @your_user_name = @game_room_data_json["sente_user_name"]
      @ai_mode=false

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
      #Rails.logger.info "あなたの出番: #{@your_role}"
      #Rails.logger.info "session[:opponent_identifier]: #{session[:opponent_identifier]}"

      # マッチング成立後に不要になったセッション情報をクリア
      #session.delete(:matching_in_progress)
      #session.delete(:matched_room_id)
      #session.delete(:player_role)
      #session.delete(:opponent_identifier)
    
      #redis_board_key = "shogi_game:#{@room_id}"
      #redis_chat_key = "shogi_game_chat:#{@room_id}"
    end
  end

=begin
  def update #移動を処理して状態を更新します
    game_id = params[:game_id]
    move = params[:move]

    Rails.logger.info "ShogiControllerのindexのgame_id: #{@game_id}"
    Rails.logger.info "ShogiControllerのindexのmove:  #{move}"

    game_state = RedisService.get_game_state(@game_id)
    Rails.logger.error "ShogiControllerのRedisServiceからの戻り値のgame_state:  #{game_state}"
  end
=end

end
