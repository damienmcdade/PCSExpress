import UIKit
import PDFKit

/// Generates a DoD-style travel voucher PDF from a JSON moving-expense list.
///
/// Input JSON shape (array of MovingExpense):
/// [
///   { "category": "Mileage", "description": "POV — Fort Bragg to Fort Campbell",
///     "amount": 412.50, "date": "2025-06-15", "receiptAttached": true },
///   { "category": "Lodging", "description": "Holiday Inn — night 1",
///     "amount": 129.00, "date": "2025-06-15", "receiptAttached": true },
///   ...
/// ]
final class PDFExportService {

    // MARK: - Public types

    struct MovingExpense: Codable {
        let category: String
        let description: String
        let amount: Double
        let date: String           // ISO 8601 date string YYYY-MM-DD
        let receiptAttached: Bool
    }

    struct VoucherHeader {
        var memberName:   String
        var rank:         String
        var ssn:          String    // last 4 only
        var unit:         String
        var fromStation:  String
        var toStation:    String
        var ordersNumber: String
        var voucherDate:  String
    }

    enum ExportError: LocalizedError {
        case jsonDecodingFailed(String)
        case renderFailed

        var errorDescription: String? {
            switch self {
            case .jsonDecodingFailed(let msg): return "JSON decode error: \(msg)"
            case .renderFailed:                return "PDF rendering failed."
            }
        }
    }

    // MARK: - Public API

    /// Creates a PDF from a JSON string of `[MovingExpense]` and a header struct.
    /// Returns the PDF as Data which can be saved, shared, or written to disk.
    static func exportToPDF(jsonExpenses: String,
                            header: VoucherHeader) throws -> Data {
        guard let jsonData = jsonExpenses.data(using: .utf8) else {
            throw ExportError.jsonDecodingFailed("Could not convert string to UTF-8 data")
        }
        let expenses: [MovingExpense]
        do {
            expenses = try JSONDecoder().decode([MovingExpense].self, from: jsonData)
        } catch {
            throw ExportError.jsonDecodingFailed(error.localizedDescription)
        }

        return try renderPDF(header: header, expenses: expenses)
    }

    // MARK: - Rendering

    private static let pageW: CGFloat  = 612   // 8.5 in @ 72 dpi
    private static let pageH: CGFloat  = 792   // 11 in  @ 72 dpi
    private static let margin: CGFloat = 50

    private static func renderPDF(header: VoucherHeader,
                                  expenses: [MovingExpense]) throws -> Data {
        let pageRect = CGRect(x: 0, y: 0, width: pageW, height: pageH)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        let data = renderer.pdfData { ctx in
            var yOffset: CGFloat = margin

            // --- Page 1 ---
            ctx.beginPage()
            yOffset = drawHeader(header: header, y: yOffset)
            yOffset = drawDivider(y: yOffset)
            yOffset = drawTableHeader(y: yOffset)
            yOffset = drawDivider(y: yOffset)

            for expense in expenses {
                // Start a new page if we're near the bottom.
                if yOffset > pageH - margin - 80 {
                    ctx.beginPage()
                    yOffset = margin
                    yOffset = drawTableHeader(y: yOffset)
                    yOffset = drawDivider(y: yOffset)
                }
                yOffset = drawExpenseRow(expense: expense, y: yOffset)
            }

            yOffset = drawDivider(y: yOffset)
            yOffset = drawTotals(expenses: expenses, y: yOffset)
            yOffset = drawDivider(y: yOffset)
            _ = drawSignatureBlock(header: header, y: yOffset)
        }

        return data
    }

    // MARK: - Drawing helpers

