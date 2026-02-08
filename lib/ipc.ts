// lib/ipc.ts
export const IPC_CHANNEL_NAME = "zustand-ipc-demo";
export const ipc = new BroadcastChannel(IPC_CHANNEL_NAME);
