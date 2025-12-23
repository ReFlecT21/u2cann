"use client";

import React from "react";
import { Value } from "@udecode/plate";
import { Plate } from "@udecode/plate/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { useCreateEditor } from "@adh/ui/custom/editor/use-create-editor";
import { Editor, EditorContainer } from "@adh/ui/plate-ui/editor";

interface PlateEditorProps {
  value: Value;
  onChange: (value: Value) => void;
  readOnly?: boolean;
}

export function PlateEditor({ value, onChange, readOnly }: PlateEditorProps) {
  const editor = useCreateEditor({ value });

  return (
    <DndProvider backend={HTML5Backend}>
      <Plate
        editor={editor}
        onChange={({ value }) => {
          onChange(value);
        }}
        readOnly={readOnly}
      >
        <EditorContainer className="rounded-lg border">
          <Editor variant="demo" />
        </EditorContainer>
      </Plate>
    </DndProvider>
  );
}
