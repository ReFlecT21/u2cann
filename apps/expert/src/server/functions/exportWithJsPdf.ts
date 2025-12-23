// utils/exportWithJsPdf.ts
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const exportHtmlToPdf = async (
  html: string,
  fileName = "contract.pdf",
) => {
  // Create a hidden container
  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "800px"; // give it width to simulate real render
  document.body.appendChild(container);

  // Render container as image using html2canvas
  const canvas = await html2canvas(container);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const ratio = canvas.width / canvas.height;

  const imgWidth = pageWidth;
  const imgHeight = pageWidth / ratio;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(fileName);

  document.body.removeChild(container);
};
