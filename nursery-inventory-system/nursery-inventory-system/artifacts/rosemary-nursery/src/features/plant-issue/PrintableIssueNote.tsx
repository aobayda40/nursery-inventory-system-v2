import { PlantIssue } from "@workspace/api-client-react";
import { formatCurrency } from "@/features/production/utils";

interface PrintableIssueNoteProps {
  issue: PlantIssue;
}

export function PrintableIssueNote({ issue }: PrintableIssueNoteProps) {
  const hasPlants = issue.lines && issue.lines.length > 0;
  const hasMaterials = issue.materialLines && issue.materialLines.length > 0;

  const grandTotalValue = issue.totalValue + issue.totalMaterialValue;
  const grandTotalQty = issue.totalQuantity + issue.totalMaterialQuantity;

  return (
    <div className="print-area bg-white text-black max-w-3xl mx-auto p-10 border rounded-md shadow-sm print:shadow-none print:border-none print:p-0">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-6 mb-6">
        <div>
          {/* Company Logo placeholder — rendered as text; replace with <img> when logo asset is available */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2 border border-gray-200">
            <span className="text-green-700 font-bold text-xs text-center leading-tight px-1">🌿</span>
          </div>
          <h1 className="text-2xl font-serif font-semibold">Rosemary Nursery</h1>
          <p className="text-sm text-gray-500 mt-0.5">Rosemary Contracting Company</p>
          <p className="text-xs text-gray-400 mt-0.5">Plant &amp; Material Issue Voucher</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Issue No.</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{issue.issueNumber}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(issue.issueDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Project & Personnel Info */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Project</p>
          <p className="font-semibold">{issue.project.projectCode} — {issue.project.projectName}</p>
          <p className="text-gray-600">{issue.project.clientName}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Requested By</p>
            <p className="font-medium">{issue.requestedBy}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Issued By</p>
            <p className="font-medium">{issue.issuedBy}</p>
          </div>
        </div>
      </div>

      {/* Plants Section */}
      {hasPlants && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 border-b pb-1">
            Plants
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2 pr-2 font-semibold">Plant</th>
                <th className="py-2 pr-2 font-semibold">Batch</th>
                <th className="py-2 pr-2 font-semibold">Pot Size</th>
                <th className="py-2 pr-2 text-right font-semibold">Qty</th>
                <th className="py-2 pr-2 text-right font-semibold">Unit Cost</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {issue.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{line.plant.commonName}</div>
                    <div className="text-xs text-gray-500">{line.plant.botanicalName}</div>
                  </td>
                  <td className="py-2 pr-2">
                    {line.batchNumber}
                    <div className="text-xs text-gray-500">
                      {line.batchSource === "PURCHASE" ? "Purchased" : "Produced"}
                    </div>
                  </td>
                  <td className="py-2 pr-2">{line.potSize}</td>
                  <td className="py-2 pr-2 text-right">{line.issueQuantity}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(line.costPerPlant)}</td>
                  <td className="py-2 text-right">{formatCurrency(line.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-gray-300">
                <td className="py-2" colSpan={3}>Plants Subtotal</td>
                <td className="py-2 text-right">{issue.totalQuantity}</td>
                <td />
                <td className="py-2 text-right">{formatCurrency(issue.totalValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Materials Section */}
      {hasMaterials && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 border-b pb-1">
            Materials
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-left">
                <th className="py-2 pr-2 font-semibold">Material</th>
                <th className="py-2 pr-2 font-semibold">Purchase Lot</th>
                <th className="py-2 pr-2 font-semibold">Location</th>
                <th className="py-2 pr-2 text-right font-semibold">Qty</th>
                <th className="py-2 pr-2 font-semibold">Unit</th>
                <th className="py-2 pr-2 text-right font-semibold">Unit Cost</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {issue.materialLines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{line.material.name}</div>
                    <div className="text-xs text-gray-500">{line.material.category}</div>
                  </td>
                  <td className="py-2 pr-2 font-mono text-xs">{line.purchaseNumber}</td>
                  <td className="py-2 pr-2 text-gray-600">{line.stockLocation}</td>
                  <td className="py-2 pr-2 text-right">{Number(line.issueQuantity).toFixed(2)}</td>
                  <td className="py-2 pr-2 text-gray-600">{line.unit}</td>
                  <td className="py-2 pr-2 text-right">{formatCurrency(line.unitCost)}</td>
                  <td className="py-2 text-right">{formatCurrency(line.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold border-t border-gray-300">
                <td className="py-2" colSpan={3}>Materials Subtotal</td>
                <td className="py-2 text-right">{Number(issue.totalMaterialQuantity).toFixed(2)}</td>
                <td />
                <td />
                <td className="py-2 text-right">{formatCurrency(issue.totalMaterialValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Grand Total */}
      <div className="border-t-2 border-gray-800 pt-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold text-base">Grand Total</span>
          <div className="text-right">
            <span className="font-bold text-lg">{formatCurrency(grandTotalValue)}</span>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {issue.remarks && (
        <div className="mb-8 text-sm">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Remarks</p>
          <p className="text-gray-700">{issue.remarks}</p>
        </div>
      )}

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-16 text-sm">
        <div>
          <div className="border-t border-gray-400 pt-3 text-center">
            <p className="text-gray-500">Issued By</p>
            <p className="font-medium mt-1">{issue.issuedBy}</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-3 text-center">
            <p className="text-gray-500">Approved By</p>
            <p className="font-medium mt-1">&nbsp;</p>
          </div>
        </div>
        <div>
          <div className="border-t border-gray-400 pt-3 text-center">
            <p className="text-gray-500">Received By</p>
            <p className="font-medium mt-1">&nbsp;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
