import os
import time
from datetime import datetime, timedelta
from docxtpl import DocxTemplate
from word_factory.utils.formatters import sanitize_filename
from word_factory.utils.docx_helpers import fill_hang_hoa_table
from word_factory.services.goods_processor import preprocess_hang_hoa

def build_ban_giao_doc(data):
    raw_goods = data.get("danh_sach_hang_hoa") or []
    hang_hoa_xu_ly = preprocess_hang_hoa(raw_goods)
    
    ngay_thu_moi_str = data.get("ngay_thu_moi")
    if ngay_thu_moi_str:
        if isinstance(ngay_thu_moi_str, str):
            clean_date = ngay_thu_moi_str.split(" ")[0].split("T")[0]
            ngay_obj = datetime.strptime(clean_date, "%Y-%m-%d")
        else:
            ngay_obj = ngay_thu_moi_str
        ngay_ban_giao_obj = ngay_obj + timedelta(days=2)
    else:
        ngay_ban_giao_obj = datetime.now() + timedelta(days=2)
    
    ngay_ban_giao_format = ngay_ban_giao_obj.strftime("%d/%m/%Y")
    
    context = {
        "NguoiYeuCau": str(data.get("user_yeu_cau", "......")),
        "BoPhanYeuCau": str(data.get("bo_phan_yeu_cau", "......")),
        "NgayBanGiao": ngay_ban_giao_format  
    }
    
    BASE_DATA_PATH = os.path.abspath(os.getenv("BASE_DATA_PATH", "/data"))
    os.makedirs(BASE_DATA_PATH, exist_ok=True)
    template_path = os.path.join(BASE_DATA_PATH, "Bien_ban_ban_giao.docx")
    safe_ma_ho_so = sanitize_filename(data.get('ma_ho_so', 'Unknown'))
    output_path = os.path.join(BASE_DATA_PATH, f"BB_BanGiao_NoiBo_{safe_ma_ho_so}_{int(time.time())}.docx")
    
    if not os.path.exists(template_path): raise FileNotFoundError(f"Thiếu template: {template_path}")
    
    doc_tpl = DocxTemplate(template_path)
    doc_tpl.render(context)
    doc_tpl.save(output_path)
    fill_hang_hoa_table(output_path, hang_hoa_xu_ly, "ban_giao")
    return {"status": "success", "file_name": os.path.basename(output_path)}