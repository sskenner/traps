import React from "react";
import SimpleTetris from "./SimpleTetris";
import "@fontsource/inter";

// Prevent the browser console errors from websocket connection
// Since we're not using the websocket functionality in this version
if (window.WebSocket) {
  // Override the WebSocket constructor to prevent any unwanted connections
  // This is a temporary fix until we properly implement multiplayer
  const OriginalWebSocket = window.WebSocket;
  
  window.WebSocket = function(url, protocols) {
    if (url.includes('/ws')) {
      console.log('WebSocket connection prevented:', url);
      // Return a mock WebSocket that does nothing
      return {
        send: () => {},
        close: () => {},
        onopen: null,
        onclose: null,
        onmessage: null,
        onerror: null
      };
    }
    return new OriginalWebSocket(url, protocols);
  } as any;
  
  // Copy the prototype and static properties
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  window.WebSocket.OPEN = OriginalWebSocket.OPEN;
  window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
}

function App() {
  console.log("App component rendering");

  return (
    <SimpleTetris />
  );
}

export default App;
