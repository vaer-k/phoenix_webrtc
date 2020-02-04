defmodule VideoChat.Repo do
  use Ecto.Repo,
    otp_app: :video_chat,
    adapter: Ecto.Adapters.Postgres
end
