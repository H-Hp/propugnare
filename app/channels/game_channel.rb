# app/channels/game_channel.rb
class GameChannel < ApplicationCable::Channel
  def subscribed # クライアントがチャンネルにサブスクライブしたときの処理
    stream_from "game_#{params[:game_id]}"
    Rails.logger.error "GameChannelのsubscribedのparams[:game_id]: #{params[:game_id]}"

  end

  # クライアントがチャンネルから退出したときの処理
  def unsubscribed
    # チャンネルから退出時のクリーンアップ処理をここに記述（必要な場合）
  end
=begin
  def receive(data)
    # Handle incoming messages from the client
    case data['action']
    when 'make_move'
      handle_move(data)
    end
  end

  private

  def handle_move(data)
    game_id = data['game_id']
    move = data['move']

    # Process the move (example logic)
    game = Game.find(game_id)
    result = game.process_move(move)

    # Broadcast the move to all subscribers of this game channel
    ActionCable.server.broadcast(
      "game_#{game_id}", 
      action: 'move_made', 
      move: move, 
      result: result
    )
  end
=end

  def make_move(data) # クライアントからメッセージを受信したときの処理
    
    # WebSocketで送信した'data'はJSON文字列として送られているため、parseが必要
    #parsed_data = JSON.parse(data)
    #game_id = parsed_data['game_id']
    #move = parsed_data['move']
    game_id = data['game_id']
    move = data['move']

    Rails.logger.error "GameChannelのmake_moveのgame_id: #{game_id}"
    Rails.logger.error "GameChannelのmake_moveのmove: #{move}"


    # Update game state in Redis
    #game_state = RedisService.get_game_state(game_id)
    #Rails.logger.error "GameChannelのmake_moveのgame_state: #{game_state}"
    # Update game state logic here...

    # Broadcast move to other players
     # 受信したメッセージをすべてのサブスクライバーにブロードキャスト
    ActionCable.server.broadcast("game_#{game_id}", move: move)
  end

  def receive(data)
    Rails.logger.info "Received data in GameChannel: #{data}"
    parsed_data = JSON.parse(data['data'])
    
    case parsed_data['action']
    when 'make_move'
      make_move(parsed_data)
    else
      Rails.logger.warn "Unknown action received: #{parsed_data['action']}"
    end
  end
end