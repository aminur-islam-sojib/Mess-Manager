import type { MealMember } from "@/types/MealManagementTypes";

type MealReportSummaryItem = {
  label: string;
  value: string;
};

type MealReportPdfOptions = {
  title: string;
  periodLabel: string;
  messName: string;
  summary: MealReportSummaryItem[];
  members: MealMember[];
  filename: string;
  costPerMeal?: number;
};

const PDF_MARGIN_X = 36;
const PDF_HEADER_HEIGHT = 112;
const PDF_SUMMARY_Y = 132;
const PDF_SUMMARY_HEIGHT = 58;

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const sanitizeFilename = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, "-");

export async function downloadMealReportPdf({
  title,
  periodLabel,
  messName,
  summary,
  members,
  filename,
  costPerMeal,
}: MealReportPdfOptions) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable = autoTableModule.default;
  const generatedAt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const summaryItems = summary.slice(0, 4);
  const showCostColumn =
    typeof costPerMeal === "number" &&
    Number.isFinite(costPerMeal) &&
    costPerMeal > 0;

  const drawHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, PDF_HEADER_HEIGHT, "F");

    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - 174, 28, 138, 24, 12, 12, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Meal Report PDF", pageWidth - 105, 44, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(title, PDF_MARGIN_X, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(periodLabel, PDF_MARGIN_X, 82);
    doc.text(`${messName} - Generated ${generatedAt}`, PDF_MARGIN_X, 98);
  };

  const drawFooter = (pageNumber: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(
      PDF_MARGIN_X,
      pageHeight - 26,
      pageWidth - PDF_MARGIN_X,
      pageHeight - 26,
    );

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(messName, PDF_MARGIN_X, pageHeight - 10);
    doc.text(`Page ${pageNumber}`, pageWidth - PDF_MARGIN_X, pageHeight - 10, {
      align: "right",
    });
  };

  const drawSummaryCards = () => {
    if (!summaryItems.length) return;

    const gap = 10;
    const cardWidth =
      (pageWidth - PDF_MARGIN_X * 2 - gap * (summaryItems.length - 1)) /
      summaryItems.length;

    summaryItems.forEach((item, index) => {
      const x = PDF_MARGIN_X + index * (cardWidth + gap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(
        x,
        PDF_SUMMARY_Y,
        cardWidth,
        PDF_SUMMARY_HEIGHT,
        14,
        14,
        "FD",
      );

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(item.label.toUpperCase(), x + 12, PDF_SUMMARY_Y + 18);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const valueLines = doc.splitTextToSize(item.value, cardWidth - 24);
      doc.text(valueLines, x + 12, PDF_SUMMARY_Y + 38);
    });
  };

  const body = members.length
    ? members.map((member, index) => ({
        rank: `#${index + 1}`,
        name: member.name,
        email: member.email ?? "-",
        breakfast: String(member.breakfast),
        lunch: String(member.lunch),
        dinner: String(member.dinner),
        totalMeals: String(member.totalMeals),
        estimatedCost: showCostColumn
          ? formatCurrency(member.totalMeals * (costPerMeal ?? 0))
          : "",
      }))
    : [
        {
          rank: "-",
          name: "No member data available",
          email: "-",
          breakfast: "-",
          lunch: "-",
          dinner: "-",
          totalMeals: "-",
          estimatedCost: "-",
        },
      ];

  const columns = [
    { header: "Rank", dataKey: "rank" },
    { header: "Member", dataKey: "name" },
    { header: "Email", dataKey: "email" },
    { header: "Breakfast", dataKey: "breakfast" },
    { header: "Lunch", dataKey: "lunch" },
    { header: "Dinner", dataKey: "dinner" },
    { header: "Total Meals", dataKey: "totalMeals" },
    ...(showCostColumn
      ? [{ header: "Est. Cost", dataKey: "estimatedCost" as const }]
      : []),
  ];

  const columnStyles: Record<
    number,
    { halign: "left" | "center" | "right"; cellWidth: number | "auto" }
  > = {
    0: { halign: "center", cellWidth: 56 },
    1: { halign: "left", cellWidth: 120 },
    2: { halign: "left", cellWidth: 180 },
    3: { halign: "center", cellWidth: 68 },
    4: { halign: "center", cellWidth: 56 },
    5: { halign: "center", cellWidth: 56 },
    6: { halign: "center", cellWidth: 78 },
  };

  if (showCostColumn) {
    columnStyles[7] = { halign: "right", cellWidth: 90 };
  }

  autoTable(doc, {
    startY: PDF_SUMMARY_Y + PDF_SUMMARY_HEIGHT + 22,
    margin: {
      top: PDF_SUMMARY_Y + PDF_SUMMARY_HEIGHT + 22,
      right: PDF_MARGIN_X,
      bottom: 38,
      left: PDF_MARGIN_X,
    },
    columns,
    body,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [30, 41, 59],
      halign: "center",
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8.5,
      cellPadding: 7,
      lineColor: [226, 232, 240],
      overflow: "linebreak",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didDrawPage: (hookData) => {
      drawHeader();
      drawFooter(hookData.pageNumber);

      if (hookData.pageNumber === 1) {
        drawSummaryCards();
      }
    },
  });

  doc.save(sanitizeFilename(filename));
}
