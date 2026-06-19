"use client";

import React, { useState } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  XCircle,
  Layers,
  Sparkles
} from "lucide-react";

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

interface DynamicItemsTableProps {
  items: MaterialItem[];
  itemErrors: Record<string, string>;
  isSubmitting: boolean;
  isSidebarCollapsed: boolean;
  onAddItem: (item: Omit<MaterialItem, "id">) => void;
  onDeleteItem: (id: string, name: string) => void;
  onResetForm: () => void;
}

export default function DynamicItemsTable({
  items,
  itemErrors,
  isSubmitting,
  isSidebarCollapsed,
  onAddItem,
  onDeleteItem,
  onResetForm
}: DynamicItemsTableProps) {
  // Modal open/close state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New item form state inside modal
  const [newItem, setNewItem] = useState({
    tenHangHoa: "",
    giaTien: "" as number | "",
    soLuong: "" as number | "",
    dvt: "Cái",
    chungChi: "",
    chiTiet: "",
    ghiChu: "",
  });

  // Modal form validation errors
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  // Reset modal state
  const openModal = () => {
    setNewItem({
      tenHangHoa: "",
      giaTien: "",
      soLuong: "",
      dvt: "Cái",
      chungChi: "",
      chiTiet: "",
      ghiChu: "",
    });
    setModalErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (
    field: keyof typeof newItem,
    value: string | number
  ) => {
    setNewItem((prev) => ({ ...prev, [field]: value }));
    // Clear validation error if typed
    if (modalErrors[field]) {
      setModalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  // Submit new item to parent
  const handleAddNewItem = () => {
    const errors: Record<string, string> = {};
    if (!newItem.tenHangHoa.trim()) {
      errors.tenHangHoa = "Tên hàng hóa không được để trống";
    }
    if (newItem.soLuong === "" || newItem.soLuong <= 0) {
      errors.soLuong = "Số lượng phải lớn hơn 0";
    }
    if (newItem.giaTien === "" || newItem.giaTien < 0) {
      errors.giaTien = "Giá tiền không hợp lệ";
    }
    if (!newItem.dvt.trim()) {
      errors.dvt = "ĐVT không được trống";
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    // Call parent handler
    onAddItem({
      tenHangHoa: newItem.tenHangHoa,
      giaTien: newItem.giaTien === "" ? 0 : Number(newItem.giaTien),
      soLuong: Number(newItem.soLuong),
      dvt: newItem.dvt,
      chungChi: newItem.chungChi,
      chiTiet: newItem.chiTiet,
      ghiChu: newItem.ghiChu,
    });

    closeModal();
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-sm p-6 md:p-8 relative overflow-hidden">
      {/* Visual Accent bar */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600"></div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
            <FolderOpen className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Phần 2: Quản lý Danh sách Hàng Hóa & Thiết Bị
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Chi tiết mặt hàng đề xuất mời thầu, mô tả yêu cầu chất lượng và các chứng chỉ chất lượng
            </p>
          </div>
        </div>

        {/* Top Add Button triggers dialog modal */}
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-sm ml-auto cursor-pointer"
        >
          <Plus className="size-4" />
          + Thêm Thiết Bị/Hàng Hóa
        </button>
      </div>

      {/* Main Material Table rendering */}
      {items.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/20 dark:bg-zinc-950/20 animate-fadeIn">
          <div className="relative mb-4">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-zinc-800/80 flex items-center justify-center">
              <Layers className="size-7 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-violet-500 text-white rounded-full">
              <Plus className="size-3.5" />
            </div>
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có hàng hóa nào trong danh mục
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
            Danh sách đề xuất mời thầu cần có tối thiểu 1 hàng hóa. Hãy click nút bên dưới để mở Form thêm mới.
          </p>
          <button
            type="button"
            onClick={openModal}
            className="mt-5 flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold bg-indigo-65 text-indigo-600 border border-indigo-200/60 hover:bg-indigo-50 dark:bg-indigo-950/25 dark:text-indigo-400 dark:border-indigo-850 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            Thêm thiết bị đầu tiên
          </button>
          {itemErrors.listEmpty && (
            <span className="text-xs text-rose-500 font-semibold mt-3.5 flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="size-3.5" />
              {itemErrors.listEmpty}
            </span>
          )}
        </div>
      ) : (
        /* DATA TABLE RENDER */
        <div className="overflow-x-auto border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-sm bg-slate-50/10 dark:bg-zinc-900/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-zinc-800/70 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4 w-20 text-center">ĐVT</th>
                <th className="py-3 px-4 w-24 text-center">Số Lượng</th>
                <th className="py-3 px-4 min-w-[150px]">Tên Hàng Hóa</th>
                <th className="py-3 px-4 min-w-[180px]">Chi Tiết Kỹ Thuật</th>
                <th className="py-3 px-4 min-w-[150px]">Chứng Chỉ Yêu Cầu</th>
                <th className="py-3 px-4 min-w-[120px]">Ghi Chú</th>
                <th className="py-3 px-4 w-16 text-center">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-zinc-800">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-100/35 dark:hover:bg-zinc-800/20 transition-colors align-top animate-fadeIn"
                >
                  <td className="py-3 px-4 text-center font-bold text-slate-400 dark:text-slate-500 pt-4">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300 pt-4">
                    {item.dvt}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white pt-4">
                    {item.soLuong.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span>{item.tenHangHoa}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium normal-case">
                        Đơn giá: {item.giaTien ? `${item.giaTien.toLocaleString()} VND` : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 pt-4 max-w-[200px] break-words">
                    {item.chiTiet || <em className="text-slate-350">-</em>}
                  </td>
                  <td className="py-3 px-4 pt-3.5">
                    {item.chungChi ? (
                      <div className="flex flex-wrap gap-1">
                        {item.chungChi.split(",").map((c, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-slate-350 border border-slate-200/40 dark:border-zinc-700/60 px-1.5 py-0.5 rounded font-medium">
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <em className="text-slate-350">-</em>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 pt-4 max-w-[150px] break-words">
                    {item.ghiChu || <em className="text-slate-350">-</em>}
                  </td>
                  <td className="py-3 px-4 text-center pt-3">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id, item.tenHangHoa)}
                      className="p-1.5 text-slate-450 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-450 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Xóa hàng hóa"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer status summary */}
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 flex items-center justify-between">
            <span className="text-slate-450 dark:text-slate-500 font-semibold text-xs">
              Tổng cộng: <strong className="text-slate-800 dark:text-slate-200">{items.length}</strong> hàng hóa/thiết bị đề xuất
            </span>
            <button
              type="button"
              onClick={openModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-505 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="size-4" />
              Thêm thiết bị tiếp theo
            </button>
          </div>
        </div>
      )}

      {/* DIALOG MODAL (SHADCN SHEET/DIALOG ALTERNATIVE FOR COMPLETE PORTABILITY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>

          {/* Modal Container */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl relative z-10 animate-slideIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/40 dark:bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400">
                  <Plus className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thêm Hàng Hóa / Thiết Bị Mới
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Khai báo thông số kỹ thuật, giá tiền và chứng chỉ của mặt hàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            {/* Modal Fields */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên hàng hóa */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Tên Hàng Hóa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Core Switch Cisco Catalyst 9300 48-port"
                    value={newItem.tenHangHoa}
                    onChange={(e) => handleInputChange("tenHangHoa", e.target.value)}
                    className={`h-9 px-3 text-xs rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${modalErrors.tenHangHoa
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      }`}
                  />
                  {modalErrors.tenHangHoa && (
                    <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                      <AlertCircle className="size-3" />
                      {modalErrors.tenHangHoa}
                    </span>
                  )}
                </div>

                {/* Giá tiền */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Giá Tiền (VND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 55000000"
                    min="0"
                    value={newItem.giaTien}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      handleInputChange("giaTien", val);
                    }}
                    className={`h-9 px-3 text-xs rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${modalErrors.giaTien
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      }`}
                  />
                  {modalErrors.giaTien && (
                    <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                      <AlertCircle className="size-3" />
                      {modalErrors.giaTien}
                    </span>
                  )}
                </div>

                {/* Số lượng */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Số Lượng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 5"
                    min="1"
                    value={newItem.soLuong}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      handleInputChange("soLuong", val);
                    }}
                    className={`h-9 px-3 text-xs rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${modalErrors.soLuong
                      ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      }`}
                  />
                  {modalErrors.soLuong && (
                    <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5">
                      <AlertCircle className="size-3" />
                      {modalErrors.soLuong}
                    </span>
                  )}
                </div>

                {/* Đơn vị tính */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Đơn Vị Tính <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newItem.dvt}
                      onChange={(e) => handleInputChange("dvt", e.target.value)}
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      <option value="Cái">Cái</option>
                      <option value="Bộ">Bộ</option>
                      <option value="Mét">Mét</option>
                      <option value="Thùng">Thùng</option>
                      <option value="Cặp">Cặp</option>
                      <option value="Lô">Lô</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Các chứng chỉ hàng hóa yêu cầu */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Chứng Chỉ Hàng Hóa Yêu Cầu
                  </label>
                  <input
                    type="text"
                    placeholder="VD: CO, CQ, ISO 9001 (phân tách bằng dấu phẩy)"
                    value={newItem.chungChi}
                    onChange={(e) => handleInputChange("chungChi", e.target.value)}
                    className="h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                {/* Chi tiết */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Chi Tiết Yêu Cầu Kỹ Thuật
                  </label>
                  <textarea
                    placeholder="Mô tả kỹ thuật, kích thước, hiệu năng..."
                    value={newItem.chiTiet}
                    onChange={(e) => handleInputChange("chiTiet", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none h-16"
                  />
                </div>

                {/* Ghi chú */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Ghi Chú Đính Kèm
                  </label>
                  <textarea
                    placeholder="Các lưu ý đặc biệt đối với nhà thầu..."
                    // value={newItem.ghiChu}
                    value=""
                    onChange={(e) => handleInputChange("ghiChu", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none h-16"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-950/20 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-slate-250 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-xs font-bold transition-colors cursor-pointer text-slate-650 dark:text-slate-300"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 h-18 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between px-6 md:px-8 z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {/* Total Summary Left */}
        <div
          className={`transition-all duration-300 ease-in-out hidden md:flex items-center gap-2 ${isSidebarCollapsed ? "pl-16" : "pl-64"
            }`}
        >
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <span>Trạng thái:</span>
            <span className="text-amber-500 font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 uppercase text-[9px] tracking-wide border border-amber-200/40 dark:border-amber-900/30">
              Bản thảo nháp
            </span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {items.length > 0 ? `Đã nhập ${items.length} mặt hàng` : "Chưa có thông tin hàng hóa"}
          </span>
        </div>

        {/* Form Action Buttons Right */}
        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={onResetForm}
            className="px-4 h-11 text-xs font-bold border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer text-slate-600 dark:text-slate-300"
          >
            Làm mới
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 h-11 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-px duration-150"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>ĐANG GỬI HỒ SƠ...</span>
              </>
            ) : (
              <>
                <span>🚀 TẠO HỒ SƠ & PHÁT HÀNH THƯ MƠI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
