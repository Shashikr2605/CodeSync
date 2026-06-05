// Hook: WebRTC voice chat (Controller layer)
import { useCallback, useEffect, useRef, useState } from "react";
import { createPeerConnection } from "../services/webrtc";

export function useVoiceChat({ socketRef, roomId, joined }) {
  const [isInVoice, setIsInVoice]       = useState(false);
  const [isMuted, setIsMuted]           = useState(false);
  const [participants, setParticipants] = useState([]); // [{ socketId, speaking }]

  const localStreamRef  = useRef(null);
  const peerConnsRef    = useRef(new Map()); // peerId -> RTCPeerConnection
  const analyserRefs    = useRef(new Map()); // peerId -> { analyser, speaking }
  const speakingTimers  = useRef(new Map());

  // ── Speaking detection via AudioContext ──────────────────────────
  function trackSpeaking(peerId, stream) {
    try {
      const ctx      = new AudioContext();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRefs.current.set(peerId, { analyser, ctx });

      const data = new Uint8Array(analyser.frequencyBinCount);
      function check() {
        if (!analyserRefs.current.has(peerId)) return;
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const speaking = avg > 15;
        setParticipants((prev) =>
          prev.map((p) => (p.socketId === peerId ? { ...p, speaking } : p))
        );
        speakingTimers.current.set(peerId, requestAnimationFrame(check));
      }
      check();
    } catch (_) {}
  }

  function stopTracking(peerId) {
    const ref = analyserRefs.current.get(peerId);
    if (ref) { try { ref.ctx.close(); } catch (_) {} }
    analyserRefs.current.delete(peerId);
    if (speakingTimers.current.has(peerId)) {
      cancelAnimationFrame(speakingTimers.current.get(peerId));
      speakingTimers.current.delete(peerId);
    }
  }

  // ── Peer connection helpers ──────────────────────────────────────
  function addParticipant(socketId) {
    setParticipants((prev) =>
      prev.find((p) => p.socketId === socketId) ? prev : [...prev, { socketId, speaking: false }]
    );
  }

  function removeParticipant(socketId) {
    stopTracking(socketId);
    setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    const pc = peerConnsRef.current.get(socketId);
    if (pc) { pc.close(); peerConnsRef.current.delete(socketId); }
  }

  function onRemoteTrack(peerId, stream) {
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play().catch(() => {});
    trackSpeaking(peerId, stream);
  }

  function makePeerConnection(peerId) {
    const pc = createPeerConnection(peerId, socketRef.current, localStreamRef.current, onRemoteTrack);
    peerConnsRef.current.set(peerId, pc);
    return pc;
  }

  // ── Socket event listeners ───────────────────────────────────────
  useEffect(() => {
    if (!joined || !socketRef.current) return;
    const socket = socketRef.current;

    // Existing peers — send them an offer
    socket.on("voice:participants", async (peerIds) => {
      for (const peerId of peerIds) {
        addParticipant(peerId);
        const pc    = makePeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("voice:offer", { targetId: peerId, offer });
      }
    });

    // A new peer joined — they'll send us an offer
    socket.on("voice:user-joined", ({ socketId }) => {
      addParticipant(socketId);
    });

    // Received an offer → send answer
    socket.on("voice:offer", async ({ fromId, offer }) => {
      addParticipant(fromId);
      let pc = peerConnsRef.current.get(fromId) || makePeerConnection(fromId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("voice:answer", { targetId: fromId, answer });
    });

    // Received an answer
    socket.on("voice:answer", async ({ fromId, answer }) => {
      const pc = peerConnsRef.current.get(fromId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE candidate
    socket.on("voice:ice-candidate", async ({ fromId, candidate }) => {
      const pc = peerConnsRef.current.get(fromId);
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
      }
    });

    // Peer left voice
    socket.on("voice:user-left", ({ socketId }) => removeParticipant(socketId));

    return () => {
      socket.off("voice:participants");
      socket.off("voice:user-joined");
      socket.off("voice:offer");
      socket.off("voice:answer");
      socket.off("voice:ice-candidate");
      socket.off("voice:user-left");
    };
  }, [joined, socketRef.current]);

  // ── Public API ───────────────────────────────────────────────────
  const joinVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setIsInVoice(true);
      socketRef.current.emit("voice:join", roomId);
    } catch (err) {
      alert("Microphone access denied. Please allow mic access and try again.");
    }
  }, [roomId, socketRef]);

  const leaveVoice = useCallback(() => {
    socketRef.current?.emit("voice:leave", roomId);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnsRef.current.forEach((pc) => pc.close());
    peerConnsRef.current.clear();
    participants.forEach((p) => stopTracking(p.socketId));
    setParticipants([]);
    setIsInVoice(false);
    setIsMuted(false);
  }, [roomId, socketRef, participants]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  return { isInVoice, isMuted, joinVoice, leaveVoice, toggleMute, participants };
}
