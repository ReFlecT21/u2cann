import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { translateText } from "~/components/translateText"; // adjust path if needed
// @ts-ignore
import * as fontkit from "fontkit";
import fs from "fs";
import path from "path";



async function translateInvoiceContentToJapanese(invoice: any) {
  const translated = { ...invoice };

  if (translated.description && typeof translated.description === "string") {
    translated.description = await translateText(translated.description, "ja");
  }

  return translated;
}


export async function GenerateENInvoice(invoiceData: {
  type: "en";
  payeeInfo: {
    name: string;
    address: string;
    bankName: string;
    accountNumber: string;
    phoneNumber: string;
  };
  lineItems: {
    no: string;
    description: string;
    currency: string;
    total: string;
  };
  name: string;
  paymentTerms: string;
  invoiceNumber: string;
  date: string;
  status: string;
}): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  // Add a new page to the document
  const page = pdfDoc.addPage([595.28, 841.89]);

  // Get the standard font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set drawing parameters
  const { width, height } = page.getSize();
  const margin = 50;

  // Add static text elements
  page.drawText("INVOICE", {
    x: width - margin - 100,
    y: height - margin,
    size: 20,
    font: helveticaBold,
  });

  // Add form fields
  const form = pdfDoc.getForm();

  // Company Information Section
  page.drawText("Name:", {
    x: margin,
    y: height - margin,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("Address:", {
    x: margin,
    y: height - margin - 20,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("Phone:", {
    x: margin,
    y: height - margin - 80,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for company info
  const nameField = form.createTextField("name");
  nameField.setText(invoiceData.name || "oops");
  nameField.addToPage(page, {
    x: margin + 40,
    y: height - margin - 5,
    width: 150,
    height: 15,
    borderWidth: 0,
  });
  nameField.enableReadOnly();

  // Draw the address text
  page.drawText(invoiceData.payeeInfo.address || "", {
    x: margin + 40,
    y: height - margin - 20,
    size: 10, // Adjust text size as needed
    color: rgb(0, 0, 0), // Adjust text color (black in this case)
    maxWidth: 225, // Optionally set a max width for the text
  });

  const phoneField = form.createTextField("phone");
  phoneField.setText(invoiceData.payeeInfo.phoneNumber);
  phoneField.addToPage(page, {
    x: margin + 40,
    y: height - margin - 85,
    width: 150,
    height: 15,
    borderWidth: 0,
  });
  phoneField.enableReadOnly();

  // Invoice Details Section
  page.drawText("DATE:", {
    x: width - margin - 200,
    y: height - margin - 50,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("INVOICE #:", {
    x: width - margin - 200,
    y: height - margin - 65,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("PAYMENT TERMS:", {
    x: width - margin - 200,
    y: height - margin - 80,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for invoice details
  const dateField = form.createTextField("date");
  dateField.setText(invoiceData.date || "");
  dateField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 55,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  dateField.enableReadOnly();

  const invoiceNumberField = form.createTextField("invoiceNumber");
  invoiceNumberField.setText(invoiceData.invoiceNumber || "");
  invoiceNumberField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 70,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  invoiceNumberField.enableReadOnly();

  const paymentTermsField = form.createTextField("paymentTerms");
  paymentTermsField.setText(invoiceData.paymentTerms);
  paymentTermsField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 85,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  paymentTermsField.enableReadOnly();

  // Bill To Section
  const billToY = height - margin - 150;
  page.drawRectangle({
    x: margin,
    y: billToY,
    width: (1 / 4) * width,
    height: 15,
    color: rgb(0, 0, 0.5),
  });

  page.drawText("BILL TO:", {
    x: margin + 5,
    y: billToY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  const billToAddress = `Asia Deal Hub\n12 Marina Boulevard\nMarina Bay Financial Center Tower 3 #17-01,\nSingapore 018982`; // Replace with actual address
  page.drawText(billToAddress, {
    x: margin,
    y: billToY - 17,
    size: 8,
    font: helveticaFont,
    lineHeight: 12,
  });

  // Items Table
  const tableY = billToY - 120;
  page.drawRectangle({
    x: margin,
    y: tableY,
    width: width - margin * 2,
    height: 15,
    color: rgb(0, 0, 0.5),
  });

  page.drawRectangle({
    x: margin + 1,
    y: tableY - 30,
    width: width - margin * 2 - 2,
    height: 30,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: undefined,
  });

  // Table Headers
  page.drawText("No #", {
    x: margin + 10,
    y: tableY + 5,
    size: 10,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("DESCRIPTION", {
    x: margin + 70,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("TOTAL", {
    x: width - margin - 70,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  // Item number
  page.drawText("1", {
    x: margin + 15,
    y: tableY - 17,
    size: 10,
    font: helveticaFont,
  });

  // Description field
  const descField = form.createTextField(`description`);
  descField.setText(invoiceData.lineItems.description || "");
  descField.addToPage(page, {
    x: margin + 70,
    y: tableY - 20,
    width: width - margin - 180,
    height: 15,
    borderWidth: 0,
  });
  descField.enableReadOnly();

  // Total field
  const totalField = form.createTextField(`total`);
  totalField.setText(
    invoiceData.lineItems.currency + " " + invoiceData.lineItems.total || "",
  );
  totalField.addToPage(page, {
    x: width - margin - 70,
    y: tableY - 20,
    width: 65,
    height: 15,
    borderWidth: 0,
  });

  totalField.enableReadOnly();

  // Payment Details
  const paymentY = tableY - 120;
  page.drawRectangle({
    x: margin,
    y: paymentY - 5,
    width: (1 / 2) * width,
    height: 15,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText("For payment, please pay to below account:", {
    x: margin,
    y: paymentY,
    size: 10,
    font: helveticaBold,
  });

  page.drawText("Name:", {
    x: margin,
    y: paymentY - 20,
    size: 10,
    font: helveticaFont,
  });

  page.drawText("Bank Name:", {
    x: margin,
    y: paymentY - 40,
    size: 10,
    font: helveticaFont,
  });

  page.drawText("Account Number:", {
    x: margin,
    y: paymentY - 60,
    size: 10,
    font: helveticaFont,
  });

  // Bank details fields

  const accountNameField = form.createTextField("accountName");
  accountNameField.setText(invoiceData.payeeInfo.name || "");
  accountNameField.addToPage(page, {
    x: margin + 80,
    y: paymentY - 25,
    width: (1 / 2) * width - 80,
    height: 15,
    borderWidth: 0,
  });

  accountNameField.enableReadOnly();

  const bankNameField = form.createTextField("bankName");
  bankNameField.setText(invoiceData.payeeInfo.bankName || "");
  bankNameField.addToPage(page, {
    x: margin + 80,
    y: paymentY - 45,
    width: (1 / 2) * width - 80,
    height: 15,
    borderWidth: 0,
  });
  bankNameField.enableReadOnly();

  const accountNumberField = form.createTextField("accountNumber");
  accountNumberField.setText(invoiceData.payeeInfo.accountNumber || "");
  accountNumberField.addToPage(page, {
    x: margin + 80,
    y: paymentY - 65,
    width: (1 / 2) * width - 80,
    height: 15,
    borderWidth: 0,
  });
  accountNumberField.enableReadOnly();

  // Total Section
  page.drawText("TOTAL", {
    x: width - margin - 150,
    y: paymentY + 50,
    size: 12,
    font: helveticaBold,
  });

  const totalAmountField = form.createTextField("totalAmount");
  totalAmountField.setText(
    invoiceData.lineItems.currency + " " + invoiceData.lineItems.total || "",
  );
  totalAmountField.addToPage(page, {
    x: width - margin - 100,
    y: paymentY + 45,
    width: 80,
    height: 20,
    borderWidth: 0,
  });

  totalAmountField.enableReadOnly();

  // Footer
  // Define the footer text
  const footerText =
    "This is a computer-generated invoice and no signature is required";

  // Measure the width of the footer text
  const textWidth = helveticaFont.widthOfTextAtSize(footerText, 8);

  // Calculate the x-coordinate to center the text
  const x = (width - textWidth) / 2;

  // Draw the footer text
  page.drawText(footerText, {
    x: x,
    y: margin,
    size: 8,
    font: helveticaFont,
  });

  const pdfBytes = await pdfDoc.save();

  // Convert buffer to base64
  const pdfBuffer = Buffer.from(pdfBytes);
  const pdfBase64 = pdfBuffer.toString("base64");

  // Return the PDF as a base64 string
  return pdfBase64;
}

export async function GenerateJPInvoice(invoiceData: {
  type: "jp";
  payeeInfo: {
    name: string;
    address: string;
    accountType: string;
    accountNumber: string;
    accountName: string;
    phoneNumber: string;
  };
  lineItems: {
    description: string;
    unitPrice: string;
    volume: string;
    currency: string;
    amount: string;
  };
  name: string;
  paymentTerms: string;
  invoiceNumber: string;
  date: string;
  status: string;
}): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Add a new page to the document
  const page = pdfDoc.addPage([595.28, 841.89]);

  const fontPath = path.resolve(process.cwd(), "public", "fonts", "NotoSansJP-Regular.otf");
  const fontBytes = fs.readFileSync(fontPath);

  const helveticaFont = await pdfDoc.embedFont(fontBytes);
  const helveticaBold = helveticaFont; // reuse for bold if needed


  // Set drawing parameters
  const { width, height } = page.getSize();
  const margin = 50;

  // Add static text elements
  // Measure text width
  const text = "請求書";
  const invoiceWidth = helveticaBold.widthOfTextAtSize(text, 20);

  // Center align text
  page.drawText(text, {
    x: (width - invoiceWidth) / 2, // Centered horizontally
    y: height - margin, // Position from top
    size: 20,
    font: helveticaBold,
  });

  // Add form fields
  const form = pdfDoc.getForm();

  // Company Information Section
  page.drawText("名前：", {
    x: width - margin - 200,
    y: height - margin - 30,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("住所：", {
    x: width - margin - 200,
    y: height - margin - 50,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("電話番号：", {
    x: width - margin - 200,
    y: height - margin - 110,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for company info
  const nameField = form.createTextField("name");
  nameField.setText(invoiceData.name);
  nameField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 35,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  nameField.enableReadOnly();

  page.drawText(invoiceData.payeeInfo.address || "", {
    x: width - margin - 120,
    y: height - margin - 50,
    size: 10, // Adjust text size as needed
    color: rgb(0, 0, 0), // Adjust text color (black in this case)
    maxWidth: 225, // Optionally set a max width for the text
  });

  const phoneField = form.createTextField("phone");
  phoneField.setText(invoiceData.payeeInfo.phoneNumber);
  phoneField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 115,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  phoneField.enableReadOnly();

  // Invoice Details Section
  page.drawText("請求書番号：", {
    x: width - margin - 200,
    y: height - margin - 250,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("請求日：", {
    x: width - margin - 200,
    y: height - margin - 265,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("支払い条件：", {
    x: width - margin - 200,
    y: height - margin - 280,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for invoice details
  const invoiceNumberField = form.createTextField("invoiceNumber");
  invoiceNumberField.setText(invoiceData.invoiceNumber);
  invoiceNumberField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 255,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  invoiceNumberField.enableReadOnly();

  const dateField = form.createTextField("date");
  dateField.setText(invoiceData.date);
  dateField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 270,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  dateField.enableReadOnly();

  const paymentTermsField = form.createTextField("paymentTerms");
  paymentTermsField.setText(invoiceData.paymentTerms);
  paymentTermsField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 285,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  paymentTermsField.enableReadOnly();

  // Bill To Section
  const billToY = height - margin - 50;
  page.drawRectangle({
    x: margin,
    y: billToY,
    width: (1 / 4) * width,
    height: 15,
    color: rgb(1, 0.92, 0.92),
  });

  page.drawText("請求先：", {
    x: margin + 5,
    y: billToY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  const billToAddress = `Asia Deal Hub\n12 Marina Boulevard\nMarina Bay Financial Center Tower 3 #17-01,\nSingapore 018982`; // Replace with actual address
  page.drawText(billToAddress, {
    x: margin,
    y: billToY - 17,
    size: 8,
    font: helveticaFont,
    lineHeight: 12,
  });

  // Items Table
  const tableY = height - margin - 350;
  page.drawRectangle({
    x: margin,
    y: tableY,
    width: width - margin * 2,
    height: 15,
    color: rgb(1, 0.92, 0.92),
  });

  page.drawRectangle({
    x: margin + 1,
    y: tableY - 30,
    width: width - margin * 2 - 2,
    height: 45,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: undefined,
  });

  // Table Headers
  page.drawText("番号", {
    x: margin + 10,
    y: tableY + 5,
    size: 10,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("内容", {
    x: margin + 70,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("合計", {
    x: width - margin - 70,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // Item number
  page.drawText("1", {
    x: margin + 15,
    y: tableY - 17,
    size: 10,
    font: helveticaFont,
  });

  // Description field
  const descField = form.createTextField(`description`);
  descField.setText(invoiceData.lineItems.description);
  descField.addToPage(page, {
    x: margin + 70,
    y: tableY - 20,
    width: width - margin - 180,
    height: 15,
    borderWidth: 0,
  });

  descField.enableReadOnly();

  // Total field
  const totalField = form.createTextField(`total`);
  totalField.setText(
    `${invoiceData.lineItems.currency} ${invoiceData.lineItems.amount}`,
  );
  totalField.addToPage(page, {
    x: width - margin - 70,
    y: tableY - 20,
    width: 65,
    height: 15,
    borderWidth: 0,
  });

  totalField.enableReadOnly();

  // Payment Details
  const paymentY = height - margin - 155;
  page.drawRectangle({
    x: width - margin - 210,
    y: paymentY - 70,
    width: 200,
    height: 80,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: undefined,
  });
  page.drawText("【受取人】", {
    x: width - margin - 120,
    y: paymentY,
    size: 8,
    font: helveticaBold,
  });

  page.drawText("口座種別：", {
    x: width - margin - 200,
    y: paymentY - 20,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("口座番号：", {
    x: width - margin - 200,
    y: paymentY - 40,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("口座名義：", {
    x: width - margin - 200,
    y: paymentY - 60,
    size: 8,
    font: helveticaFont,
  });

  // Bank details fields

  const accountNameField = form.createTextField("accountType");
  accountNameField.setText(invoiceData.payeeInfo.accountType);
  accountNameField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 25,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  accountNameField.enableReadOnly();

  const bankNameField = form.createTextField("accountNumber");
  bankNameField.setText(invoiceData.payeeInfo.accountNumber);
  bankNameField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 45,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  bankNameField.enableReadOnly();

  const accountNumberField = form.createTextField("accountName");
  accountNumberField.setText(invoiceData.payeeInfo.accountName);
  accountNumberField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 65,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  accountNumberField.enableReadOnly();

  // Total Section
  page.drawText("以下の通りご請求申し上げます。", {
    x: margin,
    y: height - margin - 255,
    size: 8,
    font: helveticaBold,
  });
  page.drawRectangle({
    x: margin,
    y: height - margin - 290,
    width: 185,
    height: 30,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: rgb(1, 0.92, 0.92),
  });
  page.drawText("請求金額：", {
    x: margin + 4,
    y: height - margin - 280,
    size: 12,
    font: helveticaBold,
  });

  const totalAmountField = form.createTextField("totalAmount");
  totalAmountField.setText(
    `${invoiceData.lineItems.currency} ${invoiceData.lineItems.amount}`,
  );
  totalAmountField.addToPage(page, {
    x: margin + 100,
    y: height - margin - 285,
    width: 80,
    height: 20,
    borderWidth: 0,
  });

  totalAmountField.enableReadOnly();

  // Footer
  // Define the footer text
  const footerText =
    "備考 - 振込手数料は貴社負担でお願いいたします。";

  // Measure the width of the footer text
  const textWidth = helveticaFont.widthOfTextAtSize(footerText, 8);

  // Calculate the x-coordinate to center the text
  const x = (width - textWidth) / 2;

  // Draw the footer text
  page.drawText(footerText, {
    x: x,
    y: margin + 300,
    size: 8,
    font: helveticaFont,
  });

  const pdfBytes = await pdfDoc.save();

  // Return the PDF as a base64 string
  const pdfBuffer = Buffer.from(pdfBytes);
  const pdfBase64 = pdfBuffer.toString("base64");

  return pdfBase64;
}
export async function GenerateJPCorpInvoice(invoiceData: {
  type: "jp2";
  payeeInfo: {
    name: string;
    email?: string;
    address: string;
    accountType: string;
    accountNumber: string;
    accountName: string;
    phoneNumber: string;
  };
  lineItems: {
    description: string;
    unitPrice: string;
    volume: string;
    currency: string;
    amount: string;
  };
  name: string;

  paymentTerms: string;
  invoiceNumber: string;
  date: string;
  status: string;
}): Promise<string> {
  const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

  // Add a new page to the document
  const page = pdfDoc.addPage([595.28, 841.89]);

  // Get the standard font
  const fontPath = path.resolve(process.cwd(), "public", "fonts", "NotoSansJP-Regular.otf");
  const fontBytes = fs.readFileSync(fontPath);

  const helveticaFont = await pdfDoc.embedFont(fontBytes);
  const helveticaBold = helveticaFont; // reuse for bold if needed

  // Set drawing parameters
  const { width, height } = page.getSize();
  const margin = 50;

  // Add static text elements
  // Measure text width
  const text = "請求書";
  const invoiceWidth = helveticaBold.widthOfTextAtSize(text, 20);

  // Center align text
  page.drawText(text, {
    x: (width - invoiceWidth) / 2, // Centered horizontally
    y: height - margin, // Position from top
    size: 20,
    font: helveticaBold,
  });

  // Add form fields
  const form = pdfDoc.getForm();

  // Company Information Section
  page.drawText("	法人名:", {
    x: width - margin - 200,
    y: height - margin - 30,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("	電話番号:", {
    x: width - margin - 200,
    y: height - margin - 90,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("メールアドレス:", {
    x: width - margin - 200,
    y: height - margin - 110,
    size: 8,
    font: helveticaFont,
  });
  page.drawText("担当者名:", {
    x: width - margin - 200,
    y: height - margin - 130,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for company info
  const corpField = form.createTextField("corpField");
  corpField.setText("");
  corpField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 35,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  const phoneField = form.createTextField("phone");
  phoneField.setText("");
  phoneField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 95,
    width: 100,
    height: 15,
    borderWidth: 0,
  });
  phoneField.enableReadOnly();

  const emailField = form.createTextField("emailField");
  emailField.setText(invoiceData.payeeInfo.email || "");
  emailField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 115,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  emailField.enableReadOnly();
  const picField = form.createTextField("picField");
  picField.setText(invoiceData.payeeInfo.name || "");
  picField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 135,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  picField.enableReadOnly();
  // Invoice Details Section
  page.drawText("	登録番号:", {
    x: width - margin - 200,
    y: height - margin - 245,
    size: 8,
    font: helveticaFont,
  });
  page.drawText("請求書番号.:", {
    x: width - margin - 200,
    y: height - margin - 260,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("請求日:", {
    x: width - margin - 200,
    y: height - margin - 275,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("	支払い条件:", {
    x: width - margin - 200,
    y: height - margin - 290,
    size: 8,
    font: helveticaFont,
  });

  // Create form fields for invoice details
  const registrationNumberField = form.createTextField("registrationNumber");
  registrationNumberField.setText("");
  registrationNumberField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 250,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  const invoiceNumberField = form.createTextField("invoiceNumber");
  invoiceNumberField.setText(invoiceData.invoiceNumber);
  invoiceNumberField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 265,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  invoiceNumberField.enableReadOnly();

  const dateField = form.createTextField("date");
  dateField.setText(invoiceData.date);
  dateField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 280,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  dateField.enableReadOnly();

  const paymentTermsField = form.createTextField("paymentTerms");
  paymentTermsField.setText(invoiceData.paymentTerms);
  paymentTermsField.addToPage(page, {
    x: width - margin - 120,
    y: height - margin - 295,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  paymentTermsField.enableReadOnly();

  // Bill To Section
  const billToY = height - margin - 50;
  page.drawRectangle({
    x: margin,
    y: billToY,
    width: (1 / 4) * width,
    height: 15,
    color: rgb(1, 0.92, 0.92),
  });

  page.drawText("	請求先:", {
    x: margin + 5,
    y: billToY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  const billToAddress = `Asia Deal Hub\n12 Marina Boulevard\nMarina Bay Financial Center Tower 3 #17-01,\nSingapore 018982`; // Replace with actual address
  page.drawText(billToAddress, {
    x: margin,
    y: billToY - 17,
    size: 8,
    font: helveticaFont,
    lineHeight: 12,
  });

  // Items Table
  const tableY = height - margin - 350;
  page.drawRectangle({
    x: margin,
    y: tableY,
    width: width - margin * 2,
    height: 15,
    color: rgb(1, 0.92, 0.92),
  });

  page.drawRectangle({
    x: margin + 1,
    y: tableY - 30,
    width: width - margin * 2 - 2,
    height: 45,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: undefined,
  });

  // Table Headers
  page.drawText("	プロジェクト実施日", {
    x: margin + 10,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("内容", {
    x: margin + 90,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  page.drawText("合計", {
    x: width - margin - 70,
    y: tableY + 5,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  // date of project field
  const dopField = form.createTextField(`dopField`);
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;
  dopField.setText(formattedDate);
  dopField.addToPage(page, {
    x: margin + 10,
    y: tableY - 20,
    width: width - margin - 180,
    height: 15,
    borderWidth: 0,
  });
  dopField.enableReadOnly();
  // Description field
  const descField = form.createTextField(`description`);
  descField.setText(invoiceData.lineItems.description);
  descField.addToPage(page, {
    x: margin + 90,
    y: tableY - 20,
    width: width - margin - 180,
    height: 15,
    borderWidth: 0,
  });
  descField.enableReadOnly();

  // Total field
  const totalField = form.createTextField(`total`);
  totalField.setText(
    `${invoiceData.lineItems.currency} ${invoiceData.lineItems.amount}`,
  );
  totalField.addToPage(page, {
    x: width - margin - 70,
    y: tableY - 20,
    width: 65,
    height: 15,
    borderWidth: 0,
  });

  totalField.enableReadOnly();

  // cost field
  page.drawText("合計金額（税抜）:", {
    x: margin,
    y: height - margin - 410,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  page.drawText("合計金額（10％消費税込）:", {
    x: margin,
    y: height - margin - 425,
    size: 8,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  const amountBTField = form.createTextField("amountBTField ");
  amountBTField.setText(
    `${invoiceData.lineItems.currency} ${invoiceData.lineItems.amount}`,
  );
  amountBTField.addToPage(page, {
    x: margin + 115,
    y: height - margin - 415,
    width: 100,
    height: 15,
    borderWidth: 1,
  });

  amountBTField.enableReadOnly();
  const amountATField = form.createTextField("amountATField");
  amountATField.setText(
    `${invoiceData.lineItems.currency} ${(parseFloat(invoiceData.lineItems.amount) * 1.1).toFixed(2)}`,
  );
  amountATField.addToPage(page, {
    x: margin + 115,
    y: height - margin - 430,
    width: 100,
    height: 15,
    borderWidth: 1,
  });
  amountATField.enableReadOnly();
  // Payment Details
  const paymentY = height - margin - 155;
  page.drawRectangle({
    x: width - margin - 210,
    y: paymentY - 70,
    width: 200,
    height: 80,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: undefined,
  });
  page.drawText("[受取人]", {
    x: width - margin - 120,
    y: paymentY,
    size: 8,
    font: helveticaBold,
  });

  page.drawText("口座種別:", {
    x: width - margin - 200,
    y: paymentY - 20,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("口座番号:", {
    x: width - margin - 200,
    y: paymentY - 40,
    size: 8,
    font: helveticaFont,
  });

  page.drawText("	口座名義:", {
    x: width - margin - 200,
    y: paymentY - 60,
    size: 8,
    font: helveticaFont,
  });

  // Bank details fields

  const accountNameField = form.createTextField("accountType");
  accountNameField.setText(invoiceData.payeeInfo.accountType);
  accountNameField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 25,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  accountNameField.enableReadOnly();

  const bankNameField = form.createTextField("accountNumber");
  bankNameField.setText(invoiceData.payeeInfo.accountNumber);
  bankNameField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 45,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  bankNameField.enableReadOnly();

  const accountNumberField = form.createTextField("accountName");
  accountNumberField.setText(invoiceData.payeeInfo.accountName);
  accountNumberField.addToPage(page, {
    x: width - margin - 120,
    y: paymentY - 65,
    width: 100,
    height: 15,
    borderWidth: 0,
  });

  accountNumberField.enableReadOnly();

  // Total Section
  page.drawText("以下の通りご請求申し上げます", {
    x: margin,
    y: height - margin - 255,
    size: 8,
    font: helveticaBold,
  });
  page.drawRectangle({
    x: margin,
    y: height - margin - 290,
    width: 250,
    height: 30,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    color: rgb(1, 0.92, 0.92),
  });
  page.drawText("請求金額（税込", {
    x: margin + 4,
    y: height - margin - 280,
    size: 10,
    font: helveticaBold,
  });

  const totalAmountField = form.createTextField("totalAmount");
  totalAmountField.setText(
    `${invoiceData.lineItems.currency} ${invoiceData.lineItems.amount}`,
  );
  totalAmountField.addToPage(page, {
    x: margin + 150,
    y: height - margin - 285,
    width: 80,
    height: 20,
    borderWidth: 0,
  });

  totalAmountField.enableReadOnly();

  // Footer
  // Define the footer text
  const footerText =
    "備考 - 振込手数料は貴社負担でお願いいたします.";

  // Measure the width of the footer text
  const textWidth = helveticaFont.widthOfTextAtSize(footerText, 8);

  // Calculate the x-coordinate to center the text
  const x = (width - textWidth) / 2;

  // Draw the footer text
  page.drawText(footerText, {
    x: x,
    y: margin + 290,
    size: 8,
    font: helveticaFont,
  });

  const pdfBytes = await pdfDoc.save();

  // Return the PDF as a base64 string
  const pdfBuffer = Buffer.from(pdfBytes);
  const pdfBase64 = pdfBuffer.toString("base64");

  return pdfBase64;
}
