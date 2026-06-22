import os
import time
from datetime import datetime, timezone, timedelta
from docxtpl import DocxTemplate
from word_factory.utils.formatters import doc_so_tien_vnd, sanitize_filename
from word_factory.services.goods_processor import clean_and_summarize_goods

def build_thanh_toan_doc(data):
    danh_sach = data.get("danh_sach_hang_hoa") or []
    bo_phan_goc = str(data.get("bo_phan_yeu_cau", "......")) 
    
    for item in danh_sach:
        if not item.get("ten_hang") or not str(item.get("ten_hang")).strip():
            item["ten_hang"] = "thiết bị/vật tư"

    chuoi_v_v = clean_and_summarize_goods(danh_sach, bo_phan_goc)
    chuoi_rut_gon = clean_and_summarize_goods(danh_sach, "").replace(" cho ", "").strip()

    tong_tien_chura_vat = 0
    for item in danh_sach:
        sl = float(item.get("so_luong", 0) or 0)
        dg = float(item.get("don_gia", 0) or 0)
        tong_tien_chura_vat += sl * dg
        
    vat = tong_tien_chura_vat * 0.08
    tong_thanh_toan = tong_tien_chura_vat + vat
    
    tien_so_str = "{:,.0f}".format(tong_thanh_toan).replace(",", ".") if tong_thanh_toan > 0 else ".................."
    tien_chu_str = doc_so_tien_vnd(tong_thanh_toan) if tong_thanh_toan > 0 else "........................................."

    ngay_dx_raw = data.get("ngay_de_xuat", "")
    ngay_dx_format = "..../..../...."
    if ngay_dx_raw:
        try:
            raw_str = str(ngay_dx_raw).strip()
            # Nếu là ISO timestamp có chữ T (e.g. 2026-06-21T17:00:00Z hoặc 2026-06-21T17:00:00+00:00)
            # → DB lưu UTC, phải cộng +7 để ra giờ Việt Nam trước khi lấy ngày
            if "T" in raw_str:
                # Chuẩn hóa: bỏ Z cuối, thay bằng +00:00 để fromisoformat hiểu
                raw_str_iso = raw_str.replace("Z", "+00:00")
                dt_utc = datetime.fromisoformat(raw_str_iso)
                # Nếu không có tzinfo, coi là UTC
                if dt_utc.tzinfo is None:
                    dt_utc = dt_utc.replace(tzinfo=timezone.utc)
                dt_vn = dt_utc.astimezone(timezone(timedelta(hours=7)))
                ngay_dx_format = dt_vn.strftime("%d/%m/%Y")
            else:
                # Chỉ có phần ngày thuần (YYYY-MM-DD), parse trực tiếp không cần convert
                clean_date = raw_str.split(" ")[0]
                ngay_dx_format = datetime.strptime(clean_date, "%Y-%m-%d").strftime("%d/%m/%Y")
        except Exception:
            ngay_dx_format = str(ngay_dx_raw)

    context = {
        "BoPhanYeuCau": chuoi_v_v,
        "NoiDungChiTiet": chuoi_rut_gon,
        "SoDeXuat": str(data.get("so_de_xuat", ".....")),
        "NgayDeXuat": ngay_dx_format,
        "TongTien": tien_so_str,
        "SoTienBangChu": tien_chu_str,
        "NguoiPhuTrach": str(data.get("nguoi_phu_trach", ".......")),
    }
    
    BASE_DATA_PATH = os.path.abspath(os.getenv("BASE_DATA_PATH", "/data"))
    os.makedirs(BASE_DATA_PATH, exist_ok=True)
    template_path = os.path.join(BASE_DATA_PATH, "Giay_de_nghi_thanh_toan.docx")
    safe_ma_ho_so = sanitize_filename(data.get('ma_ho_so', 'Unknown'))
    output_path = os.path.join(BASE_DATA_PATH, f"DeNghiThanhToan_{safe_ma_ho_so}_{int(time.time())}.docx")
    
    if not os.path.exists(template_path): raise FileNotFoundError(f"Thiếu template: {template_path}")
    
    doc_tpl = DocxTemplate(template_path)
    doc_tpl.render(context)
    doc_tpl.save(output_path)
    return {"status": "success", "file_name": os.path.basename(output_path)}