"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import GeneralInfoForm from "./GeneralInfoForm";
import DynamicItemsTable from "./DynamicItemsTable";

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

interface Goi1BaseFormProps {
  values?: GeneralInfo;
  errors?: Record<string, string>;
  onChange?: (field: keyof GeneralInfo, value: string) => void;
  items?: MaterialItem[];
  itemErrors?: Record<string, string>;
  isSubmitting?: boolean;
  isSidebarCollapsed?: boolean;
  onAddItem?: (item: Omit<MaterialItem, "id">) => void;
  onDeleteItem?: (id: string, name: string) => void;
  onResetForm?: () => void;
}

export default function Goi1BaseForm({
  values,
  errors,
  onChange,
  items,
  itemErrors,
  isSubmitting = false,
  isSidebarCollapsed = false,
  onAddItem,
  onDeleteItem,
  onResetForm,
}: Goi1BaseFormProps) {
  const formContext = useFormContext();

  if (formContext) {
    // ----------------------------------------------------
    // CASE A: Inside FormProvider (e.g. in /goi-2/page.tsx)
    // ----------------------------------------------------
    const { watch, setValue, getValues, formState: { errors: formErrors } } = formContext;

    // 1. Map values from react-hook-form (snake_case) to camelCase expected by GeneralInfoForm
    const mappedValues: GeneralInfo = {
      soDeXuat: watch("so_de_xuat") || "",
      muaChoAi: watch("mua_cho_ai") || "",
      ngayDeXuat: watch("ngay_de_xuat") || "",
      boPhanYeuCau: watch("bo_phan_yeu_cau") || "",
      thoiGianGiaoHang: watch("thoi_gian_giao_hang") || "",
      soThuMoi: watch("so_thu_moi") || "",
      thoiGianBaoHanh: watch("thoi_gian_bao_hanh") || "",
      ngayLamThuMoi: watch("ngay_lam_thu_moi") || "",
      hanChotChaoGia: watch("han_chot_chao_gia") || "",
    };

    // 2. Map errors from react-hook-form to camelCase
    const mappedErrors: Record<string, string> = {
      soDeXuat: (formErrors.so_de_xuat?.message as string) || "",
      muaChoAi: (formErrors.mua_cho_ai?.message as string) || "",
      ngayDeXuat: (formErrors.ngay_de_xuat?.message as string) || "",
      boPhanYeuCau: (formErrors.bo_phan_yeu_cau?.message as string) || "",
      thoiGianGiaoHang: (formErrors.thoi_gian_giao_hang?.message as string) || "",
      soThuMoi: (formErrors.so_thu_moi?.message as string) || "",
      thoiGianBaoHanh: (formErrors.thoi_gian_bao_hanh?.message as string) || "",
      ngayLamThuMoi: (formErrors.ngay_lam_thu_moi?.message as string) || "",
      hanChotChaoGia: (formErrors.han_chot_chao_gia?.message as string) || "",
    };

    // 3. Handle change by setting react-hook-form state in snake_case
    const handleGeneralInfoChange = (field: keyof GeneralInfo, value: string) => {
      const fieldMapping: Record<keyof GeneralInfo, string> = {
        soDeXuat: "so_de_xuat",
        muaChoAi: "mua_cho_ai",
        ngayDeXuat: "ngay_de_xuat",
        boPhanYeuCau: "bo_phan_yeu_cau",
        thoiGianGiaoHang: "thoi_gian_giao_hang",
        soThuMoi: "so_thu_moi",
        thoiGianBaoHanh: "thoi_gian_bao_hanh",
        ngayLamThuMoi: "ngay_lam_thu_moi",
        hanChotChaoGia: "han_chot_chao_gia",
      };
      setValue(fieldMapping[field] as any, value, { shouldValidate: true });
    };

    // 4. Map items from react-hook-form to camelCase for DynamicItemsTable
    const watchedItems = watch("items") || [];
    const mappedItems: MaterialItem[] = watchedItems.map((item: any) => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      tenHangHoa: item.ten_hang || "",
      giaTien: item.don_gia || "",
      soLuong: item.so_luong || "",
      dvt: item.dvt || "Cái",
      chungChi: item.chung_chi || "",
      thoiGianBaoHanh: item.thoi_gian_bao_hanh || "",
      chiTiet: item.chi_tiet || "",
      ghiChu: item.ghi_chu || "",
    }));

    const handleAddItem = (newItemData: Omit<MaterialItem, "id">) => {
      const current = getValues("items") || [];
      setValue("items" as any, [
        ...current,
        {
          id: Math.random().toString(36).substring(2, 9),
          ten_hang: newItemData.tenHangHoa,
          don_gia: Number(newItemData.giaTien) || 0,
          so_luong: Number(newItemData.soLuong) || 0,
          dvt: newItemData.dvt,
          chung_chi: newItemData.chungChi,
          thoi_gian_bao_hanh: newItemData.thoiGianBaoHanh,
          chi_tiet: newItemData.chiTiet,
          ghi_chu: newItemData.ghiChu,
        },
      ]);
    };

    const handleDeleteItem = (id: string, name: string) => {
      const current = getValues("items") || [];
      setValue("items" as any, current.filter((item: any) => item.id !== id));
    };

    const handleResetForm = () => {
      setValue("items" as any, []);
    };

    const mappedItemErrors = {
      listEmpty: (formErrors.items?.message as string) || "",
    };

    return (
      <>
        <GeneralInfoForm
          values={mappedValues}
          errors={mappedErrors}
          onChange={handleGeneralInfoChange}
        />
        <DynamicItemsTable
          items={mappedItems}
          itemErrors={mappedItemErrors}
          isSubmitting={isSubmitting}
          isSidebarCollapsed={isSidebarCollapsed}
          onAddItem={handleAddItem}
          onDeleteItem={handleDeleteItem}
          onResetForm={handleResetForm}
        />
      </>
    );
  }

  // ----------------------------------------------------
  // CASE B: Standard Props Usage (e.g. in Gói 1 /page.tsx)
  // ----------------------------------------------------
  return (
    <>
      <GeneralInfoForm
        values={values || {
          soDeXuat: "",
          muaChoAi: "",
          ngayDeXuat: "",
          boPhanYeuCau: "",
          thoiGianGiaoHang: "",
          soThuMoi: "",
          thoiGianBaoHanh: "",
          ngayLamThuMoi: "",
          hanChotChaoGia: "",
        }}
        errors={errors || {}}
        onChange={onChange || (() => {})}
      />
      <DynamicItemsTable
        items={items || []}
        itemErrors={itemErrors || {}}
        isSubmitting={isSubmitting}
        isSidebarCollapsed={isSidebarCollapsed}
        onAddItem={onAddItem || (() => {})}
        onDeleteItem={onDeleteItem || (() => {})}
        onResetForm={onResetForm || (() => {})}
      />
    </>
  );
}
