import os
import time
from docxtpl import DocxTemplate
from word_factory.utils.formatters import split_ngay_khoi_tao, sanitize_filename
from word_factory.utils.docx_helpers import fill_hang_hoa_table
from word_factory.services.goods_processor import preprocess_hang_hoa, generate_global_certs_text

def build_thu_moi_doc(data):
    raw_goods = data.get("danh_sach_hang_hoa") or []
    hang_hoa_xu_ly = preprocess_hang_hoa(raw_goods)
    ngay_context = split_ngay_khoi_tao(str(data.get("created_at", "")))
    
    context = {
        "SoThuMoi": str(data.get("so_thu_moi", "..................")),
        "ThoiGianGiaoHang": str(data.get("thoi_gian_giao_hang", "..................")),
        "ThoiGianBaoHanh": str(data.get("thoi_gian_bao_hanh", "..................")),
        "HanChot": str(data.get("han_chot_chao_gia", "..................")),
        "BoPhanYeuCau": str(data.get("bo_phan_yeu_cau", "Phòng TKE")),
        "NguoiYeuCau": str(data.get("user_yeu_cau", "Ms Trâm")),
        "NgayDeXuat": str(data.get("ngay_de_xuat", "..................")),
        "ChungChiBaoGom": generate_global_certs_text(raw_goods),
        **ngay_context
    }
    
    BASE_DATA_PATH = os.path.abspath(os.getenv("BASE_DATA_PATH", "/data"))
    os.makedirs(BASE_DATA_PATH, exist_ok=True)
    template_path = os.path.join(BASE_DATA_PATH, "Thu_moi_chao_gia.docx")
    safe_ma_ho_so = sanitize_filename(data.get('ma_ho_so', 'Unknown'))
    output_path = os.path.join(BASE_DATA_PATH, f"ThuMoi_Goi1_{safe_ma_ho_so}_{int(time.time())}.docx")
    
    if not os.path.exists(template_path): raise FileNotFoundError(f"Thiếu template: {template_path}")
    
    doc_tpl = DocxTemplate(template_path)
    doc_tpl.render(context)
    doc_tpl.save(output_path)
    fill_hang_hoa_table(output_path, hang_hoa_xu_ly, "thu_moi")
    return {"status": "success", "file_name": os.path.basename(output_path)}