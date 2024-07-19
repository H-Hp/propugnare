class HomeController < ApplicationController
  before_action :set_session_id

  def index
    @battles = Battle.where(status: 'waiting')
    #@battles = 1
  end

  def create
    @battle = Battle.new(creator_id: session[:user_id], status: 'waiting' ,mode: 'typing')
    if @battle.save
      redirect_to root_path, notice: '対戦予約が作成されました'
    else
      render :index
    end
  end

  def join
    @battle = Battle.find(params[:id])
    if @battle.update(opponent_id: session[:user_id], status: 'matched')
      redirect_to root_path, notice: '対戦に参加しました'
      #ifでリダイレクト先
    else
      redirect_to root_path, alert: '対戦への参加に失敗しました'
    end
  end

  private

  def set_session_id
    unless session[:user_id]
      session[:user_id] = SecureRandom.uuid
    end
  end
end
