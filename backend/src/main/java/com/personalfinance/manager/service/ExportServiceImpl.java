package com.personalfinance.manager.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.personalfinance.manager.dto.TransactionDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExportServiceImpl implements ExportService {

    private final TransactionService transactionService;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ExportServiceImpl(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Override
    public byte[] exportTransactionsToExcel() {
        List<TransactionDTO> transactions = transactionService.getAllTransactions();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transactions");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Columns
            String[] columns = {"ID", "Date", "Description", "Type", "Category", "Amount", "From Account", "To Account"};

            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int col = 0; col < columns.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(columns[col]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowIdx = 1;
            for (TransactionDTO t : transactions) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getDate().format(DATE_FORMATTER));
                row.createCell(2).setCellValue(t.getDescription() != null ? t.getDescription() : "");
                row.createCell(3).setCellValue(t.getType().toString());
                row.createCell(4).setCellValue(t.getCategoryName());
                row.createCell(5).setCellValue(t.getAmount().doubleValue());
                row.createCell(6).setCellValue(t.getFromAccountName() != null ? t.getFromAccountName() : "");
                row.createCell(7).setCellValue(t.getToAccountName() != null ? t.getToAccountName() : "");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Failed to export transactions to Excel: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] exportTransactionsToPdf() {
        List<TransactionDTO> transactions = transactionService.getAllTransactions();
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

            // Title
            Paragraph title = new Paragraph("Personal Finance Manager - Transactions Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table setup (7 columns)
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100f);
            table.setWidths(new float[]{1.8f, 2.2f, 1.2f, 1.8f, 1.2f, 1.8f, 1.8f});

            // Headers
            String[] headers = {"Date", "Description", "Type", "Category", "Amount", "From", "To"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
                cell.setPadding(6);
                table.addCell(cell);
            }

            // Data Cells
            for (TransactionDTO t : transactions) {
                table.addCell(new PdfPCell(new Phrase(t.getDate().format(DATE_FORMATTER), cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getDescription() != null ? t.getDescription() : "", cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getType().toString(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getCategoryName(), cellFont)));
                table.addCell(new PdfPCell(new Phrase("$" + t.getAmount().toString(), cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getFromAccountName() != null ? t.getFromAccountName() : "-", cellFont)));
                table.addCell(new PdfPCell(new Phrase(t.getToAccountName() != null ? t.getToAccountName() : "-", cellFont)));
            }

            document.add(table);
            document.close();

            return out.toByteArray();

        } catch (DocumentException e) {
            throw new RuntimeException("Failed to export transactions to PDF: " + e.getMessage(), e);
        }
    }
}
