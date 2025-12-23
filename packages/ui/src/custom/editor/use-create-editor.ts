import { withProps } from "@udecode/cn";
import { TElement } from "@udecode/plate";
import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@udecode/plate-basic-marks/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@udecode/plate-code-block/react";
import { CommentsPlugin } from "@udecode/plate-comments/react";
import { DatePlugin } from "@udecode/plate-date/react";
import { EmojiInputPlugin } from "@udecode/plate-emoji/react";
import { ExcalidrawPlugin } from "@udecode/plate-excalidraw/react";
import { HEADING_KEYS } from "@udecode/plate-heading";
import { TocPlugin } from "@udecode/plate-heading/react";
import { HighlightPlugin } from "@udecode/plate-highlight/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { KbdPlugin } from "@udecode/plate-kbd/react";
import { ColumnItemPlugin, ColumnPlugin } from "@udecode/plate-layout/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import {
  EquationPlugin,
  InlineEquationPlugin,
} from "@udecode/plate-math/react";
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  VideoPlugin,
} from "@udecode/plate-media/react";
import {
  MentionInputPlugin,
  MentionPlugin,
} from "@udecode/plate-mention/react";
import { SlashInputPlugin } from "@udecode/plate-slash-command/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@udecode/plate-table/react";
import { TogglePlugin } from "@udecode/plate-toggle/react";
import {
  ParagraphPlugin,
  PlateLeaf,
  usePlateEditor,
} from "@udecode/plate/react";

import { editorPlugins } from "@adh/ui/custom/editor/plugins/editor-plugins";
import { FixedToolbarPlugin } from "@adh/ui/custom/editor/plugins/fixed-toolbar-plugin";
import { FloatingToolbarPlugin } from "@adh/ui/custom/editor/plugins/floating-toolbar-plugin";
import { BlockquoteElement } from "@adh/ui/plate-ui/blockquote-element";
import { CodeBlockElement } from "@adh/ui/plate-ui/code-block-element";
import { CodeLeaf } from "@adh/ui/plate-ui/code-leaf";
import { CodeLineElement } from "@adh/ui/plate-ui/code-line-element";
import { CodeSyntaxLeaf } from "@adh/ui/plate-ui/code-syntax-leaf";
import { ColumnElement } from "@adh/ui/plate-ui/column-element";
import { ColumnGroupElement } from "@adh/ui/plate-ui/column-group-element";
import { CommentLeaf } from "@adh/ui/plate-ui/comment-leaf";
import { DateElement } from "@adh/ui/plate-ui/date-element";
import { EmojiInputElement } from "@adh/ui/plate-ui/emoji-input-element";
import { EquationElement } from "@adh/ui/plate-ui/equation-element";
import { ExcalidrawElement } from "@adh/ui/plate-ui/excalidraw-element";
import { HeadingElement } from "@adh/ui/plate-ui/heading-element";
import { HighlightLeaf } from "@adh/ui/plate-ui/highlight-leaf";
import { HrElement } from "@adh/ui/plate-ui/hr-element";
import { ImageElement } from "@adh/ui/plate-ui/image-element";
import { InlineEquationElement } from "@adh/ui/plate-ui/inline-equation-element";
import { KbdLeaf } from "@adh/ui/plate-ui/kbd-leaf";
import { LinkElement } from "@adh/ui/plate-ui/link-element";
import { MediaAudioElement } from "@adh/ui/plate-ui/media-audio-element";
import { MediaEmbedElement } from "@adh/ui/plate-ui/media-embed-element";
import { MediaFileElement } from "@adh/ui/plate-ui/media-file-element";
import { MediaVideoElement } from "@adh/ui/plate-ui/media-video-element";
import { MentionElement } from "@adh/ui/plate-ui/mention-element";
import { MentionInputElement } from "@adh/ui/plate-ui/mention-input-element";
import { ParagraphElement } from "@adh/ui/plate-ui/paragraph-element";
import { withPlaceholders } from "@adh/ui/plate-ui/placeholder";
import { SlashInputElement } from "@adh/ui/plate-ui/slash-input-element";
import {
  TableCellElement,
  TableCellHeaderElement,
} from "@adh/ui/plate-ui/table-cell-element";
import { TableElement } from "@adh/ui/plate-ui/table-element";
import { TableRowElement } from "@adh/ui/plate-ui/table-row-element";
import { TocElement } from "@adh/ui/plate-ui/toc-element";
import { ToggleElement } from "@adh/ui/plate-ui/toggle-element";

