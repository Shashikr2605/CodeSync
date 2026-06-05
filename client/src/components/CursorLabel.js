// Component: floating name tag above remote cursors (View layer)
import { useEffect, useState } from "react";

export default function CursorLabel({ cursor, editor, monaco }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!editor || !monaco || !cursor.line || !cursor.column) return;

    const updatePos = () => {
      try {
        const scrolledVisiblePos = editor.getScrolledVisiblePosition({
          lineNumber: cursor.line,
          column: cursor.column,
        });
        if (scrolledVisiblePos) setPos(scrolledVisiblePos);
      } catch (_) {}
    };

    updatePos();
    const disposable = editor.onDidScrollChange(updatePos);
    return () => disposable.dispose();
  }, [cursor.line, cursor.column, editor, monaco]);

  if (!pos) return null;

  return (
    <div
      className="cursor-label-overlay"
      style={{
        left: pos.left + 2,
        top: pos.top - 20,
        background: cursor.color,
        pointerEvents: "none",
        position: "absolute",
        zIndex: 100,
      }}
    >
      {cursor.username}
    </div>
  );
}
