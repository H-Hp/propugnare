class ChatChannel < ApplicationCable::Channel
  # クライアントがチャンネルにサブスクライブしたときの処理
  def subscribed
    stream_from "chat_channel"
  end

  # クライアントがチャンネルから退出したときの処理
  def unsubscribed
    # チャンネルから退出時のクリーンアップ処理をここに記述（必要な場合）
  end

  # クライアントからメッセージを受信したときの処理
  def speak(data)
    # 受信したメッセージをすべてのサブスクライバーにブロードキャスト
    ActionCable.server.broadcast "chat_channel", message: data['message']
  end
end