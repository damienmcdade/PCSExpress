import UIKit
import PDFKit

/// Non-destructive extension on PDFExportService that adds a full
/// DD Form 1351-2-aligned export using the `DD1351_2_Voucher` data model.
///
/// Covers Block 15 (itinerary with official travel/stop codes) and
/// Block 18 (reimbursable expenses with ≥$75 receipt flags).
/// Self-contained — does not access private members of PDFExportService.
extension PDFExportService {

    // MARK: - Page constants (mirrored from PDFExportService private scope)

    private static let dd_pageW:  CGFloat = 612   // 8.5 in @ 72 dpi
    private static let dd_pageH:  CGFloat = 792   // 11 in  @ 72 dpi
    private static let dd_margin: CGFloat = 50

    // MARK: - Public entry point

    /// Generates a DD 1351-2-formatted PDF from a `DD1351_2_Voucher`.
    /// Returns the combined PDF data (expense table + itinerary appendix).
    static func exportDD1351_2(voucher: DD1351_2_Voucher) throws -> Data {
        // Build the base expense-table PDF using the existing VoucherHeader/MovingExpense API.
        let header = VoucherHeader(
            memberName:   voucher.travelerName,
            rank:         voucher.travelerPayGrade.displayName,
            ssn:          voucher.ssnLast4,
            unit:         "",
            fromStation:  voucher.itinerary.first?.location ?? "",
            toStation:    voucher.itinerary.last?.location  ?? "",
            ordersNumber: "",
            voucherDate:  Self.ddShortDate(Date())
        )

        let movingExpenses = voucher.expenses.map { item in
            MovingExpense(
                category:        "Expense",
                description:     item.description,
                amount:          item.amount,
                date:            Self.ddShortDate(item.date),
                receiptAttached: item.requiresReceipt
            )
        }

        let jsonData = try JSONEncoder().encode(movingExpenses)
        guard let jsonString = String(data: jsonData, encoding: .utf8) else {
            throw ExportError.jsonDecodingFailed("Expense serialization failed")
        }
        let basePDF = try exportToPDF(jsonExpenses: jsonString, header: header)

        return try Self.appendItineraryPage(to: basePDF, voucher: voucher)
    }

    // MARK: - Itinerary page

    private static func appendItineraryPage(to basePDF: Data,
                                             voucher: DD1351_2_Voucher) throws -> Data {
        guard let existingDoc = PDFDocument(data: basePDF) else {
            throw ExportError.renderFailed
        }

        let pageRect = CGRect(x: 0, y: 0, width: dd_pageW, height: dd_pageH)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)

        // Create the date formatter once per render pass rather than per leg.
        let legDateFormatter = DateFormatter()
        legDateFormatter.dateFormat = "MM/dd/yy"

        let appendData = renderer.pdfData { ctx in
            ctx.beginPage()
            var y = dd_margin

            y = dd_drawSectionHeader("DD FORM 1351-2 — BLOCK 15: ITINERARY", y: y)
            y = dd_drawCodeKey(y: y)
            y = dd_drawDivider(y: y)
            y = dd_drawItiColumnHeaders(y: y)
            y = dd_drawDivider(y: y)

            for leg in voucher.itinerary {
                if y > dd_pageH - dd_margin - 60 {
                    ctx.beginPage()
                    y = dd_margin
                    y = dd_drawItiColumnHeaders(y: y)
                    y = dd_drawDivider(y: y)
                }
                y = dd_drawItineraryLeg(leg, formatter: legDateFormatter, y: y)
            }

            y = dd_drawDivider(y: y)
            _ = dd_drawPaymentSummary(voucher, y: y)
        }

