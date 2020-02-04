use Mix.Config

# Configure your database
config :video_chat, VideoChat.Repo,
  username: "postgres",
  password: "postgres",
  database: "video_chat_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :video_chat, VideoChatWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn
