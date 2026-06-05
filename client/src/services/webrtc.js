// Service: WebRTC peer connection factory
const STUN_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/**
 * Creates an RTCPeerConnection for a given peer.
 * Handles ICE candidate forwarding and track routing.
 *
 * @param {string} peerId - The remote socket ID
 * @param {object} socket - Socket.IO client instance
 * @param {MediaStream} localStream - Local microphone stream
 * @param {function} onTrack - Callback when remote track arrives: (peerId, stream) => {}
 * @returns {RTCPeerConnection}
 */
export function createPeerConnection(peerId, socket, localStream, onTrack) {
  const pc = new RTCPeerConnection(STUN_SERVERS);

  // Add local audio tracks
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // Send ICE candidates to peer via signaling server
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("voice:ice-candidate", {
        targetId:  peerId,
        candidate: e.candidate,
      });
    }
  };

  // When remote track arrives, call the callback
  pc.ontrack = (e) => {
    if (onTrack) onTrack(peerId, e.streams[0]);
  };

  return pc;
}
