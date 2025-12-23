import { TElement } from "@udecode/plate";

function slateToHtml(nodes: TElement[]): string {
  const serializeNode = (node: any): string => {
    if (node.text) {
      let text = node.text;
      if (node.bold) text = `<strong style="font-size: 14px;">${text}</strong>`;
      if (node.italic) text = `<em style="font-size: 14px;">${text}</em>`;
      if (node.underline) text = `<u style="font-size: 14px;">${text}</u>`;
      if (node.strikethrough) text = `<s style="font-size: 14px;">${text}</s>`;
      return `<span style="font-size: 14px;">${text}</span>`;
    }
    console.log("hi", node.children);
    const children = Array.isArray(node.children)
      ? node.children.map(serializeNode).join("")
      : "";
    switch (node.type) {
      case "h1":
        return `<h1>${children}</h1>`;
      case "h2":
        return `<h2>${children}</h2>`;
      case "h3":
        return `<h3>${children}</h3>`;
      case "blockquote":
        return `<blockquote>${children}</blockquote>`;
      case "table":
        return `<table style="border-collapse: collapse; border: 1px solid #ccc; width: 100%; table-layout: fixed; word-wrap: break-word;">${children}</table>`;
      case "tr":
        return `<tr style="border: 1px solid #ccc;">${children}</tr>`;
      case "td":
        return `<td style="border: 1px solid #ccc; padding: 8px;">${children}</td>`;
      case "p":
      default:
        return `<p style="margin: 0 0 1em 0; font-size: 14px; text-align: justify;">${children}</p>`;
    }
  };

  return `<div style="padding: 0 100px;">${nodes.map(serializeNode).join("")}</div>`;
}

export { slateToHtml };
