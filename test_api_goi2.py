"""
Test gọi Flask API /generate-doc với payload Gói 2 và tự động mở file kết quả.
Chạy: python test_api_goi2.py
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
import requests
import os
import subprocess

API_BASE = "http://localhost:5000"

payload = {
    "action": "goi_2",
    "ma_ho_so": "HSMS-G2-TEST-001",
    "bo_phan_yeu_cau": "Ban Dự Án PMThjghjkbhjbhj,",
    "items": [
        {
            "ten_hang": "Laptop Asus ExpertBook P1",
            "chi_tiet": "CPU Intel i5-13420H, RAM 16GB, SSD 512GB, Win 11",
            "dvt": "Cái",
            "so_luong": 1
        },
        {
            "ten_hang": "Màn hình Viewsonic 24inch",
            "chi_tiet": "Full HD 1920x1080, 75Hz, IPS Panel, chống lóa",
            "dvt": "Cái",
            "so_luong": 4
        },
        {
            "ten_hang": "Aruba Access Point AP-303",
            "chi_tiet": "Dual-band 802.11ac, Bluetooth BLE, PoE",
            "dvt": "Cái",
            "so_luong": 2
        }
    ],
    "nha_cung_cap": [
        {
            "id": "ncc_1",
            "ten_ncc": "CÔNG TY TNHH PHÚ SĨ",
            "thue_vat": 8,
            "quotes": [
                {"ten_hang": "Laptop Asus ExpertBook P1",    "don_gia": 17900000, "danh_gia": "dat"},
                {"ten_hang": "Màn hình Viewsonic 24inch",    "don_gia": 3950000,  "danh_gia": "dat"},
                {"ten_hang": "Aruba Access Point AP-303",    "don_gia": 6800000,  "danh_gia": "dat"},
            ]
        },
        {
            "id": "ncc_2",
            "ten_ncc": "DNTN VIỆT TIN",
            "thue_vat": 8,
            "quotes": [
                {"ten_hang": "Laptop Asus ExpertBook P1",    "don_gia": 18450000, "danh_gia": "dat"},
                {"ten_hang": "Màn hình Viewsonic 24inch",    "don_gia": 4100000,  "danh_gia": "dat"},
                {"ten_hang": "Aruba Access Point AP-303",    "don_gia": 7200000,  "danh_gia": "dat"},
            ]
        },
        {
            "id": "ncc_3",
            "ten_ncc": "CÔNG TY TNHH BẢO MINH",
            "thue_vat": 8,
            "quotes": [
                {"ten_hang": "Laptop Asus ExpertBook P1",    "don_gia": 18100000, "danh_gia": "dat"},
                {"ten_hang": "Màn hình Viewsonic 24inch",    "don_gia": 4100000,  "danh_gia": "dat"},
                {"ten_hang": "Aruba Access Point AP-303",    "don_gia": 6900000,  "danh_gia": "khong_dat"},
            ]
        }
    ],
    "nha_thau_trung_id": "ncc_1"
}

print("=" * 55)
print("  TEST: Goi Flask API /generate-doc - Goi 2 CBE")
print("=" * 55)
print(f"  URL  : {API_BASE}/generate-doc")
print(f"  Items: {len(payload['items'])} hang hoa, {len(payload['nha_cung_cap'])} NCC")
print()

try:
    resp = requests.post(f"{API_BASE}/generate-doc", json=payload, timeout=30)
    print(f"  HTTP Status : {resp.status_code}")

    if resp.status_code == 200:
        data = resp.json()
        print(f"  Response    : {data}")
        file_name = data.get("file_sinh_ra", {}).get("file_name", "")

        if file_name:
            print()
            print(f"  File sinh ra: {file_name}")
            dl_url = f"{API_BASE}/download-file/{file_name}"
            print(f"  Download URL: {dl_url}")

            # Tải file về thư mục Downloads
            dl_resp = requests.get(dl_url, timeout=30)
            if dl_resp.status_code == 200:
                save_path = os.path.join(os.path.expanduser("~"), "Downloads", file_name)
                with open(save_path, "wb") as f:
                    f.write(dl_resp.content)
                print(f"  Da tai ve  : {save_path}")
                print()
                print("  Mo file Excel de kiem tra...")
                os.startfile(save_path)
            else:
                print(f"  Loi tai file: HTTP {dl_resp.status_code}")
        else:
            print("  Khong co file_name trong response!")
    else:
        print(f"  Loi API: {resp.text[:500]}")

except requests.exceptions.ConnectionError:
    print("  LOI: Khong ket noi duoc Flask server tai localhost:5000")
    print("  -> Hay chay: python api.py")
except Exception as e:
    print(f"  LOI: {e}")

print()
print("=" * 55)
