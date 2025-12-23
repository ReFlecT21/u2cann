// utils/slateToHtml.ts
import { TElement } from "@udecode/plate";

function slateToHtml(nodes: TElement[]): string {
  const serializeNode = (node: any): string => {
    if (node.text) {
      let text = node.text;
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      if (node.underline) text = `<u>${text}</u>`;
      if (node.strikethrough) text = `<s>${text}</s>`;
      return text;
    }

    const children = node.children.map(serializeNode).join("");

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
        return `<table border="1">${children}</table>`;
      case "tr":
        return `<tr>${children}</tr>`;
      case "td":
        return `<td>${children}</td>`;
      case "p":
      default:
        return `<p>${children}</p>`;
    }
  };

  return nodes.map(serializeNode).join("");
}

export { slateToHtml };
