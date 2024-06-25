class ChangeDataTypeForBattle < ActiveRecord::Migration[6.1]
  def change
    change_column :battles, :creator_id, :varchar
    change_column :battles, :opponent_id, :varchar
  end
end
rails generate migration ChangeDataTypeForBattle