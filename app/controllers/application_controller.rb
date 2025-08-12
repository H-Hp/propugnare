class ApplicationController < ActionController::Base
  before_action :set_locale

  def set_locale
    # I18n.default_localeは、config/application.rbで指定したデフォルト言語jaで日本語
    I18n.locale = cookies[:lang] || I18n.default_locale
    #I18n.locale = params[:locale] || I18n.default_locale
  end
  
end
