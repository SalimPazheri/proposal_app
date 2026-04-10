import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer { id: string; company_name: string; }
interface Agreement { id: string; agreement_number: string; }

interface CargoRow {
  id: string;
  commodity: string;
  packing_type: string;
  no_of_packages: string;
  gross_weight: string;
  net_weight: string;
  volume_cbm: string;
  condition_on_receipt: string;
  storage_location: string;
}

interface GRNFull {
  id: string;
  grn_number: string;
  customer_id: string;
  agreement_id: string | null;
  received_date: string;
  vehicle_no: string;
  driver_name: string;
  received_by: string;
  remarks: string;
  status: string;
  created_at: string;
  customers?: { company_name: string };
  storage_grn_items?: any[];
}

type LookupMap = Record<string, string[]>;
const AUTOCOMPLETE_COLS = ["commodity", "packing_type", "condition_on_receipt", "storage_location"] as const;
type AutocompleteColumn = typeof AUTOCOMPLETE_COLS[number];

const emptyRow = (): CargoRow => ({
  id: crypto.randomUUID(),
  commodity: "", packing_type: "", no_of_packages: "",
  gross_weight: "", net_weight: "", volume_cbm: "",
  condition_on_receipt: "", storage_location: "",
});

const STATUS_OPTIONS = ["In Storage", "Partially Released", "Released"];

// ─── Copy GRN to clipboard ────────────────────────────────────────────────────

const copyGRNToClipboard = async (grn: GRNFull) => {
  const items = grn.storage_grn_items || [];
  const date = new Date(grn.received_date).toLocaleDateString("en-GB");
  const createdAt = new Date(grn.created_at).toLocaleDateString("en-GB");
  const customerName = grn.customers?.company_name || "—";

  const itemRows = items.map((item: any, i: number) => `
    <tr>
      <td style="border:1px solid #000;padding:4px 8px;text-align:center;">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px 8px;">${item.commodity || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;">${item.packing_type || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${item.no_of_packages ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${item.gross_weight ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${item.net_weight ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${item.volume_cbm ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;">${item.condition_on_receipt || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;">${item.storage_location || "—"}</td>
    </tr>`).join("");

  const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
  const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
  const total_net = items.reduce((s: number, i: any) => s + (Number(i.net_weight) || 0), 0);
  const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

  const htmlContent = `
<div style="font-family:'Calibri',Calibri,sans-serif;font-size:12px;max-width:900px;margin-top:30mm;">
  <h2 style="margin:0 0 8px;font-size:12px;color:#1e293b;font-family:'Calibri',Calibri,sans-serif;">Goods Receipt Note</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:12px;font-family:Calibri,sans-serif;">
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;width:140px;">GRN Number</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${grn.grn_number}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;width:140px;">Date</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${date}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Customer</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${customerName}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Status</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${grn.status}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Vehicle No.</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${grn.vehicle_no || "—"}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Driver</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${grn.driver_name || "—"}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Received By</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${grn.received_by || "—"}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Printed On</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${createdAt}</td>
    </tr>
    ${grn.remarks ? `<tr><td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Remarks</td><td colspan="3" style="padding:3px 8px;border:1px solid #ccc;">${grn.remarks}</td></tr>` : ""}
  </table>

  <h3 style="margin:0 0 6px;font-size:12px;color:#1e293b;font-family:'Calibri',Calibri,sans-serif;">Cargo Details</h3>
  <table style="border-collapse:collapse;width:100%;font-size:12px;font-family:Calibri,sans-serif;">
    <thead>
      <tr style="background:#e3f2fd;">
        <th style="border:1px solid #000;padding:4px 8px;text-align:center;">#</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:left;">Commodity</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:left;">Packing Type</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">No. of Pkgs</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Gross Wt (kg)</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Net Wt (kg)</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Vol (CBM)</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:left;">Condition</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:left;">Storage Location</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      <tr style="background:#eef2ff;font-weight:bold;">
        <td colspan="3" style="border:1px solid #000;padding:4px 8px;text-align:right;">Totals</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${total_pkgs > 0 ? total_pkgs.toLocaleString() : "—"}</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${total_gross > 0 ? total_gross.toFixed(2) : "—"}</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${total_net > 0 ? total_net.toFixed(2) : "—"}</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:right;">${total_cbm > 0 ? total_cbm.toFixed(3) : "—"}</td>
        <td colspan="2" style="border:1px solid #000;padding:4px 8px;"></td>
      </tr>
    </tbody>
  </table>
<br><br><table style="border-collapse:collapse;width:100%;margin-top:20px;font-family:Calibri,sans-serif;font-size:12px;"><tr><td style="width:50%;padding:8px;border-top:1px solid #000;text-align:center;">Delivered by: Name &amp; Sign</td><td style="width:50%;padding:8px;border-top:1px solid #000;text-align:center;">Received by: Date &amp; Sign</td></tr></table></div>`.trim();

  const plainText = [
    `GRN: ${grn.grn_number}  |  Date: ${date}  |  Customer: ${customerName}  |  Status: ${grn.status}`,
    `Vehicle: ${grn.vehicle_no || "—"}  |  Driver: ${grn.driver_name || "—"}  |  Received By: ${grn.received_by || "—"}`,
    "",
    ["#", "Commodity", "Packing Type", "No. of Pkgs", "Gross Wt", "Net Wt", "Vol CBM", "Condition", "Location"].join("\t"),
    ...items.map((item: any, i: number) =>
      [i + 1, item.commodity, item.packing_type, item.no_of_packages, item.gross_weight, item.net_weight, item.volume_cbm, item.condition_on_receipt, item.storage_location].join("\t")
    ),
    ["", "", "Totals", total_pkgs, total_gross.toFixed(2), total_net.toFixed(2), total_cbm.toFixed(3), "", ""].join("\t"),
  ].join("\n");

  const modernCopy = async (): Promise<boolean> => {
    if (!navigator.clipboard?.write) return false;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlContent], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return true;
    } catch { return false; }
  };

  const execCommandCopy = (): boolean => {
    try {
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;";
      container.innerHTML = htmlContent;
      document.body.appendChild(container);
      const range = document.createRange();
      range.selectNode(container);
      const selection = window.getSelection();
      if (!selection) { document.body.removeChild(container); return false; }
      selection.removeAllRanges();
      selection.addRange(range);
      const success = document.execCommand("copy");
      selection.removeAllRanges();
      document.body.removeChild(container);
      return success;
    } catch { return false; }
  };

  await modernCopy() || execCommandCopy();
};

