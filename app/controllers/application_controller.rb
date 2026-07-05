require 'net/http'
require 'uri'
require 'json'

class ApplicationController < ActionController::Base
  before_action :set_locale

  def set_locale
    # I18n.default_localeは、config/application.rbで指定したデフォルト言語jaで日本語
    I18n.locale = cookies[:lang] || I18n.default_locale
    #I18n.locale = params[:locale] || I18n.default_locale
  end


def health_check
  url = params[:url]
  puts "url: #{url}" 
  #https://propugnare.online/health_check?url=https://propugnare.online
  #http://127.0.0.1:3000/health_check?url=http://127.0.0.1:3000


  result = {
    external: nil,
    db: nil,
    redis: nil,
    oci: nil
  }

  # 外部URLチェック
  begin
    uri = URI(url)
    res = Net::HTTP.get_response(uri)
    result[:external] = res.code.to_i
  rescue => e
    result[:external] = 0
    Rails.logger.error("External error: #{e.message}")
  end

  # DBチェック
  begin
    ActiveRecord::Base.connection.execute("SELECT 1")
    result[:db] = true
  rescue => e
    result[:db] = false
    Rails.logger.error("DB error: #{e.message}")
  end

  # Redisチェック
  begin
    #redis = Redis.new(url: ENV["REDIS_URL"])
    #pong = redis.ping
    pong = $redis.ping
    result[:redis] = (pong == "PONG")
  rescue => e
    result[:redis] = false
    Rails.logger.error("Redis error: #{e.message}")
  end

  # OCI（Oracle Cloud Infrastructureの将棋AI）チェック
  begin
    uri = URI("http://168.138.215.52:5000/move")

    http = Net::HTTP.new(uri.host, uri.port)
    http.open_timeout = 5   # 接続タイムアウト
    http.read_timeout = 6   # レスポンスタイムアウト

    req = Net::HTTP::Post.new(uri.path, { "Content-Type" => "application/json" })
    req.body = {
      sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
      think_time: 100
    }.to_json

    res = http.request(req)
    if res.code.to_i == 200
      body = JSON.parse(res.body) rescue {}
      result[:oci] = body["move"].present?
    else
      result[:oci] = false
    end
  rescue => e
    result[:oci] = false
    Rails.logger.error("OCI error: #{e.message}")
  end

  # ステータス判定
  status_code = (result[:external] == 200 && result[:db] && result[:redis] && result[:oci]) ? 200 : 500
  puts "Health check result: #{result}, status_code: #{status_code}"
  render json: result, status: status_code
end

def redis_keep_alive
  begin
    $redis.set("keep_alive", "ok", ex: 300) # 5分で消える
    render json: { status: "ok" }
  rescue => e
    Rails.logger.error("Redis keep alive error: #{e.message}")
    render json: { status: "ng" }, status: 500
  end
end
  
end
