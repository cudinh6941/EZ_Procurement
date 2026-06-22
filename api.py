
import os
import sys

# Force UTF-8 encoding for stdout and stderr to prevent encoding crashes on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 1. Load env variables manually or via python-dotenv immediately
env_file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
try:
    from dotenv import load_dotenv
    load_dotenv(env_file_path)
except ImportError:
    if os.path.exists(env_file_path):
        with open(env_file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")

# 2. Get and convert BASE_DATA_PATH to absolute path, then write back to os.environ
raw_path = os.getenv("BASE_DATA_PATH", "./data")
BASE_DATA_PATH = os.path.abspath(raw_path)
os.environ["BASE_DATA_PATH"] = BASE_DATA_PATH

# 3. Ensure the folder exists
os.makedirs(BASE_DATA_PATH, exist_ok=True)

# 4. Print debug info
print("=" * 60)
print("SYSTEM DEBUG INFO:")
print(f"BASE_DATA_PATH from .env: {raw_path}")
print(f"Resolved absolute path: {BASE_DATA_PATH}")
print(f"Directory status: {'Exists' if os.path.exists(BASE_DATA_PATH) else 'Created'}")
print("=" * 60)

# 5. Import standard and application libraries
from flask import Flask, request, jsonify, send_from_directory
from word_factory.factory import generate_document as factory_generate_document 
from excel_factory.factory import ExcelFactory
import eoffice_bot
import time
import zipfile
import json
import requests
import werkzeug.utils

app = Flask(__name__)
SHARED_OTP_CODE = None

@app.route('/generate-word-doc', methods=['POST'])
def generate_word_doc():
    """Route cũ phục vụ luồng sơ khai"""
    incoming = request.get_json(silent=True)
    if isinstance(incoming, list) and len(incoming) > 0:
        data = incoming[0]
    elif isinstance(incoming, dict):
        data = incoming.get("body", incoming)
    else:
        return jsonify({"status": "Lỗi", "chi_tiet": "Payload không hợp lệ"}), 400

    try:
        # Gọi qua tên alias mới đặt
        result = factory_generate_document("goi_1", data)
        return jsonify({"file_sinh_ra": result}), 200
    except Exception as e:
        return jsonify({"status": "Lỗi", "chi_tiet": str(e)}), 500


# 🌟 GIỮ NGUYÊN TÊN HÀM GỐC 'generate_document' CỦA ÔNG KHÔNG ĐỔI MỘT CHỮ!
@app.route('/generate-doc', methods=['POST'])
def generate_document():
    """Route trung tâm xử lý đúc đơn lẻ hoặc trọn bộ hồ sơ + Bắn Telegram"""
    data = request.json
    action = data.get("action", "thu_moi")
    
    TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "8868470986:AAEOtgjpH56MoOhpywSfbAceKLCIKdFNgj0")
    CHAT_ID = os.getenv("CHAT_ID", "1184601478")
    
    reply_markup = {
        "inline_keyboard": [
            [
                { "text": "🟢 Tiến hành Trình Ký", "callback_data": "action_approve" },
                { "text": "🔴 Hủy / Sửa lại", "callback_data": "action_reject" }
            ]
        ]
    }

    def send_preview_to_telegram(word_file_name, label):
        ho_so_id = data.get("id") or data.get("ho_so_id") or "999"
        docx_path = os.path.join(BASE_DATA_PATH, word_file_name)
        pdf_path = eoffice_bot.convert_docx_to_pdf(docx_path, BASE_DATA_PATH)
        
        if pdf_path and os.path.exists(pdf_path):
            print(f"📦 [PREVIEW] Đang nã file PDF {label} lên Telegram...")
            url_doc = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
            with open(pdf_path, "rb") as f:
                requests.post(url_doc, data={"chat_id": CHAT_ID, "caption": f"📄 BẢN PREVIEW PDF: {label.upper()}"}, files={"document": f})
            
            url_mess = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            text_content = f"🔔 Hệ thống đã sinh xong {label} cho Hồ sơ số #{ho_so_id}!\n\nÔng Định lướt xem file PDF gửi ở trên xem chuẩn chỉ chưa rồi chọc nút ra lệnh nhé:"
            requests.post(url_mess, data={"chat_id": CHAT_ID, "text": text_content, "reply_markup": json.dumps(reply_markup)})
            return os.path.basename(pdf_path)
        return None

    # Định tuyến Gói 2 sang excel_factory (backward compat)
    is_goi_2 = ("nha_cung_cap" in data) or ("phan_bo_ban_giao" in data) or (action == "goi_2")
    if is_goi_2:
        try:
            excel_gen = ExcelFactory()
            result = excel_gen.generate_cbe_excel(data)
            return jsonify({"file_sinh_ra": result}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    try:
        label_map = {
            "thu_moi": "Thư mời chào giá",
            "ban_giao": "Biên bản bàn giao nội bộ",
            "thanh_toan": "Giấy đề nghị thanh toán"
        }

        if action == "all":
            # Gọi qua tên alias mới đặt
            res_thu_moi = factory_generate_document("thu_moi", data)
            res_ban_giao = factory_generate_document("ban_giao", data)
            res_thanh_toan = factory_generate_document("thanh_toan", data)

            pdf_thu_moi = eoffice_bot.convert_docx_to_pdf(os.path.join(BASE_DATA_PATH, res_thu_moi['file_name']), BASE_DATA_PATH)
            pdf_ban_giao = eoffice_bot.convert_docx_to_pdf(os.path.join(BASE_DATA_PATH, res_ban_giao['file_name']), BASE_DATA_PATH)
            pdf_thanh_toan = eoffice_bot.convert_docx_to_pdf(os.path.join(BASE_DATA_PATH, res_thanh_toan['file_name']), BASE_DATA_PATH)


            #     # GOM FILE PDF VÀO 1 ALBUM (SEND MEDIAGROUP)
            ho_so_id = data.get("id") or data.get("ho_so_id") or "999"
                
                # Mở sẵn các luồng đọc file bọc thép phòng lỗi nghẽn stream
            opened_files = {}
            media_group = []
                
            if pdf_thu_moi and os.path.exists(pdf_thu_moi):
                opened_files["file1"] = open(pdf_thu_moi, "rb")
                media_group.append({"type": "document", "media": "attach://file1", "caption": "📄 Thư mời chào giá"})
                    
            if pdf_ban_giao and os.path.exists(pdf_ban_giao):
                opened_files["file2"] = open(pdf_ban_giao, "rb")
                media_group.append({"type": "document", "media": "attach://file2", "caption": "📄 Biên bản bàn giao nội bộ"})
                    
            if pdf_thanh_toan and os.path.exists(pdf_thanh_toan):
                opened_files["file3"] = open(pdf_thanh_toan, "rb")
                media_group.append({"type": "document", "media": "attach://file3", "caption": "📄 Giấy đề nghị thanh toán"})

            #coming soon 
            # if media_group:
            #     print(f"🚀 [UI/UX TỐI ƯU] Đang nã Album gồm {len(media_group)} file PDF lên Telegram...")
            #     url_album = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMediaGroup"
                    
            #         # Phát 1: Bắn nguyên cái cụm Album file lên Telegram
            #     requests.post(url_album, data={"chat_id": CHAT_ID, "media": json.dumps(media_group)}, files=opened_files)
                    
            #         # Giải phóng bộ nhớ, đóng toàn bộ file stream lại cho sạch sẽ hệ thống
            #     for f_stream in opened_files.values():
            #             f_stream.close()

            #         # Phát 2: Thả ngay một "Bảng điều khiển chữ" chứa nút bấm ngay dưới Album
            #     url_control = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            #     text_content = f"🔔 Đã xử lý xong trọn bộ hồ sơ bản thảo cho **Hồ sơ số #{ho_so_id}**!\n\nÔng Định lướt xem toàn bộ file PDF trong cụm Album phía trên, nếu OK thì chọc nút kích hoạt luồng tự động nộp eOffice:"
            #     requests.post(url_control, data={"chat_id": CHAT_ID, "text": text_content, "reply_markup": json.dumps(reply_markup)})
                # # ======================================================================

            ma_ho_so_clean = str(data.get('ma_ho_so', 'Unknown')).replace('/', '-')
            zip_name = f"Bo_Ho_So_Goi1_{ma_ho_so_clean}_{int(time.time())}.zip"
            zip_path = os.path.join(BASE_DATA_PATH, zip_name)
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                zipf.write(os.path.join(BASE_DATA_PATH, res_thu_moi['file_name']), res_thu_moi['file_name'])
                zipf.write(os.path.join(BASE_DATA_PATH, res_ban_giao['file_name']), res_ban_giao['file_name'])
                zipf.write(os.path.join(BASE_DATA_PATH, res_thanh_toan['file_name']), res_thanh_toan['file_name'])
                if pdf_thu_moi: zipf.write(pdf_thu_moi, os.path.basename(pdf_thu_moi))
                if pdf_ban_giao: zipf.write(pdf_ban_giao, os.path.basename(pdf_ban_giao))
                if pdf_thanh_toan: zipf.write(pdf_thanh_toan, os.path.basename(pdf_thanh_toan))
                
            return jsonify({"file_sinh_ra": {"status": "success", "file_name": zip_name}}), 200
            
        else:
            # Gọi qua tên alias mới đặt
            result = factory_generate_document(action, data)
            send_preview_to_telegram(result['file_name'], label_map.get(action, action))
            return jsonify({"file_sinh_ra": result}), 200
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════
#  ROUTE GÓI 2: Đúc trọn bộ hồ sơ → ZIP
# ══════════════════════════════════════════════════════════════════════
@app.route('/generate-doc-goi2', methods=['POST'])
def generate_doc_goi2():
    """
    Nhận payload đầy đủ từ goi2Actions.ts,
    đúc tất cả biểu mẫu Gói 2 hiện có và đóng gói thành 1 file ZIP.

    Biểu mẫu hiện implement:
      - CBE Excel (QN-COM-PR01-FM06): Bảng đánh giá kỹ thuật + thương mại
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Payload rong hoac khong phai JSON"}), 400

    ma_ho_so_raw = str(data.get("ma_ho_so", "Unknown"))
    ma_ho_so_clean = ma_ho_so_raw.replace("/", "-").replace("\\", "-")

    generated_files = []  # danh sach (duong_dan_tuyet_doi, ten_trong_zip)

    # ── Bước 1: Đúc CBE Excel ──────────────────────────────────────────
    try:
        excel_gen = ExcelFactory()
        cbe_result = excel_gen.generate_cbe_excel(data)
        cbe_path = os.path.join(BASE_DATA_PATH, cbe_result["file_name"])
        if os.path.exists(cbe_path):
            generated_files.append((cbe_path, cbe_result["file_name"]))
            print(f"[Goi2] Da duc CBE Excel: {cbe_result['file_name']}")
    except Exception as e:
        print(f"[Goi2] LOI duc CBE Excel: {e}")
        return jsonify({"error": f"Loi duc CBE Excel: {str(e)}"}), 500

    # ── (Slot cho các biểu mẫu Gói 2 tương lai) ───────────────────────
    # Ví dụ: thu_moi_goi2, bien_ban_chon_nha_thau, hop_dong...
    # Khi implement thêm, append vào generated_files tương tự bước 1.

    # ── Bước cuối: Đóng gói ZIP ────────────────────────────────────────
    if not generated_files:
        return jsonify({"error": "Khong co file nao duoc tao ra"}), 500

    zip_name = f"Bo_Ho_So_Goi2_{ma_ho_so_clean}_{int(time.time())}.zip"
    zip_path = os.path.join(BASE_DATA_PATH, zip_name)

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for abs_path, arc_name in generated_files:
                zf.write(abs_path, arc_name)
        print(f"[Goi2] Da dong goi ZIP: {zip_name} ({len(generated_files)} file)")
    except Exception as e:
        return jsonify({"error": f"Loi dong goi ZIP: {str(e)}"}), 500

    return jsonify({"file_sinh_ra": {"status": "success", "file_name": zip_name}}), 200


# --- GIỮ NGUYÊN TOÀN BỘ CÁC ROUTE KHÁC ĐỂ TRÁNH LỖI HỆ THỐNG BOT ---
@app.route('/test-bot', methods=['GET'])
def test_bot():
    global SHARED_OTP_CODE
    SHARED_OTP_CODE = None
    def wait_for_user_otp():
        giay_da_cho = 0
        while SHARED_OTP_CODE is None:
            time.sleep(1)
            giay_da_cho += 1
            if giay_da_cho > 120: return None
        return SHARED_OTP_CODE
    try:
        tieu_de_trang = eoffice_bot.run_capture_cookie_workflow(wait_for_user_otp)
        return jsonify({"status": "Đại thắng", "tin_nhan": f"Đã cướp thành công Cookie! Tiêu đề: {tieu_de_trang}"}), 200
    except Exception as e: return jsonify({"status": "Sập hầm", "loi": str(e)}), 500

@app.route('/submit-otp', methods=['GET'])
def submit_otp():
    global SHARED_OTP_CODE
    otp = request.args.get('code')
    if not otp or len(otp) != 6: return jsonify({"error": "Mã OTP phải đúng 6 chữ số!"}), 400
    SHARED_OTP_CODE = otp
    return jsonify({"status": "Đã nhận mã", "tin_nhan": f"Mã {otp} đã thông sang Bot ngầm."}), 200

@app.route('/run-patrol', methods=['GET'])
def run_patrol():
    try:
        ket_qua = eoffice_bot.run_patrol_workflow("TM-2026-PTSC", 102)
        return jsonify({"status": "Hoàn thành lượt tuần tra", "ket_qua": ket_qua}), 200
    except Exception as e: return jsonify({"status": "Lỗi tuần tra", "loi": str(e)}), 500

@app.route('/test-bypass', methods=['GET'])
def test_bypass():
    try:
        tieu_de_trang = eoffice_bot.run_official_upload_workflow(os.path.join(BASE_DATA_PATH, "Thu_moi_chao_gia.docx")) 
        return jsonify({"status": "Vượt ngục thành công", "tin_nhan": f"Tiêu đề trang: {tieu_de_trang}"}), 200
    except Exception as e: return jsonify({"status": "Bị chặn lại rồi", "loi": str(e)}), 500
    
@app.route('/run-next-step', methods=['POST'])
def run_next_step():
    incoming = request.get_json(silent=True) or {}
    ho_so_id = incoming.get("ho_so_id")
    if not ho_so_id: return jsonify({"status": "Lỗi", "chi_tiet": "Thiếu ho_so_id"}), 400
    try:
        tieu_de_trang = eoffice_bot.run_official_upload_workflow(os.path.join(BASE_DATA_PATH, "Tieu_chuan_ky_thuat_Goi2.docx"))
        return jsonify({"status": "Thành công", "tin_nhan": f"eOffice Title: {tieu_de_trang}"}), 200
    except Exception as e: return jsonify({"status": "Sập hầm", "loi": str(e)}), 500
    
@app.route('/download-file/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(BASE_DATA_PATH, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)