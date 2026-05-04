import Capacitor
import UIKit

/// Capacitor plugin — exposes PDFExportService to the React web layer and
/// presents iOS share sheet so the user can save or send the generated PDF.
///
/// JavaScript usage:
///   import { Plugins } from '@capacitor/core';
///   const { PDFExportPlugin } = Plugins;
///
///   const result = await PDFExportPlugin.exportVoucher({
///     memberName:   'Smith, John A.',
///     rank:         'SSG',
///     ssn:          '1234',           // last 4 only
///     unit:         '2-502 IN, 101st ABN',
///     fromStation:  'Fort Bragg, NC',
///     toStation:    'Fort Campbell, KY',
///     ordersNumber: 'ORDERS 123-456',
///     voucherDate:  '2025-06-20',
///     expensesJson: '[{"category":"Mileage",...}]'
///   });
///   // result.saved === true when user completes the share sheet
@objc(PDFExportPlugin)
public class PDFExportPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier    = "PDFExportPlugin"
    public let jsName        = "PDFExportPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "exportVoucher",     returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "exportDD1351_2",    returnType: CAPPluginReturnPromise),
    ]

    @objc func exportVoucher(_ call: CAPPluginCall) {
        guard let memberName   = call.getString("memberName"),
              let rank         = call.getString("rank"),
              let ssn          = call.getString("ssn"),
              let unit         = call.getString("unit"),
              let fromStation  = call.getString("fromStation"),
              let toStation    = call.getString("toStation"),
              let ordersNumber = call.getString("ordersNumber"),
              let voucherDate  = call.getString("voucherDate"),
              let expensesJson = call.getString("expensesJson") else {
            call.reject("Missing required parameters")
            return
        }

        let header = PDFExportService.VoucherHeader(
            memberName:   memberName,
            rank:         rank,
            ssn:          ssn,
            unit:         unit,
            fromStation:  fromStation,
            toStation:    toStation,
            ordersNumber: ordersNumber,
            voucherDate:  voucherDate
        )

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let pdfData = try PDFExportService.exportToPDF(jsonExpenses: expensesJson,
                                                               header: header)

                // Write to a temp file so the share sheet can offer "Save to Files".
                let fileName = "TravelVoucher_\(ordersNumber.replacingOccurrences(of: " ", with: "_")).pdf"
                let tmpURL   = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
                try pdfData.write(to: tmpURL, options: .atomic)

                DispatchQueue.main.async {
                    self.presentShareSheet(for: tmpURL, call: call)
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // MARK: - Share sheet

    private func presentShareSheet(for url: URL, call: CAPPluginCall) {
        let ac = UIActivityViewController(activityItems: [url],
                                          applicationActivities: nil)

        // Exclude activities that don't make sense for a PDF voucher.
        ac.excludedActivityTypes = [
            .assignToContact,
            .addToReadingList,
            .postToFacebook,
            .postToTwitter,
        ]

        ac.completionWithItemsHandler = { _, completed, _, error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve(["saved": completed])
            }
        }

        // iPad requires a source view/barButton for the popover.
        // Use the web view bounds rather than the deprecated UIScreen.main.bounds.
        if let popover = ac.popoverPresentationController {
            let sourceView = self.bridge?.webView
            popover.sourceView = sourceView
            let bounds = sourceView?.bounds ?? CGRect(x: 0, y: 0, width: 600, height: 800)
            popover.sourceRect  = CGRect(x: bounds.midX, y: bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }

        self.bridge?.viewController?.present(ac, animated: true)
    }
}

// MARK: - DD 1351-2 Enhanced Export (non-destructive extension)

extension PDFExportPlugin {

    /// Generates a full DD Form 1351-2 PDF with itinerary legs and travel codes,
    /// then presents the iOS share sheet.
    ///
    /// JavaScript usage:
    ///   await PDFExportPlugin.exportDD1351_2({
    ///     travelerName:    'Smith, Jane A.',
    ///     travelerPayGrade: 'E-6',
    ///     ssnLast4:        '5678',
    ///     paymentMode:     'EFT',
    ///     itineraryJson:   '[{"date":"2025-06-15T12:00:00Z","location":"Fort Bragg, NC 28310",...}]',
    ///     expensesJson:    '[{"date":"2025-06-15T12:00:00Z","description":"Holiday Inn","amount":129.00}]'
    ///   });
    @objc func exportDD1351_2(_ call: CAPPluginCall) {
        guard let name      = call.getString("travelerName"),
              let gradeRaw  = call.getString("travelerPayGrade"),
              let grade     = PayGrade(normalizing: gradeRaw),
              let ssnLast4  = call.getString("ssnLast4"),
              let itiJson   = call.getString("itineraryJson"),
              let expJson   = call.getString("expensesJson") else {
            call.reject("Missing required parameters: travelerName, travelerPayGrade, ssnLast4, itineraryJson, expensesJson")
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let itinerary = try self.decodeLegs(from: itiJson)
                let expenses  = try self.decodeExpenses(from: expJson)

                let voucher = DD1351_2_Voucher(
                    splitDisbursementAmount: call.getDouble("splitDisbursementAmount"),
                    travelerName:     name,
                    travelerPayGrade: grade,
                    ssnLast4:         ssnLast4,
                    itinerary:        itinerary,
                    expenses:         expenses
                )

                let pdfData  = try PDFExportService.exportDD1351_2(voucher: voucher)
                let fileName = "DD1351-2_\(name.replacingOccurrences(of: " ", with: "_")).pdf"
                let tmpURL   = FileManager.default.temporaryDirectory
                                   .appendingPathComponent(fileName)
                try pdfData.write(to: tmpURL, options: .atomic)

                DispatchQueue.main.async {
                    self.presentShareSheet(for: tmpURL, call: call)
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    // MARK: - JSON Decoders

    private func decodeLegs(from json: String) throws -> [DD1351_2_Voucher.TravelLeg] {
        guard let data = json.data(using: .utf8) else {
            throw PDFExportService.ExportError.jsonDecodingFailed("Invalid UTF-8 in itineraryJson")
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        do {
            return try decoder.decode([DD1351_2_Voucher.TravelLeg].self, from: data)
        } catch {
            throw PDFExportService.ExportError.jsonDecodingFailed(error.localizedDescription)
        }
    }

    private func decodeExpenses(from json: String) throws -> [DD1351_2_Voucher.ExpenseItem] {
        guard let data = json.data(using: .utf8) else {
            throw PDFExportService.ExportError.jsonDecodingFailed("Invalid UTF-8 in expensesJson")
        }
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        do {
            return try decoder.decode([DD1351_2_Voucher.ExpenseItem].self, from: data)
        } catch {
            throw PDFExportService.ExportError.jsonDecodingFailed(error.localizedDescription)
        }
    }
}
