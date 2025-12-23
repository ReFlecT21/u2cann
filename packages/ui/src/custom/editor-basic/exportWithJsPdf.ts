import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportHtmlToPdf = async (
  html: string,
  fileName = "contract.pdf",
) => {
  const splitHtml = html.split("<table");
  const hasTable = splitHtml.length > 1;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const safeMargin = 20;
  const printableHeight = pdfHeight - 2 * safeMargin;

  const renderToCanvasAndPdf = async (
    content: string,
    forceNewPage = false,
  ) => {
    const container = document.createElement("div");
    container.innerHTML = content;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px";
    document.body.appendChild(container);

    const canvas = await html2canvas(container);
    document.body.removeChild(container);

    let position = 0;
    while (position < canvas.height) {
      const pageCanvas = document.createElement("canvas");
      const pageHeightPx = (printableHeight * canvas.width) / pdfWidth;
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.min(canvas.height - position, pageHeightPx);

      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          position,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height,
        );
        const imgData = pageCanvas.toDataURL("image/png");
        const imgDisplayHeight = (pageCanvas.height * pdfWidth) / canvas.width;
        if (forceNewPage || position > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, safeMargin, pdfWidth, imgDisplayHeight);
      }

      position += pageCanvas.height;
    }
  };

  if (hasTable) {
    const paddedLastSection = `<div style="padding: 0 100px;">${"<table" + splitHtml[1]}</div>`;
    await renderToCanvasAndPdf(splitHtml[0] || "");
    await renderToCanvasAndPdf(paddedLastSection, true);
  } else {
    const paddedHtml = `<div style="padding: 0 100px;">${html}</div>`;
    await renderToCanvasAndPdf(paddedHtml);
  }

  pdf.save(fileName);
};
