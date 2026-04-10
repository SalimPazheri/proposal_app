import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

interface Customer { id: string; company_name: string; }
interface GRNOption { id: string; grn_number: string; }

interface CargoRow {
  id: string;
  commodity: string;
  packing_type: string;
  no_of_packages: string;
  gross_weight: string;
  net_weight: string;
  volume_cbm: string;
  delivery_address: string;
  remarks: string;
}

interface GDNFull {
  id: string;
  gdn_number: string;
  customer_id: string;
  grn_id: string | null;
  delivery_date: string;
  delivered_to: string;
  delivered_by: string;
  vehicle_no: string;
  driver_name: string;
  received_by_customer: string;
  status: string;
  created_at: string;
  customers?: { company_name: string };
  storage_grn?: { grn_number: string };
  storage_gdn_items?: any[];
}

type LookupMap = Record<string, string[]>;
const AUTOCOMPLETE_COLS = ["commodity", "packing_type", "delivery_address"] as const;

const emptyRow = (): CargoRow => ({
  id: crypto.randomUUID(),
  commodity: "", packing_type: "", no_of_packages: "",
  gross_weight: "", net_weight: "", volume_cbm: "",
  delivery_address: "", remarks: "",
});

const STATUS_OPTIONS = ["Delivered", "Partially Delivered", "Pending", "Returned"];

// ─── Copy GDN to clipboard ────────────────────────────────────────────────────

const copyGDNToClipboard = async (gdn: GDNFull) => {
  const items = gdn.storage_gdn_items || [];
  const date = new Date(gdn.delivery_date).toLocaleDateString("en-GB");
  const createdAt = new Date(gdn.created_at).toLocaleDateString("en-GB");
  const customerName = gdn.customers?.company_name || "—";
  const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
  const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
  const total_net = items.reduce((s: number, i: any) => s + (Number(i.net_weight) || 0), 0);
  const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

  const itemRows = items.map((item: any, i: number) => `
    <tr>
      <td style="border:1px solid #000;padding:4px 8px;text-align:center;font-family:Calibri,sans-serif;font-size:12px;">${i + 1}</td>
      <td style="border:1px solid #000;padding:4px 8px;font-family:Calibri,sans-serif;font-size:12px;">${item.commodity || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;font-family:Calibri,sans-serif;font-size:12px;">${item.packing_type || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;font-family:Calibri,sans-serif;font-size:12px;">${item.no_of_packages ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;font-family:Calibri,sans-serif;font-size:12px;">${item.gross_weight ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;font-family:Calibri,sans-serif;font-size:12px;">${item.net_weight ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;text-align:right;font-family:Calibri,sans-serif;font-size:12px;">${item.volume_cbm ?? "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;font-family:Calibri,sans-serif;font-size:12px;">${item.delivery_address || "—"}</td>
      <td style="border:1px solid #000;padding:4px 8px;font-family:Calibri,sans-serif;font-size:12px;">${item.remarks || "—"}</td>
    </tr>`).join("");

  const htmlContent = `
<div style="font-family:Calibri,sans-serif;font-size:12px;max-width:900px;margin-top:30mm;">
  <h2 style="margin:0 0 4px;font-size:14px;color:#1e293b;font-family:Calibri,sans-serif;">Goods Delivery Note</h2><div style="font-size:11px;color:#64748b;margin-bottom:12px;font-family:Calibri,sans-serif;">Alpha Line Cargo W.L.L</div>
  <table style="border-collapse:collapse;width:100%;margin-bottom:16px;font-size:12px;font-family:Calibri,sans-serif;">
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;width:140px;">GDN Number</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.gdn_number}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;width:140px;">Date</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${date}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Customer</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${customerName}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Status</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.status}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">GRN Ref</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.storage_grn?.grn_number || "—"}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Printed On</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${createdAt}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Vehicle No.</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.vehicle_no || "—"}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Driver</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.driver_name || "—"}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Delivered To</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.delivered_to || "—"}</td>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Delivered By</td>
      <td style="padding:3px 8px;border:1px solid #ccc;">${gdn.delivered_by || "—"}</td>
    </tr>
    <tr>
      <td style="padding:3px 8px;font-weight:bold;background:#f0f4f8;border:1px solid #ccc;">Received By</td>
      <td colspan="3" style="padding:3px 8px;border:1px solid #ccc;">${gdn.received_by_customer || "—"}</td>
    </tr>
  </table>
  <h3 style="margin:0 0 6px;font-size:12px;color:#1e293b;font-family:Calibri,sans-serif;">Delivery Details</h3>
  <table style="border-collapse:collapse;width:100%;font-size:12px;font-family:Calibri,sans-serif;">
    <thead>
      <tr style="background:#e3f2fd;">
        <th style="border:1px solid #000;padding:4px 8px;text-align:center;">#</th>
        <th style="border:1px solid #000;padding:4px 8px;">Commodity</th>
        <th style="border:1px solid #000;padding:4px 8px;">Packing Type</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">No. of Pkgs</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Gross Wt (kg)</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Net Wt (kg)</th>
        <th style="border:1px solid #000;padding:4px 8px;text-align:right;">Vol (CBM)</th>
        <th style="border:1px solid #000;padding:4px 8px;">Delivery Address</th>
        <th style="border:1px solid #000;padding:4px 8px;">Remarks</th>
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
  <br><br>
  <table style="border-collapse:collapse;width:100%;margin-top:20px;font-family:Calibri,sans-serif;font-size:12px;">
    <tr>
      <td style="width:50%;padding:8px;border-top:1px solid #000;text-align:center;">Delivered by: Name &amp; Sign</td>
      <td style="width:50%;padding:8px;border-top:1px solid #000;text-align:center;">Received by: Date &amp; Sign</td>
    </tr>
  </table>
</div>`.trim();

  const plainText = [
    `GDN: ${gdn.gdn_number}  |  Date: ${date}  |  Customer: ${customerName}  |  Status: ${gdn.status}`,
    `Vehicle: ${gdn.vehicle_no || "—"}  |  Driver: ${gdn.driver_name || "—"}  |  Delivered To: ${gdn.delivered_to || "—"}`,
    "",
    ["#", "Commodity", "Packing Type", "Pkgs", "Gross Wt", "Net Wt", "CBM", "Delivery Address", "Remarks"].join("\t"),
    ...items.map((item: any, i: number) =>
      [i + 1, item.commodity, item.packing_type, item.no_of_packages, item.gross_weight, item.net_weight, item.volume_cbm, item.delivery_address, item.remarks].join("\t")
    ),
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
      const sel = window.getSelection();
      if (!sel) { document.body.removeChild(container); return false; }
      sel.removeAllRanges(); sel.addRange(range);
      const ok = document.execCommand("copy");
      sel.removeAllRanges(); document.body.removeChild(container);
      return ok;
    } catch { return false; }
  };

  await modernCopy() || execCommandCopy();
};

