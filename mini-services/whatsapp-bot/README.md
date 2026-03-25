# WhatsApp Bot Service

Layanan bot WhatsApp untuk Idol Meta Tournament Platform.

## Deploy ke Render (Gratis!)

### 1. Buat Akun Render
- Kunjungi [render.com](https://render.com)
- Login dengan GitHub

### 2. Deploy dari GitHub

1. Klik **New +** → **Web Service**
2. Pilih **Connect a repository**
3. Pilih repository `idm`
4. Set **Root Directory** ke: `mini-services/whatsapp-bot`
5. Set **Name**: `idm-whatsapp-bot`
6. Pilih **Plan**: **Free**
7. Klik **Create Web Service**

### 3. Set Environment Variables

Di Render Dashboard, bagian **Environment**, tambahkan:

| Key | Value |
|-----|-------|
| `API_BASE` | `https://your-app.vercel.app` |

Ganti dengan URL deployment Vercel Anda.

### 4. Dapatkan URL Bot

Setelah deploy berhasil, Render akan memberikan URL seperti:
```
https://idm-whatsapp-bot.onrender.com
```

### 5. Test Bot

```bash
# Health check
curl https://idm-whatsapp-bot.onrender.com/health

# Test command
curl "https://idm-whatsapp-bot.onrender.com/test?message=p%20help"
```

## Integrasi dengan WhatsApp

Setelah bot berjalan di Render, integrasikan dengan:

### Opsi A: WhatsApp Business API
1. Daftar di [Meta for Developers](https://developers.facebook.com)
2. Buat WhatsApp Business Account
3. Setup Webhook: `https://your-bot.onrender.com/webhook`

### Opsi B: Twilio WhatsApp
1. Daftar di [Twilio](https://www.twilio.com/whatsapp)
2. Set webhook ke URL Render

### Opsi C: Jalankan Baileys di VPS
Untuk menggunakan Baileys (koneksi langsung ke WhatsApp):
1. Setup VPS (DigitalOcean/Vultr)
2. Install Node.js/Bun
3. Jalankan bot dengan fitur Baileys

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/webhook` | POST | Receive messages |
| `/broadcast` | POST | Send broadcast |
| `/send` | POST | Send message |
| `/test` | GET | Test bot |

## Render Free Tier Limits

- 750 jam/bulan (cukup untuk 1 service)
- Service akan sleep setelah 15 menit idle
- 512MB RAM
- Cold start ~30 detik setelah sleep

## Troubleshooting

### Bot tidak bisa connect ke API
- Pastikan `API_BASE` sudah benar
- Cek logs di Render Dashboard

### Service sleep terus
- Free tier service sleep setelah 15 menit idle
- Gunakan uptime monitor seperti UptimeRobot untuk keep-alive

### Cold start lama
- Normal untuk free tier
- Pertama kali akses bisa 30-60 detik
