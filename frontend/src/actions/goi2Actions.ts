"use server";

import pool from "@/lib/db";

export interface Goi2Item {
  id?: string;
  ten_hang: string;
  chi_tiet: string;
  dvt: string;
  so_luong: number;
  don_gia?: number;
  chung_chi?: string;
  ghi_chu?: string;
}

export interface VendorQuote {
  ten_hang: string;
  don_gia: number;
  danh_gia: "dat" | "khong_dat";
}

export interface Vendor {
  id: string;
  ten_ncc: string;
  thue_vat: number;
  quotes: VendorQuote[];
}

export interface HandoverAllocationItem {
  nguoi_nhan: string;
  so_luong_nhan: number;
}

export interface HandoverAllocation {
  ten_hang: string;
  allocations: HandoverAllocationItem[];
}

export interface Goi2Payload {
  so_de_xuat: string;
  mua_cho_ai: string;
  ngay_de_xuat: string;
  bo_phan_yeu_cau: string;
  thoi_gian_giao_hang: string;
  so_thu_moi: string;
  thoi_gian_bao_hanh: string;
  ngay_lam_thu_moi: string;
  han_chot_chao_gia: string;
  items: Goi2Item[];
  nha_cung_cap: Vendor[];
  nha_thau_trung_id: string;
  phan_bo_ban_giao: HandoverAllocation[];
}

/**
 * Server Action: Submit Hồ sơ Gói 2.
 * Transaction bao gồm:
 *   1. INSERT ho_so_mua_sam
 *   2. INSERT danh_sach_hang_hoa  → build hangHoaIdMap (ten_hang → id)
 *   3. INSERT nha_cung_cap_goi_thau
 *   4. INSERT chi_tiet_bao_gia    (dùng hangHoaIdMap để gắn hang_hoa_id)
 * Sau COMMIT: gọi Flask /generate-doc-goi2 → trả về ZIP file.
 */
