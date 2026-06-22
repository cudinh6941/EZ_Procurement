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

    // ─── Bước 5: Query lại DB lấy full data → gửi Flask ────────────────
    // Đây là bản sao chính xác query n8n đang dùng, migrate trực tiếp vào đây
    let fileName = "";
    try {
      const dbResult = await client.query(
        `SELECT
           h.*,
           t.ten_ncc,
           t.mst,
           t.so_tai_khoan,
           t.ten_ngan_hang,
           t.so_hoa_don,
           t.tong_tien_co_vat,
           t.so_tien_bang_chu,
           (
             SELECT json_agg(row_to_json(d))
             FROM danh_sach_hang_hoa d
             WHERE d.ho_so_id = h.id
           ) AS danh_sach_hang_hoa
         FROM ho_so_mua_sam h
         LEFT JOIN thong_tin_thanh_toan t ON t.ho_so_id = h.id
         WHERE h.id = $1`,
        [hoSoId]
      );

      const hoSoRow = dbResult.rows[0] ?? {};

      // Flask payload = DB row (snake_case) + các trường bổ sung mà word_factory cần
      const flaskPayload = {
        ...hoSoRow,                           // Tất cả cột từ ho_so_mua_sam + thong_tin_thanh_toan
        action: "all",                        // Yêu cầu Flask đúc trọn bộ (zip)
        ho_so_id: hoSoId,
        // Các field camelCase mà goi1Actions.ts truyền thêm (ngay_lam_thu_moi...)
        ngay_thu_moi: formData.ngayLamThuMoi, // ban_giao builder dùng ngay_thu_moi
      };

      const resp = await fetch("http://localhost:5000/generate-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flaskPayload),
      });

      if (resp.ok) {
        const respData = await resp.json();
        fileName = respData.file_sinh_ra?.file_name || "";
      } else {
        const errText = await resp.text();
        console.warn(`[Goi1] Flask tra loi ${resp.status}:`, errText);
      }
    } catch (fetchErr) {
      console.warn("[Goi1] Loi khi query DB hoac goi Flask:", fetchErr);
    }

    return { success: true, hoSoId, maHoSo, fileName };
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