// ─── Print GDN ────────────────────────────────────────────────────────────────

const printGDN = (gdn: GDNFull) => {
  const items = gdn.storage_gdn_items || [];
  const date = new Date(gdn.delivery_date).toLocaleDateString("en-GB");
  const customerName = gdn.customers?.company_name || "—";
  const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
  const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
  const total_net = items.reduce((s: number, i: any) => s + (Number(i.net_weight) || 0), 0);
  const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>GDN - ${gdn.gdn_number}</title>
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family:'Calibri',Calibri,sans-serif;font-size:9pt;padding:24px;padding-top:30mm;color:#111; }
  h1 { font-size:11pt;margin-bottom:4px;color:#1e293b; }
  .sub { font-size:9pt;color:#64748b;margin-bottom:16px; }
  .info { width:100%;border-collapse:collapse;margin-bottom:20px;font-size:9pt; }
  .info td { border:1px solid #ccc;padding:4px 8px; }
  .info td.lbl { background:#f0f4f8;font-weight:bold;width:130px; }
  .ct { width:100%;border-collapse:collapse;font-size:9pt; }
  .ct th { border:1px solid #000;padding:5px 8px;background:#e3f2fd;font-weight:bold; }
  .ct td { border:1px solid #000;padding:4px 8px; }
  .r { text-align:right; } .c { text-align:center; }
  .tot { background:#eef2ff;font-weight:bold; }
  .sig { width:100%;border-collapse:collapse;margin-top:40px;font-size:9pt; }
  .sig td { padding:8px;text-align:center;border-top:1px solid #000;width:50%; }
  @media print { body { padding:0;padding-top:30mm; } }
</style></head><body>
  <h1>Goods Delivery Note</h1>
  <div class="sub">Alpha Line Cargo W.L.L— Warehouse Delivery</div>
  <table class="info">
    <tr><td class="lbl">GDN Number</td><td>${gdn.gdn_number}</td><td class="lbl">Date</td><td>${date}</td></tr>
    <tr><td class="lbl">Customer</td><td>${customerName}</td><td class="lbl">Status</td><td>${gdn.status}</td></tr>
    <tr><td class="lbl">GRN Ref</td><td>${gdn.storage_grn?.grn_number || "—"}</td><td class="lbl">Delivery Date</td><td>${date}</td></tr>
    <tr><td class="lbl">Vehicle No.</td><td>${gdn.vehicle_no || "—"}</td><td class="lbl">Driver Name</td><td>${gdn.driver_name || "—"}</td></tr>
    <tr><td class="lbl">Delivered To</td><td>${gdn.delivered_to || "—"}</td><td class="lbl">Delivered By</td><td>${gdn.delivered_by || "—"}</td></tr>
    <tr><td class="lbl">Received By</td><td colspan="3">${gdn.received_by_customer || "—"}</td></tr>
  </table>
  <h3 style="font-size:9pt;margin-bottom:8px;">Delivery Details</h3>
  <table class="ct">
    <thead><tr>
      <th class="c" style="width:28px;">#</th>
      <th>Commodity</th><th>Packing Type</th>
      <th class="r" style="width:70px;">Pkgs</th>
      <th class="r" style="width:80px;">Gross Wt</th>
      <th class="r" style="width:80px;">Net Wt</th>
      <th class="r" style="width:70px;">CBM</th>
      <th>Delivery Address</th><th>Remarks</th>
    </tr></thead>
    <tbody>
      ${items.map((item: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? "#fff" : "#f9fafb"}">
        <td class="c">${i + 1}</td>
        <td>${item.commodity || "—"}</td><td>${item.packing_type || "—"}</td>
        <td class="r">${item.no_of_packages ?? "—"}</td>
        <td class="r">${item.gross_weight ?? "—"}</td>
        <td class="r">${item.net_weight ?? "—"}</td>
        <td class="r">${item.volume_cbm ?? "—"}</td>
        <td>${item.delivery_address || "—"}</td>
        <td>${item.remarks || "—"}</td>
      </tr>`).join("")}
      <tr class="tot">
        <td colspan="3" style="text-align:right;padding:5px 8px;">Totals</td>
        <td class="r">${total_pkgs > 0 ? total_pkgs.toLocaleString() : "—"}</td>
        <td class="r">${total_gross > 0 ? total_gross.toFixed(2) : "—"}</td>
        <td class="r">${total_net > 0 ? total_net.toFixed(2) : "—"}</td>
        <td class="r">${total_cbm > 0 ? total_cbm.toFixed(3) : "—"}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>
  <table class="sig">
    <tr>
      <td>Delivered by: Name &amp; Sign</td>
      <td>Received by: Date &amp; Sign</td>
    </tr>
  </table>
  <script>window.onload = () => window.print();</script>
</body></html>`);
  win.document.close();
};

// ─── Autocomplete Cell (with keyboard navigation) ─────────────────────────────

function AutocompleteCell({ value, options, placeholder, onChange }: {
  value: string; options: string[]; placeholder?: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openList = (v: string) => {
    const f = v.trim() === "" ? options.slice(0, 20) : options.filter(o => o.toLowerCase().startsWith(v.toLowerCase()));
    setFiltered(f);
    setActiveIdx(-1);
    setOpen(f.length > 0);
  };

  const handleInput = (v: string) => { onChange(v); openList(v); };
  const handleFocus = () => openList(value);

  const pick = (opt: string) => { onChange(opt); setOpen(false); setActiveIdx(-1); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "ArrowUp") openList(value); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(activeIdx + 1, filtered.length - 1);
      setActiveIdx(next);
      (listRef.current?.children[next] as HTMLElement)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(activeIdx - 1, 0);
      setActiveIdx(prev);
      (listRef.current?.children[prev] as HTMLElement)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(filtered[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false); setActiveIdx(-1);
    }
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", height: "100%" }}>
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => handleInput(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{ width: "100%", height: "100%", padding: "0 8px", fontSize: "12px", background: "transparent", border: "none", outline: "none" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.background = "transparent"; }}
        onFocusCapture={e => (e.currentTarget.style.background = "#eef2ff")}
        onBlur={e => (e.currentTarget.style.background = "transparent")}
      />
      {open && filtered.length > 0 && (
        <ul ref={listRef} style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0,
          width: "100%", minWidth: "160px", background: "#fff",
          border: "1px solid #d1d5db", borderRadius: "4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: "160px", overflowY: "auto",
          listStyle: "none", margin: 0, padding: 0,
        }}>
          {filtered.map((opt, i) => (
            <li key={opt}
              onMouseDown={() => pick(opt)}
              style={{
                padding: "6px 12px", fontSize: "12px", cursor: "pointer",
                background: i === activeIdx ? "#eef2ff" : "transparent",
                color: i === activeIdx ? "#4338ca" : "inherit",
              }}
              onMouseEnter={() => setActiveIdx(i)}
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

export default function GDNTab() {
  const [gdns, setGdns] = useState<GDNFull[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [grns, setGrns] = useState<GRNOption[]>([]);
  const [lookups, setLookups] = useState<LookupMap>({ commodity: [], packing_type: [], delivery_address: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGdn, setEditingGdn] = useState<GDNFull | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [grnId, setGrnId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [deliveredBy, setDeliveredBy] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [driverName, setDriverName] = useState("");
  const [receivedByCustomer, setReceivedByCustomer] = useState("");
  const [status, setStatus] = useState("Pending");
  const [cargoRows, setCargoRows] = useState<CargoRow[]>([emptyRow()]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: gdnData }, { data: custData }, { data: grnData }, { data: lookupData }] = await Promise.all([
      supabase.from("storage_gdn").select("*, customers(company_name), storage_grn(grn_number), storage_gdn_items(*)").order("created_at", { ascending: false }),
      supabase.from("customers").select("id, company_name").order("company_name"),
      supabase.from("storage_grn").select("id, grn_number").order("grn_number"),
      supabase.from("gdn_lookup_options").select("column_name, value").order("value"),
    ]);
    setGdns(gdnData || []);
    setCustomers(custData || []);
    setGrns(grnData || []);
    const map: LookupMap = { commodity: [], packing_type: [], delivery_address: [] };
    (lookupData || []).forEach(({ column_name, value }: { column_name: string; value: string }) => {
      if (map[column_name]) map[column_name].push(value);
    });
    setLookups(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetForm = () => {
    setCustomerId(""); setGrnId(""); setDeliveryDate("");
    setDeliveredTo(""); setDeliveredBy(""); setVehicleNo("");
    setDriverName(""); setReceivedByCustomer(""); setStatus("Pending");
    setCargoRows([emptyRow()]); setEditingGdn(null);
  };

  const openNew = () => { resetForm(); setShowForm(true); };

  const openEdit = (gdn: GDNFull) => {
    setEditingGdn(gdn);
    setCustomerId(gdn.customer_id || "");
    setGrnId(gdn.grn_id || "");
    setDeliveryDate(gdn.delivery_date || "");
    setDeliveredTo(gdn.delivered_to || "");
    setDeliveredBy(gdn.delivered_by || "");
    setVehicleNo(gdn.vehicle_no || "");
    setDriverName(gdn.driver_name || "");
    setReceivedByCustomer(gdn.received_by_customer || "");
    setStatus(gdn.status || "Pending");
    const items = gdn.storage_gdn_items || [];
    setCargoRows(items.length > 0 ? items.map((i: any) => ({
      id: crypto.randomUUID(),
      commodity: i.commodity || "", packing_type: i.packing_type || "",
      no_of_packages: String(i.no_of_packages ?? ""),
      gross_weight: String(i.gross_weight ?? ""),
      net_weight: String(i.net_weight ?? ""),
      volume_cbm: String(i.volume_cbm ?? ""),
      delivery_address: i.delivery_address || "",
      remarks: i.remarks || "",
    })) : [emptyRow()]);
    setShowForm(true);
  };

  const updateRow = (idx: number, field: keyof CargoRow, value: string) =>
    setCargoRows(rows => rows.map((r, i) => i === idx ? { ...r, [field]: value } : r));

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

  const saveLookups = async (rows: CargoRow[]) => {
    const toUpsert: { column_name: string; value: string }[] = [];
    rows.forEach(row => {
      AUTOCOMPLETE_COLS.forEach(col => {
        const val = row[col as keyof CargoRow]?.trim();
        if (val && !lookups[col].includes(val)) toUpsert.push({ column_name: col, value: val });
      });
    });
    if (toUpsert.length > 0)
      await supabase.from("gdn_lookup_options").upsert(toUpsert, { onConflict: "column_name,value", ignoreDuplicates: true });
  };

  const handleSubmit = async () => {
    if (!customerId || !deliveryDate) return alert("Customer and Delivery Date are required.");
    const validRows = cargoRows.filter(r => r.commodity.trim() !== "");
    if (validRows.length === 0) return alert("Add at least one delivery item.");
    setSaving(true);
    try {
      let gdnId = editingGdn?.id;
      if (editingGdn) {
        await supabase.from("storage_gdn").update({
          customer_id: customerId, grn_id: grnId || null,
          delivery_date: deliveryDate, delivered_to: deliveredTo,
          delivered_by: deliveredBy, vehicle_no: vehicleNo,
          driver_name: driverName, received_by_customer: receivedByCustomer, status,
        }).eq("id", editingGdn.id);
        await supabase.from("storage_gdn_items").delete().eq("gdn_id", editingGdn.id);
      } else {
        const { data, error } = await supabase.from("storage_gdn").insert({
          customer_id: customerId, grn_id: grnId || null,
          delivery_date: deliveryDate, delivered_to: deliveredTo,
          delivered_by: deliveredBy, vehicle_no: vehicleNo,
          driver_name: driverName, received_by_customer: receivedByCustomer, status,
        }).select("id").single();
        if (error) throw error;
        gdnId = data.id;
      }
      await supabase.from("storage_gdn_items").insert(
        validRows.map((r, idx) => ({
          gdn_id: gdnId, commodity: r.commodity, packing_type: r.packing_type,
          no_of_packages: parseFloat(r.no_of_packages) || null,
          gross_weight: parseFloat(r.gross_weight) || null,
          net_weight: parseFloat(r.net_weight) || null,
          volume_cbm: parseFloat(r.volume_cbm) || null,
          delivery_address: r.delivery_address, remarks: r.remarks, sort_order: idx,
        }))
      );
      await saveLookups(validRows);
      const { data: savedGdn } = await supabase
        .from("storage_gdn")
        .select("*, customers(company_name), storage_grn(grn_number), storage_gdn_items(*)")
        .eq("id", gdnId!).single();
      if (savedGdn) {
        await copyGDNToClipboard(savedGdn);
        alert(`${savedGdn.gdn_number} saved & copied to clipboard!\nYou can paste it in your email.`);
      }
      setShowForm(false); resetForm(); fetchAll();
    } catch (e: any) {
      alert("Error saving GDN: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("storage_gdn").delete().eq("id", id);
    setDeleteConfirm(null); fetchAll();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      "Delivered": "bg-green-100 text-green-700",
      "Partially Delivered": "bg-yellow-100 text-yellow-700",
      "Pending": "bg-blue-100 text-blue-700",
      "Returned": "bg-red-100 text-red-700",
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || "bg-gray-100 text-gray-600"}`}>{s}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading GDNs...</div>;

  const fieldCls = "w-full h-9 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white";
  const gb = "1px solid #d1d5db";
  const gbl = "1px solid #e5e7eb";

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Goods Delivery Notes</h2>
          <div class="sub">Alpha Line Cargo W.L.L— Warehouse Delivery</div>
          <p className="text-xs text-gray-400 mt-0.5">{gdns.length} record{gdns.length !== 1 ? "s" : ""}</p>
        </div>
        {!showForm && (
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New GDN
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">
              {editingGdn ? `Edit ${editingGdn.gdn_number}` : "New Goods Delivery Note"}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">GRN Reference (optional)</label>
                <select value={grnId} onChange={e => setGrnId(e.target.value)} className={fieldCls}>
                  <option value="">None</option>
                  {grns.map(g => <option key={g.id} value={g.id}>{g.grn_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date <span className="text-red-400">*</span></label>
                <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivered To</label>
                <input type="text" value={deliveredTo} onChange={e => setDeliveredTo(e.target.value)} placeholder="Recipient name" className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivered By</label>
                <input type="text" value={deliveredBy} onChange={e => setDeliveredBy(e.target.value)} placeholder="Staff name" className={fieldCls} />
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Received By (Customer)</label>
                <input type="text" value={receivedByCustomer} onChange={e => setReceivedByCustomer(e.target.value)} placeholder="Customer contact" className={fieldCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className={fieldCls}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Excel-style grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delivery Details</h4>
                <button onClick={addRow} disabled={cargoRows.length >= 10}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors border border-indigo-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Row {cargoRows.length >= 10 ? "(max 10)" : `(${cargoRows.length}/10)`}
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: gb, minWidth: "920px", fontSize: "12px" }}>
                  <colgroup>
                    <col style={{ width: "30px" }} />
                    <col style={{ width: "150px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "170px" }} />
                    <col style={{ width: "150px" }} />
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
                        { label: "Delivery Address", align: "left" },
                        { label: "Remarks", align: "left" },
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
                          <AutocompleteCell value={row.delivery_address} options={lookups.delivery_address} placeholder="Delivery address" onChange={v => updateRow(idx, "delivery_address", v)} />
                        </td>
                        <td style={{ borderRight: gbl, padding: 0 }}>
                          <AutocompleteCell value={row.remarks} options={[]} placeholder="Remarks" onChange={v => updateRow(idx, "remarks", v)} />
                        </td>
                        <td style={{ textAlign: "center", padding: "0 4px" }}>
                          <button
                            onClick={() => removeRow(idx)}
                            disabled={cargoRows.length <= 1}
                            style={{
                              width: "20px", height: "20px", display: "inline-flex",
                              alignItems: "center", justifyContent: "center",
                              border: "none", background: "transparent",
                              cursor: cargoRows.length <= 1 ? "not-allowed" : "pointer",
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
              <p className="text-xs text-gray-400 mt-1.5">{cargoRows.length} row{cargoRows.length !== 1 ? "s" : ""} · max 10 per GDN</p>
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
                  : editingGdn ? "Update & Copy" : "Save & Copy"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GDN List */}
      {!showForm && (
        <div className="space-y-3">
          {gdns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 bg-white border border-dashed border-gray-200 rounded-xl text-gray-400">
              <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-sm">No GDNs yet</p>
              <p className="text-xs mt-1">Click <strong>New GDN</strong> to get started</p>
            </div>
          ) : (
            gdns.map(gdn => {
              const items = gdn.storage_gdn_items || [];
              const total_pkgs = items.reduce((s: number, i: any) => s + (Number(i.no_of_packages) || 0), 0);
              const total_gross = items.reduce((s: number, i: any) => s + (Number(i.gross_weight) || 0), 0);
              const total_cbm = items.reduce((s: number, i: any) => s + (Number(i.volume_cbm) || 0), 0);

              return (
                <div key={gdn.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-indigo-700 font-mono">{gdn.gdn_number}</span>
                      {statusBadge(gdn.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => { await copyGDNToClipboard(gdn); alert("Copied to clipboard!"); }}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100 hover:border-indigo-100">Copy</button>
                      <button onClick={() => printGDN(gdn)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-gray-100 hover:border-emerald-100">Print</button>
                      <button onClick={() => openEdit(gdn)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-100 hover:border-indigo-100">Edit</button>
                      {deleteConfirm === gdn.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button onClick={() => handleDelete(gdn.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(gdn.id)}
                          className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-100 hover:border-red-100">Delete</button>
                      )}
                    </div>
                  </div>

                  <div className="px-4 py-3">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-3">
                      <span><span className="font-medium text-gray-700">Customer:</span> {gdn.customers?.company_name || "—"}</span>
                      <span><span className="font-medium text-gray-700">Date:</span> {gdn.delivery_date}</span>
                      {gdn.storage_grn?.grn_number && <span><span className="font-medium text-gray-700">GRN:</span> {gdn.storage_grn.grn_number}</span>}
                      {gdn.vehicle_no && <span><span className="font-medium text-gray-700">Vehicle:</span> {gdn.vehicle_no}</span>}
                      {gdn.delivered_to && <span><span className="font-medium text-gray-700">Delivered To:</span> {gdn.delivered_to}</span>}
                      {gdn.delivered_by && <span><span className="font-medium text-gray-700">Delivered By:</span> {gdn.delivered_by}</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap mb-3">
                      {total_pkgs > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">📦 {total_pkgs.toLocaleString()} pkgs</span>}
                      {total_gross > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">⚖️ {total_gross.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg</span>}
                      {total_cbm > 0 && <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">📐 {total_cbm.toLocaleString(undefined, { maximumFractionDigits: 3 })} CBM</span>}
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">{items.length} line{items.length !== 1 ? "s" : ""}</span>
                    </div>
                    {items.length > 0 && (
                      <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "640px", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                              {["Commodity", "Packing", "Pkgs", "Gross Wt", "Net Wt", "CBM", "Delivery Address", "Remarks"].map((h, i) => (
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
                                <td style={{ padding: "5px 10px", color: "#6b7280", borderRight: "1px solid #f3f4f6" }}>{item.delivery_address || "—"}</td>
                                <td style={{ padding: "5px 10px", color: "#6b7280" }}>{item.remarks || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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