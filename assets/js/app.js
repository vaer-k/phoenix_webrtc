// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.css";

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html";

// Import local files
//
// Local files can be imported directly using relative paths, for example:
import socket from "./socket";

let localStream, peerConnection;
let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");
let remoteStream = new MediaStream();
let connectButton = document.getElementById("connect");
let callButton = document.getElementById("call");
let hangupButton = document.getElementById("hangup");

socket.connect();

const channel = socket.channel("call:lobby", {});

channel
  .join()
  .receive("ok", () => console.log("Successfully joined call lobby"))
  .receive("error", () => console.log("Unable to join call lobby"));

channel.on("message", payload => {
  const message = JSON.parse(payload.body);
  if (message.sdp) {
    acceptRemoteDescription(message.sdp);
  } else if (message.candidate) {
    gotRemoteIceCandidate(message.candidate);
  }
});

hangupButton.disabled = true;
callButton.disabled = true;
connectButton.onclick = connect;
callButton.onclick = call;
hangupButton.onclick = hangup;

function connect() {
  console.log("Requesting local stream");
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: true })
    .then(gotStream, error => {
      console.log("getUserMedia error: ", error);
    });
}

function gotStream(stream) {
  console.log("Received local stream");
  console.log(stream);
  localVideo.srcObject = stream;
  localStream = stream;
  remoteVideo.srcObject = remoteStream;
  setupPeerConnection();
}

function setupPeerConnection() {
  connectButton.disabled = true;
  callButton.disabled = false;
  hangupButton.disabled = false;
  console.log("Waiting for call");

  let configuration = {
    iceServers: [
      {
        urls: "stun:stun.1.google.com:19302"
      }
    ]
  };

  peerConnection = new RTCPeerConnection(configuration);
  console.log("Created local peer connection");
  peerConnection.onicecandidate = gotLocalIceCandidate;
  peerConnection.ontrack = gotRemoteStream;
  peerConnection.onicegatheringstatechange = () => {
    if (peerConnection.iceGatheringState === "complete") {
      console.log("Peers connected!");
    }
  };

  localStream.getTracks().forEach(t => peerConnection.addTrack(t));

  console.log("Added localStream to localPeerConnection");
}

function call() {
  callButton.disabled = true;
  console.log("Starting call");
  peerConnection.createOffer().then(sendLocalDescription, handleError);
}

function sendLocalDescription(description) {
  peerConnection.setLocalDescription(description).then(() => {
    channel.push("message", {
      body: JSON.stringify({
        sdp: peerConnection.localDescription
      })
    });
  }, handleError);
  console.log(
    "Sent description from localPeerConnection: \n" + description.sdp
  );
}

function acceptRemoteDescription(description) {
  console.log("Accepting offer from remotePeerConnection: \n" + description);
  peerConnection.setRemoteDescription(description);

  if (description.type == "offer") {
    peerConnection.createAnswer().then(sendLocalDescription, handleError);
  }
}

function gotRemoteStream(event) {
  // remoteVideo.srcObject = event.stream;
  remoteStream.addTrack(event.track, remoteStream);
  console.log("Received remote stream");
}

function gotLocalIceCandidate(event) {
  if (event.candidate) {
    console.log("Local ICE candidate: \n" + event.candidate.candidate);
    channel.push("message", {
      body: JSON.stringify({
        candidate: event.candidate
      })
    });
  }
}

function gotRemoteIceCandidate(candidate) {
  callButton.disabled = true;
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).then(
    () => console.log("Successfully added ICE candidate"),
    e => console.log(e)
  );
  console.log("Remote ICE candidate: \n " + candidate.candidate);
}

function hangup() {
  console.log("Ending call");
  peerConnection.close();
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  peerConnection = null;
  hangupButton.disabled = true;
  connectButton.disabled = false;
  callButton.disabled = true;

  localStream.getTracks().forEach(t => t.stop());
}

function handleError(error) {
  console.log(error.name + ": " + error.message);
}
