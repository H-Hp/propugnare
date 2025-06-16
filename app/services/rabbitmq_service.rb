require 'bunny'

class RabbitmqService
  def self.connection
=begin
  RabbitMQサーバーへの接続を確立します
  ||=演算子により、初回実行時のみ接続を作成し、以降は既存の接続を再利用します（シングルトンパターン）
  Bunny.newでRabbitMQクライアントインスタンスを作成
  .tap(&:start)で接続を開始し、同じオブジェクトを返します
  接続は一度作成されると@connectionインスタンス変数に保存されます

    #@connection ||= Bunny.new.tap(&:start)

    return @connection if @connection
    @connection = Bunny.new
    @connection.start
    Rails.logger.error "rabbitmq_service.rbのself.connection"
    @connection
=end
    @connection ||= begin #@connection ||= でシングルトンパターンを実装し、既存の接続があれば再利用
      conn = Bunny.new(
      #@connection = Bunny.new(
        host: Rails.application.credentials.dig(:rabbitmq, :host) || 'localhost',
        port: Rails.application.credentials.dig(:rabbitmq, :port) || 5672,
        username: Rails.application.credentials.dig(:rabbitmq, :username) || 'guest',
        password: Rails.application.credentials.dig(:rabbitmq, :password) || 'guest'
      )
      #@connection.start
      conn.start
      Rails.logger.info "RabbitMQ接続が確立されました"
      conn
      #@connection
    rescue Bunny::Exception => e
      Rails.logger.error "RabbitMQ接続エラー: #{e.message}"
      raise e
    end
  end

=begin
    RabbitMQでの通信チャンネルを作成します
    チャンネルは実際のメッセージ送受信を行うための通信路です
    一度作成されると@channelに保存され、再利用されます
    複数のチャンネルを同時に使用することで、並行処理が可能になります
=end
  def self.channel
    ##@channel ||= connection.create_channel
    #@channel ||= @connection.create_channel
    #Rails.logger.error "rabbitmq_service.rbのself.channel#{@channel}"
    if @channel.nil?
    #if channel.nil?
      Rails.logger.error "channel: @channel is nil, attempting to create new channel."
      created_channel = connection.create_channel
      Rails.logger.error "channel: connection.create_channel returned: #{created_channel.inspect}" # ここで返り値を確認
      #channel = created_channel
      @channel = created_channel
    end
    #Rails.logger.error "rabbitmq_service.rbのself.channel#{@channel}" # 最終的な @channel の値
    #channel
    @channel
    Rails.logger.error "チャンネルが作成されました"
  end

  def self.exchange
=begin
    fanoutタイプのエクスチェンジを作成します
    エクスチェンジはメッセージの配信ルールを決定する仕組みです
    fanoutタイプは、接続されている全てのキューにメッセージを同時配信します
    'shogi_game_exchange'という名前で、将棋ゲーム専用のエクスチェンジを作成
    将棋の対戦情報を複数のプレイヤーに同時に配信するのに適しています


    @exchange ||= begin
      #@exchange ||= channel.fanout('shogi_game_exchange')
      @exchange ||= channel.topic('shogi_game_exchange')
      #@exchange ||= channel.topic('shogi_game_topic_exchange')
      #@exchange ||= @channel.fanout('shogi_game_exchange')
      #Rails.logger.error "rabbitmq_service.rbのself.exchange"
      #@channel = initialize_channel
      #@exchange = channel.topic('shogi_game_topic_exchange', durable: true)
      #@exchange = channel.topic('shogi_game_exchange', durable: true)
      Rails.logger.info "RabbitMQエクスチェンジが作成されました"
      #exchange
      @exchange
    rescue StandardError => e
      Rails.logger.error "RabbitMQエクスチェンジ作成エラー: #{e.message}"
      reset_connections
      raise e
    end
=end
    #@bunny_exchange ||= begin
    exchange ||= begin
    #@exchange ||= begin
      # ここで `channel` メソッドが呼び出されている
      # この `channel` が正しく Bunny::Channel オブジェクトを返しているか再確認
      #actual_channel = self.channel
      #Rails.logger.error "exchange: Using channel: #{actual_channel.inspect}" # ここでチャンネルが何であるかログに出す
      
      Rails.logger.error "exchange: Using channel: #{@channel.inspect}" # ここでチャンネルが何であるかログに出す

      
      #@exchange ||= actual_channel.fanout('shogi_game_exchange')
      #@exchange ||= @channel.fanout('shogi_game_exchange')
      exchange ||= @channel.fanout('shogi_game_exchange')
      #@exchange ||= actual_channel.topic('shogi_game_exchange')
      Rails.logger.info "RabbitMQエクスチェンジが作成されました"
      Rails.logger.info "exchange:#{exchange}"
      exchange # ここで @exchange を返す
      #@exchange # ここで @exchange を返す
    rescue StandardError => e
      Rails.logger.error "RabbitMQエクスチェンジ作成エラー: #{e.message}"
      reset_connections
      raise e
    end
    exchange # 修正推奨箇所
    #@exchange # 修正推奨箇所
  end

=begin
    メッセージをエクスチェンジに送信します
    message.to_jsonでメッセージをJSON形式に変換してから送信
    fanoutエクスチェンジなので、接続されている全てのキューにメッセージが配信されます
=end
=begin
  def self.publish(message)
    exchange.publish(message.to_json)
    #@exchange.publish(message.to_json)
    Rails.logger.error "rabbitmq_service.rbのself.publish(message)のmessage: #{message}"
  end
=end

  # ルーティングキーを引数として受け取るように変更
  def self.publish(routing_key, message)
    # routing_key が nil や空の場合はエラーにするか、デフォルト値を設定する
    raise ArgumentError, "routing_key は空白にしてはダメ" if routing_key.nil? || routing_key.empty?

    Rails.logger.info "ああああexchange:#{exchange}"

    Rails.logger.info "RabbitMQが公開: routing_key=#{routing_key}, message=#{message.to_json}"
    exchange.publish(message.to_json, routing_key: routing_key)
    #@exchange.publish(message.to_json, routing_key: routing_key)
  end

  # (オプション) 特定のルーティングキーを購読するためのメソッド
  # これはRailsのワーカープロセス（例: Sidekiqジョブ）や、
  # Action Cableチャンネル内でバックエンド処理として使うことが多い
  def self.subscribe(routing_key, &block)
    actual_channel = self.channel
    Rails.logger.error "ああああああexchange: Using channel: #{actual_channel.inspect}" # ここでチャンネルが何であるかログに出す
      
    Rails.logger.info "aaa channel=#{channel}"
    #queue = channel.queue("", exclusive: true) # 一時的な匿名キュー
    queue = @channel.queue("", exclusive: true) # 一時的な匿名キュー
    queue.bind(exchange, routing_key: routing_key)

    queue.subscribe(block: true) do |delivery_info, properties, body|
      Rails.logger.info "RabbitMQ received: routing_key=#{delivery_info.routing_key}, body=#{body}"
      block.call(JSON.parse(body), delivery_info.routing_key) # ブロックにパース済みのJSONとルーティングキーを渡す
    end
  end

  # 接続を切断するメソッド (アプリケーション終了時などに呼び出す)
  def self.close_connection
    if @connection && @connection.connected?
      @connection.close
      @connection = nil
      @channel = nil
      @exchange = nil
      Rails.logger.info "RabbitMQ connection closed."
    end
  end
end

# アプリケーションシャットダウン時に接続を閉じるフック (Railsの場合)
# Rails.application.config.after_initialize do
#   at_exit { RabbitmqService.close_connection }
# end