export async function submitHoSoGoi2(payload: Goi2Payload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ─── Xác định NCC trúng thầu ────────────────────────────────────────
    const winningVendor = payload.nha_cung_cap.find(
      (v) => v.id === payload.nha_thau_trung_id
    );
    const tenNhaThauTrung = winningVendor?.ten_ncc ?? "Chưa xác định";

    // ─── Bước 1: INSERT ho_so_mua_sam ───────────────────────────────────
    const hoSoResult = await client.query(
      `INSERT INTO ho_so_mua_sam (
         ma_ho_so, so_de_xuat, ngay_de_xuat, user_yeu_cau,
         bo_phan_yeu_cau, thoi_gian_giao_hang, so_thu_moi,
         thoi_gian_bao_hanh, loai_goi_thau, trang_thai,
         ten_nha_thau_trung, created_at, external_scans
       ) VALUES (
         'HSMS-G2-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
         $1, $2, $3, $4, $5, $6, $7,
         'Gói 2', 'Mới tạo', $8, now(), $9
       ) RETURNING id, ma_ho_so`,
      [
        payload.so_de_xuat,
        payload.ngay_de_xuat,
        payload.mua_cho_ai,
        payload.bo_phan_yeu_cau,
        payload.thoi_gian_giao_hang,
        payload.so_thu_moi,
        payload.thoi_gian_bao_hanh,
        tenNhaThauTrung,
        JSON.stringify({
          nha_thau_trung_id: payload.nha_thau_trung_id,
          phan_bo_ban_giao: payload.phan_bo_ban_giao,
          ngay_lam_thu_moi: payload.ngay_lam_thu_moi,
          han_chot_chao_gia: payload.han_chot_chao_gia,
        }),
      ]
    );
    const hoSoId: number = hoSoResult.rows[0].id;
    const maHoSo: string = hoSoResult.rows[0].ma_ho_so;

    // ─── Bước 2: INSERT danh_sach_hang_hoa ──────────────────────────────
    // RETURNING id để build map ten_hang → hang_hoa_id
    const hangHoaIdMap: Record<string, number> = {};

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];

      // Đơn giá từ NCC trúng thầu
      const winningQuote = winningVendor?.quotes.find(
        (q) => q.ten_hang === item.ten_hang
      );
      const donGia = Number(winningQuote?.don_gia) || 0;

      const itemResult = await client.query(
        `INSERT INTO danh_sach_hang_hoa (
           ho_so_id, stt, ten_hang, chi_tiet, dvt,
           so_luong, don_gia, ghi_chu, chung_chi
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          hoSoId,
          i + 1,
          item.ten_hang,
          item.chi_tiet,
          item.dvt,
          Number(item.so_luong) || 0,
          donGia,
          item.ghi_chu || `Trúng thầu bởi: ${tenNhaThauTrung}`,
          item.chung_chi || "",
        ]
      );

      hangHoaIdMap[item.ten_hang] = itemResult.rows[0].id;
    }

    // ─── Bước 3: INSERT nha_cung_cap_goi_thau + chi_tiet_bao_gia ────────
    for (const ncc of payload.nha_cung_cap) {
      // 3a. Insert NCC
      const nccResult = await client.query(
        `INSERT INTO nha_cung_cap_goi_thau (
           ho_so_id, ten_ncc, thue_vat, is_trung_thau
         ) VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [
          hoSoId,
          ncc.ten_ncc,
          ncc.thue_vat ?? 8,
          ncc.id === payload.nha_thau_trung_id,
        ]
      );
      const nccId: number = nccResult.rows[0].id;

      // 3b. Insert từng báo giá (chi_tiet_bao_gia)
      for (const quote of ncc.quotes) {
        const hangHoaId = hangHoaIdMap[quote.ten_hang];
        if (!hangHoaId) {
          console.warn(
            `[Goi2] Khong tim thay hang_hoa_id cho ten_hang='${quote.ten_hang}', bo qua.`
          );
          continue;
        }
        await client.query(
          `INSERT INTO chi_tiet_bao_gia (ncc_id, hang_hoa_id, don_gia, danh_gia)
           VALUES ($1, $2, $3, $4)`,
          [nccId, hangHoaId, Number(quote.don_gia) || 0, quote.danh_gia || "dat"]
        );
      }
    }

    // ─── Bước 4: COMMIT ─────────────────────────────────────────────────
    await client.query("COMMIT");

    // ─── Bước 5: Gọi Flask /generate-doc-goi2 → ZIP ─────────────────────
    let fileName = "";
    try {
      // Xây payload đầy đủ cho Python factory
      // (nha_cung_cap với quotes chứa ten_hang để _find_quote() match đúng)
      const flaskPayload = {
        action: "goi_2",
        ho_so_id: hoSoId,
        ma_ho_so: maHoSo,
        so_de_xuat: payload.so_de_xuat,
        ngay_de_xuat: payload.ngay_de_xuat,
        mua_cho_ai: payload.mua_cho_ai,
        bo_phan_yeu_cau: payload.bo_phan_yeu_cau,
        thoi_gian_giao_hang: payload.thoi_gian_giao_hang,
        so_thu_moi: payload.so_thu_moi,
        thoi_gian_bao_hanh: payload.thoi_gian_bao_hanh,
        ngay_lam_thu_moi: payload.ngay_lam_thu_moi,
        han_chot_chao_gia: payload.han_chot_chao_gia,
        ten_nha_thau_trung: tenNhaThauTrung,
        nha_thau_trung_id: payload.nha_thau_trung_id,
        phan_bo_ban_giao: payload.phan_bo_ban_giao,
        // items: đủ trường cho PMT và CBE
        items: payload.items.map((item, idx) => {
          const wq = winningVendor?.quotes.find(
            (q) => q.ten_hang === item.ten_hang
          );
          return {
            stt: idx + 1,
            ten_hang: item.ten_hang,
            chi_tiet: item.chi_tiet,
            dvt: item.dvt,
            so_luong: item.so_luong,
            don_gia: Number(wq?.don_gia) || 0,
            chung_chi: item.chung_chi || "",
            ghi_chu: item.ghi_chu || "",
          };
        }),
        // nha_cung_cap: giữ nguyên quotes với ten_hang để Python match
        nha_cung_cap: payload.nha_cung_cap.map((ncc) => ({
          ten_ncc: ncc.ten_ncc,
          thue_vat: ncc.thue_vat,
          quotes: ncc.quotes, // [{ten_hang, don_gia, danh_gia}]
        })),
      };

      const resp = await fetch("http://localhost:5000/generate-doc-goi2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flaskPayload),
      });

      if (resp.ok) {
        const data = await resp.json();
        fileName = data.file_sinh_ra?.file_name || "";
      } else {
        const errText = await resp.text();
        console.warn("[Goi2] Flask tra loi loi:", resp.status, errText);
      }
    } catch (e) {
      console.warn("[Goi2] Khong the goi Flask /generate-doc-goi2:", e);
    }

    return { success: true, hoSoId, maHoSo, fileName };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("[Goi2] Transaction ROLLBACK:", error);
    return {
      success: false,
      error: error.message || "Lỗi giao dịch cơ sở dữ liệu.",
    };
  } finally {
    client.release();
  }
}
