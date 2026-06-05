// Hook: applies Monaco editor decorations for remote cursors (Controller layer)
import { useEffect } from "react";

export function useEditorDecorations({ editorRef, monacoRef, remoteCursors, decorationsRef }) {
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = [];

    Object.values(remoteCursors).forEach(({ line, column, selection }) => {
      if (!line || !column) return;

      // Cursor line decoration
      newDecorations.push({
        range: new monaco.Range(line, column, line, column + 1),
        options: {
          className: "remote-cursor-line",
          beforeContentClassName: "remote-cursor-caret",
          before: {
            content: " ",
            inlineClassName: "remote-cursor-caret",
          },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      });

      // Selection decoration
      if (
        selection &&
        (selection.startLine !== selection.endLine ||
          selection.startCol !== selection.endCol)
      ) {
        newDecorations.push({
          range: new monaco.Range(
            selection.startLine,
            selection.startCol,
            selection.endLine,
            selection.endCol
          ),
          options: {
            className: "remote-selection",
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        });
      }
    });

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [remoteCursors]);
}
