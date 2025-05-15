Rails.application.routes.draw do
  get 'shogi/index'
  #root 'home#index'
  #root to: "home#index"
  root to: "shogi#index"
  #get '/'  => 'home#index'
  mount ActionCable.server => '/cable'

  resources :home, only: [:index, :create] do
    member do
      post 'join'
    end
  end
end
