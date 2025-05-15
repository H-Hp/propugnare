class ShogiController < ApplicationController
  def index
    @game_id = 2
  end

  def update #移動を処理して状態を更新します
    # Optional: Save drawing state to database
    game_id = params[:game_id]
    move = params[:move]

    Rails.logger.error "ShogiControllerのindexのgame_id: #{@game_id}"
    Rails.logger.error "ShogiControllerのindexのmove:  #{move}"


    # Update game state in Redis
    game_state = RedisService.get_game_state(@game_id)
    Rails.logger.error "ShogiControllerのRedisServiceからの戻り値のgame_state:  #{game_state}"
    # Update game state logic here...

    # Publish move to RabbitMQ
    #RabbitmqService.publish(move)

    #render json: { success: true }

  end
end