    private static func drawHeader(header: VoucherHeader, y: CGFloat) -> CGFloat {
        var yOffset = y

        // Title block
        let titleAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 14),
            .foregroundColor: UIColor.black
        ]
        let subtitleAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 10),
            .foregroundColor: UIColor.darkGray
        ]

        let title = "DEPARTMENT OF DEFENSE"
        title.draw(at: CGPoint(x: pageW / 2 - textWidth(title, font: UIFont.boldSystemFont(ofSize: 14)) / 2,
                               y: yOffset), withAttributes: titleAttr)
        yOffset += 18

        let subtitle = "TRAVEL VOUCHER / SUBVOUCHER (DD Form 1351-2)"
        subtitle.draw(at: CGPoint(x: pageW / 2 - textWidth(subtitle, font: UIFont.systemFont(ofSize: 10)) / 2,
                                  y: yOffset), withAttributes: subtitleAttr)
        yOffset += 22

        // Two-column info grid
        let labelAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 9),
            .foregroundColor: UIColor.gray
        ]
        let valueAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 10),
            .foregroundColor: UIColor.black
        ]

        let leftX  = margin
        let rightX = pageW / 2 + 10
        let colW   = pageW / 2 - margin - 10

        let fields: [(String, String, String, String)] = [
            ("MEMBER NAME",   header.memberName,   "RANK / GRADE",    header.rank),
            ("SSN (LAST 4)",  "XXX-XX-\(header.ssn)", "VOUCHER DATE", header.voucherDate),
            ("UNIT / ORG",    header.unit,          "ORDERS NUMBER",  header.ordersNumber),
            ("FROM STATION",  header.fromStation,   "TO STATION",     header.toStation),
        ]

        for (lLabel, lValue, rLabel, rValue) in fields {
            lLabel.draw(at: CGPoint(x: leftX, y: yOffset),  withAttributes: labelAttr)
            rLabel.draw(at: CGPoint(x: rightX, y: yOffset), withAttributes: labelAttr)
            yOffset += 12
            drawClippedText(lValue, in: CGRect(x: leftX, y: yOffset, width: colW, height: 14),
                            attributes: valueAttr)
            drawClippedText(rValue, in: CGRect(x: rightX, y: yOffset, width: colW, height: 14),
                            attributes: valueAttr)
            yOffset += 18
        }

        return yOffset
    }

    private static func drawTableHeader(y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 9),
            .foregroundColor: UIColor.black
        ]
        let cols = columnRects()
        drawText("DATE",        in: cols.date,    attributes: attr)
        drawText("CATEGORY",    in: cols.cat,     attributes: attr)
        drawText("DESCRIPTION", in: cols.desc,    attributes: attr)
        drawText("RECEIPT",     in: cols.receipt, attributes: attr)
        drawText("AMOUNT",      in: cols.amount,  attributes: attr, rightAlign: true)
        return y + 16
    }

    private static func drawExpenseRow(expense: MovingExpense, y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 9),
            .foregroundColor: UIColor.black
        ]
        let cols = columnRects(y: y)
        drawText(expense.date,        in: cols.date,    attributes: attr)
        drawText(expense.category,    in: cols.cat,     attributes: attr)
        drawClippedText(expense.description, in: cols.desc, attributes: attr)
        drawText(expense.receiptAttached ? "Yes" : "No", in: cols.receipt, attributes: attr)
        let amtStr = String(format: "$%.2f", expense.amount)
        drawText(amtStr, in: cols.amount, attributes: attr, rightAlign: true)
        return y + 16
    }

    private static func drawTotals(expenses: [MovingExpense], y: CGFloat) -> CGFloat {
        var yOffset = y + 6
        let total = expenses.reduce(0) { $0 + $1.amount }

        let labelAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 10),
            .foregroundColor: UIColor.black
        ]
        let valueAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 10),
            .foregroundColor: UIColor.black
        ]

        let label = "TOTAL CLAIMED AMOUNT:"
        let value = String(format: "$%.2f", total)
        label.draw(at: CGPoint(x: pageW - margin - 220, y: yOffset), withAttributes: labelAttr)
        let valueW = textWidth(value, font: UIFont.boldSystemFont(ofSize: 10))
        value.draw(at: CGPoint(x: pageW - margin - valueW, y: yOffset), withAttributes: valueAttr)
        yOffset += 20

        let itemCount = "\(expenses.count) line item(s)"
        let countAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 9),
            .foregroundColor: UIColor.gray
        ]
        itemCount.draw(at: CGPoint(x: pageW - margin - 220, y: yOffset), withAttributes: countAttr)
        return yOffset + 16
    }

    private static func drawSignatureBlock(header: VoucherHeader, y: CGFloat) -> CGFloat {
        var yOffset = y + 20
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 9),
            .foregroundColor: UIColor.darkGray
        ]
        let bold: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 9),
            .foregroundColor: UIColor.black
        ]

        "MEMBER SIGNATURE:".draw(at: CGPoint(x: margin, y: yOffset), withAttributes: bold)
        drawLine(from: CGPoint(x: margin + 140, y: yOffset + 10),
                 to:   CGPoint(x: margin + 340, y: yOffset + 10))

        "DATE:".draw(at: CGPoint(x: margin + 360, y: yOffset), withAttributes: bold)
        drawLine(from: CGPoint(x: margin + 395, y: yOffset + 10),
                 to:   CGPoint(x: pageW - margin, y: yOffset + 10))
        yOffset += 30

        let disclaimer = "I certify that this voucher is true and correct to the best of my knowledge and that payment has not been received."
        let paraStyle = NSMutableParagraphStyle()
        paraStyle.lineBreakMode = .byWordWrapping
        let disclaimerAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.italicSystemFont(ofSize: 8),
            .foregroundColor: UIColor.gray,
            .paragraphStyle: paraStyle
        ]
        let disclaimerRect = CGRect(x: margin, y: yOffset,
                                    width: pageW - margin * 2, height: 30)
        disclaimer.draw(in: disclaimerRect, withAttributes: disclaimerAttr)
        yOffset += 35

        "CERTIFYING OFFICIAL:".draw(at: CGPoint(x: margin, y: yOffset), withAttributes: bold)
        drawLine(from: CGPoint(x: margin + 150, y: yOffset + 10),
                 to:   CGPoint(x: margin + 350, y: yOffset + 10))
        "TITLE:".draw(at: CGPoint(x: margin + 370, y: yOffset), withAttributes: bold)
        drawLine(from: CGPoint(x: margin + 402, y: yOffset + 10),
                 to:   CGPoint(x: pageW - margin, y: yOffset + 10))
        yOffset += 30

        // Footer
        let footer = "Generated by PCS Express · \(header.voucherDate)"
        footer.draw(at: CGPoint(x: margin, y: pageH - margin + 5), withAttributes: attr)

        return yOffset
    }

    // MARK: - Column layout

    private struct ColumnLayout {
        let date, cat, desc, receipt, amount: CGRect
    }

    private static func columnRects(y: CGFloat = 0) -> ColumnLayout {
        let x0      = margin
        let dateW:    CGFloat = 60
        let catW:     CGFloat = 75
        let receiptW: CGFloat = 42
        let amountW:  CGFloat = 60
        let descW     = pageW - margin * 2 - dateW - catW - receiptW - amountW - 12
        return ColumnLayout(
            date:    CGRect(x: x0,                           y: y, width: dateW,    height: 14),
            cat:     CGRect(x: x0 + dateW + 3,              y: y, width: catW,     height: 14),
            desc:    CGRect(x: x0 + dateW + catW + 6,       y: y, width: descW,    height: 14),
            receipt: CGRect(x: x0 + dateW + catW + descW + 9, y: y, width: receiptW, height: 14),
            amount:  CGRect(x: pageW - margin - amountW,    y: y, width: amountW,  height: 14)
        )
    }

    // MARK: - Graphics utilities

    private static func drawDivider(y: CGFloat) -> CGFloat {
        UIColor.lightGray.setStroke()
        let path = UIBezierPath()
        path.move(to:    CGPoint(x: margin, y: y + 4))
        path.addLine(to: CGPoint(x: pageW - margin, y: y + 4))
        path.lineWidth = 0.5
        path.stroke()
        return y + 10
    }

    private static func drawLine(from: CGPoint, to: CGPoint) {
        UIColor.darkGray.setStroke()
        let path = UIBezierPath()
        path.move(to: from)
        path.addLine(to: to)
        path.lineWidth = 0.5
        path.stroke()
    }

    private static func drawText(_ text: String,
                                  in rect: CGRect,
                                  attributes: [NSAttributedString.Key: Any],
                                  rightAlign: Bool = false) {
        var attr = attributes
        if rightAlign {
            let para = NSMutableParagraphStyle()
            para.alignment = .right
            attr[.paragraphStyle] = para
        }
        text.draw(in: rect, withAttributes: attr)
    }

    private static func drawClippedText(_ text: String,
                                         in rect: CGRect,
                                         attributes: [NSAttributedString.Key: Any]) {
        let context = UIGraphicsGetCurrentContext()
        context?.saveGState()
        context?.clip(to: rect)
        text.draw(in: rect, withAttributes: attributes)
        context?.restoreGState()
    }

    private static func textWidth(_ text: String, font: UIFont) -> CGFloat {
        (text as NSString).size(withAttributes: [.font: font]).width
    }
}
