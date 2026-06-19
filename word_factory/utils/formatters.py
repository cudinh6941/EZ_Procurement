import re
from datetime import datetime

def sanitize_filename(name: str) -> str:
    """
    Loại bỏ các ký tự bị cấm trên Windows khỏi tên file.
    Windows không cho phép: \\ / : * ? " < > |
    """
    # Thay thế tất cả ký tự nguy hiểm bằng dấu gạch ngang
    sanitized = re.sub(r'[\\/:*?"<>|]', '-', str(name))
    # Gộp nhiều dấu gạch ngang liên tiếp thành một
    sanitized = re.sub(r'-+', '-', sanitized)
    # Cắt bỏ dấu gạch ngang ở đầu và cuối
    return sanitized.strip('-') or 'Unknown'

def split_ngay_khoi_tao(date_str):
    if not date_str:
        return {"NgayLap": "", "ThangLap": "", "NamLap": ""}
    if "T" in date_str:
        date_str = date_str.split("T")[0]
    if "/" in date_str:
        parts = date_str.split("/")
        if len(parts) >= 3:
            return {"NgayLap": parts[0], "ThangLap": parts[1], "NamLap": parts[2]}
    if "-" in date_str:
        parts = date_str.split("-")
        if len(parts) >= 3:
            if len(parts[0]) == 4: 
                return {"NgayLap": parts[2], "ThangLap": parts[1], "NamLap": parts[0]}
            else:
                return {"NgayLap": parts[0], "ThangLap": parts[1], "NamLap": parts[2]}
    return {"NgayLap": "", "ThangLap": "", "NamLap": ""}

def doc_so_tien_vnd(number):
    try:
        amt = int(float(number))
    except:
        return "........................................................"
    if amt == 0: return "Không đồng"
    
    digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    units = [["", "mười", "trăm"], ["nghìn", "mười", "trăm"], ["triệu", "mười", "trăm"], ["tỷ", "mười", "trăm"]]
    
    def read_block(n, show_zero):
        res = ""
        hundred = n // 100
        ten = (n % 100) // 10
        one = n % 10
        if hundred > 0 or show_zero:
            res += digits[hundred] + " trăm "
        if ten == 0:
            if hundred > 0 and one > 0: res += "linh "
        elif ten == 1: res += "mười "
        else: res += digits[ten] + " mươi "
        if one == 1:
            if ten > 1: res += "mốt "
            else: res += "một "
        elif one == 5:
            if ten > 0: res += "lăm "
            else: res += "năm "
        elif one > 0:
            res += digits[one] + " "
        return res

    str_num = str(amt)
    while len(str_num) % 3 != 0: str_num = "0" + str_num
    blocks = [int(str_num[i:i+3]) for i in range(0, len(str_num), 3)]
    
    words = ""
    for idx, block in enumerate(blocks):
        unit_idx = len(blocks) - 1 - idx
        if block > 0 or unit_idx == 0:
            show_zero = idx > 0
            block_text = read_block(block, show_zero)
            if block_text:
                words += block_text + units[unit_idx][0] + " "
                
    words = words.strip().replace("  ", " ")
    return words.capitalize() + " đồng chẵn"