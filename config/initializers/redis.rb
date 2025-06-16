# config/initializers/redis.rb
# development.rbやproduction.rbで環境変数を使うなど、実際の環境に合わせて設定してください
# ENV['REDIS_URL'] = "redis://localhost:6379/0" # 例

$redis = Redis.new(url: ENV.fetch("REDIS_URL") { "redis://localhost:6379/0" })

# オプション: Redisの接続テスト
# begin
#   $redis.ping
#   Rails.logger.info "Redis connection successful!"
# rescue Redis::CannotConnectError => e
#   Rails.logger.error "Redis connection failed: #{e.message}"
# end

#Redis.current = Redis.new(host: 'localhost', port: 6379)