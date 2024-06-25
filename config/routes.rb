Rails.application.routes.draw do
  #root 'home#index'
  root to: "home#index"
  #get '/'  => 'home#index'

  resources :home, only: [:index, :create] do
    member do
      post 'join'
    end
  end
end
