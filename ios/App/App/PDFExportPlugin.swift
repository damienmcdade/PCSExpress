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
        CAPPluginMethod(name: "exportVoucher", returnType: CAPPluginReturnPromise),
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
        if let popover = ac.popoverPresentationController {
            popover.sourceView  = self.bridge?.webView
            popover.sourceRect  = CGRect(x: UIScreen.main.bounds.midX,
                                         y: UIScreen.main.bounds.midY,
                                         width: 0, height: 0)
            popover.permittedArrowDirections = []
        }

        self.bridge?.viewController?.present(ac, animated: true)
    }
}
