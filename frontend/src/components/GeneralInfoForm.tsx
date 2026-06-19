"use client";

import React from "react";
import { FileText, AlertCircle, Calendar } from "lucide-react";

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

interface GeneralInfoFormProps {
  values: GeneralInfo;
  errors: Record<string, string>;
  onChange: (field: keyof GeneralInfo, value: string) => void;
}

export default function GeneralInfoForm({
  values,
  errors,
  onChange,
}: GeneralInfoFormProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl shadow-sm hover:shadow-md/50 transition-all p-6 md:p-8 relative overflow-hidden">
      {/* Accent left line */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
          <FileText className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Phần 1: Thông Tin Chung Đề Xuất & Thư Mời
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Khai báo số đề xuất, đơn vị phụ trách và mốc thời gian phát hành thư mời chào giá
          </p>
        </div>
      </div>

      {/* Form layout dividing Nhóm A and Nhóm B */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* NHÓM A */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">
            Nhóm A: Thông tin Đề xuất & Bộ phận yêu cầu
          </h3>

          {/* Grid A */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Số đề xuất */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="soDeXuat" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số Đề Xuất <span className="text-rose-500">*</span>
              </label>
              <input
                id="soDeXuat"
                type="text"
                placeholder="VD: DX-2026-0489"
                value={values.soDeXuat}
                onChange={(e) => onChange("soDeXuat", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.soDeXuat
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.soDeXuat && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.soDeXuat}
                </span>
              )}
            </div>

            {/* Mua cho ai */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="muaChoAi" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Mua Cho Ai / Dự Án <span className="text-rose-500">*</span>
              </label>
              <input
                id="muaChoAi"
                type="text"
                placeholder="VD: Chi nhánh miền Nam / Dự án tòa nhà B"
                value={values.muaChoAi}
                onChange={(e) => onChange("muaChoAi", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.muaChoAi
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.muaChoAi && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.muaChoAi}
                </span>
              )}
            </div>

            {/* Ngày Đề Xuất */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ngayDeXuat" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ngày Đề Xuất <span className="text-rose-500">*</span>
              </label>
              <input
                id="ngayDeXuat"
                type="date"
                value={values.ngayDeXuat}
                onChange={(e) => onChange("ngayDeXuat", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none transition-all ${
                  errors.ngayDeXuat
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.ngayDeXuat && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.ngayDeXuat}
                </span>
              )}
            </div>

            {/* Bộ phận yêu cầu */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="boPhanYeuCau" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bộ Phận Yêu Cầu <span className="text-rose-500">*</span>
              </label>
              <input
                id="boPhanYeuCau"
                type="text"
                placeholder="VD: Ban Công nghệ thông tin"
                value={values.boPhanYeuCau}
                onChange={(e) => onChange("boPhanYeuCau", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.boPhanYeuCau
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.boPhanYeuCau && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.boPhanYeuCau}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NHÓM B */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider border-b border-slate-100 dark:border-zinc-800 pb-2">
            Nhóm B: Thời gian, Số thư mời & Hạn chót
          </h3>

          {/* Grid B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Số thư mời */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="soThuMoi" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số Thư Mời <span className="text-rose-500">*</span>
              </label>
              <input
                id="soThuMoi"
                type="text"
                placeholder="VD: TM-2026-102"
                value={values.soThuMoi}
                onChange={(e) => onChange("soThuMoi", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.soThuMoi
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.soThuMoi && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.soThuMoi}
                </span>
              )}
            </div>

            {/* Thời gian giao hàng */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="thoiGianGiaoHang" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Thời Gian Giao Hàng <span className="text-rose-500">*</span>
              </label>
              <input
                id="thoiGianGiaoHang"
                type="text"
                placeholder="VD: 30 ngày kể từ ngày đặt"
                value={values.thoiGianGiaoHang}
                onChange={(e) => onChange("thoiGianGiaoHang", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.thoiGianGiaoHang
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.thoiGianGiaoHang && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.thoiGianGiaoHang}
                </span>
              )}
            </div>

            {/* Thời gian bảo hành */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="thoiGianBaoHanh" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Thời Gian Bảo Hành <span className="text-rose-500">*</span>
              </label>
              <input
                id="thoiGianBaoHanh"
                type="text"
                placeholder="VD: 12 tháng hoặc 24 tháng"
                value={values.thoiGianBaoHanh}
                onChange={(e) => onChange("thoiGianBaoHanh", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all ${
                  errors.thoiGianBaoHanh
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.thoiGianBaoHanh && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.thoiGianBaoHanh}
                </span>
              )}
            </div>

            {/* Ngày làm thư mời */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ngayLamThuMoi" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Ngày Làm Thư Mời <span className="text-rose-500">*</span>
              </label>
              <input
                id="ngayLamThuMoi"
                type="date"
                value={values.ngayLamThuMoi}
                onChange={(e) => onChange("ngayLamThuMoi", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none transition-all ${
                  errors.ngayLamThuMoi
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.ngayLamThuMoi && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.ngayLamThuMoi}
                </span>
              )}
            </div>

            {/* Hạn chót chào giá */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="hanChotChaoGia" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Hạn Chót Chào Giá <span className="text-rose-500">*</span>
              </label>
              <input
                id="hanChotChaoGia"
                type="date"
                value={values.hanChotChaoGia}
                onChange={(e) => onChange("hanChotChaoGia", e.target.value)}
                className={`h-9 px-3 text-sm rounded-lg border bg-white dark:bg-zinc-800 text-slate-900 dark:text-white outline-none transition-all ${
                  errors.hanChotChaoGia
                    ? "border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-200 dark:border-zinc-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {errors.hanChotChaoGia && (
                <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 mt-0.5 animate-fadeIn">
                  <AlertCircle className="size-3 shrink-0" />
                  {errors.hanChotChaoGia}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
