"use client";

const offlineSocket = {
  connected: false,
  id: null,
  auth: {},
  on() { return this; },
  once() { return this; },
  off() { return this; },
  removeListener() { return this; },
  removeAllListeners() { return this; },
  emit() { return false; },
  connect() { return this; },
  disconnect() { return this; },
};

export function getSocket() {
  return offlineSocket;
}

export function updateSocketToken() {}
export function reconnectSocket() {}
export function disconnectSocket() {}
export function isSocketConnected() { return false; }
