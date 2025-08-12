require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Propugnare
  class Application < Rails::Application

    config.i18n.default_locale = :ja #デフォルトの言語を指定

    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 6.1

    # `.rb` ファイルを含まない、または再読み込みや事前読み込みの対象とすべきでない
    #他の `lib` サブディレクトリを `ignore` リストに追加してください。
    # 一般的な例としては、`templates`、`generators`、または `middleware` などがあります。
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
