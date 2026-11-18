"""Tích hợp thông báo Telegram Bot, đồng bộ Google Sheets Webhook và sinh mã QR Ủng hộ tác giả (VietQR động + Local QR PNG)."""

import io
import urllib.parse
import httpx
import qrcode
from PIL import Image, ImageDraw
from app.engines.image_studio import _load_font, FONT_BOLD_CANDIDATES, FONT_REG_CANDIDATES


POPULAR_VN_BANKS = [
    {"code": "MB", "name": "MBBank — Ngân hàng Quân Đội"},
    {"code": "VCB", "name": "Vietcombank — Ngoại Thương Việt Nam"},
    {"code": "TCB", "name": "Techcombank — Kỹ Thương Việt Nam"},
    {"code": "ACB", "name": "ACB — Ngân hàng Á Châu"},
    {"code": "BIDV", "name": "BIDV — Đầu tư & Phát triển VN"},
    {"code": "CTG", "name": "VietinBank — Công Thương Việt Nam"},
    {"code": "TPB", "name": "TPBank — Tiên Phong"},
    {"code": "VPB", "name": "VPBank — Việt Nam Thịnh Vượng"},
]


async def notify_telegram_feedback(bot_token: str, chat_id: str, feedback_data: dict) -> bool:
    if not bot_token or not chat_id:
        return False
    text = (
        f"📬 *GÓP Ý MỚI — AI CONTENT STUDIO*\n"
        f"• *Phân loại:* `{feedback_data.get('category')}`\n"
        f"• *Người gửi:* {feedback_data.get('author_name')} ({feedback_data.get('rating')}⭐)\n"
        f"• *Tiêu đề:* {feedback_data.get('title')}\n"
        f"• *Nội dung:* {feedback_data.get('message')}"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            )
            return r.status_code == 200
    except Exception:
        return False


async def sync_google_sheets_webhook(webhook_url: str, feedback_data: dict) -> bool:
    if not webhook_url:
        return False
    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            r = await client.post(webhook_url, json=feedback_data)
            return r.status_code < 400
    except Exception:
        return False


def build_vietqr_info(
    *,
    bank_id: str,
    account_no: str,
    account_name: str,
    amount: int,
    message: str,
) -> dict:
    clean_bank = (bank_id or "MB").strip().upper()
    clean_acc = (account_no or "0987654321").strip()
    clean_name = (account_name or "TAC GIA CONTENT STUDIO").strip().upper()
    clean_msg = (message or "Ung ho AI Content Studio").strip()
    amt = max(0, int(amount or 0))

    params = {
        "amount": str(amt) if amt > 0 else "",
        "addInfo": clean_msg,
        "accountName": clean_name,
    }
    query = urllib.parse.urlencode({k: v for k, v in params.items() if v})
    vietqr_remote_url = f"https://img.vietqr.io/image/{clean_bank}-{clean_acc}-compact2.png?{query}"
    local_qr_url = (
        f"/api/donate/qr.png?bank_id={urllib.parse.quote(clean_bank)}"
        f"&account_no={urllib.parse.quote(clean_acc)}"
        f"&account_name={urllib.parse.quote(clean_name)}"
        f"&amount={amt}"
        f"&message={urllib.parse.quote(clean_msg)}"
    )
    return {
        "bank_id": clean_bank,
        "account_no": clean_acc,
        "account_name": clean_name,
        "amount": amt,
        "message": clean_msg,
        "vietqr_remote_url": vietqr_remote_url,
        "local_qr_url": local_qr_url,
    }


def render_local_donate_qr_png(
    *,
    bank_id: str,
    account_no: str,
    account_name: str,
    amount: int,
    message: str,
) -> bytes:
    """Sinh thẻ ảnh QR Ủng hộ tác giả sắc nét trực tiếp từ server (luôn hiển thị mượt ngay cả khi offline)."""
    payload = f"VIETQR|BANK:{bank_id}|ACC:{account_no}|NAME:{account_name}|AMOUNT:{amount}|MSG:{message}"
    qr = qrcode.QRCode(version=3, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0F172A", back_color="#FFFFFF").convert("RGB")
    qr_img = qr_img.resize((300, 300), Image.Resampling.NEAREST)

    card_w, card_h = 400, 480
    card = Image.new("RGB", (card_w, card_h), (253, 252, 249))
    draw = ImageDraw.Draw(card)

    # Header thanh lịch
    draw.rounded_rectangle((12, 12, card_w - 12, card_h - 12), radius=18, outline=(214, 211, 204), width=2, fill=(255, 255, 255))
    draw.rounded_rectangle((12, 12, card_w - 12, 74), radius=18, fill=(15, 76, 92))
    draw.rectangle((12, 54, card_w - 12, 74), fill=(15, 76, 92))

    f_bold = _load_font(FONT_BOLD_CANDIDATES, 17)
    f_sub = _load_font(FONT_REG_CANDIDATES, 13)
    f_small = _load_font(FONT_BOLD_CANDIDATES, 14)

    draw.text((28, 24), f"VIETQR NAPAS 247 · {bank_id}", font=f_bold, fill=(255, 255, 255))
    draw.text((28, 47), "Quet ma ung ho tac gia phat trien", font=f_sub, fill=(203, 213, 225))

    card.paste(qr_img, ((card_w - 300) // 2, 88))

    amt_str = f"{amount:,} VND".replace(",", ".") if amount > 0 else "Tuy tam ung ho"
    draw.text((34, 400), f"STK: {account_no} ({bank_id})", font=f_small, fill=(15, 23, 42))
    draw.text((34, 422), f"Chu TK: {account_name[:28]}", font=f_sub, fill=(51, 65, 85))
    draw.text((34, 444), f"Muc ung ho: {amt_str} · ND: {message[:22]}", font=f_sub, fill=(15, 118, 110))

    buf = io.BytesIO()
    card.save(buf, format="PNG")
    return buf.getvalue()
