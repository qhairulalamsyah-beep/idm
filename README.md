# 🎮 Idol Meta Tournament Platform

Platform turnamen profesional untuk game Idol Meta dengan fitur lengkap: pendaftaran online, bracket system, scoring real-time, WhatsApp bot, dan dashboard admin.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.11-blue)

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Instalasi Lokal](#-instalasi-lokal)
- [Panduan Penggunaan Aplikasi](#-panduan-penggunaan-aplikasi)
- [Panduan WhatsApp Bot](#-panduan-whatsapp-bot)
- [Deployment ke Production](#-deployment-ke-production)
- [Kustomisasi Aplikasi](#-kustomisasi-aplikasi)
- [Kustomisasi WhatsApp Bot](#-kustomisasi-whatsapp-bot)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Fitur Utama

### Untuk Peserta
- ✅ Pendaftaran turnamen online (Male/Female/Liga)
- ✅ Lihat bracket interaktif
- ✅ Pantau skor real-time
- ✅ Profil pemain dengan statistik
- ✅ Donasi & saweran untuk prize pool
- ✅ Notifikasi push

### Untuk Admin
- ✅ Dashboard admin lengkap
- ✅ Manajemen turnamen (CRUD)
- ✅ Approval pendaftaran peserta
- ✅ Generate tim otomatis
- ✅ Generate bracket (Single/Double Elimination, Group Stage)
- ✅ Input skor pertandingan
- ✅ Role & Permission management
- ✅ Konfirmasi donasi/saweran

### WhatsApp Bot
- ✅ Pendaftaran via WhatsApp
- ✅ Cek jadwal & bracket
- ✅ Info turnamen
- ✅ Leaderboard
- ✅ Input skor
- ✅ Notifikasi otomatis

---

## 🛠 Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Prisma ORM (SQLite dev, PostgreSQL prod) |
| UI | Tailwind CSS 4 + shadcn/ui |
| State | Zustand + TanStack Query |
| Realtime | Socket.IO |
| Icons | Lucide React |

---

## 💻 Instalasi Lokal

### Prasyarat
- Node.js 18+ atau Bun
- Git

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/username/idm.git
cd idm

# 2. Install dependencies
bun install

# 3. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 4. Setup database
bun run db:push

# 5. Jalankan aplikasi
bun run dev
```

Aplikasi berjalan di `http://localhost:3000`

### Login Super Admin
- **Phone:** `+6281349924210`
- **Password:** `tazevsta`

---

## 📱 Panduan Penggunaan Aplikasi

### Menu Utama

#### 1. 🏠 Home
Halaman utama menampilkan:
- Turnamen aktif per divisi (Male/Female/Liga)
- Prize pool terkini
- Peserta terdaftar
- Total donasi & saweran

#### 2. 🏆 Turnamen
- Lihat daftar turnamen
- Detail turnamen (mode, BPM, lokasi, rules)
- Bracket interaktif
- Daftar peserta

#### 3. 👤 Profil
- Edit profil pemain
- Lihat statistik pertandingan
- Riwayat turnamen
- Achievement

#### 4. ❤️ Donasi & Saweran
- Donasi untuk mendukung turnamen
- Saweran untuk prize pool turnamen tertentu
- Payment via Midtrans

### Alur Pendaftaran Turnamen

```
1. Buka aplikasi → Pilih turnamen aktif
2. Klik "Daftar" → Isi form pendaftaran
3. Pilih tier (S/A/B)
4. Submit → Menunggu approval admin
5. Admin approve → Tim dibentuk otomatis
6. Bracket digenerate → Siap bertanding
```

---

## 🤖 Panduan WhatsApp Bot

### Konfigurasi Bot

Bot WhatsApp berjalan sebagai service terpisah di port `3004`.

```bash
# Jalankan WhatsApp Bot
cd mini-services/whatsapp-bot
bun run dev
```

### Daftar Perintah Bot

| Perintah | Fungsi | Contoh |
|----------|--------|--------|
| `p help` | Bantuan semua perintah | `p help` |
| `p info` | Info turnamen aktif | `p info` |
| `p jadwal` | Jadwal pertandingan hari ini | `p jadwal` |
| `p daftar [nama] [divisi]` | Daftar turnamen | `p daftar Tazos male` |
| `p bracket [divisi]` | Status bracket | `p bracket male` |
| `p hasil [divisi]` | Hasil turnamen selesai | `p hasil male` |
| `p top global` | Leaderboard global | `p top global` |
| `p tim [nama]` | Info tim/pemain | `p tim Tazos` |
| `p peserta` | Daftar peserta terdaftar | `p peserta` |
| `p skor [id] [home] [away]` | Input skor (admin) | `p skor abc123 2 1` |
| `p donasi [jumlah] [pesan]` | Donasi | `p donasi 50000 semangat!` |
| `p notif on/off` | Atur notifikasi | `p notif on` |
| `p status` | Status akun | `p status` |

### Contoh Penggunaan

```
User: p info
Bot: 🎮 *IDOL META TOURNAMENT*
     ━━━━━━━━━━━━━━━━━━━━
     ♂️ *MALE DIVISION*
     📍 Tarkam #10
     📅 Senin, 24 Maret 2025, 20:00
     ...

User: p daftar Tazos male
Bot: 📝 *KONFIRMASI PENDAFTARAN*
     Turnamen: Tarkam #10
     Nama: Tazos
     Divisi: ♂️ MALE
     
     Pilih tier Anda:
     • S - Pro Player
     • A - Experienced
     • B - Beginner
     
     Ketik tier (S/A/B):

User: A
Bot: 📝 *KONFIRMASI PENDAFTARAN*
     Nama: Tazos
     Divisi: ♂️ MALE
     Tier: 🔸 A
     
     Balas *ya* untuk konfirmasi atau *batal* untuk membatalkan.

User: ya
Bot: 🎉 *PENDAFTARAN BERHASIL!*
     Nama: Tazos
     Divisi: ♂️ MALE
     
     ✅ Anda akan menerima notifikasi saat pendaftaran disetujui.
```

### Endpoint API Bot

| Endpoint | Method | Fungsi |
|----------|--------|--------|
| `/webhook` | POST | Menerima pesan dari WhatsApp |
| `/broadcast` | POST | Kirim broadcast ke semua subscriber |
| `/send` | POST | Kirim pesan ke nomor tertentu |
| `/test` | GET | Test bot tanpa WhatsApp |

### Test Bot

```bash
# Test perintah tanpa WhatsApp
curl "http://localhost:3004/test?message=p%20help"

# Test dengan from number
curl "http://localhost:3004/test?message=p%20info&from=+628123456789"
```

---

## 🚀 Deployment ke Production

### Arsitektur Production

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│    Neon     │────▶│  Database   │
│  (Frontend) │     │ (PostgreSQL)│     │  (Storage)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Langkah 1: Setup Neon Database

1. Buka [neon.tech](https://neon.tech)
2. Sign up / Login
3. Buat project baru:
   - Project name: `idolmeta-tournament`
   - Region: `Southeast Asia (Singapore)`
4. Copy connection string:
   ```
   postgresql://username:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### Langkah 2: Push ke GitHub

```bash
# Inisialisasi git jika belum
git init

# Add remote
git remote add origin https://github.com/username/idm.git

# Add dan commit
git add .
git commit -m "Initial commit"

# Push ke GitHub
git push -u origin main
```

### Langkah 3: Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik "New Project"
3. Import repository GitHub `idm`
4. Konfigurasi:
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next`

5. Tambahkan Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (dari Neon) |
| `NEXTAUTH_SECRET` | `random-string-32-char` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `SUPER_ADMIN_PHONE` | `+6281349924210` |
| `SUPER_ADMIN_PASSWORD` | `tazevsta` |

6. Klik "Deploy"

### Langkah 4: Seed Super Admin

Setelah deploy, buka URL berikut di browser:

```
https://your-app.vercel.app/api/seed/super-admin
```

Response:
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "user": {
    "phone": "+6281349924210",
    "role": "SUPER_ADMIN"
  }
}
```

### Langkah 5: Seed Default Roles

```
https://your-app.vercel.app/api/admin/roles/seed
```

### Environment Variables Lengkap

```env
# Database
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="https://your-app.vercel.app"

# App
NEXT_PUBLIC_APP_NAME="Idol Meta Tournament"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# Super Admin
SUPER_ADMIN_PHONE="+6281349924210"
SUPER_ADMIN_PASSWORD="tazevsta"

# WhatsApp Bot (opsional)
WHATSAPP_GROUP_ID="120363xxxxxxxx@g.us"

# Midtrans (opsional)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxx"
```

---

## 🔧 Kustomisasi Aplikasi

### Struktur Folder

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── tournaments/   # Tournament CRUD
│   │   ├── registrations/ # Registration API
│   │   ├── brackets/      # Bracket generation
│   │   ├── admin/         # Admin APIs
│   │   └── ...
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── admin/             # Admin components
│   ├── tournament/        # Tournament components
│   ├── ui/                # shadcn/ui components
│   └── ...
├── lib/
│   └── db.ts              # Prisma client
├── store/
│   └── index.ts           # Zustand store
└── prisma/
    └── schema.prisma      # Database schema

mini-services/
├── whatsapp-bot/          # WhatsApp Bot service
│   └── index.ts
└── tournament-ws/         # WebSocket service
    └── index.ts
```

### Menambah Menu Baru di Admin

**1. Tambah di `admin-dashboard.tsx`:**

```tsx
// Di fungsi renderContent()
case 'menu-baru':
  return <MenuBaruComponent />;

// Di bottom navigation
{ id: 'menu-baru', icon: IconBaru, label: 'Menu Baru' }
```

**2. Buat komponen baru:**

```tsx
// src/components/admin/menu-baru.tsx
'use client';

export function MenuBaruComponent() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Menu Baru</h2>
      {/* Konten menu */}
    </div>
  );
}
```

### Menambah API Endpoint

**Contoh: API untuk fitur baru**

```typescript
// src/app/api/fitur-baru/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const data = await db.namaModel.findMany();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await db.namaModel.create({ data: body });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Gagal membuat data' },
      { status: 500 }
    );
  }
}
```

### Menambah Model Database

**1. Edit `prisma/schema.prisma`:**

```prisma
model FiturBaru {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
```

**2. Push ke database:**

```bash
bun run db:push
```

---

## 🤖 Kustomisasi WhatsApp Bot

### Lokasi File Bot

```
mini-services/whatsapp-bot/index.ts
```

### Menambah Perintah Baru

**Contoh: Menambah perintah `p klaim`**

```typescript
// 1. Tambah handler function
async function handleKlaim(from: string, args: string[]): Promise<BotResponse> {
  const klaimCode = args[0];
  
  if (!klaimCode) {
    return {
      message: `🎁 *KLAIM REWARD*\n\nFormat: p klaim [kode]\n\nContoh: p klaim REWARD123`
    };
  }
  
  // Cek kode di database
  const result = await apiCall(`/api/rewards/claim?code=${klaimCode}`);
  
  if (result.success) {
    return {
      message: `🎉 *KLAIM BERHASIL!*\n\nReward: ${result.data.reward}\n\nTerima kasih telah berpartisipasi!`
    };
  }
  
  return {
    message: `❌ Kode klaim tidak valid atau sudah digunakan.`
  };
}

// 2. Tambah di switch statement handleMessage()
switch (command) {
  // ... existing cases
  
  case 'klaim':
  case 'claim':
    return handleKlaim(from, args);
    
  // ...
}

// 3. Update help message
async function handleHelp(): Promise<BotResponse> {
  return {
    message: `📚 *PANDUAN BOT IDM TOURNAMENT*
━━━━━━━━━━━━━━━━━━━━

...existing content...

🎁 *REWARD*
• p klaim [kode] - Klaim reward

━━━━━━━━━━━━━━━━━━━━
🎮 *IDOL META TOURNAMENT*`
  };
}
```

### Menghapus Perintah

**Cukup hapus atau comment case di switch statement:**

```typescript
switch (command) {
  // case 'donasi':  // <- hapus atau comment untuk menonaktifkan
  // case 'donate':
  //   return handleDonasi(from, args);
  
  // ...
}
```

### Mengubah Respons Perintah

**Contoh: Mengubah respons `p info`**

```typescript
async function handleInfo(): Promise<BotResponse> {
  // ... fetch data
  
  let message = `🎮 *IDOL META TOURNAMENT*\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Ubah format pesan sesuai keinginan
  if (maleT) {
    message += `♂️ *MALE DIVISION*\n`;
    message += `🏆 ${maleT.name}\n`;
    message += `📅 ${formatDate(maleT.startDate)}\n`;
    // ... tambah atau ubah informasi
    message += `🎮 Mode: ${maleT.mode}\n`;
    message += `🎵 BPM: ${maleT.bpm}\n`;
    message += `👥 Peserta: ${maleT.currentParticipants}/${maleT.maxParticipants}\n\n`;
  }
  
  // ... rest of code
}
```

### Menambah Notifikasi Otomatis

**Tambahkan event type baru:**

```typescript
function formatEventMessage(event: string, data: any): string {
  switch (event) {
    // ... existing cases
    
    case 'new-feature':
      return `🆕 *FITUR BARU!*
      
${data.featureName}
${data.description}

Coba sekarang di aplikasi web!`;
      
    case 'maintenance':
      return `🔧 *MAINTENANCE NOTICE*

${data.message}
Estimasi selesai: ${data.estimatedTime}

Mohon pengertiannya.`;
      
    default:
      return `📢 ${event}\n\n${JSON.stringify(data, null, 2)}`;
  }
}
```

### Integrasi dengan WhatsApp Business API

Untuk production, integrasikan dengan WhatsApp Business API:

```typescript
// Ganti fungsi sendWhatsAppNotification
export async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  try {
    const response = await fetch('https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return false;
  }
}
```

---

## 🐛 Troubleshooting

### Error: Database connection failed

```bash
# Cek DATABASE_URL di .env
# Pastikan format benar untuk PostgreSQL:
# postgresql://user:password@host:5432/database?sslmode=require

# Test connection
bun run db:studio
```

### Error: Prisma Client not found

```bash
# Generate ulang Prisma Client
bun run db:generate
```

### Error: Super Admin login gagal

```bash
# Reset dan seed ulang super admin
bun run db:seed

# Atau via API
curl -X POST http://localhost:3000/api/seed/super-admin
```

### Bot tidak merespons

```bash
# Cek log bot
cd mini-services/whatsapp-bot
bun run dev

# Test endpoint
curl "http://localhost:3004/test?message=p%20help"
```

### Build Error di Vercel

1. Pastikan `DATABASE_URL` sudah benar di Environment Variables
2. Pastikan Build Command: `prisma generate && next build`
3. Check build logs untuk error detail

---

## 📞 Support

- **WhatsApp:** +6281349924210
- **Email:** support@idolmeta.id
- **Website:** https://idolmeta.id

---

## 📄 License

MIT License - Copyright © 2025 Idol Meta Tournament

---

<div align="center">
  <p>Made with ❤️ by Idol Meta Team</p>
  <p>🎮 Game On!</p>
</div>
