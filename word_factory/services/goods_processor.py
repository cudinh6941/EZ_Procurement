import re
from collections import Counter

def preprocess_hang_hoa(danh_sach):
    if not danh_sach:
        danh_sach = []
    hang_hoa_xu_ly = []
    for index, item in enumerate(danh_sach, start=1):
        chi_tiet_goc = str(item.get("chi_tiet", ""))
        ghi_chu_goc = str(item.get("ghi_chu", "Mới 100%"))
        chung_chi_goc = str(item.get("chung_chi", ""))
        danh_sach_chi_tiet = [d.strip() for d in chi_tiet_goc.split('-') if d.strip()]
        danh_sach_chung_chi = [d.strip() for d in chung_chi_goc.split('-') if d.strip()]
        danh_sach_ghi_chu = [d.strip() for d in ghi_chu_goc.split('-') if d.strip()]
        chi_tiet_render = "\n".join([f"- {d}" for d in danh_sach_chi_tiet])
        chung_chi_render = "\n".join([f"- {d}" for d in danh_sach_chung_chi])
        ghi_chu_render = "\n".join([f"- {d}" for d in danh_sach_ghi_chu])
        item_moi = {
            **item,
            "STT": item.get("stt", index),
            "TenHang": item.get("ten_hang", ""),
            "DVT": item.get("dvt", ""),
            "SoLuong": item.get("so_luong", ""),
            "ChiTietRender": chi_tiet_render,
            "GhiChu": ghi_chu_render,
            "ChungChi": chung_chi_render,
        }
        hang_hoa_xu_ly.append(item_moi)
    return hang_hoa_xu_ly

def clean_and_summarize_goods(danh_sach_hang_hoa, bo_phan_yeu_cau):
    if not danh_sach_hang_hoa:
        return f"thiết bị cho {bo_phan_yeu_cau}" if bo_phan_yeu_cau else "thiết bị"

    DICTIONARY = {
        r"máy tính (xách tay|laptop|dell|hp|thinkpad|asus|acer)": "máy tính xách tay",
        r"máy tính để bàn|pc|computer": "máy tính để bàn",
        r"màn hình|monitor|display": "màn hình",
        r"máy in|printer": "máy in",
        r"chuột|mouse": "chuột máy tính",
        r"bàn phím|keyboard": "bàn phím"
    }

    summary_counter = Counter()
    for item in danh_sach_hang_hoa:
        ten_raw = str(item.get("ten_hang", "")).lower()
        so_luong = int(item.get("so_luong", 1))

        matched_group = None
        for pattern, group_name in DICTIONARY.items():
            if re.search(pattern, ten_raw):
                matched_group = group_name
                break
        
        if not matched_group:
            matched_group = " ".join(ten_raw.split()[:5])

        summary_counter[matched_group] += so_luong

    list_phrases = []
    for group_name, qty in summary_counter.items():
        qty_str = f"{qty:02d}" 
        list_phrases.append(f"{qty_str} {group_name}")

    if len(list_phrases) == 1:
        chuoi_hang_hoa = list_phrases[0]
    else:
        chuoi_hang_hoa = ", ".join(list_phrases[:-1]) + " và " + list_phrases[-1]

    if bo_phan_yeu_cau:
        return f"{chuoi_hang_hoa} cho {bo_phan_yeu_cau}"
    return chuoi_hang_hoa

def generate_global_certs_text(danh_sach_hang_hoa):
    if not danh_sach_hang_hoa:
        return ".................................................."

    cert_to_stts = {}
    all_actual_stts = []

    for index, item in enumerate(danh_sach_hang_hoa, start=1):
        stt = item.get("stt") or item.get("STT") or index
        all_actual_stts.append(stt)
        
        ghi_chu_goc = str(item.get("chung_chi")).strip()
        certs = [c.strip() for c in ghi_chu_goc.split("-") if c.strip()]

        for cert in certs:
            if cert not in cert_to_stts:
                cert_to_stts[cert] = []
            if stt not in cert_to_stts[cert]:
                cert_to_stts[cert].append(stt)

    stts_to_certs = {}
    for cert, stts in cert_to_stts.items():
        stts_tuple = tuple(sorted(stts))
        if stts_tuple not in stts_to_certs:
            stts_to_certs[stts_tuple] = []
        stts_to_certs[stts_tuple].append(cert)

    result_lines = []
    total_items = len(danh_sach_hang_hoa)
    sorted_groups = sorted(stts_to_certs.keys(), key=lambda x: (0 if len(x) == total_items else 1, x))

    for stts in sorted_groups:
        certs_list = stts_to_certs[stts]
        certs_str = ", ".join(certs_list)
        certs_str = certs_str[0].upper() + certs_str[1:] if certs_str else ""

        if len(stts) == total_items or len(all_actual_stts) <= 1:
            result_lines.append(f"• {certs_str}.")
        else:
            stt_formatted = ", ".join([f"số {s:02d}" for s in stts])
            result_lines.append(f"• {certs_str} đối với mục {stt_formatted}.")

    return "\n".join(result_lines) if result_lines else "• Theo quy định nhà sản xuất."