"use client";

import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
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
  AlertCircle,
  Plus,
  Trash2,
  Award,
  UserCheck,
  Calculator,
  Loader2,
  Info
} from "lucide-react";

import Goi1BaseForm from "@/components/Goi1BaseForm";
import { submitHoSoGoi2, Goi2Payload, Vendor, HandoverAllocation } from "@/actions/goi2Actions";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
}

export default function Goi2ProcurementPage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // React Hook Form initialization
  const methods = useForm<Goi2Payload>({
    defaultValues: {
      so_de_xuat: "",
      mua_cho_ai: "",
      ngay_de_xuat: "",
      bo_phan_yeu_cau: "",
      thoi_gian_giao_hang: "",
      so_thu_moi: "",
      thoi_gian_bao_hanh: "",
      ngay_lam_thu_moi: "",
      han_chot_chao_gia: "",
      items: [],
      nha_cung_cap: [],
      nha_thau_trung_id: "",
      phan_bo_ban_giao: []
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors }
  } = methods;

  // Watchers to trigger reactive changes
  const watchedItems = watch("items") || [];
  const watchedVendors = watch("nha_cung_cap") || [];
  const watchedWinningVendorId = watch("nha_thau_trung_id");

  // Show toast notification helper
  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Sync goods list into vendor quotes and handover allocations
  useEffect(() => {
    const currentItems = getValues("items") || [];

    // 1. Sync quotes in vendors
    const currentVendors = getValues("nha_cung_cap") || [];
    const updatedVendors = currentVendors.map((vendor) => {
      const existingQuotes = vendor.quotes || [];
      const updatedQuotes = currentItems.map((item) => {
        const existing = existingQuotes.find((q) => q.ten_hang === item.ten_hang);
        return {
          ten_hang: item.ten_hang,
          don_gia: existing ? Number(existing.don_gia) : 0,
          danh_gia: existing ? existing.danh_gia : ("dat" as const)
        };
      });
      return {
        ...vendor,
        quotes: updatedQuotes
      };
    });
    setValue("nha_cung_cap", updatedVendors);

    // 2. Sync allocations
    const currentAllocations = getValues("phan_bo_ban_giao") || [];
    const updatedAllocations = currentItems.map((item) => {
      const existing = currentAllocations.find((a) => a.ten_hang === item.ten_hang);

      if (!existing || !existing.allocations || existing.allocations.length === 0) {
        return {
          ten_hang: item.ten_hang,
          allocations: [{ nguoi_nhan: "", so_luong_nhan: Number(item.so_luong) || 0 }]
        };
      }

      // If quantity has changed, adjust the allocations sum
      const sumAllocated = existing.allocations.reduce((sum, a) => sum + Number(a.so_luong_nhan), 0);
      const targetQty = Number(item.so_luong) || 0;

      if (sumAllocated !== targetQty) {
        const firstAlloc = existing.allocations[0];
        const restAllocs = existing.allocations.slice(1);
        const restSum = restAllocs.reduce((sum, a) => sum + Number(a.so_luong_nhan), 0);

        return {
          ten_hang: item.ten_hang,
          allocations: [
            { nguoi_nhan: firstAlloc.nguoi_nhan, so_luong_nhan: Math.max(0, targetQty - restSum) },
            ...restAllocs
          ]
        };
      }

      return {
        ten_hang: item.ten_hang,
        allocations: existing.allocations
      };
    });
    setValue("phan_bo_ban_giao", updatedAllocations);
  }, [watchedItems, setValue, getValues]);

  // Calculations for each vendor's quote
  const getVendorSummary = (vendor: Vendor) => {
    const preVat = (vendor.quotes || []).reduce((sum, quote) => {
      const item = watchedItems.find((i) => i.ten_hang === quote.ten_hang);
      const qty = item ? Number(item.so_luong) || 0 : 0;
      return sum + qty * (Number(quote.don_gia) || 0);
    }, 0);
    const vatRate = Number(vendor.thue_vat) || 0;
    const vat = preVat * (vatRate / 100);
    const total = preVat + vat;
    return { preVat, vat, total };
  };

  // Find current winning vendor metadata
  const winningVendor = watchedVendors.find((v) => v.id === watchedWinningVendorId);
  const winningSummary = winningVendor ? getVendorSummary(winningVendor) : null;

  // Handle sample data loading for quick testing
  const loadSampleData = () => {
    const samplePayload: Goi2Payload = {
      so_de_xuat: `DX-G2-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      mua_cho_ai: "Chi nhánh miền Nam - Tòa nhà Landmark 81",
      ngay_de_xuat: new Date().toISOString().split("T")[0],
      bo_phan_yeu_cau: "Ban Kế hoạch & Điều phối công nghệ",
      thoi_gian_giao_hang: "Trước ngày 30/08/2026",
      so_thu_moi: `TM-MS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      thoi_gian_bao_hanh: "24 tháng kể từ ngày nghiệm thu",
      ngay_lam_thu_moi: new Date().toISOString().split("T")[0],
      han_chot_chao_gia: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [
        {
          id: "sample-1",
          ten_hang: "Server Dell PowerEdge R760 Intel Xeon Gold",
          chi_tiet: "Xeon 6430 32-core, RAM 128GB DDR5, HDD 4x 2.4TB SAS 12G",
          dvt: "Cái",
          so_luong: 3,
          chung_chi: "CO, CQ, CE, ISO 9001",
          thoi_gian_bao_hanh: "36 tháng",
          ghi_chu: "Bàn giao đầy đủ phụ kiện balo và chuột không dây đi kèm."
        },
        {
          id: "sample-2",
          ten_hang: "Thiết bị mạng Firewall FortiGate FG-100F",
          chi_tiet: "Hỗ trợ 22x GE RJ45, 4x 10G SFP+ slots, bảo hành 3 năm Gold",
          dvt: "Cái",
          so_luong: 2,
          chung_chi: "CO, CQ, RoHS",
          thoi_gian_bao_hanh: "12 tháng",
          ghi_chu: "Thiết bị mới 100%, bảo hành 12 tháng."
        },
        {
          id: "sample-3",
          ten_hang: "Tủ rack APC NetShelter SX 42U AR3100",
          chi_tiet: "Chuẩn rack 19 inch, rộng 600mm x sâu 1070mm, tải trọng 1.3 tấn",
          dvt: "Tủ",
          so_luong: 1,
          chung_chi: "CO, CQ",
          thoi_gian_bao_hanh: "6 tháng",
          ghi_chu: "Lắp đặt cố định tại phòng máy chủ"
        }
      ],
      nha_cung_cap: [
        {
          id: "vendor-1",
          ten_ncc: "Công ty Cổ phần Tích hợp Hệ thống HPT",
          thue_vat: 8,
          quotes: [
            {
              ten_hang: "Server Dell PowerEdge R760 Intel Xeon Gold",
              don_gia: 195000000,
              danh_gia: "dat"
            },
            {
              ten_hang: "Thiết bị mạng Firewall FortiGate FG-100F",
              don_gia: 88000000,
              danh_gia: "dat"
            },
            {
              ten_hang: "Tủ rack APC NetShelter SX 42U AR3100",
              don_gia: 29000000,
              danh_gia: "dat"
            }
          ]
        },
        {
          id: "vendor-2",
          ten_ncc: "Tập đoàn Công nghệ CMC TS",
          thue_vat: 8,
          quotes: [
            {
              ten_hang: "Server Dell PowerEdge R760 Intel Xeon Gold",
              don_gia: 188000000,
              danh_gia: "dat"
            },
            {
              ten_hang: "Thiết bị mạng Firewall FortiGate FG-100F",
              don_gia: 91000000,
              danh_gia: "dat"
            },
            {
              ten_hang: "Tủ rack APC NetShelter SX 42U AR3100",
              don_gia: 31000000,
              danh_gia: "dat"
            }
          ]
        }
      ],
      nha_thau_trung_id: "vendor-2",
      phan_bo_ban_giao: [
        {
          ten_hang: "Server Dell PowerEdge R760 Intel Xeon Gold",
          allocations: [
            { nguoi_nhan: "Nguyễn Văn A - IT Miền Bắc", so_luong_nhan: 2 },
            { nguoi_nhan: "Trần Thị B - IT Miền Nam", so_luong_nhan: 1 }
          ]
        },
        {
          ten_hang: "Thiết bị mạng Firewall FortiGate FG-100F",
          allocations: [
            { nguoi_nhan: "Lê Văn C - Kỹ thuật NOC", so_luong_nhan: 1 },
            { nguoi_nhan: "Nguyễn Thị D - Dự phòng SOC", so_luong_nhan: 1 }
          ]
        },
        {
          ten_hang: "Tủ rack APC NetShelter SX 42U AR3100",
          allocations: [
            { nguoi_nhan: "Lê Văn C - Kỹ thuật NOC", so_luong_nhan: 1 }
          ]
        }
      ]
    };

    reset(samplePayload);
    showToast("success", "Nạp dữ liệu mẫu Gói 2", "Đã tải thành công bộ hồ sơ thẩm định và chọn thầu mẫu.");
  };

  // Form Submission
  const onSubmit = async (data: Goi2Payload) => {
    if (data.items.length === 0) {
      showToast("error", "Lỗi biểu mẫu", "Vui lòng nhập ít nhất 1 hàng hóa ở Section 1.");
      return;
    }
    if (data.nha_cung_cap.length === 0) {
      showToast("error", "Lỗi biểu mẫu", "Vui lòng thêm ít nhất 1 Nhà cung cấp báo giá ở Section 2.");
      return;
    }
    if (!data.nha_thau_trung_id) {
      showToast("error", "Lỗi biểu mẫu", "Vui lòng chọn Nhà cung cấp trúng thầu ở Section 3.");
      return;
    }

    // Validate allocations sum matches item quantity
    for (const item of data.items) {
      const allocObj = data.phan_bo_ban_giao.find((a) => a.ten_hang === item.ten_hang);
      if (allocObj) {
        const sum = allocObj.allocations.reduce((s: number, a: any) => s + Number(a.so_luong_nhan || 0), 0);
        if (sum !== Number(item.so_luong)) {
          showToast(
            "error",
            "Sai lệch số lượng bàn giao",
            `Mặt hàng "${item.ten_hang}" có tổng phân bổ (${sum}) khác với số lượng đề xuất (${item.so_luong}).`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    showToast("info", "Đang đúc hồ sơ Gói 2...", "Ghi nhận vào PostgreSQL & Trình ký tự động...");

    try {
      const response = await submitHoSoGoi2(data);
      if (response.success) {
        showToast("success", "Đại thắng! 🎉", "Hồ sơ Gói 2 đã tạo thành công trong CSDL.");
        if (response.fileName) {
          window.open(`http://localhost:5000/download-file/${response.fileName}`, "_blank");
        }
      } else {
        showToast("error", "Lỗi hệ thống", response.error || "Giao dịch CSDL thất bại.");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Lỗi kết nối", "Không thể gọi Server Action hoặc máy chủ ngoại tuyến.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="flex h-screen w-full bg-slate-50/50 text-slate-800 dark:bg-zinc-950 dark:text-slate-100 overflow-hidden font-sans">

        {/* 1. LEFT SIDEBAR */}
        <aside
          className={`relative flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out z-20 ${isSidebarCollapsed ? "w-16" : "w-64"
            }`}
        >
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
                  <span className="text-xs text-indigo-400 font-medium">Procurement Hub</span>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {!isSidebarCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Nghiệp Vụ Mua Sắm
              </div>
            )}

            {/* Link to Gói 1 */}
            <Link
              href="/"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative text-slate-400 hover:bg-slate-800/40 hover:text-white"
            >
              <FileText className="size-5 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Gói 1: Thư Mời</span>}
            </Link>

            {/* Active Gói 2 */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative bg-indigo-600 text-white shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Users className="size-5 shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Gói 2: Đánh Giá NCC</span>}
            </button>

            <div className="pt-4 mt-4 border-t border-slate-800/80">
              {!isSidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  Tiện Ích Hệ Thống
                </div>
              )}
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/40 rounded-lg text-sm group relative cursor-pointer">
                <Database className="size-4 shrink-0 text-slate-500" />
                {!isSidebarCollapsed && <span className="text-xs">Kết nối Hệ Thống</span>}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/40 rounded-lg text-sm group relative cursor-pointer">
                <Settings className="size-4 shrink-0 text-slate-500" />
                {!isSidebarCollapsed && <span className="text-xs">Cấu hình tham số</span>}
              </button>
            </div>
          </nav>

          <div className="p-2 border-t border-slate-800 bg-slate-950/20">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors cursor-pointer"
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
                <span className="text-slate-600 dark:text-slate-300">Gói 2: Đánh Giá NCC</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                One-Click Automation: Quy Trình Thẩm Định Báo Giá & Phân Bổ Bàn Giao
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-650 transition-colors cursor-pointer"
                  title="Tải nhanh dữ liệu thầu mẫu"
                >
                  <Sparkles className="size-3" />
                  Dữ liệu mẫu Gói 2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    reset({
                      so_de_xuat: "",
                      mua_cho_ai: "",
                      ngay_de_xuat: "",
                      bo_phan_yeu_cau: "",
                      thoi_gian_giao_hang: "",
                      so_thu_moi: "",
                      thoi_gian_bao_hanh: "",
                      ngay_lam_thu_moi: "",
                      han_chot_chao_gia: "",
                      items: [],
                      nha_cung_cap: [],
                      nha_thau_trung_id: "",
                      phan_bo_ban_giao: []
                    });
                    showToast("info", "Form làm mới", "Đã dọn sạch biểu mẫu.");
                  }}
                  className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Clear dữ liệu"
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800"></div>

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
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-28">
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto space-y-8">

              {/* SECTION 1: GOI 1 REUSABLE BASE FORM */}
              <div className="space-y-6">
                <Goi1BaseForm isSidebarCollapsed={isSidebarCollapsed} />
              </div>

              {/* SECTION 2: NHẬP BÁO GIÁ */}
              <section className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 shrink-0">
                      <Calculator className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        Section 2: Cập nhật Báo Giá của các Nhà Cung Cấp
                      </h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Khai báo bảng chào giá, tỷ lệ thuế VAT và đánh giá tính đáp ứng kỹ thuật của từng đơn vị
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentVendors = getValues("nha_cung_cap") || [];
                      const nextId = `vendor-${Math.random().toString(36).substring(2, 9)}`;
                      setValue("nha_cung_cap", [
                        ...currentVendors,
                        {
                          id: nextId,
                          ten_ncc: `Nhà cung cấp mới #${currentVendors.length + 1}`,
                          thue_vat: 8,
                          quotes: watchedItems.map((item) => ({
                            ten_hang: item.ten_hang || "Hàng hóa chưa đặt tên",
                            don_gia: 0,
                            danh_gia: "dat" as const
                          }))
                        }
                      ]);
                      showToast("success", "Đã thêm nhà cung cấp", "Hệ thống tự động đồng bộ hóa danh sách hàng hóa.");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg transition-all cursor-pointer shadow-sm animate-fadeIn"
                  >
                    <Plus className="size-3.5" /> + Thêm Nhà Cung Cấp
                  </button>
                </div>

                {/* Vendors Grid */}
                {watchedVendors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-150 dark:border-zinc-800 rounded-xl bg-slate-50/20 text-slate-400">
                    <Calculator className="size-6 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold">Chưa có Nhà cung cấp thầu nào được tạo.</p>
                    <p className="text-[10px] text-slate-400">Click nút "+ Thêm Nhà Cung Cấp" phía trên để nạp thông tin báo giá.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {watchedVendors.map((vendorField, vendorIdx) => {
                      const vSum = getVendorSummary(vendorField);
                      return (
                        <div
                          key={vendorField.id}
                          className="border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 md:p-6 bg-slate-50/10 dark:bg-zinc-900/20 relative shadow-sm hover:shadow transition-all"
                        >
                          {/* Remove Vendor Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = watchedVendors.filter((_, idx) => idx !== vendorIdx);
                              setValue("nha_cung_cap", filtered);
                              if (watchedWinningVendorId === vendorField.id) {
                                setValue("nha_thau_trung_id", "");
                              }
                              showToast("info", "Đã xóa nhà cung cấp", "Đã gỡ bảng báo giá liên quan.");
                            }}
                            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Xóa nhà cung cấp này"
                          >
                            <Trash2 className="size-4" />
                          </button>

                          {/* Vendor Header Inputs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">
                                Tên Nhà Cung Cấp <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                placeholder="Nhập tên nhà thầu..."
                                {...register(`nha_cung_cap.${vendorIdx}.ten_ncc` as const, { required: true })}
                                className="h-8 px-2 text-xs border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md focus:border-indigo-500 outline-none font-bold text-slate-800 dark:text-white"
                              />
                            </div>

                            <div className="flex flex-col gap-1 w-32">
                              <label className="text-xs font-bold text-slate-650 dark:text-slate-400">
                                Thuế VAT (%) <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                {...register(`nha_cung_cap.${vendorIdx}.thue_vat` as const, {
                                  required: true,
                                  valueAsNumber: true
                                })}
                                className="h-8 px-2 text-xs border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md focus:border-indigo-500 outline-none text-center font-semibold"
                              />
                            </div>
                          </div>

                          {/* Quotes Input Table */}
                          <div className="overflow-x-auto border border-slate-250/60 dark:border-zinc-800/80 rounded-lg bg-white dark:bg-zinc-900/60 mb-4">
                            <table className="w-full text-left border-collapse text-[11px]">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-zinc-850 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-500 dark:text-slate-400">
                                  <th className="py-2 px-3 w-10 text-center">STT</th>
                                  <th className="py-2 px-3">Tên Hàng Hóa</th>
                                  <th className="py-2 px-3 w-20 text-center">Số Lượng</th>
                                  <th className="py-2 px-3 w-32">Đơn Giá Chào (VND) <span className="text-rose-500">*</span></th>
                                  <th className="py-2 px-3 w-32 text-right">Thành Tiền (VND)</th>
                                  <th className="py-2 px-3 w-36 text-center">Đánh Giá Kỹ Thuật <span className="text-rose-500">*</span></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/65">
                                {watchedItems.map((item, itemIdx) => {
                                  const quoteFieldPrefix = `nha_cung_cap.${vendorIdx}.quotes.${itemIdx}`;
                                  const itemQty = Number(item.so_luong) || 0;
                                  const itemPrice = Number(watch(`${quoteFieldPrefix}.don_gia` as any)) || 0;
                                  const itemSubTotal = itemQty * itemPrice;

                                  return (
                                    <tr key={itemIdx} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/5">
                                      <td className="py-2 px-3 text-center font-semibold text-slate-400">{itemIdx + 1}</td>
                                      <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                        {item.ten_hang || <em className="text-slate-400">(Chưa nhập tên)</em>}
                                      </td>
                                      <td className="py-2 px-3 text-center font-bold text-slate-900 dark:text-slate-200">{itemQty}</td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="number"
                                          min="0"
                                          placeholder="0"
                                          {...register(`${quoteFieldPrefix}.don_gia` as any, {
                                            required: true,
                                            valueAsNumber: true
                                          })}
                                          className="w-full h-7 px-1.5 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded text-right"
                                        />
                                      </td>
                                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                        {itemSubTotal.toLocaleString()}
                                      </td>
                                      <td className="py-2 px-3 text-center">
                                        <div className="inline-flex rounded-md p-0.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50">
                                          <label className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all">
                                            <input
                                              type="radio"
                                              value="dat"
                                              {...register(`${quoteFieldPrefix}.danh_gia` as any)}
                                              className="accent-indigo-600 hidden"
                                            />
                                            <span
                                              className={`px-2 py-0.5 rounded ${watch(`${quoteFieldPrefix}.danh_gia` as any) === "dat"
                                                  ? "bg-indigo-600 text-white shadow-sm"
                                                  : "text-slate-450"
                                                }`}
                                            >
                                              ĐẠT
                                            </span>
                                          </label>
                                          <label className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all">
                                            <input
                                              type="radio"
                                              value="khong_dat"
                                              {...register(`${quoteFieldPrefix}.danh_gia` as any)}
                                              className="accent-rose-600 hidden"
                                            />
                                            <span
                                              className={`px-2 py-0.5 rounded ${watch(`${quoteFieldPrefix}.danh_gia` as any) === "khong_dat"
                                                  ? "bg-rose-550 text-white shadow-sm"
                                                  : "text-slate-450"
                                                }`}
                                            >
                                              K.ĐẠT
                                            </span>
                                          </label>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Summary Block */}
                          <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-zinc-950/30 border border-slate-200/40 dark:border-zinc-800/40">
                            <div className="text-[11px] text-slate-500 font-medium">
                              * Công thức: Tổng cộng = Tổng chưa VAT + VAT ({watchedVendors[vendorIdx]?.thue_vat || 0}%)
                            </div>

                            <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-700 dark:text-slate-350">
                              <div>
                                Chưa VAT: <span className="text-slate-900 dark:text-white">{vSum.preVat.toLocaleString()} VND</span>
                              </div>
                              <div className="text-violet-600 dark:text-violet-400">
                                Thuế VAT: <span>{vSum.vat.toLocaleString()} VND</span>
                              </div>
                              <div className="text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-md border border-indigo-200/30">
                                Tổng thanh toán: <span>{vSum.total.toLocaleString()} VND</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* SECTION 3: CHỐT THẦU */}
              <section className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>

                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 shrink-0">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Section 3: Chỉ định Nhà Thầu Trúng Thầu
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Lựa chọn một đơn vị trúng thầu chính thức để làm căn cứ phát hành biên bản và thanh toán
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                      Lựa Chọn Đơn Vị Trúng Thầu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        {...register("nha_thau_trung_id", { required: "Vui lòng chọn nhà thầu trúng thầu" })}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold"
                      >
                        <option value="">-- Click để chọn NCC Trúng Thầu --</option>
                        {watchedVendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.ten_ncc || `Nhà cung cấp (${vendor.id})`}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                    {errors.nha_thau_trung_id && (
                      <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                        <AlertCircle className="size-3" /> {errors.nha_thau_trung_id.message}
                      </span>
                    )}

                    {watchedVendors.length === 0 && (
                      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 flex items-start gap-2 animate-fadeIn">
                        <Info className="size-4 shrink-0 mt-0.5" />
                        <span>Cần bổ sung ít nhất một báo giá của nhà cung cấp ở Section 2 thì dropdown chốt thầu mới hiển thị danh sách.</span>
                      </div>
                    )}
                  </div>

                  {/* Live Preview Card */}
                  <div>
                    {winningVendor && winningSummary ? (
                      <div className="p-5 rounded-xl border border-amber-250/60 dark:border-zinc-800/80 bg-amber-50/15 dark:bg-zinc-950/20 relative animate-fadeIn">
                        <div className="absolute top-4 right-4 bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Trúng Thầu
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2.5">
                          Thông Tin Đơn Vị Chỉ Định
                        </h4>
                        <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                          {winningVendor.ten_ncc}
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between border-b border-slate-200/40 dark:border-zinc-850 pb-1.5">
                            <span className="text-slate-450 font-semibold">Thành tiền chưa VAT:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{winningSummary.preVat.toLocaleString()} VND</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200/40 dark:border-zinc-850 pb-1.5">
                            <span className="text-slate-450 font-semibold">Thuế VAT ({winningVendor.thue_vat}%):</span>
                            <span className="font-bold text-violet-600 dark:text-violet-400">+{winningSummary.vat.toLocaleString()} VND</span>
                          </div>
                          <div className="flex justify-between pt-1 font-bold text-sm">
                            <span className="text-slate-800 dark:text-slate-350">TỔNG THANH TOÁN (Có VAT):</span>
                            <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md">
                              {winningSummary.total.toLocaleString()} VND
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full min-h-[120px] flex items-center justify-center p-6 border border-slate-200/80 dark:border-zinc-800/80 border-dashed rounded-xl bg-slate-50/20 text-slate-450 text-xs font-semibold text-center">
                        <Info className="size-4.5 mr-2 text-slate-400" />
                        Chọn nhà thầu ở bên trái để xem bảng tổng quan giá trị tài chính.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION 4: PHÂN BỔ BÀN GIAO */}
              <section className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl shadow-sm p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>

                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Section 4: Phân bổ Người nhận Bàn Giao Thiết Bị
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Phân bổ phân phối số lượng thiết bị thầu cho từng nhân sự tiếp nhận làm căn cứ đúc Biên bản bàn giao tương ứng
                    </p>
                  </div>
                </div>

                {watchedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-150 dark:border-zinc-800 rounded-xl bg-slate-50/20 text-slate-400">
                    <UserCheck className="size-6 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold">Chưa có hàng hóa thiết bị thầu.</p>
                    <p className="text-[10px] text-slate-400">Vui lòng thêm hàng hóa ở Section 1 để định cấu hình bàn giao.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {watchedItems.map((item, itemIdx) => {
                      const allocKey = `phan_bo_ban_giao.${itemIdx}`;
                      const qtyTotal = Number(item.so_luong) || 0;

                      const itemAllocations = watch(`${allocKey}.allocations` as any) || [];
                      const sumAlloc = itemAllocations.reduce((s: number, a: any) => s + (Number(a.so_luong_nhan) || 0), 0);
                      const isMatched = sumAlloc === qtyTotal;

                      return (
                        <div
                          key={itemIdx}
                          className="border border-slate-200/80 dark:border-zinc-800 rounded-xl p-4 md:p-5 bg-slate-50/15 dark:bg-zinc-900/30 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors animate-fadeIn"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-slate-200/50 dark:border-zinc-800/80">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Mục #{itemIdx + 1}: {item.ten_hang || <em className="text-slate-400">(Chưa đặt tên)</em>}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Số lượng thầu: <strong className="text-slate-700 dark:text-slate-350">{qtyTotal} {item.dvt}</strong>
                              </span>
                            </div>

                            <div>
                              {isMatched ? (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400 rounded-full uppercase tracking-wider border border-green-200/40 dark:border-green-900/30 flex items-center gap-1">
                                  <CheckCircle className="size-3" /> Đã phân bổ hết
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 rounded-full uppercase tracking-wider border border-rose-200/40 dark:border-rose-900/30 flex items-center gap-1">
                                  <AlertCircle className="size-3" /> Lệch số lượng (Đã chia: {sumAlloc}/{qtyTotal})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {itemAllocations.map((alloc: any, allocIdx: number) => (
                              <div key={allocIdx} className="flex flex-wrap items-center gap-4 animate-fadeIn">
                                <div className="flex-1 min-w-[200px] flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500">
                                    Họ tên & Đơn vị người nhận #{allocIdx + 1} <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="VD: Nguyễn Văn A - Ban CNTT"
                                    {...register(`${allocKey}.allocations.${allocIdx}.nguoi_nhan` as any, { required: true })}
                                    className="h-8 px-2 text-xs border border-slate-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md outline-none"
                                  />
                                </div>

                                <div className="w-28 flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 text-center">
                                    SL bàn giao <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    {...register(`${allocKey}.allocations.${allocIdx}.so_luong_nhan` as any, {
                                      required: true,
                                      valueAsNumber: true
                                    })}
                                    className="h-8 px-2 text-xs border border-slate-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-md outline-none text-center font-bold"
                                  />
                                </div>

                                {itemAllocations.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = getValues(`${allocKey}.allocations` as any) || [];
                                      const filtered = current.filter((_: any, i: number) => i !== allocIdx);
                                      setValue(`${allocKey}.allocations` as any, filtered);
                                    }}
                                    className="mt-5 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                                    title="Gỡ người nhận này"
                                  >
                                    <Trash2 className="size-4.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {qtyTotal > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = getValues(`${allocKey}.allocations` as any) || [];
                                  setValue(`${allocKey}.allocations` as any, [
                                    ...current,
                                    { nguoi_nhan: "", so_luong_nhan: 1 }
                                  ]);
                                }}
                                className="mt-2 text-[10px] font-bold text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                + Chia nhỏ thêm người nhận
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </form>
          </main>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="fixed bottom-0 left-0 right-0 h-18 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between px-6 md:px-8 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div
              className={`transition-all duration-300 ease-in-out hidden md:flex items-center gap-2 ${isSidebarCollapsed ? "pl-16" : "pl-64"
                }`}
            >
              <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
                <span>Đại diện trúng:</span>
                {winningVendor ? (
                  <span className="text-green-600 font-bold px-2 py-0.5 rounded bg-green-50 dark:bg-green-950/20 border border-green-200/30 uppercase text-[9px] tracking-wide font-sans">
                    {winningVendor.ten_ncc.slice(0, 25)}...
                  </span>
                ) : (
                  <span className="text-amber-500 font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 uppercase text-[9px] tracking-wide border border-amber-200/40">
                    Chưa chốt thầu
                  </span>
                )}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
              <span className="text-xs font-semibold text-slate-500">
                {watchedItems.length > 0 ? `Đã nạp ${watchedItems.length} hàng hóa` : "Chưa có thiết bị"}
              </span>
            </div>

            {/* Form Action Buttons Right */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => {
                  reset({
                    so_de_xuat: "",
                    mua_cho_ai: "",
                    ngay_de_xuat: "",
                    bo_phan_yeu_cau: "",
                    thoi_gian_giao_hang: "",
                    so_thu_moi: "",
                    thoi_gian_bao_hanh: "",
                    ngay_lam_thu_moi: "",
                    han_chot_chao_gia: "",
                    items: [],
                    nha_cung_cap: [],
                    nha_thau_trung_id: "",
                    phan_bo_ban_giao: []
                  });
                  showToast("info", "Form làm mới", "Đã dọn sạch biểu mẫu.");
                }}
                className="px-4 h-11 text-xs font-bold border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
              >
                Làm mới form
              </button>

              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-6 h-11 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-px duration-150"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>ĐANG ĐÚC HỒ SƠ...</span>
                  </>
                ) : (
                  <>
                    <span>🔥 ĐÚC TRỌN BỘ HỒ SƠ</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TOAST NOTIFICATIONS RENDERER */}
          <div className="fixed top-6 right-6 flex flex-col gap-3 z-50 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className="p-4 rounded-xl shadow-lg border border-slate-200 dark:border-zinc-850 bg-white/95 dark:bg-zinc-900/95 backdrop-blur flex items-start gap-3 pointer-events-auto transform translate-y-0 transition-all duration-300 ease-out border-l-4"
                style={{
                  borderLeftColor:
                    toast.type === "success"
                      ? "#4f46e5"
                      : toast.type === "error"
                        ? "#f43f5e"
                        : "#818cf8",
                }}
              >
                <div className="shrink-0 pt-0.5">
                  {toast.type === "success" ? (
                    <CheckCircle className="size-5 text-indigo-550" />
                  ) : toast.type === "error" ? (
                    <XCircle className="size-5 text-rose-500" />
                  ) : (
                    <Info className="size-5 text-indigo-400" />
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
    </FormProvider>
  );
}
