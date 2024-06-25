class HomeController < ApplicationController
  def index
    @battles = Battle.where(status: 'waiting')
  end

  def create
    @battle = Battle.new(creator_id: 1, status: 'waiting' ,mode: 'typing')
    if @battle.save
      redirect_to home_index_path, notice: '対戦予約が作成されました'
    else
      render :index
    end
  end

  def join
    @battle = Battle.find(params[:id])
    if @battle.update(opponent_id: 2, status: 'matched')
      redirect_to home_index_path, notice: '対戦に参加しました'
    else
      redirect_to home_index_path, alert: '対戦への参加に失敗しました'
    end
  end

end
