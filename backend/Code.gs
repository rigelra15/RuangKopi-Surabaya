/**
 * RuangKopi Surabaya - Google Apps Script Backend
 *
 * CARA MENGGUNAKAN:
 * 1. Buka Google Spreadsheet Anda
 * 2. Klik Extensions > Apps Script
 * 3. Hapus semua kode yang ada
 * 4. Copy-paste seluruh kode ini
 * 5. Klik Deploy > New deployment
 * 6. Pilih "Web app"
 * 7. Set "Execute as" = Me, "Who has access" = Anyone
 * 8. Copy URL deployment dan simpan di .env sebagai VITE_SHEETS_API_URL
 *
 * STRUKTUR SPREADSHEET:
 * Sheet 1: "Cafes" - Data cafe custom
 * Sheet 2: "Reports" - Laporan masalah dari user
 * Sheet 3: "Overrides" - Override data untuk cafe Overpass API
 *
 * Kolom Overrides:
 * A: originalId
 * B: originalName
 * C: name
 * D: address
 * E: phone
 * F: website
 * G: instagram
 * H: openingHours
 * I: menuUrl
 * J: hasWifi
 * K: wifiFree
 * L: hasOutdoorSeating
 * M: smokingPolicy
 * N: hasTakeaway
 * O: hasAirConditioning
 * P: priceRange
 * Q: description
 * R: isHidden      <-- KOLOM BARU
 * S: updatedAt
 */

// Your secret key - GANTI DENGAN KEY ANDA
const SECRET_KEY = "your_secret_key_here";

// Handle GET requests
function doGet(e) {
  const key = e.parameter.key;

  // Validate key
  if (key !== SECRET_KEY) {
    return createJsonResponse({ success: false, error: "Invalid key" });
  }

  const type = e.parameter.type || "cafes";

  try {
    switch (type) {
      case "cafes":
        return createJsonResponse({ success: true, data: getCafes() });
      case "reports":
        return createJsonResponse({ success: true, data: getReports() });
      case "overrides":
        return createJsonResponse({ success: true, data: getOverrides() });
      default:
        return createJsonResponse({ success: false, error: "Unknown type" });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// Handle POST requests
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const key = data.key;

    // Validate key
    if (key !== SECRET_KEY) {
      return createJsonResponse({ success: false, error: "Invalid key" });
    }

    const action = data.action;

    switch (action) {
      case "add":
        return createJsonResponse(addCafe(data.cafe));
      case "bulkAdd":
        return createJsonResponse(bulkAddCafes(data.cafes));
      case "update":
        return createJsonResponse(updateCafe(data.id, data.cafe));
      case "delete":
        return createJsonResponse(deleteCafe(data.id));
      case "report":
        return createJsonResponse(addReport(data.report));
      case "override":
        return createJsonResponse(saveOverride(data.override));
      case "deleteOverride":
        return createJsonResponse(deleteOverride(data.id));
      default:
        return createJsonResponse({ success: false, error: "Unknown action" });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// Helper function to create JSON response
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ============================================
// CAFES FUNCTIONS
// ============================================

function getCafes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cafes");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers

  const headers = data[0];
  const cafes = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const cafe = {};
    headers.forEach((header, index) => {
      cafe[header] = row[index];
    });
    cafes.push(cafe);
  }

  return cafes;
}

function addCafe(cafeData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cafes");
  if (!sheet) {
    // Create sheet with headers
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const newSheet = ss.insertSheet("Cafes");
    newSheet.appendRow([
      "id",
      "name",
      "lat",
      "lon",
      "address",
      "phone",
      "website",
      "openingHours",
      "hasWifi",
      "wifiFree",
      "hasOutdoorSeating",
      "smokingPolicy",
      "hasTakeaway",
      "hasAirConditioning",
      "instagram",
      "menuUrl",
      "description",
      "createdAt",
    ]);
    return addCafe(cafeData);
  }

  const id = Utilities.getUuid();
  const row = [
    id,
    cafeData.name || "",
    cafeData.lat || 0,
    cafeData.lon || 0,
    cafeData.address || "",
    cafeData.phone || "",
    cafeData.website || "",
    cafeData.openingHours || "",
    cafeData.hasWifi || false,
    cafeData.wifiFree || false,
    cafeData.hasOutdoorSeating || false,
    cafeData.smokingPolicy || "",
    cafeData.hasTakeaway || false,
    cafeData.hasAirConditioning || false,
    cafeData.instagram || "",
    cafeData.menuUrl || "",
    cafeData.description || "",
    new Date().toISOString(),
  ];

  sheet.appendRow(row);
  return { success: true, id: id };
}

// Bulk add cafes (for migration from Overpass API)
function bulkAddCafes(cafesData) {
  if (!Array.isArray(cafesData) || cafesData.length === 0) {
    return { success: false, error: "No cafes provided" };
  }

  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cafes");

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.insertSheet("Cafes");
    sheet.appendRow([
      "id",
      "name",
      "lat",
      "lon",
      "address",
      "phone",
      "website",
      "openingHours",
      "hasWifi",
      "wifiFree",
      "hasOutdoorSeating",
      "smokingPolicy",
      "hasTakeaway",
      "hasAirConditioning",
      "instagram",
      "menuUrl",
      "description",
      "brand",
      "cuisine",
      "isHidden",
      "createdAt",
    ]);
  }

  // Get existing cafe IDs to avoid duplicates
  const existingData = sheet.getDataRange().getValues();
  const headers = existingData[0];
  const idIndex = headers.indexOf("id");
  const existingIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][idIndex]) {
      existingIds.add(existingData[i][idIndex].toString());
    }
  }

  // Prepare rows for new cafes only
  const newRows = [];
  let skipped = 0;

  cafesData.forEach(function (cafeData) {
    if (existingIds.has(cafeData.id?.toString())) {
      skipped++;
      return;
    }

    const row = [
      cafeData.id || Utilities.getUuid(),
      cafeData.name || "",
      cafeData.lat || 0,
      cafeData.lon || 0,
      cafeData.address || "",
      cafeData.phone || "",
      cafeData.website || "",
      cafeData.openingHours || "",
      cafeData.hasWifi || false,
      cafeData.wifiFree || false,
      cafeData.hasOutdoorSeating || false,
      cafeData.smokingPolicy || "",
      cafeData.hasTakeaway || false,
      cafeData.hasAirConditioning || false,
      cafeData.instagram || "",
      cafeData.menuUrl || "",
      cafeData.description || "",
      cafeData.brand || "",
      cafeData.cuisine || "",
      cafeData.isHidden || false,
      new Date().toISOString(),
    ];
    newRows.push(row);
  });

  // Batch insert all new rows at once
  if (newRows.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet
      .getRange(lastRow + 1, 1, newRows.length, newRows[0].length)
      .setValues(newRows);
  }

  return {
    success: true,
    added: newRows.length,
    skipped: skipped,
    total: cafesData.length,
  };
}

