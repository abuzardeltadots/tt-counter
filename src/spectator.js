import Peer from 'peerjs';

const PREFIX = 'ttc-';

function randomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// --- HOST ---
export function createHost(onReady, onError) {
  const code = randomCode();
  const peerId = PREFIX + code;
  const peer = new Peer(peerId, { debug: 0 });
  const connections = [];

  peer.on('open', () => onReady(code));
  peer.on('error', (err) => {
    if (err.type === 'unavailable-id') {
      // Code collision — retry with new code
      peer.destroy();
      return createHost(onReady, onError);
    }
    onError(err);
  });

  peer.on('connection', (conn) => {
    connections.push(conn);
    conn.on('close', () => {
      const idx = connections.indexOf(conn);
      if (idx >= 0) connections.splice(idx, 1);
    });
  });

  return {
    broadcast(data) {
      connections.forEach(c => { if (c.open) c.send(data); });
    },
    getViewerCount() { return connections.filter(c => c.open).length; },
    destroy() { peer.destroy(); }
  };
}

// --- SPECTATOR ---
export function joinHost(code, onData, onConnect, onClose, onError) {
  const peerId = PREFIX + 'v' + Date.now().toString(36);
  const peer = new Peer(peerId, { debug: 0 });

  peer.on('open', () => {
    const conn = peer.connect(PREFIX + code, { reliable: true });
    conn.on('open', () => onConnect());
    conn.on('data', (data) => onData(data));
    conn.on('close', () => onClose());
    conn.on('error', (err) => onError(err));
  });

  peer.on('error', (err) => onError(err));

  return {
    destroy() { peer.destroy(); }
  };
}
