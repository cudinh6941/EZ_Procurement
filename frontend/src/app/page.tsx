"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  Layers,
  Database,
  Settings,
  Sparkles,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

import Goi1BaseForm from "@/components/Goi1BaseForm";
import { submitHoSoGoi1 } from "@/actions/goi1Actions";

// Item interface definitions
interface MaterialItem {
  id: string;
  tenHangHoa: string;
  giaTien: number | "";
  soLuong: number | "";
  dvt: string;
  chungChi: string;
  chiTiet: string;
  ghiChu: string;
}

// General Info interface definitions
interface GeneralInfo {
  soDeXuat: string;
  muaChoAi: string;
  ngayDeXuat: string;
  boPhanYeuCau: string;
  thoiGianGiaoHang: string;
  soThuMoi: string;
  thoiGianBaoHanh: string;
  ngayLamThuMoi: string;
  hanChotChaoGia: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export default function ProcurementProfilePage() {
  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Part 1: General Info Form state
  const [generalInfo, setGeneralInfo] = useState<GeneralInfo>({
    soDeXuat: "",
    muaChoAi: "",
    ngayDeXuat: "",
    boPhanYeuCau: "",
    thoiGianGiaoHang: "",
    soThuMoi: "",
    thoiGianBaoHanh: "",
    ngayLamThuMoi: "",
    hanChotChaoGia: "",
  });

  // Part 1: General Info Form errors
  const [generalInfoErrors, setGeneralInfoErrors] = useState<Record<string, string>>({});

  // Part 2: Materials list state
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // Loading state when calling Server Actions / API
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to trigger a toast notification
  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Change handler for Part 1 Form fields
  const handleGeneralInfoChange = (field: keyof GeneralInfo, value: string) => {
    setGeneralInfo((prev) => ({ ...prev, [field]: value }));
    // Clear validation error if typed
    if (generalInfoErrors[field]) {
      setGeneralInfoErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Add material item added from Modal
  const handleAddItem = (newItemData: Omit<MaterialItem, "id">) => {
    const newItem: MaterialItem = {
      ...newItemData,
      id: Math.random().toString(36).substring(2, 9),
    };
    setItems((prev) => [...prev, newItem]);
    
    // Clear list length error if exists
    if (itemErrors.listEmpty) {
      setItemErrors((prev) => {
        const { listEmpty: _, ...rest } = prev;
        return rest;
      });
    }
    showToast("success", "Đã thêm hàng hóa", `Đã đưa "${newItemData.tenHangHoa}" vào danh sách.`);
  };

  // Delete a material item
  const handleDeleteItem = (id: string, name: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    showToast("info", "Đã xóa hàng hóa", `Đã xóa mặt hàng "${name || "Không tên"}" khỏi danh sách`);
  };

  // Populate sample data for quick validation & UX testing
  const loadSampleData = () => {
    setGeneralInfo({
      soDeXuat: `DX-MS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      muaChoAi: "Chi nhánh miền Nam - Tòa nhà Landmark 81",
      ngayDeXuat: new Date().toISOString().split("T")[0],
      boPhanYeuCau: "Ban Kế hoạch & Điều phối công nghệ",
      thoiGianGiaoHang: "Trước ngày 30/08/2026",
      soThuMoi: `TM-MS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      thoiGianBaoHanh: "24 tháng kể từ ngày nghiệm thu",
      ngayLamThuMoi: new Date().toISOString().split("T")[0],
      hanChotChaoGia: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days later
    });

    setItems([
      {
        id: "sample-1",
        tenHangHoa: "Laptop ThinkPad L14 Gen 4 Core i5",
        giaTien: 21500000,
        soLuong: 12,
        dvt: "Bộ",
        chungChi: "CO, CQ, CE, ISO 9001",
        chiTiet: "CPU Intel i5-1335U, RAM 16GB, SSD 512GB, màn hình IPS FHD 14.0 inch.",
        ghiChu: "Bàn giao đầy đủ phụ kiện balo và chuột không dây đi kèm.",
      },
      {
        id: "sample-2",
        tenHangHoa: "Aruba Access Point AP-303 (JZ320A)",
        giaTien: 6800000,
        soLuong: 4,
        dvt: "Cái",
        chungChi: "CO, CQ, RoHS",
        chiTiet: "Dual-band 802.11ac, Bluetooth BLE, hỗ trợ cấp nguồn PoE.",
        ghiChu: "Thiết bị mới 100%, bảo hành 12 tháng.",
      }
    ]);

    setGeneralInfoErrors({});
    setItemErrors({});
    showToast("success", "Tải dữ liệu mẫu ERP", "Đã nạp dữ liệu Đề xuất & Thư mời chào giá thử nghiệm.");
  };

  // Clear all form data
  const resetForm = () => {
    setGeneralInfo({
      soDeXuat: "",
      muaChoAi: "",
      ngayDeXuat: "",
      boPhanYeuCau: "",
      thoiGianGiaoHang: "",
      soThuMoi: "",
      thoiGianBaoHanh: "",
      ngayLamThuMoi: "",
      hanChotChaoGia: "",
    });
    setItems([]);
    setGeneralInfoErrors({});
    setItemErrors({});
    showToast("info", "Làm mới form", "Đã xóa toàn bộ dữ liệu trên màn hình nhập liệu.");
  };

  // Validate form entries
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Part 1 fields validation
    if (!generalInfo.soDeXuat.trim()) errors.soDeXuat = "Bắt buộc nhập số đề xuất";
    if (!generalInfo.muaChoAi.trim()) errors.muaChoAi = "Bắt buộc nhập người mua/dự án";
    if (!generalInfo.ngayDeXuat.trim()) errors.ngayDeXuat = "Bắt buộc chọn ngày đề xuất";
    if (!generalInfo.boPhanYeuCau.trim()) errors.boPhanYeuCau = "Bắt buộc nhập bộ phận yêu cầu";
    if (!generalInfo.soThuMoi.trim()) errors.soThuMoi = "Bắt buộc nhập số thư mời";
    if (!generalInfo.thoiGianGiaoHang.trim()) errors.thoiGianGiaoHang = "Bắt buộc nhập thời gian giao hàng";
    if (!generalInfo.thoiGianBaoHanh.trim()) errors.thoiGianBaoHanh = "Bắt buộc nhập thời gian bảo hành";
    if (!generalInfo.ngayLamThuMoi.trim()) errors.ngayLamThuMoi = "Bắt buộc chọn ngày làm thư mời";
    if (!generalInfo.hanChotChaoGia.trim()) errors.hanChotChaoGia = "Bắt buộc chọn hạn chót chào giá";

    setGeneralInfoErrors(errors);

    // Part 2 table list length validation
    const isItemsValid = items.length > 0;
    if (!isItemsValid) {
      setItemErrors({ listEmpty: "Vui lòng thêm ít nhất 1 hàng hóa vào danh sách trước khi tạo hồ sơ." });
    } else {
      setItemErrors({});
    }

    const isValid = Object.keys(errors).length === 0 && isItemsValid;
    return isValid;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("error", "Lỗi Validation", "Vui lòng điền đầy đủ các thông tin bắt buộc còn trống hoặc bổ sung hàng hóa.");
      return;
    }

    setIsSubmitting(true);
    showToast("info", "Đang lưu & sinh hồ sơ...", "Đang ghi nhận dữ liệu vào PostgreSQL và phát hành văn bản...");

    try {
      // Execute PostgreSQL transaction and document generation in Server Action
      const result = await submitHoSoGoi1(generalInfo, items);

      // Gọi fetch đồng bộ hoặc kích hoạt API bổ sung phía client
      // const response = await fetch("http://localhost:5000/run-next-step", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     ho_so_id: result.success ? 1 : null,
      //     generalInfo,
      //     items,
      //   }),
      // });

      if (result.success && result.fileName) {
        // ✅ Cả DB lẫn Flask đều thành công
        showToast(
          "success",
          "Thành công! 🎉",
          "Hồ sơ đã lưu Database thành công & File zip đã sẵn sàng tải xuống."
        );
        window.open(`http://localhost:5000/download-file/${result.fileName}`, "_blank");
      } else if (result.success && !result.fileName) {
        // ⚠️ DB thành công, nhưng Flask không sinh ra file
        showToast(
          "info",
          "Lưu DB thành công, chưa có file",
          `Hồ sơ ${result.maHoSo || ""} đã được ghi vào Database. Tuy nhiên Flask chưa trả về file — kiểm tra Flask server có đang chạy không.`
        );
      } else {
        // ❌ DB transaction thất bại
        showToast(
          "error",
          "Lỗi hệ thống",
          result.error || "Giao dịch cơ sở dữ liệu không thành công."
        );
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      showToast(
        "error",
        "Lỗi Kết Nối",
        "Không thể thực thi Server Action hoặc backend server ngoại tuyến."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50/50 text-slate-800 dark:bg-zinc-950 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* 1. LEFT SIDEBAR */}
      <aside
        className={`relative flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out z-20 ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded-lg bg-indigo-600/95 text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Layers className="size-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-wide text-white uppercase">
                  ENTERPRISE ERP
                </span>
                <span className="text-xs text-indigo-400 font-medium"> Procurement Hub</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {!isSidebarCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Nghiệp Vụ Mua Sắm
            </div>
          )}

          {/* Menu Item 1 */}
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative bg-indigo-600 text-white shadow-md shadow-indigo-600/10`}
          >
            <FileText className="size-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Gói 1: Thư Mời</span>}
            {isSidebarCollapsed && (
              <div className="absolute left-14 hidden group-hover:block bg-slate-950 text-xs text-white rounded py-1 px-2.5 whitespace-nowrap shadow-xl border border-slate-800 pointer-events-none z-50">
                Gói 1: Tạo Hồ Sơ & Thư Mời
              </div>
            )}
          </button>

          {/* Menu Item 2 */}
          <Link
            href="/goi-2"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/40 hover:text-white transition-all group relative"
          >
            <Users className="size-5 shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Gói 2: Đánh Giá NCC</span>}
          </Link>

          {/* Settings & connection options */}
          <div className="pt-4 mt-4 border-t border-slate-800/80">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Tiện Ích Hệ Thống
              </div>
            )}
            <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/40 rounded-lg text-sm group relative">
              <Database className="size-4 shrink-0 text-slate-500" />
              {!isSidebarCollapsed && <span className="text-xs">Kết nối Hệ Thống</span>}
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/40 rounded-lg text-sm group relative">
              <Settings className="size-4 shrink-0 text-slate-500" />
              {!isSidebarCollapsed && <span className="text-xs">Cấu hình tham số</span>}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium">
                <ChevronLeft className="size-5" />
                <span>Thu gọn menu</span>
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOPBAR */}
        <header className="h-16 border-b border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <span>Hệ thống ERP</span>
              <span>/</span>
              <span>Quản lý mua sắm</span>
              <span>/</span>
              <span className="text-slate-600 dark:text-slate-300">Gói 1: Thư Mời</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Tạo Hồ Sơ Mua Sắm & Phát Hành Thư Mời (Master-Detail ERP)
            </h1>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={loadSampleData}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-650 transition-colors"
                title="Tải nhanh bộ dữ liệu mẫu ERP đầy đủ"
              >
                <Sparkles className="size-3" />
                Dữ liệu mẫu ERP
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                title="Clear dữ liệu trên Form"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800"></div>

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Nguyễn Quốc Dũng</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  Trưởng ban mua sắm
                </span>
              </div>
              <div className="size-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm border-2 border-white dark:border-zinc-800 shadow shadow-indigo-500/10">
                QD
              </div>
            </div>
          </div>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pb-28">
          <form
            onSubmit={handleSubmit}
            className="max-w-6xl mx-auto space-y-6"
          >
            
            {/* GOI 1 BASE FORM */}
            <Goi1BaseForm
              values={generalInfo}
              errors={generalInfoErrors}
              onChange={handleGeneralInfoChange}
              items={items}
              itemErrors={itemErrors}
              isSubmitting={isSubmitting}
              isSidebarCollapsed={isSidebarCollapsed}
              onAddItem={handleAddItem}
              onDeleteItem={handleDeleteItem}
              onResetForm={resetForm}
            />

          </form>
        </main>

        {/* TOAST NOTIFICATIONS RENDERER */}
        <div className="fixed top-6 right-6 flex flex-col gap-3 z-50 w-full max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="p-4 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur flex items-start gap-3 pointer-events-auto transform translate-y-0 transition-all duration-300 ease-out border-l-4 animate-slideIn"
              style={{
                borderLeftColor:
                  toast.type === "success"
                    ? "var(--color-indigo-500, #4f46e5)"
                    : toast.type === "error"
                    ? "var(--color-rose-500, #f43f5e)"
                    : "var(--color-indigo-400, #818cf8)",
              }}
            >
              <div className="shrink-0 pt-0.5">
                {toast.type === "success" ? (
                  <CheckCircle className="size-5 text-indigo-500" />
                ) : toast.type === "error" ? (
                  <XCircle className="size-5 text-rose-500" />
                ) : (
                  <AlertCircle className="size-5 text-indigo-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {toast.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
