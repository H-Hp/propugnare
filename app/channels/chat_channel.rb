class ChatChannel < ApplicationCable::Channel

  # クライアントがチャンネルにサブスクライブ（購読開始）したときの処理
  # JavaScript側から'subscribe'コマンドが送信されたときに自動的に呼び出される
  def subscribed
    # "chat_channel"という名前のストリーム（ブロードキャストグループ）にクライアントを登録・chat_channel"という名前のストリームから配信を開始
    # これにより、このストリームにブロードキャストされたメッセージがこのクライアントに送信されるようになる・このストリームに送信されたメッセージがこのクライアントに配信される
    stream_from "chat_channel"
  end

  # クライアントがチャンネルから退出したときの処理
  # WebSocket接続が閉じられたり、クライアントがサブスクライブを解除したりしたときに呼び出される
  def unsubscribed
    # チャンネルから退出時のクリーンアップ処理をここに記述（必要な場合）
  end

  # クライアントからメッセージを受信したときの処理（カスタムアクション）:
  # JavaScript側から'message'コマンドと'action: "speak"'が送信されたときに呼び出される
  # data引数には、JavaScriptから送信された'data'プロパティの内容（ここでは`{ action: 'speak', message: message }`）がハッシュとして渡される
  def speak(data)
    # 受信したメッセージを"chat_channel"ストリームの全サブスクライバーにブロードキャスト
    # このチャンネルを購読している全クライアントに同じメッセージが配信される・"chat_channel"ストリームを購読しているすべてのクライアントに対してメッセージを送信
    # `message: data['message']` は、送信するペイロード（データ）を定義
    ActionCable.server.broadcast "chat_channel", message: data['message']

    #データベースへの保存処理も可能
    #Message.create!(content: data['message'], user: current_user)
  end
end