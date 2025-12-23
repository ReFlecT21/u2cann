"use client";

import { useEffect } from "react";
import { Value } from "@udecode/plate";
import { Plate } from "@udecode/plate/react";

import { useCreateEditor } from "@adh/ui/custom/editor-basic/use-create-editor";
import { Editor, EditorContainer } from "@adh/ui/plate-ui/editor";

import { exportHtmlToPdf } from "./exportWithJsPdf";
import { slateToHtml } from "./slateToHtml";

export function PlateEditor({ value }: { value: Value }) {
  const editor = useCreateEditor({ value });

  useEffect(() => {
    editor.tf.setValue(value);
  }, [editor.tf, value]);

  const handleDownload = async () => {
    const html = slateToHtml(editor.children);
    await exportHtmlToPdf(html, "contract.pdf");
  };

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button
          onClick={handleDownload}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
        >
          Download PDF
        </button>
      </div>
      <Plate editor={editor} readOnly={true}>
        <EditorContainer className="rounded-lg border">
          <Editor variant="demo" placeholder="Type..." />
        </EditorContainer>
      </Plate>
    </div>
  );
}
