require 'rails_helper'
RSpec.describe "Matching", type: :request do
  describe "POST /matching/start" do
    it "starts matching successfully" do
      post "/matching/start", params: { battleType: "10min", userName: "テストちゃん"  }
      expect(response).to have_http_status(:success) # レスポンスのHTTPステータスが成功(2xx)であることを検証・200なら成功
      #expect(json["status"]).to eq("started") # レスポンスボディ(JSON)の "status" フィールドが "started" であることを検証
    end
  end
end