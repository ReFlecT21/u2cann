"use client";

import { withProps } from "@udecode/cn";
import { TElement } from "@udecode/plate";
import { BasicElementsPlugin } from "@udecode/plate-basic-elements/react";
import {
  BasicMarksPlugin,
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { ImagePlugin, MediaEmbedPlugin } from "@udecode/plate-media/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@udecode/plate-table/react";
import {
  ParagraphPlugin,
  PlateElement,
  PlateLeaf,
  usePlateEditor,
} from "@udecode/plate/react";

import { ImageElement } from "@adh/ui/plate-ui/image-element";
import { MediaEmbedElement } from "@adh/ui/plate-ui/media-embed-element";
import {
  TableCellElement,
  TableCellHeaderElement,
} from "@adh/ui/plate-ui/table-cell-element";
import { TableElement } from "@adh/ui/plate-ui/table-element";
import { TableRowElement } from "@adh/ui/plate-ui/table-row-element";

export const useCreateEditor = ({ value }: { value: TElement[] }) => {
  return usePlateEditor({
    override: {
      components: {
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
        [ParagraphPlugin.key]: withProps(PlateElement, {
          as: "p",
          className: "mb-4",
        }),
        [TableCellHeaderPlugin.key]: TableCellHeaderElement,
        [TableCellPlugin.key]: TableCellElement,
        [TablePlugin.key]: TableElement,
        [TableRowPlugin.key]: TableRowElement,
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
        blockquote: withProps(PlateElement, {
          as: "blockquote",
          className: "mb-4 border-l-4 border-[#d0d7de] pl-4 text-[#636c76]",
        }),
        h1: withProps(PlateElement, {
          as: "h1",
          className:
            "mb-4 mt-6 text-3xl font-semibold tracking-tight lg:text-4xl",
        }),
        h2: withProps(PlateElement, {
          as: "h2",
          className: "mb-4 mt-6 text-2xl font-semibold tracking-tight",
        }),
        h3: withProps(PlateElement, {
          as: "h3",
          className: "mb-4 mt-6 text-xl font-semibold tracking-tight",
        }),
        [ImagePlugin.key]: ImageElement,
        [MediaEmbedPlugin.key]: MediaEmbedElement,
      },
    },
    plugins: [
      BasicElementsPlugin,
      BasicMarksPlugin,
      TableCellHeaderPlugin,
      TableCellPlugin,
      TablePlugin,
      TableRowPlugin,
      ImagePlugin,
    ],
    value: value,
  });
};
