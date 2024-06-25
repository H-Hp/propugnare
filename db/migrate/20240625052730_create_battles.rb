class CreateBattles < ActiveRecord::Migration[6.1]
  def change
    create_table :battles do |t|
      t.integer :creator_id
      t.integer :opponent_id
      t.string :mode
      t.string :status

      t.timestamps
    end
  end
end
