# ☕ RuangKopi Surabaya

**Temukan Cafe Terbaik di Surabaya** - Aplikasi peta interaktif untuk mencari dan menjelajahi cafe-cafe di Surabaya, Indonesia.

![RuangKopi Surabaya](https://img.shields.io/badge/RuangKopi-Surabaya-8B4513?style=for-the-badge&logo=coffeescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?style=flat-square&logo=leaflet)

## ✨ Fitur

### 🗺️ Peta Interaktif

- Peta berbasis **Leaflet.js** dengan tile dari **CARTO** (style Positron)
- Tampilan bersih dan minimal
- Support **Dark Mode** dan **Light Mode**
- Batas peta dibatasi ke area Surabaya

### 🔍 Pencarian Cafe

- Cari cafe berdasarkan nama
- Dropdown hasil pencarian dengan autocomplete
- Klik untuk zoom ke lokasi cafe

### 📍 Fitur Lokasi

- **Lokasi Saya** - Gunakan GPS untuk menemukan posisi Anda
- **Filter Jarak** - Filter cafe berdasarkan jarak dari lokasi Anda:
  - 500m, 1km, 2km, 5km, 10km
- Marker biru menunjukkan posisi Anda

### ❤️ Cafe Favorit

- Simpan cafe favorit ke dalam bookmark
- Data tersimpan di **localStorage** (tidak hilang saat refresh)
- Lihat daftar favorit dan navigasi langsung ke cafe

### 📱 Detail Cafe

- Panel detail muncul saat klik marker cafe
- Informasi yang ditampilkan:
  - Nama cafe
  - Alamat
  - Jam operasional
  - Nomor telepon
  - Website
- **Tombol Rute** - Buka Google Maps untuk navigasi
- **Tombol Favorit** - Tambah/hapus dari favorit

### 🌐 Multi-Bahasa

- Dukungan **Bahasa Indonesia** dan **English**
- Toggle bahasa dengan satu klik

### 📱 Responsive Design

- Tampilan optimal di **Desktop** dan **Mobile**
- Bottom sheet untuk detail cafe di mobile
- Side panel untuk detail cafe di desktop

## 🛠️ Teknologi

| Teknologi         | Keterangan                                        |
| ----------------- | ------------------------------------------------- |
| **React 18**      | Library UI dengan hooks dan functional components |
| **TypeScript**    | Type-safe JavaScript                              |
| **Vite**          | Build tool yang cepat                             |
| **Leaflet.js**    | Library peta interaktif                           |
| **React-Leaflet** | React wrapper untuk Leaflet                       |
| **TailwindCSS**   | Utility-first CSS framework                       |
| **Overpass API**  | Data cafe dari OpenStreetMap                      |
| **CARTO**         | Tile server untuk peta                            |

## 🎨 Design System

### Warna Utama (Mocha Brown)

```css
--primary-50:  #FBF7F4
--primary-100: #F5EBE4
--primary-200: #E8D5C8
--primary-300: #D4B8A5
--primary-400: #BC9577
--primary-500: #8B6914  /* Main */
--primary-600: #6F4E37  /* Variant */
--primary-700: #5D4037
--primary-800: #4E342E
--primary-900: #3E2723
```

### Font

- **Poppins** - Untuk heading dan body text

## 🚀 Instalasi

### Prerequisites

- Node.js 18+
- npm atau yarn

### Steps

1. **Clone repository**

   ```bash
   git clone https://github.com/rigelra15/RuangKopi-Surabaya.git
   cd RuangKopi-Surabaya
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

4. **Buka browser**
   ```
   http://localhost:5173
   ```

## 📁 Struktur Proyek

```
RuangKopi-Surabaya/
├── src/
│   ├── components/
│   │   ├── MapView.tsx          # Komponen peta utama
│   │   ├── SearchBox.tsx        # Search bar dengan autocomplete
│   │   ├── MapControls.tsx      # Tombol kontrol (lokasi, dark mode, bahasa)
│   │   ├── CafeDetailPanel.tsx  # Panel detail cafe
│   │   ├── DistanceFilter.tsx   # Filter jarak dropdown
│   │   └── FavoritesPanel.tsx   # Panel daftar favorit
│   ├── services/
│   │   ├── cafeService.ts       # API untuk fetch data cafe
│   │   └── favoritesService.ts  # Service untuk manage favorit
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🌐 Data Source

Data cafe diambil dari **OpenStreetMap** melalui **Overpass API**:

- Endpoint utama: `overpass.kumi.systems`
- Backup: `maps.mail.ru`, `overpass-api.de`
- Fallback: Data sample lokal jika API gagal

Query mencari:

- `amenity=cafe`
- `cuisine=coffee`
- `shop=coffee`

## 📄 Scripts

```bash
# Development
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## 🤝 Contributing

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📜 License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

## 👨‍💻 Author

Dibuat oleh **Rigel Ramadhani Waloni** dengan ☕ di Surabaya, Indonesia

---

**RuangKopi Surabaya** - _Ngopi santai, temukan kedai!_ ☕🏙️
