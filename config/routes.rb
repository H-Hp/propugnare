Rails.application.routes.draw do
  
  #root 'home#index'
  #root to: "home#index"
  #root to: "shogi#index"
  root to: "shogi#top"

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