        guard let appendDoc = PDFDocument(data: appendData) else {
            throw ExportError.renderFailed
        }
        for i in 0..<appendDoc.pageCount {
            if let page = appendDoc.page(at: i) {
                existingDoc.insert(page, at: existingDoc.pageCount)
            }
        }
        guard let merged = existingDoc.dataRepresentation() else {
            throw ExportError.renderFailed
        }
        return merged
    }

    // MARK: - Drawing helpers

    @discardableResult
    private static func dd_drawSectionHeader(_ text: String, y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 12),
            .foregroundColor: UIColor.black,
        ]
        let w = (text as NSString).size(withAttributes: attr).width
        text.draw(at: CGPoint(x: dd_pageW / 2 - w / 2, y: y), withAttributes: attr)
        return y + 18
    }

    @discardableResult
    private static func dd_drawCodeKey(y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 8),
            .foregroundColor: UIColor.darkGray,
        ]
        "Mode: PA=Private Auto  CA=Commercial Auto  CP=Commercial Air  GP=Government Air"
            .draw(at: CGPoint(x: dd_margin, y: y), withAttributes: attr)
        "Stop: AD=Auth Delay  AT=Awaiting Trans  LV=Leave  MC=Mission Complete"
            .draw(at: CGPoint(x: dd_margin, y: y + 11), withAttributes: attr)
        return y + 24
    }

    @discardableResult
    private static func dd_drawDivider(y: CGFloat) -> CGFloat {
        UIColor.lightGray.setStroke()
        let path = UIBezierPath()
        path.move(to:    CGPoint(x: dd_margin,           y: y + 4))
        path.addLine(to: CGPoint(x: dd_pageW - dd_margin, y: y + 4))
        path.lineWidth = 0.5
        path.stroke()
        return y + 10
    }

    @discardableResult
    private static func dd_drawItiColumnHeaders(y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 8),
            .foregroundColor: UIColor.black,
        ]
        let c = dd_cols(y: y)
        "DATE".draw(in:     c.date,  withAttributes: attr)
        "LOCATION".draw(in: c.loc,   withAttributes: attr)
        "MODE".draw(in:     c.mode,  withAttributes: attr)
        "STOP".draw(in:     c.stop,  withAttributes: attr)
        "LODGING".draw(in:  c.lodge, withAttributes: attr)
        "POC MI".draw(in:   c.miles, withAttributes: attr)
        return y + 14
    }

    @discardableResult
    private static func dd_drawItineraryLeg(_ leg: DD1351_2_Voucher.TravelLeg,
                                             formatter: DateFormatter,
                                             y: CGFloat) -> CGFloat {
        let attr: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 8),
            .foregroundColor: UIColor.black,
        ]
        let boldAttr: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 8),
            .foregroundColor: UIColor.black,
        ]
        let c = dd_cols(y: y)

        formatter.string(from: leg.date).draw(in: c.date, withAttributes: attr)

        // Clip long location strings to column width.
        let ctx = UIGraphicsGetCurrentContext()
        ctx?.saveGState()
        ctx?.clip(to: c.loc)
        leg.location.draw(in: c.loc, withAttributes: attr)
        ctx?.restoreGState()

        leg.modeOfTravel.rawValue.draw(in:  c.mode, withAttributes: boldAttr)
        leg.reasonForStop.rawValue.draw(in: c.stop, withAttributes: boldAttr)

        if let lodge = leg.lodgingCost {
            String(format: "$%.0f", lodge).draw(in: c.lodge, withAttributes: attr)
        }
        if let mi = leg.pocMiles {
            "\(mi)".draw(in: c.miles, withAttributes: attr)
        }
        return y + 14
    }

    @discardableResult
    private static func dd_drawPaymentSummary(_ voucher: DD1351_2_Voucher,
                                               y: CGFloat) -> CGFloat {
        var yOff = y + 10
        let label: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 9),
            .foregroundColor: UIColor.darkGray,
        ]
        let value: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 9),
            .foregroundColor: UIColor.black,
        ]
        func row(_ l: String, _ v: String) {
            l.draw(at: CGPoint(x: dd_margin,       y: yOff), withAttributes: label)
            v.draw(at: CGPoint(x: dd_margin + 160, y: yOff), withAttributes: value)
            yOff += 14
        }
        row("PAYMENT MODE:",           voucher.paymentMode)
        row("TOTAL CLAIMED AMOUNT:",   String(format: "$%.2f", voucher.totalExpenses))
        if let split = voucher.splitDisbursementAmount {
            row("SPLIT DISBURSEMENT:", String(format: "$%.2f", split))
        }
        let receiptCount = voucher.expenses.filter(\.requiresReceipt).count
        row("ITEMS REQUIRING RECEIPT:", "\(receiptCount)")
        return yOff
    }

    // MARK: - Column layout

    private struct DD_Cols {
        let date, loc, mode, stop, lodge, miles: CGRect
    }

    private static func dd_cols(y: CGFloat) -> DD_Cols {
        let x0     = dd_margin
        let dateW:  CGFloat = 55
        let modeW:  CGFloat = 34
        let stopW:  CGFloat = 34
        let lodgeW: CGFloat = 50
        let milesW: CGFloat = 42
        let locW    = dd_pageW - dd_margin * 2 - dateW - modeW - stopW - lodgeW - milesW - 20

        return DD_Cols(
            date:  CGRect(x: x0,                                               y: y, width: dateW,  height: 13),
            loc:   CGRect(x: x0 + dateW + 4,                                  y: y, width: locW,   height: 13),
            mode:  CGRect(x: x0 + dateW + locW + 8,                           y: y, width: modeW,  height: 13),
            stop:  CGRect(x: x0 + dateW + locW + modeW + 12,                  y: y, width: stopW,  height: 13),
            lodge: CGRect(x: x0 + dateW + locW + modeW + stopW + 16,          y: y, width: lodgeW, height: 13),
            miles: CGRect(x: x0 + dateW + locW + modeW + stopW + lodgeW + 20, y: y, width: milesW, height: 13)
        )
    }

    // MARK: - Date utility

    private static func ddShortDate(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }
}
