"use server";

import pool from "@/lib/db";

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

/**
 * Server Action to submit Goi 1 procurement profile.
 * Executes within a database transaction (BEGIN ... COMMIT ... ROLLBACK).
 */
export async function submitHoSoGoi1(
  formData: GeneralInfo,
  itemsData: MaterialItem[]
) {
  const client = await pool.connect();

  try {
    // 1. Begin SQL Transaction
    await client.query("BEGIN");

    // 2. Query 1: Insert General Info (Hồ sơ)
    const hoSoQuery = `
      INSERT INTO ho_so_mua_sam (
        ma_ho_so, 
        so_de_xuat, 
        ngay_de_xuat, 
        user_yeu_cau, 
        bo_phan_yeu_cau, 
        thoi_gian_giao_hang, 
        so_thu_moi, 
        thoi_gian_bao_hanh, 
        created_at, 
        han_chot_chao_gia, 
        loai_goi_thau, 
        trang_thai
      ) VALUES (
        'HSMS-' || to_char(now(), 'YYYYMMDD-HH24MISS'), 
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'Gói 1', 'Mới tạo'
      ) RETURNING id, ma_ho_so;
    `;

    const hoSoValues = [
      formData.soDeXuat,
      formData.ngayDeXuat,
      formData.muaChoAi, // Maps to requester/purchaser column
      formData.boPhanYeuCau,
      formData.thoiGianGiaoHang,
      formData.soThuMoi,
      formData.thoiGianBaoHanh,
      new Date().toISOString(), // created_at
      formData.hanChotChaoGia,
    ];

    const hoSoResult = await client.query(hoSoQuery, hoSoValues);
    const hoSoId = hoSoResult.rows[0].id;
    const maHoSo = hoSoResult.rows[0].ma_ho_so;

    // 3. Query 2: Insert items inside a loop
    const itemQuery = `
      INSERT INTO danh_sach_hang_hoa (
        ho_so_id, 
        stt, 
        ten_hang, 
        chi_tiet, 
        dvt, 
        so_luong, 
        don_gia, 
        ghi_chu,
        chung_chi
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
    `;

    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      const itemValues = [
        hoSoId,
        i + 1, // STT
        item.tenHangHoa,
        item.chiTiet,
        item.dvt,
        Number(item.soLuong) || 0,
        Number(item.giaTien) || 0,
        item.ghiChu,
        item.chungChi,
      ];
      await client.query(itemQuery, itemValues);
    }

    // 4. Commit SQL Transaction
    await client.query("COMMIT");

    // 5. Trigger Flask document generation endpoint
    const apiPayload = {
      action: "all", // requests zip compilation of all package 1 documents
      id: hoSoId,
      ho_so_id: hoSoId,
      ma_ho_so: maHoSo,
      soDeXuat: formData.soDeXuat,
      ngayDeXuat: formData.ngayDeXuat,
      muaChoAi: formData.muaChoAi,
      boPhanYeuCau: formData.boPhanYeuCau,
      thoiGianGiaoHang: formData.thoiGianGiaoHang,
      soThuMoi: formData.soThuMoi,
      thoiGianBaoHanh: formData.thoiGianBaoHanh,
      ngayLamThuMoi: formData.ngayLamThuMoi,
      hanChotChaoGia: formData.hanChotChaoGia,
      danhSachHangHoa: itemsData.map((item, idx) => ({
        stt: idx + 1,
        tenHangHoa: item.tenHangHoa,
        dvt: item.dvt,
        soLuong: Number(item.soLuong),
        giaTien: Number(item.giaTien) || 0,
        chungChi: item.chungChi,
        chiTiet: item.chiTiet,
        ghiChu: item.ghiChu,
        chung_chi: item.chungChi,
      })),
    };

    const response = await fetch("http://localhost:5678/webhook-test/generate-doc-package1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate files. API status: ${response.status}`);
    }

    const data = await response.json();
    const fileName = data.file_sinh_ra?.file_name || "";

    return {
      success: true,
      fileName,
    };
  } catch (error: any) {
    // Rollback changes on any query or network failure
    await client.query("ROLLBACK");
    console.error("Error in submitHoSoGoi1 Server Action:", error);
    return {
      success: false,
      error: error.message || "Lỗi giao dịch cơ sở dữ liệu (Transaction Rollback).",
    };
  } finally {
    client.release();
  }
}
