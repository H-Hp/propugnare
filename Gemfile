source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

#ruby '2.7.3'
ruby '3.3.6'

gem "rails", "~> 8.0.0"
gem 'pg'

#gem 'puma', '~> 5.0'
gem "puma", ">= 6.0"#~> 6.0 は、Puma 6.0 以上、かつ 7.0 未満の最新バージョンを意味
#gem 'sass-rails', '>= 6'

#gem 'webpacker', '~> 5.0'
gem "propshaft"
gem 'jsbundling-rails'

gem 'turbolinks', '~> 5'
gem 'jbuilder', '~> 2.7'

gem 'bootsnap', '>= 1.4.4', require: false

gem 'react-rails'
gem 'bunny'
gem 'redis'
gem 'sidekiq'

group :development, :test do
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  gem 'rspec-rails', '~> 6.0'
  gem 'sqlite3', '~> 1.4'
end

group :development do
  gem 'web-console', '>= 4.1.0'
  gem 'rack-mini-profiler', '~> 2.0'
  gem 'listen', '~> 3.3'
  gem 'spring'
end

group :test do
  gem 'capybara', '>= 3.26'
  gem 'selenium-webdriver', '>= 4.0.0.rc1'
  gem 'webdrivers'
end

gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]

gem "dockerfile-rails", ">= 1.7", :group => :development

gem "sentry-ruby", "~> 5.23"

gem "sentry-rails", "~> 5.23"
