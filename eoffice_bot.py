import os
import sys

# Force UTF-8 encoding for stdout and stderr to prevent encoding crashes on Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import time
import requests
import subprocess
from playwright.sync_api import sync_playwright

# Load env variables manually if python-dotenv is not installed
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

BASE_DATA_PATH = os.path.abspath(os.getenv("BASE_DATA_PATH", "/data"))
os.makedirs(BASE_DATA_PATH, exist_ok=True)


def run_capture_cookie_workflow(get_otp_callback):
    """
    [KỊCH BẢN 1] ĐĂNG NHẬP MỒI & VÂY BẮT OTP ĐỂ CƯỚP COOKIE
    get_otp_callback: Hàm đợi truyền mã OTP từ file api.py sang.
    """

    print("🤖 [Kịch bản mồi] Bot bắt đầu xuất kích...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, 
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context()
        page = context.new_page()
        
        # 1. Điền thông tin đăng nhập mồi
        page.goto("https://eoffice.ptscquangngai.com.vn/BTEC/Account/Login") 
        page.fill("input[name='Email']", "dinhpk") 
        page.fill("input[name='Password']", os.getenv("EOFFICE_PASS", "Cuteo964147"))    
        page.click("button[type='submit']")              
        
        # Chờ 4 giây cho hệ thống nổ OTP về điện thoại và đổi màn hình
        page.wait_for_timeout(4000) 
        print("📱 Bot đang kẹt ở màn hình OTP, đợi người dùng bơm mã từ Tab 2...")
        
        # 2. Gọi hàm đóng băng luồng để đợi gõ số OTP từ ngoài Flask truyền vào
        otp_code = get_otp_callback()
        if not otp_code:
            raise Exception("Không nhận được mã OTP từ người dùng, luồng tự hủy!")
            
        print(f"🔥 Bot đã nhận được mã {otp_code} -> Tiến hành nã phím vào ô số 0...")
        
        # 3. Điền OTP vào ô số 0 bằng Selector bọc thép data-index
        page.focus("input[data-index='0']") 
        page.keyboard.type(otp_code) # Bot tự gõ liên tù tì 6 số vào các ô liền kề
        
        # 4. Đợi load và cướp Cookie lưu ra ổ cứng Windows
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(5000) # Chờ 5 giây cho session ngấm sâu
        
        # Thần chú hút linh hồn đăng nhập ném ra thư mục chung /data
        context.storage_state(path=os.path.join(BASE_DATA_PATH, "auth_state.json"))
        page.screenshot(path=os.path.join(BASE_DATA_PATH, "bypass_otp_thanh_cong.png"))
        
        tieu_de = page.title()
        browser.close()
        return tieu_de


def run_official_upload_workflow(file_pdf_path):
    """
    [KỊCH BẢN 2 - CHẠY CHÍNH THỨC] ĐI XUYÊN TƯỜNG BẢO MẬT BẰNG COOKIE
    Bypass hoàn toàn trang đăng nhập + trang OTP để vào thẳng bên trong.
    """

    # Kiểm tra xem ông bạn đã đi săn cookie ở kịch bản 1 chưa
    auth_state_path = os.path.join(BASE_DATA_PATH, "auth_state.json")
    if not os.path.exists(auth_state_path):
        raise FileNotFoundError(f"Không tìm thấy file {auth_state_path}! Hãy chạy luồng test-bot để lấy cookie trước.")

    print("🤖 [Kịch bản chính thức] Bot đang dùng Cookie vạn năng để vượt biên...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, 
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        
        context = browser.new_context(storage_state=auth_state_path)
        page = context.new_page()
        
        # 1. Phi thẳng vào link trang Dashboard hoặc link tạo hồ sơ bên trong eOffice
        page.goto("https://eoffice.ptscquangngai.com.vn/Btec/core#/") 
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(3000) # Đợi 3 giây cho giao diện bên trong load hết
        
        # 2. Chụp tấm ảnh bằng chứng xem có đúng là vào thẳng không cần hỏi han gì không
        page.screenshot(path=os.path.join(BASE_DATA_PATH, "kiem_tra_vao_thang.png"))
        print(f"📸 Đã chụp ảnh màn hình bên trong eOffice tại: {os.path.join(BASE_DATA_PATH, 'kiem_tra_vao_thang.png')}")
        
        # ======================================================================
        # TODO (Giai đoạn 2): Viết tiếp kịch bản tự động hóa tại đây:
        # - Bấm nút "Trình ký mới"
        # - Upload file: file_pdf_path
        # - Chọn luồng quy trình, người duyệt...
        # ======================================================================
        
        tieu_de = page.title()
        browser.close()
        return tieu_de
    
def run_patrol_workflow(ma_hieu_bieu_mau, ho_so_id):
    """
    [KỊCH BẢN 3] BOT ĐI TUẦN TRA - QUÉT TRẠNG THÁI VĂN BẢN TRÊN EOFFICE
    ma_hieu_bieu_mau: Mã hiệu để search trên eOffice (Ví dụ: Thư mời chào giá)
    ho_so_id: ID hồ sơ dưới Postgres để n8n biết đường mà map dữ liệu
    """


    # 1. Check hạ tầng cookie trước khi xuất kích
    auth_state_path = os.path.join(BASE_DATA_PATH, "auth_state.json")
    if not os.path.exists(auth_state_path):
        print("🚨 Không có cookie! Báo n8n kích hoạt luồng đăng nhập mồi...")
        return "NO_COOKIE"

    print(f"🕵️ Bot Playwright bắt đầu đi tuần hồ sơ {ho_so_id} [Mã tìm kiếm: {ma_hieu_bieu_mau}]...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, 
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(storage_state=auth_state_path)
        page = context.new_page()
        
        # 2. Phi thẳng vào trang Thống Kê / Tra cứu văn bản của eOffice
        # (Ông sửa lại đoạn URI sau dấu # cho đúng thực tế trang thống kê của PTSC nhé)
        page.goto("https://eoffice.ptscquangngai.com.vn/Btec/core#/ThongKeVanBan") 
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)

        # 🛑 BẪY LỖI: Kiểm tra xem có bị văng ra màn hình đăng nhập do hết hạn cookie không
        if "Account/Login" in page.url:
            print("❌ Thôi xong! Cookie hết hạn và bị đá ra ngoài login.")
            browser.close()
            
            # Nã lệnh gọi Webhook n8n thông báo: "Định ơi, cookie sập rồi, cho xin OTP mới!"
            # requests.post("http://<IP_N8N>:5678/webhook/cookie-expired", json={"ho_so_id": ho_so_id})
            return "COOKIE_EXPIRED"

        # 3. Điền mã hiệu vào ô Search trang thống kê
        # (Ông F12 trên eOffice lấy chuẩn Selector của ô input tìm kiếm và điền thay vào đây)
        search_input_selector = "input[placeholder='Tìm kiếm theo mã hiệu, tên văn bản...']"
        page.fill(search_input_selector, ma_hieu_bieu_mau)
        page.keyboard.press("Enter")
        page.wait_for_timeout(3000) # Chờ 3 giây cho lưới dữ liệu đổ ra

        # 4. Kiểm tra trạng thái của dòng đầu tiên trả về
        try:
            # (Ông F12 lấy chuẩn Selector của cái ô hiển thị chữ "Đã ký" hoặc "Đang xử lý")
            status_selector = ".grid-row-first .cell-status" 
            status_text = page.locator(status_selector).inner_text().strip()
            
            print(f"📊 Kết quả tuần tra eOffice nhặt về: '{status_text}'")

            if status_text == "Đã ký":
                print("🎉 Kèo thơm! Sếp đã ký xong thư mời chào giá. Kích nổ n8n bắn Tele!")
                
                # Nã webhook gọi con n8n dậy bốc file mẫu + vẽ nút bấm gửi lên điện thoại cho ông
                N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/Playwright_Alert"
                payload = {
                    "ho_so_id": ho_so_id,
                    "ma_hieu": ma_hieu_bieu_mau,
                    "status": "SIGNED"
                }
                requests.post(N8N_WEBHOOK_URL, json=payload)
                
                browser.close()
                return "SIGNED_AND_TRIGGERED"
            else:
                print("⏳ Văn bản vẫn đang ở trạng thái chờ ký hoặc đang xử lý. Đi ngủ tiếp...")
                browser.close()
                return "STILL_PENDING"

        except Exception as e:
            print(f"⚠️ Không tìm thấy dòng dữ liệu nào khớp hoặc sai Selector: {e}")
            browser.close()
            return "NOT_FOUND"

def convert_docx_to_pdf(docx_path, output_dir=None):
    """
    Convert .docx sang .pdf.
    - Windows (local): Dùng docx2pdf (qua Microsoft Word COM).
    - Linux / Docker:  Dùng LibreOffice Headless.
    Trả về đường dẫn file PDF nếu thành công, None nếu thất bại.
    """
    import sys
    if output_dir is None:
        output_dir = BASE_DATA_PATH

    if not os.path.exists(docx_path):
        print(f"[PDF] Khong tim thay file Word de convert: {docx_path}")
        return None

    pdf_path = os.path.join(output_dir, os.path.splitext(os.path.basename(docx_path))[0] + ".pdf")

    # ── WINDOWS: dùng docx2pdf (Microsoft Word COM) ──────────────────
    if sys.platform.startswith("win"):
        try:
            from docx2pdf import convert
            print(f"[PDF] Windows mode: Dang dung Word COM convert {os.path.basename(docx_path)}...")
            convert(docx_path, pdf_path)
            if os.path.exists(pdf_path):
                print(f"[PDF] Thanh cong! File PDF tai: {pdf_path}")
                return pdf_path
            else:
                print(f"[PDF] docx2pdf chay xong nhung khong tim thay file PDF dau ra: {pdf_path}")
                return None
        except ImportError:
            print("[PDF] Thu vien docx2pdf chua duoc cai. Chay: pip install docx2pdf")
            return None
        except Exception as e:
            print(f"[PDF] Loi khi dung docx2pdf: {e}")
            return None

    # ── LINUX / DOCKER: dùng LibreOffice Headless ────────────────────
    try:
        print(f"[PDF] Linux mode: Dang goi LibreOffice convert {os.path.basename(docx_path)}...")
        # Tìm binary LibreOffice (có thể là 'libreoffice' hoặc 'soffice')
        lo_bin = "libreoffice"
        if subprocess.run(["which", "soffice"], capture_output=True).returncode == 0:
            lo_bin = "soffice"

        cmd = [lo_bin, "--headless", "--convert-to", "pdf", "--outdir", output_dir, docx_path]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        if result.returncode != 0:
            print(f"[PDF] LibreOffice tra ve loi (exit {result.returncode}): {result.stderr.strip()}")
            return None

        # LibreOffice lưu PDF cùng thư mục output_dir, cùng tên file
        if os.path.exists(pdf_path):
            print(f"[PDF] Thanh cong! File PDF tai: {pdf_path}")
            return pdf_path

        print(f"[PDF] LibreOffice chay xong nhung khong tim thay: {pdf_path}")
        return None
    except FileNotFoundError:
        print("[PDF] Khong tim thay lenh LibreOffice. Tren Docker: dam bao 'libreoffice' da duoc cai.")
        return None
    except subprocess.TimeoutExpired:
        print("[PDF] LibreOffice bi timeout (>60s).")
        return None
    except Exception as e:
        print(f"[PDF] Loi convert bang LibreOffice: {e}")
        return None