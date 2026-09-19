import { createClient } from "@/lib/supabase/server";
import {
  Package, Truck, CheckCircle2, ChevronLeft, AlertCircle,
  MapPin, CreditCard, Clock, RotateCcw, X, Calendar, FileText, Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { cancelOrder, requestReturn } from "@/lib/db/order_actions";
import { redirect } from "next/navigation";
import InvoiceDownloadButton from "@/components/orders/InvoiceDownloadButton";

/* ─── Full tracking pipeline ─────────────────────────── */
const PIPELINE = [
  { key: "pending",           label: "Order Placed",             desc: "Your order has been received." },
  { key: "confirmed",         label: "Order Confirmed",           desc: "Order confirmed and queued for processing." },
  { key: "frame_reserved",    label: "Frame Reserved",            desc: "Your frame has been reserved." },
  { key: "frame_preparing",   label: "Frame Being Prepared",      desc: "Frame is being cleaned and readied." },
  { key: "lens_selected",     label: "Lens Selected",             desc: "Optimal lenses chosen for your prescription." },
  { key: "lens_manufacturing",label: "Lenses Manufacturing",      desc: "Your custom lenses are being precision-cut." },
  { key: "lens_fitting",      label: "Lens Fitting",              desc: "Lenses are being fitted into your frame." },
  { key: "quality_check",     label: "Quality Inspection",        desc: "Final quality check by our optical experts." },
  { key: "packed",            label: "Packed",                    desc: "Your order has been packed securely." },
  { key: "waiting_shipment",  label: "Waiting for Shipment",      desc: "Package awaiting courier pickup." },
  { key: "shipped",           label: "Shipped",                   desc: "On its way to you!" },
  { key: "out_for_delivery",  label: "Out for Delivery",          desc: "Your order is almost there." },
  { key: "delivered",         label: "Delivered",                 desc: "Order delivered successfully." },
];

const STATUS_STYLES: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
  shipped:   "bg-blue-50 text-blue-700 border-blue-100",
  confirmed: "bg-violet-50 text-violet-700 border-violet-100",
  pending:   "bg-amber-50 text-amber-700 border-amber-100",
  cancelled: "bg-red-50 text-red-600 border-red-100",
  returned:  "bg-gray-50 text-gray-600 border-gray-200",
  refunded:  "bg-gray-50 text-gray-600 border-gray-200",
};