// ─── Print GRN ────────────────────────────────────────────────────────────────

const printGRN = (grn: GRNFull) => {
  const items = grn.storage_grn_items || [];
  const date = new Date(grn.received_date).toLocaleDateString("en-GB");
  const customerName = grn.customers?.company_name || "—";
  const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
  const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
  const total_net = items.reduce((s: number, i: any) => s + (Number(i.net_weight) || 0), 0);
  const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>GRN - ${grn.grn_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing:; }
    body { font-family: 'Calibri',Calibri,sans-serif; font-size: 10pt; padding: 24px; padding-top: 30mm; color: #111; }
    h1 { font-size: 13pt; margin-bottom: 4px; color: #1e293b; font-family: 'Calibri',Calibri,sans-serif; }
    .subtitle { font-size: 11px; color: #64748b; margin-bottom: 16px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: 'Calibri',Calibri,sans-serif; font-size: 10pt; }
    .info-table td { border: 1px solid #ccc; padding: 4px 8px; }
    .info-table td.label { background: #f0f4f8; font-weight: bold; width: 130px; }
    .cargo-table { width: 100%; border-collapse: collapse; font-size: 10pt; font-family: 'Calibri',Calibri,sans-serif; }
    .cargo-table th { border: 1px solid #000; padding: 5px 8px; background: #e3f2fd; font-weight: bold; }
    .cargo-table td { border: 1px solid #000; padding: 4px 8px; }
    .cargo-table .num { text-align: right; }
    .cargo-table .ctr { text-align: center; }
    .totals-row { background: #eef2ff; font-weight: bold; }
    h3 { font-size: 10pt; margin-bottom: 8px; color: #1e293b; font-family: 'Calibri',Calibri,sans-serif; }
    .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 9pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; font-family: 'Calibri',Calibri,sans-serif; }
    @media print {
      body { padding: 0; padding-top: 30mm; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>Goods Receipt Note</h1>
  <div class="subtitle">Alpha Line Cargo W.L.L — Warehouse Receipt</div>

  <table class="info-table">
    <tr>
      <td class="label">GRN Number</td><td>${grn.grn_number}</td>
      <td class="label">Date</td><td>${date}</td>
    </tr>
    <tr>
      <td class="label">Customer</td><td>${customerName}</td>
      <td class="label">Status</td><td>${grn.status}</td>
    </tr>
    <tr>
      <td class="label">Vehicle No.</td><td>${grn.vehicle_no || "—"}</td>
      <td class="label">Driver Name</td><td>${grn.driver_name || "—"}</td>
    </tr>
    <tr>
      <td class="label">Received By</td><td>${grn.received_by || "—"}</td>
      <td class="label">Agreement</td><td>${grn.agreement_id ? "Linked" : "None"}</td>
    </tr>
    ${grn.remarks ? `<tr><td class="label">Remarks</td><td colspan="3">${grn.remarks}</td></tr>` : ""}
  </table>

  <h3>Cargo Details</h3>
  <table class="cargo-table">
    <thead>
      <tr>
        <th class="ctr" style="width:28px;">#</th>
        <th>Commodity</th>
        <th>Packing Type</th>
        <th class="num" style="width:70px;">No. of Pkgs</th>
        <th class="num" style="width:80px;">Gross Wt (kg)</th>
        <th class="num" style="width:80px;">Net Wt (kg)</th>
        <th class="num" style="width:70px;">Vol (CBM)</th>
        <th>Condition</th>
        <th>Storage Location</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"};">
        <td class="ctr">${i + 1}</td>
        <td>${item.commodity || "—"}</td>
        <td>${item.packing_type || "—"}</td>
        <td class="num">${item.no_of_packages ?? "—"}</td>
        <td class="num">${item.gross_weight ?? "—"}</td>
        <td class="num">${item.net_weight ?? "—"}</td>
        <td class="num">${item.volume_cbm ?? "—"}</td>
        <td>${item.condition_on_receipt || "—"}</td>
        <td>${item.storage_location || "—"}</td>
      </tr>`).join("")}
      <tr class="totals-row">
        <td colspan="3" style="text-align:right;padding:5px 8px;">Totals</td>
        <td class="num">${total_pkgs > 0 ? total_pkgs.toLocaleString() : "—"}</td>
        <td class="num">${total_gross > 0 ? total_gross.toFixed(2) : "—"}</td>
        <td class="num">${total_net > 0 ? total_net.toFixed(2) : "—"}</td>
        <td class="num">${total_cbm > 0 ? total_cbm.toFixed(3) : "—"}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <span>Received By: ________________________</span>
    <span>Signature: ________________________</span>
    <span>Date: ________________________</span>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`);
  win.document.close();
};

// ─── Autocomplete Cell ────────────────────────────────────────────────────────

function AutocompleteCell({ value, options, placeholder, onChange }: {
  value: string; options: string[]; placeholder?: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (v: string) => {
    onChange(v);
    setFiltered(v.trim() === "" ? options.slice(0, 20) : options.filter(o => o.toLowerCase().startsWith(v.toLowerCase())));
    setOpen(true);
  };

  const handleFocus = () => {
    setFiltered(value.trim() === "" ? options.slice(0, 20) : options.filter(o => o.toLowerCase().startsWith(value.toLowerCase())));
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%" }}>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => handleInput(e.target.value)}
        onFocus={handleFocus}
        style={{ width: "100%", height: "100%", padding: "0 8px", fontSize: "12px", background: "transparent", border: "none", outline: "none" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
        onFocusCapture={e => (e.currentTarget.style.background = "#eef2ff")}
        onBlur={e => (e.currentTarget.style.background = "transparent")}
      />
      {open && filtered.length > 0 && (
        <ul style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0,
          width: "100%", minWidth: "160px", background: "#fff",
          border: "1px solid #d1d5db", borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: "160px", overflowY: "auto",
          listStyle: "none", margin: 0, padding: 0,
        }}>
          {filtered.map(opt => (
            <li key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false); }}
              style={{ padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >{opt}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Number Cell ──────────────────────────────────────────────────────────────

function NumberCell({ value, placeholder, step = "1", onChange }: {
  value: string; placeholder: string; step?: string; onChange: (v: string) => void;
}) {
  return (
    <input type="number" min="0" step={step} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", height: "100%", padding: "0 8px", fontSize: "12px", textAlign: "right", background: "transparent", border: "none", outline: "none" } as React.CSSProperties}
      onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
      onFocusCapture={e => (e.currentTarget.style.background = "#eef2ff")}
      onBlur={e => (e.currentTarget.style.background = "transparent")}
      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GRNTab() {
  const [grns, setGrns] = useState<GRNFull[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [lookups, setLookups] = useState<LookupMap>({
    commodity: [], packing_type: [], condition_on_receipt: [], storage_location: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGrn, setEditingGrn] = useState<GRNFull | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [agreementId, setAgreementId] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("In Storage");
  const [cargoRows, setCargoRows] = useState<CargoRow[]>([emptyRow()]);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: grnData }, { data: custData }, { data: agrData }, { data: lookupData }] = await Promise.all([
      supabase.from("storage_grn").select("*, customers(company_name), storage_grn_items(*)").order("created_at", { ascending: false }),
      supabase.from("customers").select("id, company_name").order("company_name"),
      supabase.from("storage_agreements").select("id, agreement_number").eq("status", "Active"),
      supabase.from("grn_lookup_options").select("column_name, value").order("value"),
    ]);
    setGrns(grnData || []);
    setCustomers(custData || []);
    setAgreements(agrData || []);
    const map: LookupMap = { commodity: [], packing_type: [], condition_on_receipt: [], storage_location: [] };
    (lookupData || []).forEach(({ column_name, value }: { column_name: string; value: string }) => {
      if (map[column_name]) map[column_name].push(value);
    });
    setLookups(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Form helpers ───────────────────────────────────────────────────────────

  const resetForm = () => {
    setCustomerId(""); setAgreementId(""); setReceivedDate("");
    setVehicleNo(""); setDriverName(""); setReceivedBy("");
    setRemarks(""); setStatus("In Storage");
    setCargoRows([emptyRow()]); setEditingGrn(null);
  };

  const openNew = () => { resetForm(); setShowForm(true); };

  const openEdit = (grn: GRNFull) => {
    setEditingGrn(grn);
    setCustomerId(grn.customer_id);
    setAgreementId(grn.agreement_id || "");
    setReceivedDate(grn.received_date);
    setVehicleNo(grn.vehicle_no || "");
    setDriverName(grn.driver_name || "");
    setReceivedBy(grn.received_by || "");
    setRemarks(grn.remarks || "");
    setStatus(grn.status);
    const items = grn.storage_grn_items || [];
    setCargoRows(items.length > 0 ? items.map((i: any) => ({
      id: crypto.randomUUID(),
      commodity: i.commodity || "",
      packing_type: i.packing_type || "",
      no_of_packages: String(i.no_of_packages ?? ""),
      gross_weight: String(i.gross_weight ?? ""),
      net_weight: String(i.net_weight ?? ""),
      volume_cbm: String(i.volume_cbm ?? ""),
      condition_on_receipt: i.condition_on_receipt || "",
      storage_location: i.storage_location || "",
    })) : [emptyRow()]);
    setShowForm(true);
  };

  const updateRow = (idx: number, field: keyof CargoRow, value: string) => {
    setCargoRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    if (cargoRows.length >= 10) return;
    setCargoRows(rows => [...rows, emptyRow()]);
  };

  const removeRow = (idx: number) => {
    if (cargoRows.length <= 1) return;
    setCargoRows(rows => rows.filter((_, i) => i !== idx));
  };

  const totals = cargoRows.reduce((acc, r) => ({
    pkgs: acc.pkgs + (parseFloat(r.no_of_packages) || 0),
    gross: acc.gross + (parseFloat(r.gross_weight) || 0),
    net: acc.net + (parseFloat(r.net_weight) || 0),
    cbm: acc.cbm + (parseFloat(r.volume_cbm) || 0),
  }), { pkgs: 0, gross: 0, net: 0, cbm: 0 });

  // ── Save lookups ───────────────────────────────────────────────────────────

  const saveLookups = async (rows: CargoRow[]) => {
    const toUpsert: { column_name: string; value: string }[] = [];
    rows.forEach(row => {
      AUTOCOMPLETE_COLS.forEach(col => {
        const val = row[col as keyof CargoRow]?.trim();
        if (val && !lookups[col].includes(val)) toUpsert.push({ column_name: col, value: val });
      });
    });
    if (toUpsert.length > 0)
      await supabase.from("grn_lookup_options").upsert(toUpsert, { onConflict: "column_name,value", ignoreDuplicates: true });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!customerId || !receivedDate) return alert("Customer and Received Date are required.");
    const validRows = cargoRows.filter(r => r.commodity.trim() !== "");
    if (validRows.length === 0) return alert("Add at least one cargo item.");

    setSaving(true);
    try {
      let grnId = editingGrn?.id;

      if (editingGrn) {
        await supabase.from("storage_grn").update({
          customer_id: customerId, agreement_id: agreementId || null,
          received_date: receivedDate, vehicle_no: vehicleNo,
          driver_name: driverName, received_by: receivedBy, remarks, status,
        }).eq("id", editingGrn.id);
        await supabase.from("storage_grn_items").delete().eq("grn_id", editingGrn.id);
      } else {
        const { data, error } = await supabase.from("storage_grn").insert({
          customer_id: customerId, agreement_id: agreementId || null,
          received_date: receivedDate, vehicle_no: vehicleNo,
          driver_name: driverName, received_by: receivedBy, remarks, status,
        }).select("id").single();
        if (error) throw error;
        grnId = data.id;
      }

      await supabase.from("storage_grn_items").insert(
        validRows.map((r, idx) => ({
          grn_id: grnId,
          commodity: r.commodity, packing_type: r.packing_type,
          no_of_packages: parseFloat(r.no_of_packages) || null,
          gross_weight: parseFloat(r.gross_weight) || null,
          net_weight: parseFloat(r.net_weight) || null,
          volume_cbm: parseFloat(r.volume_cbm) || null,
          condition_on_receipt: r.condition_on_receipt,
          storage_location: r.storage_location, sort_order: idx,
        }))
      );

      await saveLookups(validRows);

      // Fetch saved GRN with items for copy/print
      const { data: savedGrn } = await supabase
        .from("storage_grn")
        .select("*, customers(company_name), storage_grn_items(*)")
        .eq("id", grnId!)
        .single();

      if (savedGrn) {
        await copyGRNToClipboard(savedGrn);
        alert(`${savedGrn.grn_number} saved & copied to clipboard!\nYou can paste it in your email.`);
      }

      setShowForm(false); resetForm(); fetchAll();
    } catch (e: any) {
      alert("Error saving GRN: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("storage_grn").delete().eq("id", id);
    setDeleteConfirm(null); fetchAll();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      "In Storage": "bg-blue-100 text-blue-700",
      "Partially Released": "bg-yellow-100 text-yellow-700",
      "Released": "bg-green-100 text-green-700",
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading GRNs...</div>;

  const fieldCls = "w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white";
  const gb = "1px solid #d1d5db";
  const gbl = "1px solid #e5e7eb";

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Goods Receipt Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">{grns.length} record{grns.length !== 1 ? "s" : ""}</p>
        </div>
        {!showForm && (
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New GRN
          </button>
        )}
      </div>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingGrn ? `Edit ${editingGrn.grn_number}` : "New Goods Receipt Note"}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Header fields */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer <span className="text-red-400">*</span></label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={fieldCls}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Agreement (optional)</label>
                <select value={agreementId} onChange={e => setAgreementId(e.target.value)} className={fieldCls}>
                  <option value="">None</option>
                  {agreements.map(a => <option key={a.id} value={a.id}>{a.agreement_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Received Date <span className="text-red-400">*</span></label>
                <input type="date" value={receivedDate} onChange={e => setReceivedDate(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle No.</label>
                <input type="text" value={vehicleNo} onChange={e => setVehicleNo(e.target.value)} placeholder="e.g. DXB 12345" className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver Name</label>
                <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Driver name" className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Received By</label>
                <input type="text" value={receivedBy} onChange={e => setReceivedBy(e.target.value)} placeholder="Staff name" className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={fieldCls}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes…" className={fieldCls} />
              </div>
            </div>

            {/* Excel-style cargo grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cargo Details</h4>
                <button onClick={addRow} disabled={cargoRows.length >= 10}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors border border-indigo-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Row {cargoRows.length >= 10 ? "(max 10)" : `(${cargoRows.length}/10)`}
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: gb, minWidth: "880px", fontSize: "12px" }}>
                  <colgroup>
                    <col style={{ width: "30px" }} />
                    <col style={{ width: "155px" }} />
                    <col style={{ width: "125px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "125px" }} />
                    <col style={{ width: "135px" }} />
                    <col style={{ width: "30px" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: "#f3f4f6", borderBottom: "2px solid #9ca3af" }}>
                      {[
                        { label: "#", align: "center" },
                        { label: "Commodity", align: "left" },
                        { label: "Packing Type", align: "left" },
                        { label: "No. of Pkgs", align: "right" },
                        { label: "Gross Wt (kg)", align: "right" },
                        { label: "Net Wt (kg)", align: "right" },
                        { label: "Vol (CBM)", align: "right" },
                        { label: "Condition", align: "left" },
                        { label: "Storage Location", align: "left" },
                        { label: "", align: "center" },
                      ].map((h, i) => (
                        <th key={i} style={{
                          padding: "7px 8px", textAlign: h.align as any,
                          fontWeight: 600, color: "#374151",
                          borderRight: i < 9 ? gb : "none",
                          fontSize: "11px", whiteSpace: "nowrap",
                        }}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cargoRows.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: gbl, background: idx % 2 === 0 ? "#fff" : "#f9fafb", height: "34px" }}>
                        <td style={{ textAlign: "center", color: "#9ca3af", fontSize: "11px", borderRight: gbl, padding: "0 4px" }}>{idx + 1}</td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <AutocompleteCell value={row.commodity} options={lookups.commodity} placeholder="Commodity" onChange={v => updateRow(idx, "commodity", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <AutocompleteCell value={row.packing_type} options={lookups.packing_type} placeholder="Packing type" onChange={v => updateRow(idx, "packing_type", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <NumberCell value={row.no_of_packages} placeholder="0" onChange={v => updateRow(idx, "no_of_packages", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <NumberCell value={row.gross_weight} placeholder="0.00" step="0.01" onChange={v => updateRow(idx, "gross_weight", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <NumberCell value={row.net_weight} placeholder="0.00" step="0.01" onChange={v => updateRow(idx, "net_weight", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <NumberCell value={row.volume_cbm} placeholder="0.000" step="0.001" onChange={v => updateRow(idx, "volume_cbm", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <AutocompleteCell value={row.condition_on_receipt} options={lookups.condition_on_receipt} placeholder="Condition" onChange={v => updateRow(idx, "condition_on_receipt", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <AutocompleteCell value={row.storage_location} options={lookups.storage_location} placeholder="Location" onChange={v => updateRow(idx, "storage_location", v)} />
                        </td>
                        {/* × Delete button */}
                        <td style={{ textAlign: "center", padding: "0 4px" }}>
                          <button
                            onClick={() => removeRow(idx)}
                            disabled={cargoRows.length <= 1}
                            title="Remove row"
                            style={{
                              width: "20px", height: "20px", display: "inline-flex",
                              alignItems: "center", justifyContent: "center",
                              border: "none", background: "transparent", cursor: cargoRows.length <= 1 ? "not-allowed" : "pointer",
                              color: "#d1d5db", borderRadius: "3px",
                              opacity: cargoRows.length <= 1 ? 0.2 : 1,
                            }}
                            onMouseEnter={e => { if (cargoRows.length > 1) { (e.currentTarget as HTMLElement).style.color = "#ef4444"; (e.currentTarget as HTMLElement).style.background = "#fee2e2"; } }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#d1d5db"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Totals */}
                    <tr style={{ background: "#eef2ff", borderTop: "1.5px solid #a5b4fc" }}>
                      <td colSpan={3} style={{ textAlign: "right", padding: "7px 10px", fontWeight: 600, color: "#4338ca", fontSize: "12px", borderRight: "1px solid #a5b4fc" }}>Totals</td>
                      <td style={{ textAlign: "right", padding: "7px 8px", fontWeight: 600, color: "#4338ca", fontSize: "12px", borderRight: "1px solid #a5b4fc" }}>{totals.pkgs > 0 ? totals.pkgs.toLocaleString() : "—"}</td>
                      <td style={{ textAlign: "right", padding: "7px 8px", fontWeight: 600, color: "#4338ca", fontSize: "12px", borderRight: "1px solid #a5b4fc" }}>{totals.gross > 0 ? totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                      <td style={{ textAlign: "right", padding: "7px 8px", fontWeight: 600, color: "#4338ca", fontSize: "12px", borderRight: "1px solid #a5b4fc" }}>{totals.net > 0 ? totals.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</td>
                      <td style={{ textAlign: "right", padding: "7px 8px", fontWeight: 600, color: "#4338ca", fontSize: "12px", borderRight: "1px solid #a5b4fc" }}>{totals.cbm > 0 ? totals.cbm.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "—"}</td>
                      <td colSpan={3} />
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{cargoRows.length} row{cargoRows.length !== 1 ? "s" : ""} · max 10 per GRN</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                {saving
                  ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving…</>
                  : <>{editingGrn ? "Update & Copy" : "Save & Copy"}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRN List ─────────────────────────────────────────────────────────── */}
      {!showForm && (
        <div className="space-y-3">
          {grns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400">
              <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm">No GRNs yet</p>
              <p className="text-xs mt-1">Click <strong>New GRN</strong> to get started</p>
            </div>
          ) : (
            grns.map(grn => {
              const items = grn.storage_grn_items || [];
              const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
              const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
              const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

              return (
                <div key={grn.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all">

                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-indigo-700 font-mono">{grn.grn_number}</span>
                      {statusBadge(grn.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Copy */}
                      <button
                        onClick={async () => { await copyGRNToClipboard(grn); alert("Copied to clipboard!"); }}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100 hover:border-indigo-100"
                        title="Copy to clipboard"
                      >
                        Copy
                      </button>
                      {/* Print */}
                      <button
                        onClick={() => printGRN(grn)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-gray-100 hover:border-emerald-100"
                        title="Print GRN"
                      >
                        Print
                      </button>
                      {/* Edit */}
                      <button onClick={() => openEdit(grn)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100 hover:border-indigo-100">
                        Edit
                      </button>
                      {/* Delete */}
                      {deleteConfirm === grn.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button onClick={() => handleDelete(grn.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(grn.id)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 hover:border-red-100">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                      <span><span className="font-medium text-gray-700">Customer:</span> {grn.customers?.company_name || "—"}</span>
                      <span><span className="font-medium text-gray-700">Date:</span> {grn.received_date}</span>
                      {grn.vehicle_no && <span><span className="font-medium text-gray-700">Vehicle:</span> {grn.vehicle_no}</span>}
                      {grn.driver_name && <span><span className="font-medium text-gray-700">Driver:</span> {grn.driver_name}</span>}
                      {grn.received_by && <span><span className="font-medium text-gray-700">Received by:</span> {grn.received_by}</span>}
                    </div>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {total_pkgs > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">📦 {total_pkgs.toLocaleString()} pkgs</span>}
                      {total_gross > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">⚖️ {total_gross.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</span>}
                      {total_cbm > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">📐 {total_cbm.toLocaleString(undefined, { maximumFractionDigits: 3 })} CBM</span>}
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{items.length} line{items.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Cargo mini-table */}
                    {items.length > 0 && (
                      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                              {["Commodity", "Packing", "Pkgs", "Gross Wt", "Net Wt", "CBM", "Condition", "Location"].map((h, i) => (
                                <th key={i} style={{ padding: "6px 10px", textAlign: i > 1 && i < 6 ? "right" : "left", fontWeight: 600, color: "#6b7280", borderRight: i < 7 ? "1px solid #e5e7eb" : "none", fontSize: "11px" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item: any, i: number) => (
                              <tr key={i} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                <td style={{ padding: "5px 10px", color: "#374151", fontWeight: 500, borderRight: "1px solid #f3f4f6" }}>{item.commodity || "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#6b7280", borderRight: "1px solid #f3f4f6" }}>{item.packing_type || "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#4b5563", textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{item.no_of_packages ?? "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#4b5563", textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{item.gross_weight ?? "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#4b5563", textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{item.net_weight ?? "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#4b5563", textAlign: "right", borderRight: "1px solid #f3f4f6" }}>{item.volume_cbm ?? "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#6b7280", borderRight: "1px solid #f3f4f6" }}>{item.condition_on_receipt || "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#6b7280" }}>{item.storage_location || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {grn.remarks && <p className="text-xs text-gray-400 mt-2 italic">"{grn.remarks}"</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}