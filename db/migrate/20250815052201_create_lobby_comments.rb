class CreateLobbyComments < ActiveRecord::Migration[8.0]
  def change
    create_table :lobby_comments do |t|
      t.string :content

      t.timestamps
    end
  end
end
