"use client";

import React, { useCallback } from "react";
import { LoaderCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useServer } from "@/context/ServerContext";

export const ServerActionConfirmation: React.FC = () => {
  const {
    pendingServerAction,
    serverAction,
    confirmServerAction,
    cancelServerAction,
  } = useServer();

  const isProcessing = serverAction !== null;
  const isRestart = pendingServerAction === "restart";
  const actionLabel = isRestart ? "Restart" : "Stop";
  const close = useCallback(() => {
    if (!isProcessing) cancelServerAction();
  }, [cancelServerAction, isProcessing]);

  return (
    <Modal
      isOpen={pendingServerAction !== null}
      onClose={close}
      title={`${actionLabel} ValoriaSMP?`}
      description={isRestart
        ? "The server will restart and connected players may be disconnected."
        : "The server will shut down and players will be disconnected."}
      footer={(
        <>
          <button
            type="button"
            onClick={cancelServerAction}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmServerAction}
            disabled={isProcessing || pendingServerAction === null}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
              isRestart
                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                : "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25"
            }`}
          >
            {isProcessing && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            {isProcessing ? `${actionLabel}ing…` : `Confirm ${actionLabel}`}
          </button>
        </>
      )}
    >
      <div className="rounded-lg border border-white/5 bg-zinc-950/60 p-3 text-xs leading-relaxed text-zinc-400">
        {isRestart
          ? "This request will be sent to the server host. The dashboard will continue checking the actual server status."
          : "This request will be sent to the server host. You can start the server again after it is offline."}
      </div>
    </Modal>
  );
};
