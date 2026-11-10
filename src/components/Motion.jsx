"use client";

import { useEffect, useRef, useState } from "react";

/*
|--------------------------------------------------------------------------
| Shared motion
|--------------------------------------------------------------------------
|
| Same timing and easing as AttachmentSheet:
|
|   BottomSheet   : slides up from the bottom, backdrop fades in,
|                   drag the top area down to dismiss.
|   SlidePage     : full page that slides in from the side (right in LTR,
|                   left in RTL) while the page behind it dims.
|   FloatingButton: round button that pops in.
|
*/

export const SHEET_ANIMATION_MS = 320;
export const SLIDE_ANIMATION_MS = 320;

export const MOTION_EASING = "cubic-bezier(0.2, 0.9, 0.25, 1)";
export const POP_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// The side a new page enters from.
export function getSlideSide(language) {
  return language === "english" ? "right" : "left";
}

/*
|--------------------------------------------------------------------------
| Mount / unmount with animation
|--------------------------------------------------------------------------
|
| rendered: the element exists in the DOM.
| shown   : the element is in its final (visible) position.
|
| Opening mounts the element in its hidden position, waits two frames so the
| browser paints that state, then flips `shown`. Closing flips `shown` first
| and unmounts when the transition has finished.
|
*/

export function useAnimatedMount(open, duration = SHEET_ANIMATION_MS) {
  const [rendered, setRendered] = useState(Boolean(open));
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);

      let secondFrame = 0;

      const firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setShown(true));
      });

      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }

    setShown(false);

    const timer = window.setTimeout(() => setRendered(false), duration);

    return () => window.clearTimeout(timer);
  }, [open, duration]);

  return { rendered, shown };
}

/*
|--------------------------------------------------------------------------
| Becomes true shortly after mount (used for pop-in effects)
|--------------------------------------------------------------------------
*/

export function useEntered(delay = 0) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    let secondFrame = 0;
    let timer = 0;

    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        timer = window.setTimeout(() => setEntered(true), delay);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
    };
  }, [delay]);

  return entered;
}

/*
|--------------------------------------------------------------------------
| Bottom Sheet
|--------------------------------------------------------------------------
|
| className : background (and anything else) for the sheet panel.
| onEntered : called once the slide-up has finished (good moment to focus
|             an input without the browser scrolling the page).
|
*/

export function BottomSheet({
  open,
  onClose,
  dismissible = true,
  className = "",
  label,
  onEntered,
  children,
}) {
  const { rendered, shown } = useAnimatedMount(open, SHEET_ANIMATION_MS);

  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onEnteredRef = useRef(onEntered);

  onCloseRef.current = onClose;
  onEnteredRef.current = onEntered;

  useEffect(() => {
    if (!rendered) {
      setDragOffset(0);
      setDragging(false);
    }
  }, [rendered]);

  useEffect(() => {
    if (!open || !dismissible) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      onCloseRef.current?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, dismissible]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timer = window.setTimeout(
      () => onEnteredRef.current?.(),
      SHEET_ANIMATION_MS + 30
    );

    return () => window.clearTimeout(timer);
  }, [open]);

  /* Dragging the sheet down */

  const handlePointerDown = (event) => {
    if (!dismissible) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragRef.current = {
      id: event.pointerId,
      startY: event.clientY,
      captured: false,
      target: event.currentTarget,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;

    if (!drag || drag.id !== event.pointerId) {
      return;
    }

    const delta = event.clientY - drag.startY;

    if (!drag.captured) {
      if (Math.abs(delta) < 8) {
        return;
      }

      drag.captured = true;

      setDragging(true);

      try {
        drag.target.setPointerCapture(event.pointerId);
      } catch {
        // Capturing is only an optimization.
      }
    }

    setDragOffset(delta > 0 ? delta : 0);
  };

  const finishDrag = (event, cancelled) => {
    const drag = dragRef.current;

    if (!drag || drag.id !== event.pointerId) {
      return;
    }

    dragRef.current = null;

    const delta = event.clientY - drag.startY;

    try {
      drag.target.releasePointerCapture?.(event.pointerId);
    } catch {
      // Nothing to release.
    }

    setDragging(false);

    if (!drag.captured || cancelled || delta <= 90) {
      setDragOffset(0);

      return;
    }

    // Keep the dragged position so the sheet continues smoothly downwards.
    onCloseRef.current?.();

    // If the parent refused to close, snap back.
    window.setTimeout(() => setDragOffset(0), 60);
  };

  if (!rendered) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[120]"
    >
      <div
        aria-hidden="true"
        onClick={() => {
          if (dismissible) {
            onClose?.();
          }
        }}
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: shown ? 1 : 0,
          transition: `opacity ${SHEET_ANIMATION_MS - 60}ms ease-out`,
        }}
      />

      <div
        className={`scrollbar-none absolute inset-x-0 bottom-0 max-h-full w-full overflow-y-auto rounded-t-[24px] ${className}`}
        style={{
          transform: shown
            ? `translate3d(0, ${dragOffset}px, 0)`
            : "translate3d(0, 100%, 0)",
          transition: dragging
            ? "none"
            : `transform ${SHEET_ANIMATION_MS}ms ${MOTION_EASING}`,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.35)",
          willChange: "transform",
        }}
      >
        {dismissible && (
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => finishDrag(event, false)}
            onPointerCancel={(event) => finishDrag(event, true)}
            className="absolute inset-x-0 top-0 z-10 h-[56px] touch-none"
          />
        )}

        {children}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Slide Page
|--------------------------------------------------------------------------
|
| from       : "right" | "left" (see getSlideSide).
| background : page color (hex / css color).
|
| Children are mounted while the page is open or animating out, and
| unmounted afterwards, so their state resets every time.
|
*/

export function SlidePage({
  open,
  from = "right",
  background,
  zIndex = 100,
  children,
}) {
  const { rendered, shown } = useAnimatedMount(open, SLIDE_ANIMATION_MS);

  if (!rendered) {
    return null;
  }

  const hiddenOffset = from === "left" ? "-100%" : "100%";

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* Dims the page behind */}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black"
        style={{
          opacity: shown ? 0.35 : 0,
          transition: `opacity ${SLIDE_ANIMATION_MS}ms ease-out`,
        }}
      />

      <div
        className="absolute inset-0 flex flex-col overflow-hidden"
        style={{
          backgroundColor: background,
          transform: shown
            ? "translate3d(0, 0, 0)"
            : `translate3d(${hiddenOffset}, 0, 0)`,
          transition: `transform ${SLIDE_ANIMATION_MS}ms ${MOTION_EASING}`,
          boxShadow:
            from === "left"
              ? "12px 0 32px rgba(0,0,0,0.3)"
              : "-12px 0 32px rgba(0,0,0,0.3)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Floating Button (pops in)
|--------------------------------------------------------------------------
*/

export function FloatingButton({
  language,
  onClick,
  label,
  className = "",
  delay = 0,
  children,
}) {
  const entered = useEntered(delay);

  const isEnglish = language === "english";

  return (
    <div
      className={`fixed bottom-[14px] z-[70] ${
        isEnglish ? "right-[20px]" : "left-[20px]"
      }`}
      style={{
        transform: entered ? "scale(1)" : "scale(0)",
        opacity: entered ? 1 : 0,
        transition: `transform 300ms ${POP_EASING}, opacity 150ms ease-out`,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full text-white shadow-lg shadow-black/30 transition-transform duration-200 active:scale-95 ${className}`}
      >
        {children}
      </button>
    </div>
  );
}
