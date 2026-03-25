# 📱 IDM WhatsApp Bot - Termux Version

Bot WhatsApp untuk Idol Meta Tournament yang bisa dijalankan di HP Android menggunakan Termux.

## 🚀 Cara Install di Termux

### Step 1: Install Termux
Download Termux dari **F-Droid** (JANGAN dari Play Store):
- Link: [f-droid.org/packages/com.termux](https://f-droid.org/packages/com.termux/)

### Step 2: Update Termux
Buka Termux, ketik:
```bash
pkg update && pkg upgrade -y
```

### Step 3: Install Dependencies
```bash
pkg install nodejs git python build-essential binutils -y
```

### Step 4: Clone Repository
```bash
# Buat folder bot
mkdir -p ~/bot
cd ~/bot

# Clone repository
git clone https://github.com/qhairulalamsyah-beep/idm.git

# Masuk ke folder bot
cd idm/mini-services/whatsapp-bot-baileys
```

### Step 5: Install Node Dependencies
```bash
npm install
```

### Step 6: Jalankan Bot
```bash
npm start
```

## 📱 Scan QR Code

1. Setelah bot berjalan, akan muncul **QR Code** di Termux
2. Buka **WhatsApp** di HP utama Anda
3. Klik **Menu** (titik 3) → **Perangkat tertaut**
4. Klik **Tautkan perangkat**
5. Scan **QR Code** yang muncul di Termux
6. Bot akan otomatis terhubung!

## 📋 Daftar Perintah Bot

| Command | Fungsi |
|---------|--------|
| `p help` | Daftar semua perintah |
| `p info` | Info turnamen |
| `p jadwal` | Jadwal pertandingan |
| `p daftar [nama] [divisi]` | Daftar turnamen |
| `p top` | Leaderboard |
| `p tim [nama]` | Info tim/pemain |
| `p hasil [divisi]` | Hasil turnamen |
| `p bracket [divisi]` | Status bracket |
| `p peserta` | Daftar peserta |
| `p notif on/off` | Atur notifikasi |

## ⚙️ Konfigurasi

### Ganti URL API
Jika URL API berbeda, edit file `index.js`:
```javascript
const API_BASE = 'https://your-vercel-app.vercel.app'
```

Atau set environment variable:
```bash
export API_BASE=https://your-vercel-app.vercel.app
npm start
```

## 🔧 Menjalankan di Background

Agar bot tetap jalan saat Termux di-minimize:

### Opsi 1: Gunakan tmux
```bash
pkg install tmux -y
tmux new -s bot
npm start
# Tekan Ctrl+B lalu D untuk detach
```

Kembali ke session:
```bash
tmux attach -t bot
```

### Opsi 2: Gunakan nohup
```bash
nohup npm start > bot.log 2>&1 &
```

Cek log:
```bash
tail -f bot.log
```

Stop bot:
```bash
pkill node
```

## ❓ Troubleshooting

### QR Code tidak muncul
```bash
# Install qrcode-terminal
npm install qrcode-terminal
```

### Bot sering disconnect
- Pastikan koneksi internet stabil
- Restart bot dengan `npm start`

### Error saat npm install
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

### HP kepanasan
- Gunakan chargers saat bot berjalan
- Matikan fitur tidak perlu di HP

## 🔄 Update Bot

```bash
cd ~/bot/idm
git pull
cd mini-services/whatsapp-bot-baileys
npm install
npm start
```

## 💡 Tips

1. **Jaga HP tetap menyala** - Bot butuh HP hidup 24/7
2. **Gunakan charger** - Bot akan menguras baterai
3. **Internet stabil** - Gunakan WiFi jika memungkinkan
4. **Backup auth** - Folder `auth_info` berisi session, backup jika perlu

## 🆘 Bantuan

Jika ada masalah, hubungi:
- WhatsApp: +6281349924210
- GitHub: [github.com/qhairulalamsyah-beep/idm](https://github.com/qhairulalamsyah-beep/idm)
