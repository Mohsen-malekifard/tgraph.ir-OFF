"use client";

import { useEffect } from "react";

import Gap from "../Gap";
import AttachmentView, { getAttachmentLayout } from "./AttachmentView";
import {
  acknowledgeUpload,
  cancelUpload,
  retryUpload,
  useUploads,
} from "@/lib/uploadQueue";
import { formatMessageTime } from "@/lib/mediaUtils";

const STATUS_MAP = {
  queued: "sending",
  uploading: "sending",
  sent: "sent",
  failed: "failed",
};

export default function PendingUploads({
  conversationId,
  language = "english",
  // Set of persisted message ids currently rendered by MessageList.
  existingMessageIds = null,
}) {
  const uploads = useUploads();
  const conversationKey = String(conversationId || "");

  // A successful temporary bubble is kept until the actual server message is
  // present. This avoids making a successfully uploaded message disappear
  // when realtime delivery is delayed or temporarily unavailable.
  useEffect(() => {
    if (!conversationKey || !existingMessageIds?.has) return;

    for (const upload of uploads) {
      if (
        upload.conversationId === conversationKey &&
        upload.status === "sent" &&
        upload.serverMessageId &&
        existingMessageIds.has(upload.serverMessageId)
      ) {
        acknowledgeUpload(upload.id);
      }
    }
  }, [uploads, conversationKey, existingMessageIds]);

  const visible = uploads.filter((upload) => {
    if (upload.conversationId !== conversationKey) return false;

    return !(
      upload.status === "sent" &&
      upload.serverMessageId &&
      existingMessageIds?.has?.(upload.serverMessageId)
    );
  });

  return visible.map((upload) => {
    const layout = getAttachmentLayout(upload);
    const time = formatMessageTime(upload.createdAt, language);

    return (
      <Gap
        key={upload.id}
        side="right"
        time={time}
        status={STATUS_MAP[upload.status] || "sending"}
        mediaWidth={layout.width}
        timeOverlay={layout.overlayTime && !upload.caption}
        media={
          <AttachmentView
            attachment={upload.attachment || null}
            local={upload}
            upload={upload}
            language={language}
            onCancel={() => cancelUpload(upload.id)}
            onRetry={() => retryUpload(upload.id)}
          />
        }
      >
        {upload.caption || null}
      </Gap>
    );
  });
}