const PAYMENT_STYLES: Record<string, string> = {
  paid:    "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  failed:  "bg-red-50 text-red-600 border-red-100",
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/orders/" + id);

  // Fetch order
  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      users(name, email, phone),
      addresses(*),
      order_items(*, products(name, brand, product_images(*)), lenses(name)),
      prescriptions(*)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  // Fallback: try lens replacement order
  let isReplacement = false;
  let replacementOrder: any = null;
  if (!order) {
    const { data: repOrder } = await supabase
      .from("lens_replacement_orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (repOrder) {
      replacementOrder = repOrder;
      isReplacement = true;
    }
  }

  if (!order && !replacementOrder) {
    return (
      <div className="bg-[#F8F9FC] min-h-screen pt-28 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl border border-[#ECECEC] p-12 text-center max-w-md w-full">
          <AlertCircle size={40} className="mx-auto text-[#ECECEC] mb-4" />
          <h1 className="text-xl font-semibold text-[#111111] mb-2">Order not found</h1>
          <p className="text-[#666666] text-sm mb-6">This order doesn't exist or belongs to a different account.</p>
          <Link href="/orders" className="inline-block bg-[#03173D] text-white rounded-full px-6 py-3 font-semibold hover:bg-[#004AAD] transition-all text-sm">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const displayOrder = order || replacementOrder;
  const currentStatus = displayOrder.status;

  // Build timeline
  const historyMap: Record<string, { note: string | null; created_at: string; updated_by: string }> = {};
  if (order?.order_status_history) {
    for (const h of order.order_status_history) {
      // keep earliest occurrence for each status
      if (!historyMap[h.status] || h.created_at < historyMap[h.status].created_at) {
        historyMap[h.status] = h;
      }
    }
  }
  // Always include the order creation as "pending"
  if (!historyMap["pending"] && !isReplacement) {
    historyMap["pending"] = { note: null, created_at: displayOrder.created_at, updated_by: "system" };
  }

  const currentPipelineIdx = PIPELINE.findIndex(s => s.key === currentStatus);

  const isCancelled = ["cancelled", "returned", "refunded"].includes(currentStatus);
  const canCancel = ["pending", "confirmed"].includes(currentStatus);
  const canReturn = currentStatus === "delivered";
  const hasReturnRequest = !!displayOrder.return_requested_at;

  const addr = order?.addresses as any;
  const estDelivery = order?.estimated_delivery_date;

  return (
    <div className="bg-[#F8F9FC] min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Back */}
        <Link href="/orders" className="inline-flex items-center gap-2 text-[#004AAD] text-sm font-semibold hover:underline">
          <ChevronLeft size={16} /> Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-1">Order</p>
              <h1 className="text-2xl font-[var(--font-hero)] italic text-[#111111]">
                #{displayOrder.id.slice(0, 12).toUpperCase()}
              </h1>
              <p className="text-[#666666] text-sm mt-1">
                Placed on{" "}
                {new Date(displayOrder.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
              {estDelivery && (
                <p className="text-sm text-[#111111] mt-2 flex items-center gap-2">
                  <Calendar size={14} className="text-[#004AAD]" />
                  <span>
                    <span className="text-[#666666]">Est. delivery: </span>
                    <span className="font-semibold">
                      {new Date(estDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className={cn(
                "text-xs font-semibold px-3 py-1.5 rounded-full capitalize border",
                STATUS_STYLES[currentStatus] ?? "bg-gray-50 text-gray-600 border-gray-200"
              )}>
                {currentStatus.replace(/_/g, " ")}
              </span>
              <span className="text-lg font-bold text-[#111111]">
                ₹{Number(displayOrder.total_price || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!isCancelled && !isReplacement && (
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Order Progress</p>
            <div className="space-y-0">
              {PIPELINE.map((stage, i) => {
                const history = historyMap[stage.key];
                const isCompleted = currentPipelineIdx > i || !!history;
                const isCurrent = stage.key === currentStatus;
                const isPending = !isCompleted && !isCurrent;

                return (
                  <div key={stage.key} className="flex gap-4">
                    {/* Spine */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0",
                        isCurrent
                          ? "border-[#004AAD] bg-white shadow-[0_0_0_4px_rgba(0,74,173,0.1)]"
                          : isCompleted
                          ? "border-[#004AAD] bg-[#004AAD]"
                          : "border-[#ECECEC] bg-white"
                      )}>
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 size={14} className="text-white" />
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#004AAD] animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-[#ECECEC]" />
                        )}
                      </div>
                      {i < PIPELINE.length - 1 && (
                        <div className={cn(
                          "w-0.5 flex-1 min-h-[24px] my-1 transition-all",
                          isCompleted ? "bg-[#004AAD]" : "bg-[#ECECEC]"
                        )} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("pb-5 flex-1", i === PIPELINE.length - 1 ? "pb-0" : "")}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "text-sm font-semibold leading-tight",
                            isCurrent ? "text-[#004AAD]" : isCompleted ? "text-[#111111]" : "text-[#CCCCCC]"
                          )}>
                            {stage.label}
                          </p>
                          {(isCurrent || isCompleted) && (
                            <p className="text-xs text-[#888888] mt-0.5 leading-snug">
                              {history?.note || stage.desc}
                            </p>
                          )}
                        </div>
                        {history && (
                          <p className="text-[10px] text-[#AAAAAA] flex-shrink-0 mt-0.5">
                            {new Date(history.created_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short",
                            })}{" "}
                            {new Date(history.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
            <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">
                Order {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </p>
              {displayOrder.cancel_reason && (
                <p className="text-sm text-red-600 mt-1">{displayOrder.cancel_reason}</p>
              )}
              {currentStatus === "cancelled" && displayOrder.payment_status === "paid" && (
                <p className="text-sm text-red-600 mt-2">
                  Refund will be processed to your original payment method within 5-7 business days.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tracking info */}
        {(order?.tracking_id || order?.courier_partner) && !isCancelled && (
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-4">Shipment Details</p>
            <div className="flex flex-col sm:flex-row gap-6">
              {order?.courier_partner && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA] mb-1">Courier</p>
                  <p className="font-semibold text-[#111111]">{order.courier_partner}</p>
                </div>
              )}
              {order?.tracking_id && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#AAAAAA] mb-1">Tracking ID</p>
                  <p className="font-mono font-semibold text-[#004AAD]">{order.tracking_id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order items */}
        {!isReplacement && order?.order_items?.length > 0 && (
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Items Ordered</p>
            <div className="space-y-6 divide-y divide-[#F5F5F5]">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="pt-6 first:pt-0 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={item.products?.product_images?.[0]?.image_url || "/placeholder.jpg"}
                        className="w-full h-full object-contain p-1"
                        alt={item.products?.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-[#111111] text-sm">{item.products?.name}</p>
                          <p className="text-[#666666] text-xs mt-0.5">
                            {item.products?.brand} · Qty: {item.quantity}
                            {item.selected_color && ` · Color: ${item.selected_color}`}
                            {item.selected_size && ` · Size: ${item.selected_size}`}
                          </p>
                        </div>
                        <p className="font-semibold text-[#111111] text-sm flex-shrink-0">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
                      </div>

                      {/* Lens & Power details */}
                      <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                        <span className="text-[11px] font-medium bg-[#F4F6F8] text-[#444444] px-2.5 py-1 rounded-lg">
                          Lens: {item.lenses?.name || item.lens_type || "Frame Only"}
                        </span>
                        {item.prescription_json?.reading_power ? (
                          <span className="text-[11px] font-bold bg-blue-50 text-[#004AAD] border border-blue-200 px-2.5 py-1 rounded-lg">
                            Reading Power: {item.prescription_json.reading_power}
                          </span>
                        ) : (
                          (item.prescription_json?.os_sph || item.prescription_json?.od_sph || item.power_left || item.power_right) && (
                            <span className="text-[11px] font-medium bg-[#F4F6F8] text-[#444444] px-2.5 py-1 rounded-lg">
                              Power: {item.prescription_json?.os_sph || item.prescription_json?.od_sph 
                                ? `L: ${item.prescription_json.os_sph || "0.00"} | R: ${item.prescription_json.od_sph || "0.00"}`
                                : `L: ${item.power_left || "PL"} | R: ${item.power_right || "PL"}`}
                            </span>
                          )
                        )}
                        {item.prescription_json?.lens_package && (
                          <span className="text-[11px] font-medium bg-blue-50/50 text-[#004AAD] px-2.5 py-1 rounded-lg capitalize">
                            {item.prescription_json.lens_package}
                            {item.prescription_json.lens_tier ? ` (${item.prescription_json.lens_tier})` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clinical Prescription Matrix if custom powers attached */}
                  {(item.prescription_json?.right_eye || item.prescription_json?.left_eye) && (
                    <div className="bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl p-3.5 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#004AAD]">
                        Prescription Matrix {item.prescription_json.pd ? `(PD: ${item.prescription_json.pd} mm)` : ""}
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-lg border border-[#E8EAF2] overflow-hidden">
                          <thead className="bg-[#F4F6F8] text-[9px] uppercase font-bold text-[#666666]">
                            <tr>
                              <th className="px-2.5 py-1.5">Eye</th>
                              <th className="px-2.5 py-1.5">SPH</th>
                              <th className="px-2.5 py-1.5">CYL</th>
                              <th className="px-2.5 py-1.5">Axis</th>
                              {item.prescription_json.right_eye?.bc && <th className="px-2.5 py-1.5">BC</th>}
                              {item.prescription_json.right_eye?.dia && <th className="px-2.5 py-1.5">DIA</th>}
                              {item.prescription_json.right_eye?.add && <th className="px-2.5 py-1.5">Add</th>}
                            </tr>
                          </thead>
                          <tbody className="font-mono text-[11px] divide-y divide-[#E8EAF2]">
                            <tr>
                              <td className="px-2.5 py-1.5 font-sans font-bold text-[#004AAD]">Right (OD)</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.right_eye?.sph || "0.00"}</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.right_eye?.cyl || "—"}</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.right_eye?.axis || "—"}</td>
                              {item.prescription_json.right_eye?.bc && <td className="px-2.5 py-1.5">{item.prescription_json.right_eye.bc} mm</td>}
                              {item.prescription_json.right_eye?.dia && <td className="px-2.5 py-1.5">{item.prescription_json.right_eye.dia} mm</td>}
                              {item.prescription_json.right_eye?.add && <td className="px-2.5 py-1.5">{item.prescription_json.right_eye.add}</td>}
                            </tr>
                            <tr>
                              <td className="px-2.5 py-1.5 font-sans font-bold text-[#004AAD]">Left (OS)</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.sph || "0.00"}</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.cyl || "—"}</td>
                              <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.axis || "—"}</td>
                              {item.prescription_json.right_eye?.bc && <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.bc || "—"} mm</td>}
                              {item.prescription_json.right_eye?.dia && <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.dia || "—"} mm</td>}
                              {item.prescription_json.right_eye?.add && <td className="px-2.5 py-1.5">{item.prescription_json.left_eye?.add || "—"}</td>}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Uploaded Prescription Slip */}
                  {item.prescription_json?.file_url && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 overflow-hidden flex-shrink-0">
                          <img src={item.prescription_json.file_url} alt="Prescription" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#111111]">Attached Prescription Slip</p>
                          <p className="text-[10px] text-[#666666]">Provided during configuration</p>
                        </div>
                      </div>
                      <a
                        href={item.prescription_json.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-[#ECECEC] rounded-lg text-xs font-semibold text-[#004AAD] hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                      >
                        <Download size={13} /> View Slip
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Prescriptions on Order level if any */}
            {order.prescriptions && order.prescriptions.length > 0 && (
              <div className="mt-6 pt-6 border-t border-[#ECECEC] space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD]">Prescription Attachment</p>
                {order.prescriptions.map((rx: any, idx: number) => (
                  <div key={rx.id || idx} className="p-3 bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-[#004AAD]" />
                      <div>
                        <p className="text-xs font-semibold text-[#111111]">Prescription #{idx + 1}</p>
                        <p className="text-[10px] text-[#666666]">
                          {rx.left_eye && `L: ${rx.left_eye}`} {rx.right_eye && `| R: ${rx.right_eye}`} {rx.pd && `| PD: ${rx.pd}mm`}
                        </p>
                      </div>
                    </div>
                    {(rx.file_url || rx.download_url) && (
                      <a
                        href={rx.file_url || rx.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-[#ECECEC] rounded-lg text-xs font-semibold text-[#004AAD] hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                      >
                        <Download size={13} /> View Prescription
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-5 mt-6 border-t border-[#ECECEC]">
              <span className="text-sm text-[#666666]">Order Total</span>
              <span className="text-lg font-bold text-[#111111]">₹{Number(displayOrder.total_price || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}

        {/* Replacement service info */}
        {isReplacement && (
          <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-4">Service Details</p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F8F9FC] border border-[#ECECEC] rounded-2xl flex items-center justify-center">
                <Package size={22} className="text-[#004AAD]" />
              </div>
              <div>
                <p className="font-semibold text-[#111111]">Lens Replacement Service</p>
                <p className="text-[#666666] text-sm">Frame: {replacementOrder?.frame_type}</p>
                {replacementOrder?.pickup_date && (
                  <p className="text-[#666666] text-xs mt-0.5">Pickup: {new Date(replacementOrder.pickup_date).toLocaleDateString("en-IN")}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-6">Order Summary</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            {(addr || displayOrder.shipping_address) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={14} className="text-[#004AAD]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Shipping Address</p>
                </div>
                <div className="bg-[#F8F9FC] rounded-2xl border border-[#ECECEC] p-4 text-sm text-[#111111] leading-relaxed">
                  {addr ? (
                    <>
                      <p className="font-semibold">{addr.name}</p>
                      <p className="text-[#666666]">{addr.address}</p>
                      <p className="text-[#666666]">{addr.city}, {addr.state} — {addr.pincode}</p>
                      {addr.phone && <p className="text-[#666666]">{addr.phone}</p>}
                    </>
                  ) : (
                    <p className="text-[#666666]">{JSON.stringify(displayOrder.shipping_address)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Payment */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={14} className="text-[#004AAD]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[#666666]">Payment</p>
              </div>
              <div className="bg-[#F8F9FC] rounded-2xl border border-[#ECECEC] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Method</span>
                  <span className="font-semibold text-[#111111] capitalize">
                    {displayOrder.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Status</span>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full border capitalize",
                    PAYMENT_STYLES[displayOrder.payment_status] ?? "bg-gray-50 text-gray-600 border-gray-200"
                  )}>
                    {displayOrder.payment_status}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#ECECEC] flex justify-between">
                  <span className="font-semibold text-[#111111]">Total</span>
                  <span className="font-bold text-[#111111] text-lg">₹{Number(displayOrder.total_price || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-3xl border border-[#ECECEC] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#004AAD] mb-4">Actions</p>
          <div className="flex flex-wrap gap-3">

            {/* Cancel order */}
            {canCancel && (
              <form action={async () => {
                "use server";
                await cancelOrder(id, "Cancelled by customer");
              }}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
                >
                  <X size={14} />
                  Cancel Order
                </button>
              </form>
            )}

            {/* Return request */}
            {canReturn && !hasReturnRequest && (
              <form action={async () => {
                "use server";
                await requestReturn(id, "Return requested by customer");
              }}>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#ECECEC] text-[#666666] text-sm font-semibold hover:border-[#004AAD] hover:text-[#004AAD] transition-colors"
                >
                  <RotateCcw size={14} />
                  Request Return
                </button>
              </form>
            )}

            {hasReturnRequest && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm font-semibold">
                <Clock size={14} />
                Return Requested — We'll contact you soon
              </div>
            )}

            {/* Invoice download */}
            {!isReplacement && order?.order_items?.length > 0 && (
              <InvoiceDownloadButton
                order={{
                  id: order.id,
                  created_at: order.created_at,
                  total_price: order.total_price,
                  payment_method: order.payment_method,
                  payment_status: order.payment_status,
                  order_items: order.order_items,
                  addresses: addr,
                }}
                customer={{
                  name: order.users?.name || addr?.name || "Customer",
                  email: order.users?.email || "",
                  phone: order.users?.phone || addr?.phone,
                }}
              />
            )}

            {/* Contact support */}
            <Link
              href="/contact"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#ECECEC] text-[#666666] text-sm font-semibold hover:border-[#004AAD] hover:text-[#004AAD] transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
