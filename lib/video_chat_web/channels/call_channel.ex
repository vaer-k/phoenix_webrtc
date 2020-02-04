defmodule VideoChatWeb.CallChannel do
  use Phoenix.Channel

  def join("call:" <> _room_id, _auth_msg, socket) do
    {:ok, socket}
  end

  def handle_in("message", %{"body" => body}, socket) do
    broadcast_from!(socket, "message", %{body: body})
    {:noreply, socket}
  end
end