export const useCreateEditor = ({ value }: { value: TElement[] }) => {
  return usePlateEditor({
    override: {
      components: withPlaceholders({
        [AudioPlugin.key]: MediaAudioElement,
        [BlockquotePlugin.key]: BlockquoteElement,
        [BoldPlugin.key]: withProps(PlateLeaf, { as: "strong" }),
        [CodeBlockPlugin.key]: CodeBlockElement,
        [CodeLinePlugin.key]: CodeLineElement,
        [CodePlugin.key]: CodeLeaf,
        [CodeSyntaxPlugin.key]: CodeSyntaxLeaf,
        [ColumnItemPlugin.key]: ColumnElement,
        [ColumnPlugin.key]: ColumnGroupElement,
        [CommentsPlugin.key]: CommentLeaf,
        [DatePlugin.key]: DateElement,
        [EmojiInputPlugin.key]: EmojiInputElement,
        [EquationPlugin.key]: EquationElement,
        [ExcalidrawPlugin.key]: ExcalidrawElement,
        [HEADING_KEYS.h1]: withProps(HeadingElement, { variant: "h1" }),
        [HEADING_KEYS.h2]: withProps(HeadingElement, { variant: "h2" }),
        [HEADING_KEYS.h3]: withProps(HeadingElement, { variant: "h3" }),
        [HEADING_KEYS.h4]: withProps(HeadingElement, { variant: "h4" }),
        [HEADING_KEYS.h5]: withProps(HeadingElement, { variant: "h5" }),
        [HEADING_KEYS.h6]: withProps(HeadingElement, { variant: "h6" }),
        [HighlightPlugin.key]: HighlightLeaf,
        [VideoPlugin.key]: MediaVideoElement,
        [FilePlugin.key]: MediaFileElement,
        [HorizontalRulePlugin.key]: HrElement,
        [ImagePlugin.key]: ImageElement,
        [MediaEmbedPlugin.key]: MediaEmbedElement,
        [InlineEquationPlugin.key]: InlineEquationElement,
        [ItalicPlugin.key]: withProps(PlateLeaf, { as: "em" }),
        [KbdPlugin.key]: KbdLeaf,
        [LinkPlugin.key]: LinkElement,
        [MentionInputPlugin.key]: MentionInputElement,
        [MentionPlugin.key]: MentionElement,
        [ParagraphPlugin.key]: ParagraphElement,
        [SlashInputPlugin.key]: SlashInputElement,
        [StrikethroughPlugin.key]: withProps(PlateLeaf, { as: "s" }),
        [SubscriptPlugin.key]: withProps(PlateLeaf, { as: "sub" }),
        [SuperscriptPlugin.key]: withProps(PlateLeaf, { as: "sup" }),
        [TableCellHeaderPlugin.key]: TableCellHeaderElement,
        [TableCellPlugin.key]: TableCellElement,
        [TablePlugin.key]: TableElement,
        [TableRowPlugin.key]: TableRowElement,
        [TocPlugin.key]: TocElement,
        [TogglePlugin.key]: ToggleElement,
        [UnderlinePlugin.key]: withProps(PlateLeaf, { as: "u" }),
      }),
    },
    plugins: [
      ...editorPlugins,
      FixedToolbarPlugin,
      FloatingToolbarPlugin,
      ImagePlugin,
    ],
    value,
  });
};