function updateCafe(id, cafeData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cafes");
  if (!sheet) return { success: false, error: "Sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      // Update each field
      headers.forEach((header, colIndex) => {
        if (cafeData.hasOwnProperty(header) && header !== "id") {
          sheet.getRange(i + 1, colIndex + 1).setValue(cafeData[header]);
        }
      });
      return { success: true };
    }
  }

  return { success: false, error: "Cafe not found" };
}

function deleteCafe(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cafes");
  if (!sheet) return { success: false, error: "Sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: "Cafe not found" };
}

// ============================================
// REPORTS FUNCTIONS
// ============================================

function getReports() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const reports = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const report = {};
    headers.forEach((header, index) => {
      report[header] = row[index];
    });
    reports.push(report);
  }

  return reports;
}

function addReport(reportData) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Reports");

  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.insertSheet("Reports");
    sheet.appendRow([
      "id",
      "cafeId",
      "cafeName",
      "issueType",
      "description",
      "suggestedFix",
      "reportedAt",
      "status",
    ]);
  }

  const id = Utilities.getUuid();
  const row = [
    id,
    reportData.cafeId || "",
    reportData.cafeName || "",
    reportData.issueType || "",
    reportData.description || "",
    reportData.suggestedFix || "",
    reportData.reportedAt || new Date().toISOString(),
    "pending",
  ];

  sheet.appendRow(row);
  return { success: true, id: id };
}

// ============================================
// OVERRIDES FUNCTIONS (UPDATED WITH isHidden)
// ============================================

function getOverrides() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Overrides");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const overrides = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const override = {};
    headers.forEach((header, index) => {
      let value = row[index];

      // Convert string "true"/"false" to boolean for boolean fields
      if (
        [
          "hasWifi",
          "wifiFree",
          "hasOutdoorSeating",
          "hasTakeaway",
          "hasAirConditioning",
          "isHidden",
        ].includes(header)
      ) {
        if (value === "TRUE" || value === true || value === "true") {
          value = true;
        } else if (value === "FALSE" || value === false || value === "false") {
          value = false;
        }
      }

      // Only include non-empty values
      if (value !== "" && value !== null && value !== undefined) {
        override[header] = value;
      }
    });

    if (override.originalId) {
      overrides.push(override);
    }
  }

  return overrides;
}

function saveOverride(overrideData) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Overrides");

  // Create sheet with headers if it doesn't exist
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.insertSheet("Overrides");
    sheet.appendRow([
      "originalId", // A
      "originalName", // B
      "name", // C
      "address", // D
      "phone", // E
      "website", // F
      "instagram", // G
      "openingHours", // H
      "menuUrl", // I
      "hasWifi", // J
      "wifiFree", // K
      "hasOutdoorSeating", // L
      "smokingPolicy", // M
      "hasTakeaway", // N
      "hasAirConditioning", // O
      "priceRange", // P
      "description", // Q
      "isHidden", // R  <-- KOLOM BARU
      "updatedAt", // S
    ]);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("originalId");

  // Check if isHidden column exists, if not add it
  if (headers.indexOf("isHidden") === -1) {
    // Add isHidden column before updatedAt
    const lastCol = sheet.getLastColumn();
    sheet.insertColumnAfter(lastCol - 1); // Insert before last column (updatedAt)
    sheet.getRange(1, lastCol).setValue("isHidden");
    // Refresh headers
    return saveOverride(overrideData);
  }

  // Find existing override row
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === overrideData.originalId) {
      existingRow = i + 1;
      break;
    }
  }

  // Build row data based on headers
  const rowData = headers.map((header) => {
    if (overrideData.hasOwnProperty(header)) {
      return overrideData[header];
    }
    return "";
  });

  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowData]);
  } else {
    // Append new row
    sheet.appendRow(rowData);
  }

  return { success: true };
}

function deleteOverride(originalId) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Overrides");
  if (!sheet) return { success: false, error: "Sheet not found" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf("originalId");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === originalId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: "Override not found" };
}
