class ChangeDataTypeForBattleUuid < ActiveRecord::Migration[6.1]
  def change
   change_column :battles, :creator_id, :uuid, using: "uuid_generate(:creator_id)::uuid"
   change_column :battles, :opponent_id, :uuid, using: "uuid_generate(:opponent_id)::uuid"
  end
end
