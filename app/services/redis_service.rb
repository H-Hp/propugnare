require 'redis'

#Redisオブジェクトを作り、setでキーと値をセットし、getでキーから値を取得する

class RedisService
  def self.client
    @client ||= Redis.new
  end

  def self.save_game_state(game_id, state)
    client.set("game:#{game_id}", state.to_json)
    Rails.logger.error "redis_service.rbのdef self.save_game_state(game_id, state)のstate.to_json: #{state.to_json}"
  end

  def self.get_game_state(game_id)
    state = client.get("game:#{game_id}")
    JSON.parse(state) if state
    Rails.logger.error "redis_service.rbのself.get_game_state(game_id)のgame_id: #{game_id}"
  end
end