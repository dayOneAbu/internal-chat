"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

export function LiveKitCall({
  roomName,
  onDisconnected,
}: {
  roomName: string;
  onDisconnected: () => void;
}) {
  const [token, setToken] = useState<string>("");
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    async function getToken() {
      try {
        const res = await fetch(`/api/livekit/token?roomName=${roomName}`);
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          setUrl(data.url);
        } else {
          console.error("Failed to get LiveKit token", data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    getToken();
  }, [roomName]);

  if (!token || !url) {
    return (
      <div className="fixed inset-x-4 top-24 z-50 flex h-[60vh] max-h-[800px] flex-col items-center justify-center rounded-2xl bg-black px-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:inset-x-auto md:right-10 md:w-[480px]">
        <p className="animate-pulse text-sm font-medium text-white">Connecting to secure call...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-4 top-24 z-50 flex h-[60vh] max-h-[800px] flex-col overflow-hidden rounded-2xl bg-black shadow-[0_20px_60px_rgba(0,0,0,0.4)] md:inset-x-auto md:right-10 md:w-[480px]">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={url}
        onDisconnected={onDisconnected}
        data-lk-theme="default"
        style={{ height: "100%", width: "100%" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
