Rails.application.routes.draw do
  
  #root 'home#index'
  #root to: "home#index"
  #root to: "shogi#index"
  
  #root to: "shogi#game_lobby_auto_matching"
  root to: "matching#game_lobby_matching_board"
  
  post 'matching/start', to: 'matching#start', as: :start_matching
  get 'matching/status', to: 'matching#status', as: :matching_status # ポーリング用
  post 'matching/cancel', to: 'matching#cancel', as: :cancel_matching
  post 'matching/all_delete', to: 'matching#all_delete', as: :all_delete_matching_data #開発用のマッチングデータ削除用

  get '/shogi/:id', to: 'shogi#index'
  delete '/shogi/:id/destroy', to: 'shogi#destroy'#試合終了後にデータ削除

  #get 'shogi/index'
  #get '/'  => 'home#index'
  mount ActionCable.server => '/cable'

  resources :home, only: [:index, :create] do
    member do
      post 'join'
    end
  end
end
