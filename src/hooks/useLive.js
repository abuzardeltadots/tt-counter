import { useState, useRef, useCallback, useEffect } from 'react';
import { createHost, joinHost } from '../spectator';

export default function useLive() {
  const [liveCode, setLiveCode] = useState(null);
  const [liveViewers, setLiveViewers] = useState(0);
  const [spectating, setSpectating] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const hostRef = useRef(null);
  const specRef = useRef(null);

  const startHosting = useCallback(() => {
    if (hostRef.current) { stopHosting(); return; }
    const host = createHost(
      (code) => setLiveCode(code),
      () => setLiveCode(null)
    );
    hostRef.current = host;
  }, []);

  const stopHosting = useCallback(() => {
    hostRef.current?.destroy();
    hostRef.current = null;
    setLiveCode(null);
    setLiveViewers(0);
  }, []);

  const broadcast = useCallback((data) => {
    if (hostRef.current && liveCode) {
      hostRef.current.broadcast(data);
      setLiveViewers(hostRef.current.getViewerCount());
    }
  }, [liveCode]);

  const joinAsSpectator = useCallback(() => {
    const code = joinCode.trim();
    if (!code || code.length !== 4) return;
    specRef.current?.destroy();
    const spec = joinHost(
      code,
      (data) => setSpectating(data),
      () => setShowJoinModal(false),
      () => { setSpectating(null); specRef.current = null; },
      () => { setSpectating(null); specRef.current = null; }
    );
    specRef.current = spec;
  }, [joinCode]);

  const leaveSpectator = useCallback(() => {
    specRef.current?.destroy();
    specRef.current = null;
    setSpectating(null);
  }, []);

  useEffect(() => {
    return () => { hostRef.current?.destroy(); specRef.current?.destroy(); };
  }, []);

  return {
    liveCode, liveViewers, spectating,
    showJoinModal, setShowJoinModal,
    joinCode, setJoinCode,
    startHosting, stopHosting, broadcast,
    joinAsSpectator, leaveSpectator
  };
}
