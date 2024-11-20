require "test_helper"

class ShogiControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get shogi_index_url
    assert_response :success
  end
end
