require 'bunny'

class RabbitmqService
  def self.connection
    @connection ||= Bunny.new.tap(&:start)
    Rails.logger.error "rabbitmq_service.rbのself.connection"
  end

  def self.channel
    @channel ||= connection.create_channel
    Rails.logger.error "rabbitmq_service.rbのself.channel"
  end

  def self.exchange
    @exchange ||= channel.fanout('shogi_game_exchange')
    Rails.logger.error "rabbitmq_service.rbのself.exchange"
  end

  def self.publish(message)
    exchange.publish(message.to_json)
    Rails.logger.error "rabbitmq_service.rbのself.publish(message)のmessage: #{message}"

  end
end