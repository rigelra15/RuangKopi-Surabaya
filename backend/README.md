# Backend Google Apps Script - RuangKopi Surabaya

## Cara Update Backend

### Langkah 1: Buka Google Apps Script Editor

1. Buka Google Spreadsheet yang digunakan untuk menyimpan data
2. Klik menu **Extensions** > **Apps Script**

### Langkah 2: Update Kode

1. **Hapus semua kode** yang ada di editor
2. Copy seluruh isi file `Code.gs` dari folder ini
3. Paste ke editor Apps Script

### Langkah 3: Update Secret Key

Ganti baris ini dengan secret key Anda:

```javascript
const SECRET_KEY = "your_secret_key_here";
```

Menjadi:

```javascript
const SECRET_KEY = "rksby_admin_key_2024"; // Sesuaikan dengan .env Anda
```

### Langkah 4: Deploy Ulang

1. Klik **Deploy** > **Manage deployments**
2. Klik ikon pensil (Edit) pada deployment yang aktif
3. Di bagian **Version**, pilih **New version**
4. Klik **Deploy**
5. Copy URL deployment baru jika diperlukan

### Langkah 5: Update Spreadsheet Headers

Pastikan Sheet "Overrides" memiliki kolom `isHidden` (kolom R). Jika belum ada:

1. Buka Sheet "Overrides"
2. Tambahkan kolom baru sebelum `updatedAt`
3. Beri nama header: `isHidden`

Atau biarkan saja, script akan otomatis menambahkan kolom saat pertama kali menyimpan override.

## Struktur Spreadsheet

### Sheet: Cafes

| Kolom              | Deskripsi         |
| ------------------ | ----------------- |
| id                 | UUID unik         |
| name               | Nama cafe         |
| lat                | Latitude          |
| lon                | Longitude         |
| address            | Alamat            |
| phone              | Telepon           |
| website            | Website           |
| openingHours       | Jam buka          |
| hasWifi            | Ada WiFi          |
| wifiFree           | WiFi gratis       |
| hasOutdoorSeating  | Area outdoor      |
| smokingPolicy      | Kebijakan merokok |
| hasTakeaway        | Bisa takeaway     |
| hasAirConditioning | Ada AC            |
| instagram          | Username IG       |
| menuUrl            | URL menu          |
| description        | Deskripsi         |
| createdAt          | Tanggal dibuat    |

### Sheet: Reports

| Kolom        | Deskripsi                 |
| ------------ | ------------------------- |
| id           | UUID unik                 |
| cafeId       | ID cafe                   |
| cafeName     | Nama cafe                 |
| issueType    | Jenis masalah             |
| description  | Deskripsi masalah         |
| suggestedFix | Saran perbaikan           |
| reportedAt   | Tanggal laporan           |
| status       | Status (pending/resolved) |

### Sheet: Overrides

| Kolom              | Deskripsi                  |
| ------------------ | -------------------------- |
| originalId         | ID asli cafe dari Overpass |
| originalName       | Nama asli cafe             |
| name               | Override nama              |
| address            | Override alamat            |
| phone              | Override telepon           |
| website            | Override website           |
| instagram          | Override Instagram         |
| openingHours       | Override jam buka          |
| menuUrl            | Override URL menu          |
| hasWifi            | Override WiFi              |
| wifiFree           | Override WiFi gratis       |
| hasOutdoorSeating  | Override outdoor           |
| smokingPolicy      | Override kebijakan merokok |
| hasTakeaway        | Override takeaway          |
| hasAirConditioning | Override AC                |
| priceRange         | Override range harga       |
| description        | Override deskripsi         |
| **isHidden**       | **Sembunyikan dari peta**  |
| updatedAt          | Tanggal update             |

## Fitur Baru: isHidden

Field `isHidden` digunakan untuk menyembunyikan cafe dari peta tanpa menghapusnya dari database. Berguna untuk:

- Cafe yang sudah tutup permanen tapi masih ada di OpenStreetMap
- Cafe yang lokasinya salah
- Cafe yang bukan cafe (salah data di OSM)

Nilai:

- `true` atau `TRUE` = Cafe disembunyikan
- `false`, `FALSE`, atau kosong = Cafe ditampilkan
