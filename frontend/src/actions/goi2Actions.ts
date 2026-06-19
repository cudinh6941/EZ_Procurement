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
  // Goi 1 general fields (snake_case)
  so_de_xuat: string;
  mua_cho_ai: string;
  ngay_de_xuat: string;
  bo_phan_yeu_cau: string;
  thoi_gian_giao_hang: string;
  so_thu_moi: string;
  thoi_gian_bao_hanh: string;
  ngay_lam_thu_moi: string;
  han_chot_chao_gia: string;

  // Items and vendor fields
  items: Goi2Item[];
  nha_cung_cap: Vendor[];
  nha_thau_trung_id: string;
  phan_bo_ban_giao: HandoverAllocation[];
}

/**
 * Server Action to submit Goi 2 procurement profile.
 * Executes database queries within a single transaction.
 */
export async function submitHoSoGoi2(payload: Goi2Payload) {
  const client = await pool.connect();

  try {
    // 1. Begin SQL Transaction
    await client.query("BEGIN");

    // Get the winning vendor name
    const winningVendor = payload.nha_cung_cap.find(v => v.id === payload.nha_thau_trung_id);
    const tenNhaThauTrung = winningVendor ? winningVendor.ten_ncc : "Chưa xác định";

    // 2. Insert General Info into ho_so_mua_sam
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
        loai_goi_thau, 
        trang_thai,
        ten_nha_thau_trung,
        created_at,
        external_scans
      ) VALUES (
        'HSMS-G2-' || to_char(now(), 'YYYYMMDD-HH24MISS'), 
        $1, $2, $3, $4, $5, $6, $7, 'Gói 2', 'Mới tạo', $8, now(), $9
      ) RETURNING id, ma_ho_so;
    `;

    const hoSoValues = [
      payload.so_de_xuat,
      payload.ngay_de_xuat,
      payload.mua_cho_ai, // requester/project info
      payload.bo_phan_yeu_cau,
      payload.thoi_gian_giao_hang,
      payload.so_thu_moi,
      payload.thoi_gian_bao_hanh,
      tenNhaThauTrung,
      JSON.stringify({
        nha_cung_cap: payload.nha_cung_cap,
        nha_thau_trung_id: payload.nha_thau_trung_id,
        phan_bo_ban_giao: payload.phan_bo_ban_giao,
        ngay_lam_thu_moi: payload.ngay_lam_thu_moi,
        han_chot_chao_gia: payload.han_chot_chao_gia
      })
    ];

    const hoSoResult = await client.query(hoSoQuery, hoSoValues);
    const hoSoId = hoSoResult.rows[0].id;
    const maHoSo = hoSoResult.rows[0].ma_ho_so;

    // 3. Insert items into danh_sach_hang_hoa
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

    for (let i = 0; i < payload.items.length; i++) {
      const item = payload.items[i];
      
      // Find the winning vendor's quote price for this item
      let donGia = 0;
      if (winningVendor) {
        const quote = winningVendor.quotes.find(q => q.ten_hang === item.ten_hang);
        if (quote) {
          donGia = quote.don_gia;
        }
      }

      const itemValues = [
        hoSoId,
        i + 1, // STT
        item.ten_hang,
        item.chi_tiet,
        item.dvt,
        Number(item.so_luong) || 0,
        Number(donGia) || 0,
        item.ghi_chu || `Trúng thầu bởi: ${tenNhaThauTrung}`,
        item.chung_chi || ""
      ];
      await client.query(itemQuery, itemValues);
    }

    // 4. Commit SQL Transaction
    await client.query("COMMIT");

    // 5. Trigger n8n webhook or Flask server to compile documents
    let fileName = "";
    try {
      const apiPayload = {
        action: "all",
        id: hoSoId,
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
        nha_cung_cap: payload.nha_cung_cap,
        nha_thau_trung_id: payload.nha_thau_trung_id,
        phan_bo_ban_giao: payload.phan_bo_ban_giao,
        items: payload.items.map((item, idx) => {
          let donGia = 0;
          if (winningVendor) {
            const quote = winningVendor.quotes.find(q => q.ten_hang === item.ten_hang);
            if (quote) donGia = quote.don_gia;
          }
          return {
            stt: idx + 1,
            ten_hang: item.ten_hang,
            chi_tiet: item.chi_tiet,
            dvt: item.dvt,
            so_luong: item.so_luong,
            don_gia: donGia,
            thanh_tien: item.so_luong * donGia,
            chung_chi: item.chung_chi || "",
            ghi_chu: item.ghi_chu || ""
          };
        })
      };

      // Call n8n package 2 generation webhook
      const response = await fetch("http://localhost:5678/webhook-test/generate-doc-package2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const data = await response.json();
        fileName = data.file_sinh_ra?.file_name || "";
      }
    } catch (e) {
      console.warn("Failed to call document generation API for Gói 2:", e);
    }

    // Trigger Flask's run-next-step to kick off bot upload workflow for Gói 2
    try {
      await fetch("http://localhost:5000/run-next-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ho_so_id: hoSoId }),
      });
    } catch (e) {
      console.warn("Failed to trigger Flask run-next-step:", e);
    }

    return {
      success: true,
      hoSoId,
      maHoSo,
      fileName,
    };
  } catch (error: any) {
    // Rollback SQL Transaction on any error
    await client.query("ROLLBACK");
    console.error("Error in submitHoSoGoi2 Server Action:", error);
    return {
      success: false,
      error: error.message || "Lỗi giao dịch cơ sở dữ liệu (Transaction Rollback).",
    };
  } finally {
    client.release();
  }
}
