# config/initializers/redis.rb
# development.rbやproduction.rbで環境変数を使うなど、実際の環境に合わせて設定してください
# ENV['REDIS_URL'] = "redis://localhost:6379/0" # 例

#$redis = Redis.new(url: ENV.fetch("REDIS_URL") { "redis://localhost:6379/0" })
#$redis = Redis.new(url:  Rails.application.credentials.development[:REDIS_URL] { "redis://localhost:6379/0" })

# 環境変数から Redis の URL を取得し、なければデフォルト値を使用
# RAILS_ENV に応じてクレデンシャルを切り替えるようにします

if Rails.env.production?
  # 本番環境では DATABASE_URL が設定されていない場合に備えてフォールバック
  $redis = ENV.fetch('REDIS_URL') do
    if Rails.application.credentials.production.dig(:REDIS_URL)
      Rails.application.credentials.production[:REDIS_URL]
    else
      "redis://localhost:6379/0"
    end
  end
elsif Rails.env.test?
  # テスト環境
  $redis = ENV.fetch('REDIS_URL') { "redis://localhost:6379/1" }
else # 開発環境
  # 開発環境
  $redis = Rails.application.credentials.development.dig(:REDIS_URL) || "redis://localhost:6379/0"
end

# オプション: Redisの接続テスト
# begin
#   $redis.ping
#   Rails.logger.info "Redis connection successful!"
# rescue Redis::CannotConnectError => e
#   Rails.logger.error "Redis connection failed: #{e.message}"
# end

#Redis.current = Redis.new(host: 'localhost', port: 6379)