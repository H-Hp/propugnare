require 'rails_helper'

RSpec.describe "トップページ", type: :system do
  it "トップページにアクセスできること" do
        visit root_path
    
    # ページが正常に表示されているかチェック
    expect(page).to have_current_path(root_path)
    
    # 特定の要素が存在するかチェック（実際の内容に合わせて変更）
    expect(page).to have_selector('h1')
    #expect(page).to have_css('header')
    #expect(page).to have_text('ようこそ') # 実際のテキストに変更
  end
end

