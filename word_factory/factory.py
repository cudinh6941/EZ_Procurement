from word_factory.builders.thu_moi import build_thu_moi_doc
from word_factory.builders.ban_giao import build_ban_giao_doc
from word_factory.builders.thanh_toan import build_thanh_toan_doc

def generate_document(doc_type, data):
    """Điểm chạm duy nhất để sinh file Word"""
    mapping = {
        "thu_moi": build_thu_moi_doc,
        "goi_1": build_thu_moi_doc,       # Backwards compatibility cho route cũ
        "ban_giao": build_ban_giao_doc,
        "thanh_toan": build_thanh_toan_doc
    }
    
    builder_func = mapping.get(doc_type)
    if not builder_func:
        raise ValueError(f"Loại văn bản hành chính '{doc_type}' chưa được cấu hình hệ thống!")
        
    return builder_func(data)