#!/usr/bin/env python3
"""Membuat ops/MahaKarya_Ops.xlsx: satu workbook operasional untuk diunggah ke Google Sheets.

Tab: Dashboard, Pesanan, Stok filamen, Stok bahan, Stok bagian jadi, Mutasi stok, Kas,
Laporan bulanan, Rutinitas, Resep, Pengaturan, Panduan.
Semua angka turunan adalah rumus (kompatibel Google Sheets, Excel, LibreOffice).
Jalankan: python3 tools/build-ops-sheet.py ops/MahaKarya_Ops.xlsx
"""
import sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.comments import Comment

OUT = sys.argv[1] if len(sys.argv) > 1 else "MahaKarya_Ops.xlsx"
N_ORD, N_LOG = 1000, 2000  # baris maksimum Pesanan; Mutasi stok & Kas

# ---------- gaya ----------
FONT = "Arial"
f_base = Font(name=FONT, size=10)
f_bold = Font(name=FONT, size=10, bold=True)
f_head = Font(name=FONT, size=10, bold=True, color="FFFFFF")
f_title = Font(name=FONT, size=16, bold=True, color="1F1A16")
f_sub = Font(name=FONT, size=10, italic=True, color="6B6258")
f_kpi = Font(name=FONT, size=20, bold=True, color="1F1A16")
f_formula = Font(name=FONT, size=10, color="1F1A16")
f_link = Font(name=FONT, size=10, color="008000")
fill_head = PatternFill("solid", fgColor="2B2622")
fill_input = PatternFill("solid", fgColor="FFF6D5")   # kuning muda = boleh diisi
fill_calc = PatternFill("solid", fgColor="F0ECE4")    # abu hangat = rumus, jangan diketik
fill_tile = PatternFill("solid", fgColor="FAF6EF")
fill_warn = PatternFill("solid", fgColor="F8D7DA")
fill_ok = PatternFill("solid", fgColor="D8EAD3")
fill_amber = PatternFill("solid", fgColor="FDE9C9")
thin = Side(style="thin", color="D9D2C5")
border = Border(left=thin, right=thin, top=thin, bottom=thin)
center = Alignment(horizontal="center", vertical="center", wrap_text=True)
wrap = Alignment(vertical="top", wrap_text=True)

RP = '"Rp"#,##0;[Red]-"Rp"#,##0;-'
PCT = "0%"
NUM = "#,##0;[Red]-#,##0;-"
DATE = "yyyy-mm-dd"

wb = Workbook()


def sheet(name, index=None):
    ws = wb.create_sheet(name, index)
    ws.sheet_view.showGridLines = False
    return ws


def header(ws, row, cols, start_col=1, fill=fill_head, font=f_head, height=30):
    for i, c in enumerate(cols):
        cell = ws.cell(row=row, column=start_col + i, value=c)
        cell.font, cell.fill, cell.alignment, cell.border = font, fill, center, border
    ws.row_dimensions[row].height = height


def widths(ws, ws_widths):
    for i, w in enumerate(ws_widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def style_range(ws, cell_range, fill=None, font=None, fmt=None, align=None):
    for row in ws[cell_range]:
        for c in row:
            c.border = border
            if fill: c.fill = fill
            if font: c.font = font
            if fmt: c.number_format = fmt
            if align: c.alignment = align


def title(ws, text, sub=None):
    ws["A1"] = text
    ws["A1"].font = f_title
    if sub:
        ws["A2"] = sub
        ws["A2"].font = f_sub
    ws.row_dimensions[1].height = 26


def legend(ws, row, col=1):
    c = ws.cell(row=row, column=col, value="Kuning = diisi manual")
    c.fill, c.font = fill_input, f_base
    c = ws.cell(row=row, column=col + 1, value="Abu-abu = rumus, jangan diketik")
    c.fill, c.font = fill_calc, f_base


# ======================================================================
# PENGATURAN
# ======================================================================
ws_set = sheet("Pengaturan")
title(ws_set, "Pengaturan & asumsi", "Semua rumus di tab lain mengacu ke sini. Ubah di sini, bukan di rumus.")
header(ws_set, 4, ["Parameter", "Nilai", "Satuan", "Keterangan"])
settings = [
    ("Bulan mulai laporan", date(2025, 10, 1), "tanggal", "Tanggal 1 bulan pertama di tab Laporan bulanan (18 bulan ke depan)."),
    ("Harga filamen per gram", 185, "Rp/g", "Roll 1 kg Rp 185.000 → 185 Rp/g. Asumsi; ganti dengan harga beli terakhir dari tab Mutasi stok."),
    ("Biaya mesin per gram", 60, "Rp/g", "Listrik + penyusutan printer + nozzle, dibagi gram tercetak. Asumsi; hitung ulang setelah 3 bulan dari tab Kas."),
    ("Biaya kemasan per pesanan", 18000, "Rp", "Dus + insert + tisu + stiker + bubble wrap (lihat ops/kemasan.md). Asumsi."),
    ("Modal kit kelistrikan", 35000, "Rp", "Harga beli kit (dijual Rp 49.000 di website). Asumsi."),
    ("Modal bohlam LED", 15000, "Rp", "Harga beli LED ≤5 W (dijual Rp 25.000). Asumsi."),
    ("Target konversi chat → bayar", 0.40, "%", "Dari ops/wa-quick-replies.md."),
    ("Target hari bayar → tiba", 8, "hari", "3–5 hari cetak + 2–3 hari kirim untuk preset."),
    ("Stok minimum filamen", 300, "g", "Di bawah ini status jadi PESAN. ±1,5 lampu."),
    ("Gram per roll", 1000, "g", "Ukuran roll standar."),
]
for i, (k, v, u, d) in enumerate(settings, start=5):
    ws_set.cell(row=i, column=1, value=k).font = f_bold
    c = ws_set.cell(row=i, column=2, value=v)
    c.fill = fill_input
    c.font = Font(name=FONT, size=10, color="0000FF")
    if u == "tanggal": c.number_format = DATE
    elif u == "%": c.number_format = PCT
    elif u in ("Rp", "Rp/g"): c.number_format = RP
    else: c.number_format = NUM
    ws_set.cell(row=i, column=3, value=u).font = f_base
    ws_set.cell(row=i, column=4, value=d).font = f_base
    for col in range(1, 5): ws_set.cell(row=i, column=col).border = border
widths(ws_set, [32, 16, 10, 90])
legend(ws_set, 17)
S = {  # referensi absolut
    "mulai": "Pengaturan!$B$5", "filamen": "Pengaturan!$B$6", "mesin": "Pengaturan!$B$7", "kemasan": "Pengaturan!$B$8",
    "kit": "Pengaturan!$B$9", "led": "Pengaturan!$B$10", "tkonv": "Pengaturan!$B$11", "thari": "Pengaturan!$B$12",
    "minfil": "Pengaturan!$B$13", "roll": "Pengaturan!$B$14",
}

# ======================================================================
# RESEP (gram per bentuk, kode warna)
# ======================================================================
ws_r = sheet("Resep")
title(ws_r, "Resep gram & kode", "Gram filamen per bentuk (untuk hitung pemakaian stok otomatis) dan kode 3 huruf yang dipakai kode rakitan.")
header(ws_r, 4, ["Bagian", "Kode", "Gram", "Nama", "Sumber"])
recipe = [
    ("Kap", "PLI", 200, "Silinder plisir", "ASUMSI, ganti dari slicer"), ("Kap", "KER", 170, "Kerucut", "ASUMSI, ganti dari slicer"), ("Kap", "KOT", 190, "Kotak", "ASUMSI, ganti dari slicer"),
    (None,),
    ("Badan", "BOL", 180, "Bola", "lamp-data.js kg×1000"), ("Badan", "KUB", 170, "Kubus", "lamp-data.js kg×1000"), ("Badan", "CIN", 120, "Cincin", "lamp-data.js kg×1000"), ("Badan", "HEK", 190, "Heksagon", "lamp-data.js kg×1000"), ("Badan", "SIL", 150, "Silinder", "lamp-data.js kg×1000"),
    (None,),
    ("Alas", "BUL", 220, "Bulat", "ASUMSI (lamp-data.js: alas 0,22 kg)"), ("Alas", "SEG", 200, "Segitiga", "ASUMSI"), ("Alas", "KOT", 220, "Kotak", "ASUMSI"), ("Alas", "BUN", 240, "Bunga", "ASUMSI"),
]
r = 5
rows_kap, rows_badan, rows_alas = [], [], []
for item in recipe:
    if item[0] is None:
        r += 1; continue
    bag, kode, gram, nama, src = item
    ws_r.cell(row=r, column=1, value=bag); ws_r.cell(row=r, column=2, value=kode).font = f_bold
    g = ws_r.cell(row=r, column=3, value=gram); g.fill = fill_input; g.font = Font(name=FONT, size=10, color="0000FF")
    ws_r.cell(row=r, column=4, value=nama); ws_r.cell(row=r, column=5, value=src)
    for col in range(1, 6): ws_r.cell(row=r, column=col).border = border
    {"Kap": rows_kap, "Badan": rows_badan, "Alas": rows_alas}[bag].append(r)
    r += 1
R_KAP = f"Resep!$B${rows_kap[0]}:$B${rows_kap[-1]}", f"Resep!$C${rows_kap[0]}:$C${rows_kap[-1]}"
R_BAD = f"Resep!$B${rows_badan[0]}:$B${rows_badan[-1]}", f"Resep!$C${rows_badan[0]}:$C${rows_badan[-1]}"
R_ALS = f"Resep!$B${rows_alas[0]}:$B${rows_alas[-1]}", f"Resep!$C${rows_alas[0]}:$C${rows_alas[-1]}"
r += 1
ws_r.cell(row=r, column=1, value="Kode warna (3 huruf pertama id di lamp-data.js)").font = f_bold
r += 1
header(ws_r, r, ["Dipakai di", "Kode", "Warna", "Hex", ""])
colors = [("Badan/Alas", "KRE", "Krem", "#efe3cb"), ("Badan/Alas", "HIT", "Hitam arang", "#2b2622"), ("Badan/Alas", "BAT", "Merah bata", "#c4522f"),
          ("Badan/Alas", "ZAI", "Zaitun", "#5c8040"), ("Badan/Alas", "SAL", "Salmon", "#e8836f"), ("Kap", "GAD", "Gading", "#f3e8d1"), ("Kap", "PUT", "Putih", "#f8f5ee")]
COLOR_ROW0 = r + 1
for i, (kind, kode, nama, hx) in enumerate(colors, start=r + 1):
    for col, v in enumerate([kind, kode, nama, hx], 1):
        c = ws_r.cell(row=i, column=col, value=v); c.border = border
    ws_r.cell(row=i, column=2).font = f_bold
    ws_r.cell(row=i, column=5).fill = PatternFill("solid", fgColor=hx.lstrip("#").upper())
r = r + 1 + len(colors) + 1
ws_r.cell(row=r, column=1, value="Contoh kode rakitan: MK-KERGAD-KUBBAT-HEKKRE-BOLSAL-KOTBAT  →  kap KER warna GAD, badan KUB BAT + HEK KRE + BOL SAL, alas KOT BAT. Akhiran -TK = tanpa kit, -LED = dengan bohlam.").font = f_sub
widths(ws_r, [14, 10, 10, 20, 40])

# ======================================================================
# PESANAN
# ======================================================================
ws_o = sheet("Pesanan", 0)
ws_o.freeze_panes = "D2"
HEAD = ["ID", "Tanggal", "Status", "Nama", "No WA", "Kode rakitan", "Harga lampu", "Zona", "Ongkir", "Alamat", "Tgl bayar", "Janji selesai",
        "Kurir", "Resi", "Perkiraan tiba", "Tgl selesai", "Catatan",
        "Total", "Hari bayar→tiba", "Terlambat?", "Bulan pesan", "Bulan bayar", "Terbayar?",
        "Kode bersih", "Jml segmen", "Kap", "Badan 1", "Badan 2", "Badan 3", "Alas", "Kit?", "LED?",
        "g kap", "g badan 1", "g badan 2", "g badan 3", "g alas", "Total gram", "HPP", "Laba kotor", "Margin", "No. aktif"]
header(ws_o, 1, HEAD)
for i in range(1, 18): ws_o.cell(row=1, column=i).fill = PatternFill("solid", fgColor="9C5730")
samples = [
    ["P251001-01", date(2025, 10, 1), "Selesai", "Contoh A (hapus)", "62812xxxxxxx", "MK-KERGAD-KUBBAT-HEKKRE-BOLSAL-KOTBAT", 439000, "Jabodetabek", 20000, "Jl. Contoh 1, Jakarta Selatan", date(2025, 10, 2), date(2025, 10, 7), "JNE", "JNE0001", date(2025, 10, 9), date(2025, 10, 12), "Baris contoh, hapus"],
    ["P251003-02", date(2025, 10, 3), "Cetak", "Contoh B (hapus)", "62813xxxxxxx", "MK-PLIGAD-BOLZAI-BULHIT-LED", 385000, "Pulau Jawa", 45000, "Jl. Contoh 2, Bandung", date(2025, 10, 4), date(2025, 10, 9), "", "", "", "", "Baris contoh, hapus"],
    ["P251004-03", date(2025, 10, 4), "Tunggu bayar", "Contoh C (hapus)", "62815xxxxxxx", "MK-KOTPUT-CINHIT-BOLKRE-BUNSAL-TK", 360000, "Jabodetabek", 20000, "Jl. Contoh 3, Depok", "", "", "", "", "", "", "Baris contoh, hapus"],
]
for ri, row in enumerate(samples, start=2):
    for ci, v in enumerate(row, 1):
        ws_o.cell(row=ri, column=ci, value=v if v != "" else None)
for r in range(2, N_ORD + 1):
    f = {
        18: f'=IF(A{r}="","",N(G{r})+N(I{r}))',
        19: f'=IF(OR(K{r}="",O{r}=""),"",O{r}-K{r})',
        20: f'=IF(AND(C{r}="Cetak",L{r}<>"",L{r}<TODAY()),"YA","")',
        21: f'=IF(B{r}="","",TEXT(B{r},"yyyy-mm"))',
        22: f'=IF(K{r}="","",TEXT(K{r},"yyyy-mm"))',
        23: f'=IF(OR(C{r}="Cetak",C{r}="Dikirim",C{r}="Selesai"),1,0)',
        24: f'=IF(F{r}="","",SUBSTITUTE(SUBSTITUTE(MID(UPPER(TRIM(F{r})),4,99),"-LED",""),"-TK",""))',
        25: f'=IF(X{r}="","",(LEN(X{r})+1)/7)',
        26: f'=IF(X{r}="","",LEFT(X{r},6))',
        27: f'=IF(X{r}="","",IF(Y{r}>=3,MID(X{r},8,6),""))',
        28: f'=IF(X{r}="","",IF(Y{r}>=4,MID(X{r},15,6),""))',
        29: f'=IF(X{r}="","",IF(Y{r}>=5,MID(X{r},22,6),""))',
        30: f'=IF(X{r}="","",RIGHT(X{r},6))',
        31: f'=IF(F{r}="","",IF(ISNUMBER(SEARCH("-TK",UPPER(F{r}))),0,1))',
        32: f'=IF(F{r}="","",IF(ISNUMBER(SEARCH("-LED",UPPER(F{r}))),1,0))',
        33: f'=IF(Z{r}="",0,IFERROR(INDEX({R_KAP[1]},MATCH(LEFT(Z{r},3),{R_KAP[0]},0)),0))',
        34: f'=IF(AA{r}="",0,IFERROR(INDEX({R_BAD[1]},MATCH(LEFT(AA{r},3),{R_BAD[0]},0)),0))',
        35: f'=IF(AB{r}="",0,IFERROR(INDEX({R_BAD[1]},MATCH(LEFT(AB{r},3),{R_BAD[0]},0)),0))',
        36: f'=IF(AC{r}="",0,IFERROR(INDEX({R_BAD[1]},MATCH(LEFT(AC{r},3),{R_BAD[0]},0)),0))',
        37: f'=IF(AD{r}="",0,IFERROR(INDEX({R_ALS[1]},MATCH(LEFT(AD{r},3),{R_ALS[0]},0)),0))',
        38: f'=IF(X{r}="","",AG{r}+AH{r}+AI{r}+AJ{r}+AK{r})',
        39: f'=IF(X{r}="","",AL{r}*({S["filamen"]}+{S["mesin"]})+{S["kemasan"]}+AE{r}*{S["kit"]}+AF{r}*{S["led"]})',
        40: f'=IF(X{r}="","",N(G{r})-AM{r})',
        41: f'=IF(OR(X{r}="",N(G{r})=0),"",AN{r}/G{r})',
        42: f'=IF(AND(A{r}<>"",C{r}<>"Selesai",C{r}<>"Batal"),COUNTIFS($A$2:A{r},"?*",$C$2:C{r},"<>Selesai",$C$2:C{r},"<>Batal"),"")',
    }
    for col, formula in f.items():
        c = ws_o.cell(row=r, column=col, value=formula)
        c.fill, c.font = fill_calc, f_formula
    for col in range(1, 18):
        c = ws_o.cell(row=r, column=col); c.fill = fill_input; c.font = f_base
    for col in (2, 11, 12, 15, 16): ws_o.cell(row=r, column=col).number_format = DATE
    for col in (7, 9, 18, 39, 40): ws_o.cell(row=r, column=col).number_format = RP
    for col in (33, 34, 35, 36, 37, 38): ws_o.cell(row=r, column=col).number_format = NUM
    ws_o.cell(row=r, column=41).number_format = PCT
dv_status = DataValidation(type="list", formula1='"Baru,Konfirmasi,Tunggu bayar,Cetak,Dikirim,Selesai,Batal"', allow_blank=True)
dv_zone = DataValidation(type="list", formula1='"Jabodetabek,Pulau Jawa,Luar Jawa"', allow_blank=True)
ws_o.add_data_validation(dv_status); ws_o.add_data_validation(dv_zone)
dv_status.add(f"C2:C{N_ORD}"); dv_zone.add(f"H2:H{N_ORD}")
ws_o.conditional_formatting.add(f"A2:Q{N_ORD}", FormulaRule(formula=[f'$T2="YA"'], fill=fill_warn))
ws_o.conditional_formatting.add(f"A2:Q{N_ORD}", FormulaRule(formula=[f'$C2="Baru"'], fill=fill_amber))
widths(ws_o, [12, 11, 13, 20, 14, 38, 12, 13, 10, 30, 11, 11, 8, 12, 11, 11, 24, 12, 10, 9, 10, 10, 9, 36, 8, 9, 9, 9, 9, 9, 6, 6, 7, 8, 8, 8, 7, 9, 12, 12, 8, 8])
ws_o["A1"].comment = Comment("Kolom A–Q = tempel dari CSV admin.html (Unduh CSV, pemisah ;). Kolom R ke kanan = rumus.", "MahaKarya")

# ======================================================================
# MUTASI STOK
# ======================================================================
ws_m = sheet("Mutasi stok")
ws_m.freeze_panes = "A2"
header(ws_m, 1, ["Tanggal", "Jenis", "Kategori", "Kode / Item", "Jumlah", "Satuan", "Harga total (Rp)", "Ref pesanan / catatan", "Bulan"])
mut = [
    (date(2025, 9, 28), "Masuk", "Filamen", "GAD", 1000, "g", 185000, "eSUN PLA+ matte, roll 1 kg (contoh, hapus)"),
    (date(2025, 9, 28), "Masuk", "Filamen", "PUT", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 9, 28), "Masuk", "Filamen", "KRE", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 9, 28), "Masuk", "Filamen", "HIT", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 9, 28), "Masuk", "Filamen", "BAT", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 9, 28), "Masuk", "Filamen", "ZAI", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 9, 28), "Masuk", "Filamen", "SAL", 1000, "g", 185000, "contoh, hapus"),
    (date(2025, 10, 5), "Pakai", "Filamen", "BAT", 90, "g", "", "Gagal cetak kubus P251001-01 (contoh, hapus)"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Dus kraft 240×240×200", 50, "pcs", 600000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Insert E-flute", 50, "set", 200000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Kit kelistrikan", 10, "pcs", 350000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Bohlam LED 5 W", 10, "pcs", 150000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Stiker kode rakitan", 100, "pcs", 60000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Tisu kraft", 100, "lembar", 50000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Bubble wrap", 20, "m", 60000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Pemberat alas", 20, "pcs", 100000, "contoh, hapus"),
    (date(2025, 9, 29), "Masuk", "Bahan", "Nozzle 0,4 mm", 5, "pcs", 75000, "contoh, hapus"),
]
for ri, row in enumerate(mut, start=2):
    for ci, v in enumerate(row, 1):
        ws_m.cell(row=ri, column=ci, value=v if v != "" else None)
for r in range(2, N_LOG + 1):
    for col in range(1, 9):
        c = ws_m.cell(row=r, column=col); c.fill, c.font = fill_input, f_base
    ws_m.cell(row=r, column=1).number_format = DATE
    ws_m.cell(row=r, column=7).number_format = RP
    c = ws_m.cell(row=r, column=9, value=f'=IF(A{r}="","",TEXT(A{r},"yyyy-mm"))'); c.fill, c.font = fill_calc, f_formula
dv_jenis = DataValidation(type="list", formula1='"Masuk,Pakai,Koreksi"', allow_blank=True)
dv_kat = DataValidation(type="list", formula1='"Filamen,Bahan"', allow_blank=True)
ws_m.add_data_validation(dv_jenis); ws_m.add_data_validation(dv_kat)
dv_jenis.add(f"B2:B{N_LOG}"); dv_kat.add(f"C2:C{N_LOG}")
widths(ws_m, [11, 10, 10, 26, 9, 8, 16, 44, 9])
ws_m["B1"].comment = Comment("Masuk = pembelian. Pakai = pemakaian manual (gagal cetak, sampel, bahan yang dipakai di luar pesanan). Koreksi = hasil opname: isi selisih (+/−) agar Sisa sama dengan fisik. Pemakaian untuk pesanan terbayar dihitung OTOMATIS dari tab Pesanan, jangan dicatat lagi di sini.", "MahaKarya")

MUT = lambda col: f"'Mutasi stok'!${col}$2:${col}${N_LOG}"
PES = lambda col: f"Pesanan!${col}$2:${col}${N_ORD}"

# ======================================================================
# STOK FILAMEN
# ======================================================================
ws_f = sheet("Stok filamen", 1)
title(ws_f, "Stok filamen (gram)", "Masuk/Koreksi/Pakai manual dari tab Mutasi stok. Pakai otomatis = pesanan berstatus Cetak/Dikirim/Selesai × gram di tab Resep.")
H = ["Kode", "Warna", "Dipakai di", "Merek / SKU", "Masuk (g)", "Koreksi (g)", "Pakai otomatis (g)", "Pakai manual (g)", "Sisa (g)", "Sisa roll", "Pakai 30 hari (g)", "Hari tersisa", "Status", "No. peringatan"]
header(ws_f, 4, H)
F0 = 5
for i, (kind, kode, nama, hx) in enumerate(colors):
    r = F0 + i
    ws_f.cell(row=r, column=1, value=kode).font = f_bold
    ws_f.cell(row=r, column=2, value=nama); ws_f.cell(row=r, column=3, value=kind)
    c = ws_f.cell(row=r, column=4, value=""); c.fill = fill_input
    auto = (f'SUMPRODUCT({PES("W")}*((RIGHT({PES("Z")},3)=$A{r})*{PES("AG")}+(RIGHT({PES("AA")},3)=$A{r})*{PES("AH")}'
            f'+(RIGHT({PES("AB")},3)=$A{r})*{PES("AI")}+(RIGHT({PES("AC")},3)=$A{r})*{PES("AJ")}+(RIGHT({PES("AD")},3)=$A{r})*{PES("AK")}))')
    auto30 = (f'SUMPRODUCT({PES("W")}*({PES("K")}>=TODAY()-30)*((RIGHT({PES("Z")},3)=$A{r})*{PES("AG")}+(RIGHT({PES("AA")},3)=$A{r})*{PES("AH")}'
              f'+(RIGHT({PES("AB")},3)=$A{r})*{PES("AI")}+(RIGHT({PES("AC")},3)=$A{r})*{PES("AJ")}+(RIGHT({PES("AD")},3)=$A{r})*{PES("AK")}))')
    f = {
        5: f'=SUMIFS({MUT("E")},{MUT("B")},"Masuk",{MUT("C")},"Filamen",{MUT("D")},$A{r})',
        6: f'=SUMIFS({MUT("E")},{MUT("B")},"Koreksi",{MUT("C")},"Filamen",{MUT("D")},$A{r})',
        7: f'={auto}',
        8: f'=SUMIFS({MUT("E")},{MUT("B")},"Pakai",{MUT("C")},"Filamen",{MUT("D")},$A{r})',
        9: f'=E{r}+F{r}-G{r}-H{r}',
        10: f'=IF({S["roll"]}=0,"",I{r}/{S["roll"]})',
        11: f'={auto30}+SUMIFS({MUT("E")},{MUT("B")},"Pakai",{MUT("C")},"Filamen",{MUT("D")},$A{r},{MUT("A")},">="&(TODAY()-30))',
        12: f'=IF(K{r}<=0,"",ROUND(I{r}/(K{r}/30),0))',
        13: f'=IF(I{r}<{S["minfil"]},"PESAN","OK")',
        14: f'=IF(M{r}="PESAN",COUNTIF($M${F0}:M{r},"PESAN"),"")',
    }
    for col, formula in f.items():
        c = ws_f.cell(row=r, column=col, value=formula); c.fill, c.font = fill_calc, f_formula
    for col in range(1, 15): ws_f.cell(row=r, column=col).border = border
    for col in (5, 6, 7, 8, 9, 11, 12): ws_f.cell(row=r, column=col).number_format = NUM
    ws_f.cell(row=r, column=10).number_format = "0.0"
F1 = F0 + len(colors) - 1
ws_f.conditional_formatting.add(f"M{F0}:M{F1}", CellIsRule(operator="equal", formula=['"PESAN"'], fill=fill_warn, font=Font(name=FONT, bold=True, color="9C1C1C")))
ws_f.conditional_formatting.add(f"M{F0}:M{F1}", CellIsRule(operator="equal", formula=['"OK"'], fill=fill_ok))
r = F1 + 2
ws_f.cell(row=r, column=1, value="Tambah warna baru: sisipkan baris di dalam tabel (klik kanan baris terakhir → sisipkan), salin rumus dari baris di atasnya, isi Kode 3 huruf sesuai id di lamp-data.js, dan tambahkan kodenya di tab Resep.").font = f_sub
ws_f.cell(row=r + 1, column=1, value="Opname bulanan: timbang tiap roll (gram bersih = berat roll − berat spool kosong ±200 g), lalu catat selisihnya di Mutasi stok sebagai Koreksi.").font = f_sub
legend(ws_f, r + 3)
widths(ws_f, [8, 14, 12, 22, 11, 11, 15, 14, 11, 9, 14, 11, 10, 11])
ws_f.freeze_panes = "C5"

# ======================================================================
# STOK BAHAN (kemasan & kelistrikan)
# ======================================================================
ws_b = sheet("Stok bahan", 2)
title(ws_b, "Stok bahan: kemasan & kelistrikan", "Masuk/Koreksi/Pakai manual dari Mutasi stok (Kategori = Bahan, Item harus sama persis). Pakai otomatis dihitung per pesanan terbayar.")
header(ws_b, 4, ["Item", "Satuan", "Dasar pemakaian", "Jumlah per pesanan", "Masuk", "Koreksi", "Pakai otomatis", "Pakai manual", "Sisa", "Minimum", "Status", "Supplier / catatan", "Harga satuan terakhir", "No. peringatan", "Baris Mutasi terakhir"])
bahan = [
    ("Dus kraft 240×240×200", "pcs", "Per pesanan", 1, 20, "Percetakan dus, MOQ 300–500; lihat ops/kemasan.md"),
    ("Insert E-flute", "set", "Per pesanan", 1, 20, "Satu set = nampan dasar + pemisah + cradle"),
    ("Stiker kode rakitan", "pcs", "Per pesanan", 1, 30, "Cetak digital/thermal 80×48 mm"),
    ("Tisu kraft", "lembar", "Per pesanan", 5, 50, "5 lembar per pesanan (tiap bagian dibungkus)"),
    ("Bubble wrap", "m", "Per pesanan", 1.5, 10, "±1,5 m per dus"),
    ("Kit kelistrikan", "pcs", "Per kit", 1, 5, "Hanya dipakai bila kode TIDAK berakhiran -TK"),
    ("Bohlam LED 5 W", "pcs", "Per LED", 1, 5, "Hanya dipakai bila kode berakhiran -LED"),
    ("Pemberat alas", "pcs", "Per pesanan", 1, 10, "Isi pemberat alas (baut/semen/besi), ganti sesuai yang dipakai"),
    ("Nozzle 0,4 mm", "pcs", "Manual", 0, 2, "Catat pemakaian di Mutasi stok jenis Pakai"),
]
B0 = 5
for i, (item, sat, dasar, qty, mn, note) in enumerate(bahan):
    r = B0 + i
    for col, v in ((1, item), (2, sat), (3, dasar), (4, qty), (10, mn), (12, note)):
        c = ws_b.cell(row=r, column=col, value=v); c.fill = fill_input; c.font = f_base
    auto = (f'=IF(C{r}="Per pesanan",D{r}*SUMPRODUCT({PES("W")}),IF(C{r}="Per kit",D{r}*SUMPRODUCT({PES("W")}*({PES("AE")}=1)),'
            f'IF(C{r}="Per LED",D{r}*SUMPRODUCT({PES("W")}*({PES("AF")}=1)),0)))')
    f = {
        5: f'=SUMIFS({MUT("E")},{MUT("B")},"Masuk",{MUT("C")},"Bahan",{MUT("D")},$A{r})',
        6: f'=SUMIFS({MUT("E")},{MUT("B")},"Koreksi",{MUT("C")},"Bahan",{MUT("D")},$A{r})',
        7: auto,
        8: f'=SUMIFS({MUT("E")},{MUT("B")},"Pakai",{MUT("C")},"Bahan",{MUT("D")},$A{r})',
        9: f'=E{r}+F{r}-G{r}-H{r}',
        11: f'=IF(I{r}<J{r},"PESAN","OK")',
        13: f'=IF(O{r}=0,"",INDEX({MUT("G")},O{r})/INDEX({MUT("E")},O{r}))',
        15: f'=SUMPRODUCT(MAX(({MUT("D")}=$A{r})*({MUT("B")}="Masuk")*({MUT("G")}>0)*(ROW({MUT("D")})-1)))',
        14: f'=IF(K{r}="PESAN",COUNTIF($K${B0}:K{r},"PESAN"),"")',
    }
    for col, formula in f.items():
        c = ws_b.cell(row=r, column=col, value=formula); c.fill, c.font = fill_calc, f_formula
    for col in range(1, 16): ws_b.cell(row=r, column=col).border = border
    for col in (5, 6, 7, 8, 9): ws_b.cell(row=r, column=col).number_format = "#,##0.#;[Red]-#,##0.#;-"
    ws_b.cell(row=r, column=13).number_format = RP
B1 = B0 + len(bahan) - 1
dv_dasar = DataValidation(type="list", formula1='"Per pesanan,Per kit,Per LED,Manual"', allow_blank=True)
ws_b.add_data_validation(dv_dasar); dv_dasar.add(f"C{B0}:C{B1 + 20}")
ws_b.conditional_formatting.add(f"K{B0}:K{B1}", CellIsRule(operator="equal", formula=['"PESAN"'], fill=fill_warn, font=Font(name=FONT, bold=True, color="9C1C1C")))
ws_b.conditional_formatting.add(f"K{B0}:K{B1}", CellIsRule(operator="equal", formula=['"OK"'], fill=fill_ok))
ws_b.cell(row=B1 + 2, column=1, value="Harga satuan terakhir diambil dari baris Masuk terakhir di Mutasi stok (harga total ÷ jumlah). Nama item di Mutasi stok harus sama persis dengan kolom A.").font = f_sub
legend(ws_b, B1 + 4)
widths(ws_b, [24, 8, 14, 10, 9, 9, 12, 11, 9, 9, 9, 44, 14, 11, 11])
ws_b.freeze_panes = "B5"

# ======================================================================
# STOK BAGIAN JADI (cetak di muka untuk preset)
# ======================================================================
ws_j = sheet("Stok bagian jadi", 3)
title(ws_j, "Stok bagian jadi (dicetak di muka)", "Bagian preset yang sudah dicetak dan siap kirim. Diisi manual saat opname mingguan; ini yang membuat preset bisa 3–5 hari.")
header(ws_j, 4, ["Bagian", "Bentuk", "Warna", "Kode", "Jumlah siap", "Minimum", "Status", "Catatan"])
jadi = [("Kap", "Kerucut", "Gading", 2, 1), ("Kap", "Silinder plisir", "Gading", 2, 1), ("Badan", "Bola", "Krem", 2, 1), ("Badan", "Bola", "Salmon", 1, 1),
        ("Badan", "Kubus", "Merah bata", 1, 1), ("Badan", "Heksagon", "Krem", 1, 1), ("Badan", "Cincin", "Krem", 2, 1), ("Alas", "Bulat", "Hitam arang", 2, 1), ("Alas", "Kotak", "Merah bata", 1, 1)]
code3 = {"Kerucut": "KER", "Silinder plisir": "PLI", "Kotak": "KOT", "Bola": "BOL", "Kubus": "KUB", "Heksagon": "HEK", "Cincin": "CIN", "Silinder": "SIL", "Bulat": "BUL", "Segitiga": "SEG", "Bunga": "BUN",
         "Gading": "GAD", "Putih": "PUT", "Krem": "KRE", "Hitam arang": "HIT", "Merah bata": "BAT", "Zaitun": "ZAI", "Salmon": "SAL"}
J0 = 5
for i, (bag, bentuk, warna, qty, mn) in enumerate(jadi):
    r = J0 + i
    for col, v in ((1, bag), (2, bentuk), (3, warna), (5, qty), (6, mn), (8, "contoh, ganti dengan stok nyata")):
        c = ws_j.cell(row=r, column=col, value=v); c.fill = fill_input; c.font = f_base
    c = ws_j.cell(row=r, column=4, value=code3[bentuk] + code3[warna]); c.fill, c.font = fill_calc, f_formula
    c = ws_j.cell(row=r, column=7, value=f'=IF(E{r}<F{r},"CETAK","OK")'); c.fill, c.font = fill_calc, f_formula
    for col in range(1, 9): ws_j.cell(row=r, column=col).border = border
J1 = J0 + len(jadi) - 1
for r in range(J1 + 1, J1 + 30):
    c = ws_j.cell(row=r, column=7, value=f'=IF(A{r}="","",IF(E{r}<F{r},"CETAK","OK"))'); c.fill, c.font = fill_calc, f_formula
    for col in range(1, 9): ws_j.cell(row=r, column=col).border = border
    for col in (1, 2, 3, 5, 6, 8): ws_j.cell(row=r, column=col).fill = fill_input
ws_j.conditional_formatting.add(f"G{J0}:G{J1 + 29}", CellIsRule(operator="equal", formula=['"CETAK"'], fill=fill_amber, font=Font(name=FONT, bold=True, color="7A4A00")))
ws_j.cell(row=J1 + 31, column=1, value="Saat bagian jadi dipakai untuk pesanan: kurangi Jumlah siap. Filamennya sudah terhitung otomatis di Stok filamen lewat kode rakitan pesanan itu.").font = f_sub
legend(ws_j, J1 + 33)
widths(ws_j, [10, 16, 14, 10, 12, 10, 10, 36])

# ======================================================================
# KAS
# ======================================================================
ws_k = sheet("Kas")
ws_k.freeze_panes = "A2"
header(ws_k, 1, ["Tanggal", "Jenis", "Kategori", "Jumlah (Rp)", "Ref pesanan", "Catatan", "Bulan", "Saldo berjalan"])
kas = [
    (date(2025, 9, 28), "Keluar", "Filamen", 1295000, "", "7 roll PLA+ (contoh, hapus)"),
    (date(2025, 9, 29), "Keluar", "Kemasan", 1470000, "", "dus, insert, stiker, tisu, bubble (contoh, hapus)"),
    (date(2025, 9, 29), "Keluar", "Kelistrikan", 500000, "", "10 kit + 10 LED (contoh, hapus)"),
    (date(2025, 10, 2), "Masuk", "Penjualan", 459000, "P251001-01", "transfer BCA (contoh, hapus)"),
    (date(2025, 10, 4), "Masuk", "Penjualan", 430000, "P251003-02", "transfer (contoh, hapus)"),
    (date(2025, 10, 8), "Keluar", "Kurir", 20000, "P251001-01", "JNE REG (contoh, hapus)"),
    (date(2025, 10, 31), "Keluar", "Listrik", 150000, "", "porsi listrik printer (contoh, hapus)"),
]
for ri, row in enumerate(kas, start=2):
    for ci, v in enumerate(row, 1):
        ws_k.cell(row=ri, column=ci, value=v if v != "" else None)
for r in range(2, N_LOG + 1):
    for col in range(1, 7):
        c = ws_k.cell(row=r, column=col); c.fill, c.font = fill_input, f_base
    ws_k.cell(row=r, column=1).number_format = DATE
    ws_k.cell(row=r, column=4).number_format = RP
    c = ws_k.cell(row=r, column=7, value=f'=IF(A{r}="","",TEXT(A{r},"yyyy-mm"))'); c.fill, c.font = fill_calc, f_formula
    prev = "0" if r == 2 else f"N(H{r - 1})"
    c = ws_k.cell(row=r, column=8, value=f'=IF(A{r}="","",{prev}+IF(B{r}="Masuk",N(D{r}),-N(D{r})))'); c.fill, c.font = fill_calc, f_formula
    c.number_format = RP
dv_kj = DataValidation(type="list", formula1='"Masuk,Keluar"', allow_blank=True)
dv_kk = DataValidation(type="list", formula1='"Penjualan,Ongkir diterima,Refund,Filamen,Kemasan,Kelistrikan,Kurir,Listrik,Alat & sparepart,Iklan,Marketplace fee,Lainnya"', allow_blank=True)
ws_k.add_data_validation(dv_kj); ws_k.add_data_validation(dv_kk)
dv_kj.add(f"B2:B{N_LOG}"); dv_kk.add(f"C2:C{N_LOG}")
widths(ws_k, [11, 9, 16, 14, 12, 44, 9, 14])
ws_k["A1"].comment = Comment("Catat setiap uang masuk (bukti transfer) dan keluar pada hari yang sama. Saldo berjalan harus sama dengan saldo rekening/e-wallet bisnis saat rekonsiliasi bulanan.", "MahaKarya")
KAS = lambda col: f"Kas!${col}$2:${col}${N_LOG}"

# ======================================================================
# LAPORAN BULANAN
# ======================================================================
ws_l = sheet("Laporan bulanan")
title(ws_l, "Laporan bulanan", "Per bulan, otomatis dari Pesanan dan Kas. Bulan pertama diatur di Pengaturan!B5.")
LH = ["Bulan", "Pesanan masuk", "Terbayar (dari pesanan bulan itu)", "Konversi", "Omzet lampu (bulan bayar)", "Ongkir diterima", "HPP (filamen+mesin+kemasan+kit+LED)",
      "Laba kotor", "Margin", "Kas masuk", "Kas keluar", "Arus kas bersih", "Rata hari bayar→tiba", "Terlambat (Cetak lewat janji)", "Batal"]
header(ws_l, 4, LH, height=44)
L0 = 5
for i in range(18):
    r = L0 + i
    m = f"$A{r}"
    f = {
        1: f'=TEXT(EDATE({S["mulai"]},{i}),"yyyy-mm")',
        2: f'=COUNTIFS({PES("U")},{m})',
        3: f'=SUMPRODUCT(({PES("U")}={m})*{PES("W")})',
        4: f'=IF(B{r}=0,"",C{r}/B{r})',
        5: f'=SUMIFS({PES("G")},{PES("V")},{m},{PES("W")},1)',
        6: f'=SUMIFS({PES("I")},{PES("V")},{m},{PES("W")},1)',
        7: f'=SUMIFS({PES("AM")},{PES("V")},{m},{PES("W")},1)',
        8: f'=E{r}-G{r}',
        9: f'=IF(E{r}=0,"",H{r}/E{r})',
        10: f'=SUMIFS({KAS("D")},{KAS("B")},"Masuk",{KAS("G")},{m})',
        11: f'=SUMIFS({KAS("D")},{KAS("B")},"Keluar",{KAS("G")},{m})',
        12: f'=J{r}-K{r}',
        13: f'=IF(COUNTIFS({PES("V")},{m},{PES("S")},">=0")=0,"",SUMIFS({PES("S")},{PES("V")},{m})/COUNTIFS({PES("V")},{m},{PES("S")},">=0"))',
        14: f'=COUNTIFS({PES("U")},{m},{PES("T")},"YA")',
        15: f'=COUNTIFS({PES("U")},{m},{PES("C")},"Batal")',
    }
    for col, formula in f.items():
        c = ws_l.cell(row=r, column=col, value=formula); c.fill, c.font, c.border = fill_calc, f_formula, border
    for col in (5, 6, 7, 8, 10, 11, 12): ws_l.cell(row=r, column=col).number_format = RP
    for col in (4, 9): ws_l.cell(row=r, column=col).number_format = PCT
    ws_l.cell(row=r, column=13).number_format = "0.0"
L1 = L0 + 17
r = L1 + 1
ws_l.cell(row=r, column=1, value="TOTAL").font = f_bold
for col in (2, 3, 5, 6, 7, 8, 10, 11, 12, 14, 15):
    L = get_column_letter(col)
    c = ws_l.cell(row=r, column=col, value=f"=SUM({L}{L0}:{L}{L1})"); c.font, c.fill, c.border = f_bold, fill_calc, border
    if col in (5, 6, 7, 8, 10, 11, 12): c.number_format = RP
c = ws_l.cell(row=r, column=4, value=f'=IF(B{r}=0,"",C{r}/B{r})'); c.number_format, c.font, c.fill, c.border = PCT, f_bold, fill_calc, border
c = ws_l.cell(row=r, column=9, value=f'=IF(E{r}=0,"",H{r}/E{r})'); c.number_format, c.font, c.fill, c.border = PCT, f_bold, fill_calc, border
ws_l.conditional_formatting.add(f"D{L0}:D{L1}", FormulaRule(formula=[f'AND(D{L0}<>"",D{L0}<{S["tkonv"]})'], fill=fill_warn))
ws_l.conditional_formatting.add(f"M{L0}:M{L1}", FormulaRule(formula=[f'AND(M{L0}<>"",M{L0}>{S["thari"]})'], fill=fill_warn))
ws_l.cell(row=r + 2, column=1, value="Omzet, ongkir, HPP, dan laba kotor dihitung menurut BULAN BAYAR (kolom V Pesanan); pesanan masuk dan konversi menurut bulan pesan. HPP memakai asumsi di Pengaturan, bukan pengeluaran nyata; bandingkan dengan Kas keluar untuk mengoreksi asumsinya.").font = f_sub
ws_l.cell(row=r + 3, column=1, value="Merah = konversi di bawah target atau hari bayar→tiba di atas target (Pengaturan).").font = f_sub
widths(ws_l, [10, 10, 14, 10, 15, 13, 17, 13, 9, 13, 13, 13, 11, 12, 8])
ws_l.freeze_panes = "B5"

# ======================================================================
# DASHBOARD
# ======================================================================
ws_d = sheet("Dashboard", 0)
title(ws_d, "MahaKarya Studio — Dashboard operasional", "Dibuka tiap pagi. Ganti bulan di B4 (format yyyy-mm) atau biarkan: otomatis bulan ini.")
ws_d["A4"] = "Bulan"; ws_d["A4"].font = f_bold
c = ws_d["B4"]; c.value = '=TEXT(TODAY(),"yyyy-mm")'; c.fill, c.font = fill_input, Font(name=FONT, size=12, bold=True, color="0000FF"); c.border = border
ws_d["C4"] = "← ketik bulan lain (mis. 2025-11) untuk melihat bulan itu"; ws_d["C4"].font = f_sub
M = "$B$4"


def tile(ws, row, col, label, formula, fmt=None, note=None):
    """Kotak KPI 2 kolom × 3 baris."""
    ws.merge_cells(start_row=row, start_column=col, end_row=row, end_column=col + 1)
    ws.merge_cells(start_row=row + 1, start_column=col, end_row=row + 1, end_column=col + 1)
    ws.merge_cells(start_row=row + 2, start_column=col, end_row=row + 2, end_column=col + 1)
    a = ws.cell(row=row, column=col, value=label); a.font = Font(name=FONT, size=9, bold=True, color="6B6258"); a.alignment = Alignment(horizontal="left", vertical="bottom")
    b = ws.cell(row=row + 1, column=col, value=formula); b.font = f_kpi; b.alignment = Alignment(horizontal="left", vertical="center")
    if fmt: b.number_format = fmt
    n = ws.cell(row=row + 2, column=col, value=note or ""); n.font = f_sub; n.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    for rr in range(row, row + 3):
        for cc in range(col, col + 2):
            ws.cell(row=rr, column=cc).fill = fill_tile
    ws.row_dimensions[row + 1].height = 30
    ws.row_dimensions[row + 2].height = 26


# Baris 1: penjualan bulan ini
ws_d["A6"] = "PENJUALAN BULAN INI"; ws_d["A6"].font = f_bold
tile(ws_d, 7, 1, "Pesanan masuk", f'=COUNTIFS({PES("U")},{M})', NUM, "chat yang jadi baris pesanan")
tile(ws_d, 7, 3, "Terbayar", f'=SUMPRODUCT(({PES("U")}={M})*{PES("W")})', NUM, "dari pesanan bulan ini")
tile(ws_d, 7, 5, "Konversi chat → bayar", f'=IF(COUNTIFS({PES("U")},{M})=0,"",SUMPRODUCT(({PES("U")}={M})*{PES("W")})/COUNTIFS({PES("U")},{M}))', PCT, "target ≥ 40%")
tile(ws_d, 7, 7, "Omzet lampu", f'=SUMIFS({PES("G")},{PES("V")},{M},{PES("W")},1)', RP, "pesanan dibayar bulan ini")
tile(ws_d, 7, 9, "Laba kotor (perkiraan)", f'=SUMIFS({PES("AN")},{PES("V")},{M},{PES("W")},1)', RP, "omzet − HPP asumsi Pengaturan")
tile(ws_d, 7, 11, "Rata hari bayar → tiba", f'=IF(COUNTIFS({PES("V")},{M},{PES("S")},">=0")=0,"",SUMIFS({PES("S")},{PES("V")},{M})/COUNTIFS({PES("V")},{M},{PES("S")},">=0"))', "0.0", "target ≤ 8 hari")
# Baris 2: yang harus dikerjakan hari ini
ws_d["A11"] = "HARUS DIKERJAKAN HARI INI (semua bulan)"; ws_d["A11"].font = f_bold
tile(ws_d, 12, 1, "Belum dibalas (Baru)", f'=COUNTIF({PES("C")},"Baru")', NUM, "balas < 15 menit")
tile(ws_d, 12, 3, "Menunggu bayar > 1 hari", f'=SUMPRODUCT(({PES("C")}="Tunggu bayar")*({PES("B")}<TODAY()-1)*({PES("B")}<>""))', NUM, "ingatkan sekali (/ingat)")
tile(ws_d, 12, 5, "Dalam antrean cetak", f'=COUNTIF({PES("C")},"Cetak")', NUM, "kelompokkan per warna")
tile(ws_d, 12, 7, "Terlambat dari janji", f'=COUNTIF({PES("T")},"YA")', NUM, "Cetak lewat janji selesai → kabari pembeli")
tile(ws_d, 12, 9, "Dikirim, belum selesai", f'=COUNTIF({PES("C")},"Dikirim")', NUM, "H+3 tiba: tanya kabar (/selesai)")
tile(ws_d, 12, 11, "Pesanan aktif", f'=COUNTIF({PES("A")},"?*")-COUNTIF({PES("C")},"Selesai")-COUNTIF({PES("C")},"Batal")', NUM, "semua selain Selesai/Batal")
# Baris 3: stok & kas
ws_d["A16"] = "STOK & KAS"; ws_d["A16"].font = f_bold
tile(ws_d, 17, 1, "Filamen perlu dipesan", f"=COUNTIF('Stok filamen'!$M${F0}:$M${F1},\"PESAN\")", NUM, "lihat daftar di kanan")
tile(ws_d, 17, 3, "Bahan perlu dipesan", f"=COUNTIF('Stok bahan'!$K${B0}:$K${B1},\"PESAN\")", NUM, "dus, kit, LED, dll.")
tile(ws_d, 17, 5, "Bagian jadi perlu dicetak", f"=COUNTIF('Stok bagian jadi'!$G${J0}:$G${J1 + 29},\"CETAK\")", NUM, "stok preset di bawah minimum")
tile(ws_d, 17, 7, "Kas masuk bulan ini", f'=SUMIFS({KAS("D")},{KAS("B")},"Masuk",{KAS("G")},{M})', RP, "")
tile(ws_d, 17, 9, "Kas keluar bulan ini", f'=SUMIFS({KAS("D")},{KAS("B")},"Keluar",{KAS("G")},{M})', RP, "")
tile(ws_d, 17, 11, "Saldo kas (semua waktu)", f'=SUMIFS({KAS("D")},{KAS("B")},"Masuk")-SUMIFS({KAS("D")},{KAS("B")},"Keluar")', RP, "harus = saldo rekening bisnis")
# Daftar peringatan stok
ws_d["N6"] = "PERINGATAN STOK"; ws_d["N6"].font = f_bold
header(ws_d, 7, ["Filamen", "Sisa (g)", "Hari tersisa"], start_col=14)
for i in range(1, 8):
    r = 7 + i
    c = ws_d.cell(row=r, column=14, value=f"=IFERROR(INDEX('Stok filamen'!$B${F0}:$B${F1},MATCH({i},'Stok filamen'!$N${F0}:$N${F1},0)),\"\")")
    d = ws_d.cell(row=r, column=15, value=f"=IFERROR(INDEX('Stok filamen'!$I${F0}:$I${F1},MATCH({i},'Stok filamen'!$N${F0}:$N${F1},0)),\"\")")
    e = ws_d.cell(row=r, column=16, value=f"=IFERROR(INDEX('Stok filamen'!$L${F0}:$L${F1},MATCH({i},'Stok filamen'!$N${F0}:$N${F1},0)),\"\")")
    for cc in (c, d, e): cc.fill, cc.font, cc.border = fill_calc, f_formula, border
    d.number_format = NUM
header(ws_d, 16, ["Bahan", "Sisa", "Minimum"], start_col=14)
for i in range(1, 8):
    r = 16 + i
    c = ws_d.cell(row=r, column=14, value=f"=IFERROR(INDEX('Stok bahan'!$A${B0}:$A${B1},MATCH({i},'Stok bahan'!$N${B0}:$N${B1},0)),\"\")")
    d = ws_d.cell(row=r, column=15, value=f"=IFERROR(INDEX('Stok bahan'!$I${B0}:$I${B1},MATCH({i},'Stok bahan'!$N${B0}:$N${B1},0)),\"\")")
    e = ws_d.cell(row=r, column=16, value=f"=IFERROR(INDEX('Stok bahan'!$J${B0}:$J${B1},MATCH({i},'Stok bahan'!$N${B0}:$N${B1},0)),\"\")")
    for cc in (c, d, e): cc.fill, cc.font, cc.border = fill_calc, f_formula, border
# Tren 6 bulan terakhir
ws_d["A21"] = "6 BULAN TERAKHIR (dari Laporan bulanan)"; ws_d["A21"].font = f_bold
header(ws_d, 22, ["Bulan", "Pesanan", "Terbayar", "Konversi", "Omzet", "Laba kotor", "Kas bersih", "Hari bayar→tiba"])
for i in range(6):
    r = 23 + i
    off = i - 5
    mm = f'TEXT(EDATE(DATE(VALUE(LEFT({M},4)),VALUE(RIGHT({M},2)),1),{off}),"yyyy-mm")'
    cells = {
        1: f"={mm}",
        2: f"=IFERROR(INDEX('Laporan bulanan'!$B${L0}:$B${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        3: f"=IFERROR(INDEX('Laporan bulanan'!$C${L0}:$C${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        4: f"=IFERROR(INDEX('Laporan bulanan'!$D${L0}:$D${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        5: f"=IFERROR(INDEX('Laporan bulanan'!$E${L0}:$E${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        6: f"=IFERROR(INDEX('Laporan bulanan'!$H${L0}:$H${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        7: f"=IFERROR(INDEX('Laporan bulanan'!$L${L0}:$L${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
        8: f"=IFERROR(INDEX('Laporan bulanan'!$M${L0}:$M${L1},MATCH(A{r},'Laporan bulanan'!$A${L0}:$A${L1},0)),\"\")",
    }
    for col, formula in cells.items():
        c = ws_d.cell(row=r, column=col, value=formula); c.fill, c.font, c.border = fill_calc, f_formula, border
    ws_d.cell(row=r, column=4).number_format = PCT
    for col in (5, 6, 7): ws_d.cell(row=r, column=col).number_format = RP
    ws_d.cell(row=r, column=8).number_format = "0.0"
ws_d["A30"] = "Grafik: blok A22:H28 → Sisipkan → Diagram (Google Sheets membuat grafik kolom otomatis). Dashboard ini hanya rumus; data mentahnya di tab Pesanan, Kas, Mutasi stok."; ws_d["A30"].font = f_sub
widths(ws_d, [16, 12, 16, 12, 16, 12, 16, 12, 16, 12, 16, 12, 3, 22, 11, 12])

# ======================================================================
# RUTINITAS
# ======================================================================
ws_t = sheet("Rutinitas")
title(ws_t, "Rutinitas: apa yang diisi harian, mingguan, bulanan", "Satu admin, ±15 menit/hari + 45 menit/Sabtu + 1,5 jam di awal bulan.")
header(ws_t, 4, ["Kapan", "Tugas", "Di mana", "Hasil / angka yang dicek", "Selesai? (√)"])
rut = [
    ("HARIAN (pagi)", "Buka Dashboard: lihat blok HARUS DIKERJAKAN HARI INI, kerjakan dari kiri ke kanan.", "Sheet ini → Dashboard", "Belum dibalas = 0 sebelum jam 10.", ""),
    ("HARIAN", "Balas chat Baru < 15 menit; tempel pesan ke admin.html → Baca pesan → simpan. Ubah status setiap ada perkembangan (konfirmasi, bayar, cetak, kirim).", "WhatsApp Business + admin.html", "Semua chat punya baris & kode rakitan.", ""),
    ("HARIAN", "Catat uang masuk (bukti transfer) dan uang keluar hari itu.", "Sheet ini → Kas", "Saldo berjalan = saldo rekening.", ""),
    ("HARIAN", "Catat filamen/bahan yang MASUK (pembelian) dan yang terbuang (gagal cetak, sampel) sebagai Pakai. Pemakaian untuk pesanan tidak perlu dicatat (otomatis).", "Sheet ini → Mutasi stok", "Tidak ada roll habis mendadak.", ""),
    ("HARIAN", "Kirim foto rakitan sebelum kemas; input kurir + resi ke admin.html; tempel stiker kode rakitan di dus.", "admin.html, WhatsApp", "Tidak ada pesanan Cetak lewat janji.", ""),
    ("MINGGUAN (Sabtu)", "admin.html → Unduh CSV. Buka CSV, salin semua baris data, tempel ke tab Pesanan kolom A–Q (hapus isi lama dulu: CSV berisi semua pesanan sejak awal). Lalu Unduh JSON, simpan ke Google Drive/Cadangan.", "admin.html → Sheet ini → Pesanan; Drive", "Jumlah baris Pesanan = jumlah pesanan di admin.html.", ""),
    ("MINGGUAN (Sabtu)", "Lihat Stok filamen & Stok bahan: status PESAN → pesan ke supplier hari itu (filamen 3–5 hari datang).", "Sheet ini → Stok filamen, Stok bahan", "Tidak ada PESAN yang menginap > 1 minggu.", ""),
    ("MINGGUAN (Sabtu)", "Hitung fisik bagian jadi (preset) dan isi Jumlah siap. Yang CETAK dicetak di sela antrean.", "Sheet ini → Stok bagian jadi", "Semua preset punya ≥ minimum.", ""),
    ("MINGGUAN (Senin)", "Cek dua angka di Dashboard: Konversi (≥ 40%) dan Rata hari bayar→tiba (≤ 8). Kalau merah, baca catatan pesanan yang batal / terlambat dan putuskan satu perbaikan untuk minggu itu.", "Sheet ini → Dashboard", "Satu keputusan tertulis di catatan.", ""),
    ("BULANAN (tgl 1–3)", "Baca Laporan bulanan: omzet, HPP, laba kotor, arus kas. Bandingkan HPP asumsi dengan Kas keluar nyata; perbaiki angka di Pengaturan bila selisih > 15%.", "Sheet ini → Laporan bulanan, Pengaturan", "Margin kotor ≥ 50% per paket.", ""),
    ("BULANAN (tgl 1–3)", "Opname: timbang tiap roll filamen, hitung bahan. Catat selisih sebagai Koreksi di Mutasi stok supaya Sisa = fisik.", "Sheet ini → Mutasi stok", "Selisih opname < 5%.", ""),
    ("BULANAN (tgl 1–3)", "Rekonsiliasi: Saldo kas di Dashboard = saldo rekening + e-wallet. Selisih dicari sampai ketemu.", "Sheet ini → Kas, mutasi bank", "Selisih = 0.", ""),
    ("BULANAN", "Cadangan: File → Download → Microsoft Excel, simpan ke Drive/Arsip/yyyy-mm. Hapus baris contoh bila masih ada.", "Google Sheets", "Ada file arsip per bulan.", ""),
    ("BULANAN", "Minta ulasan/foto dari pembeli Selesai bulan lalu; simpan foto untuk website (Mode Edit tab Lampu).", "WhatsApp, website #edit", "≥ 3 foto pelanggan per bulan.", ""),
    ("SETIAP 3 BULAN", "Hitung ulang harga: biaya filamen/gram riil (Kas Filamen ÷ gram terpakai), biaya mesin, kemasan. Update Pengaturan, lalu harga di lamp-data.js bila perlu.", "Sheet ini → Kas, Stok filamen; lamp-data.js", "Harga paket masih margin ≥ 50%.", ""),
]
for i, row in enumerate(rut, start=5):
    for col, v in enumerate(row, 1):
        c = ws_t.cell(row=i, column=col, value=v); c.font = f_base; c.alignment = wrap; c.border = border
    ws_t.cell(row=i, column=1).font = f_bold
    ws_t.cell(row=i, column=5).fill = fill_input
    ws_t.row_dimensions[i].height = 48
ws_t.cell(row=5 + len(rut) + 1, column=1, value="Yang TIDAK perlu dicompile: tidak ada file lain. Satu sheet ini + admin.html (data pesanan) + folder Drive untuk cadangan JSON/arsip.").font = f_sub
widths(ws_t, [18, 70, 30, 34, 12])

# ======================================================================
# PANDUAN
# ======================================================================
ws_p = sheet("Panduan")
title(ws_p, "Panduan singkat")
guide = [
    "ALUR DATA: WhatsApp → admin.html (sumber pesanan, di browser) → tiap Sabtu CSV ditempel ke tab Pesanan → semua tab lain (Dashboard, Stok, Laporan) menghitung sendiri.",
    "Stok filamen berkurang OTOMATIS dari kode rakitan pesanan berstatus Cetak/Dikirim/Selesai (gram per bentuk di tab Resep). Yang dicatat manual hanya pembelian, gagal cetak, dan koreksi opname.",
    "Stok bahan (dus, kit, LED, dll.) berkurang otomatis per pesanan terbayar sesuai kolom 'Dasar pemakaian'; kit hanya bila kode tidak berakhiran -TK, LED hanya bila berakhiran -LED.",
    "Kuning = diisi manual. Abu-abu = rumus; kalau tidak sengaja terhapus, salin dari baris di atas/bawahnya.",
    "Angka di Pengaturan dan Resep adalah ASUMSI awal (ditandai di kolom Keterangan/Sumber). Ganti dengan angka nyata dari slicer dan nota pembelian; semua laporan ikut berubah.",
    "Baris bertanda 'contoh, hapus' di Pesanan, Mutasi stok, Kas, dan Stok bagian jadi adalah ilustrasi format. Hapus sebelum dipakai sungguhan.",
    "Mengubah ke Google Sheets: unggah file ini ke Google Drive → klik kanan → Buka dengan → Google Spreadsheet → File → Simpan sebagai Google Spreadsheet. Semua rumus, dropdown, dan warna ikut terbawa.",
    "Di Google Sheets, rumus SUMPRODUCT di Stok filamen menghitung 1.000 baris Pesanan; kalau terasa lambat setelah ribuan pesanan, arsipkan pesanan tahun lalu ke file lain.",
    "Jangan menambah kolom di antara A–Q tab Pesanan: urutannya mengikuti CSV dari admin.html. Kolom baru ditambahkan setelah kolom AO.",
]
for i, t in enumerate(guide, start=3):
    c = ws_p.cell(row=i, column=1, value=f"{i - 2}. {t}"); c.font = f_base; c.alignment = wrap
    ws_p.row_dimensions[i].height = 32
widths(ws_p, [140])

# ======================================================================
# DATA DASBOR (ringkasan datar untuk dasbor web; tanpa nama/HP/alamat pembeli)
# ======================================================================
ws_x = sheet("Data dasbor")
ws_x["A1"] = "bagian"; ws_x["B1"] = "kunci"
for i, h in enumerate(["nilai1", "nilai2", "nilai3", "nilai4", "nilai5", "nilai6", "nilai7"], 3): ws_x.cell(row=1, column=i, value=h)
header(ws_x, 1, ["bagian", "kunci", "nilai1", "nilai2", "nilai3", "nilai4", "nilai5", "nilai6", "nilai7"], height=20)
xr = 2
def xrow(bag, key, *vals):
    global xr
    ws_x.cell(row=xr, column=1, value=bag); ws_x.cell(row=xr, column=2, value=key)
    for i, v in enumerate(vals, 3):
        c = ws_x.cell(row=xr, column=i, value=v); c.fill = fill_calc
    xr += 1
MX = '"' + '"'  # placeholder
MB = 'TEXT(TODAY(),"yyyy-mm")'
xrow("meta", "bulan", f"={MB}")
xrow("meta", "catatan", "Tab ini dibaca dasbor web (dasbor.html). Publikasikan HANYA tab ini ke web sebagai CSV. Tidak berisi nama/HP/alamat.")
kpi = [
    ("pesanan_masuk", f'=COUNTIFS({PES("U")},{MB})'),
    ("terbayar", f'=SUMPRODUCT(({PES("U")}={MB})*{PES("W")})'),
    ("konversi", f'=IF(COUNTIFS({PES("U")},{MB})=0,"",SUMPRODUCT(({PES("U")}={MB})*{PES("W")})/COUNTIFS({PES("U")},{MB}))'),
    ("omzet", f'=SUMIFS({PES("G")},{PES("V")},{MB},{PES("W")},1)'),
    ("laba_kotor", f'=SUMIFS({PES("AN")},{PES("V")},{MB},{PES("W")},1)'),
    ("hari_bayar_tiba", f'=IF(COUNTIFS({PES("V")},{MB},{PES("S")},">=0")=0,"",SUMIFS({PES("S")},{PES("V")},{MB})/COUNTIFS({PES("V")},{MB},{PES("S")},">=0"))'),
    ("belum_dibalas", f'=COUNTIF({PES("C")},"Baru")'),
    ("tunggu_bayar_1hari", f'=SUMPRODUCT(({PES("C")}="Tunggu bayar")*({PES("B")}<TODAY()-1)*({PES("B")}<>""))'),
    ("antrean_cetak", f'=COUNTIF({PES("C")},"Cetak")'),
    ("terlambat", f'=COUNTIF({PES("T")},"YA")'),
    ("dikirim", f'=COUNTIF({PES("C")},"Dikirim")'),
    ("aktif", f'=COUNTIF({PES("A")},"?*")-COUNTIF({PES("C")},"Selesai")-COUNTIF({PES("C")},"Batal")'),
    ("filamen_pesan", f"=COUNTIF('Stok filamen'!$M${F0}:$M${F1},\"PESAN\")"),
    ("bahan_pesan", f"=COUNTIF('Stok bahan'!$K${B0}:$K${B1},\"PESAN\")"),
    ("jadi_cetak", f"=COUNTIF('Stok bagian jadi'!$G${J0}:$G${J1 + 29},\"CETAK\")"),
    ("kas_masuk_bulan", f'=SUMIFS({KAS("D")},{KAS("B")},"Masuk",{KAS("G")},{MB})'),
    ("kas_keluar_bulan", f'=SUMIFS({KAS("D")},{KAS("B")},"Keluar",{KAS("G")},{MB})'),
    ("saldo_kas", f'=SUMIFS({KAS("D")},{KAS("B")},"Masuk")-SUMIFS({KAS("D")},{KAS("B")},"Keluar")'),
    ("target_konversi", f"={S['tkonv']}"), ("target_hari", f"={S['thari']}"),
]
for k, f in kpi: xrow("kpi", k, f)
for i in range(18):
    r = L0 + i
    xrow("tren", f"='Laporan bulanan'!A{r}", f"='Laporan bulanan'!B{r}", f"='Laporan bulanan'!C{r}", f"='Laporan bulanan'!E{r}", f"='Laporan bulanan'!H{r}", f"='Laporan bulanan'!L{r}", f"=IF('Laporan bulanan'!M{r}=\"\",\"\",'Laporan bulanan'!M{r})", f"='Laporan bulanan'!G{r}")
CR0 = r_colors0 = None
for i in range(len(colors)):
    r = F0 + i
    xrow("filamen", f"='Stok filamen'!A{r}", f"='Stok filamen'!B{r}", f"='Stok filamen'!I{r}", f"={S['minfil']}", f"=IF('Stok filamen'!L{r}=\"\",\"\",'Stok filamen'!L{r})", f"='Stok filamen'!M{r}", f"=IFERROR(INDEX(Resep!$D${COLOR_ROW0}:$D${COLOR_ROW0 + len(colors) - 1},MATCH('Stok filamen'!A{r},Resep!$B${COLOR_ROW0}:$B${COLOR_ROW0 + len(colors) - 1},0)),\"\")", f"='Stok filamen'!K{r}")
for i in range(len(bahan)):
    r = B0 + i
    xrow("bahan", f"='Stok bahan'!A{r}", f"='Stok bahan'!I{r}", f"='Stok bahan'!J{r}", f"='Stok bahan'!K{r}", f"='Stok bahan'!B{r}")
for i in range(J0, J1 + 30):
    xrow("jadi", f"=IF('Stok bagian jadi'!A{i}=\"\",\"\",'Stok bagian jadi'!D{i})", f"='Stok bagian jadi'!A{i}", f"='Stok bagian jadi'!B{i}", f"='Stok bagian jadi'!C{i}", f"='Stok bagian jadi'!E{i}", f"='Stok bagian jadi'!F{i}", f"='Stok bagian jadi'!G{i}")
for n in range(1, 41):
    def pick(col):
        return f"=IFERROR(INDEX({PES(col)},MATCH({n},{PES('AP')},0)),\"\")"
    xrow("aktif", pick("A"), pick("C"), f"=IFERROR(TEXT(INDEX({PES('B')},MATCH({n},{PES('AP')},0)),\"yyyy-mm-dd\"),\"\")", f"=IFERROR(IF(INDEX({PES('L')},MATCH({n},{PES('AP')},0))=\"\",\"\",TEXT(INDEX({PES('L')},MATCH({n},{PES('AP')},0)),\"yyyy-mm-dd\")),\"\")", pick("T"), pick("F"), pick("H"))
for r in range(2, xr):
    ws_x.cell(row=r, column=2).fill = fill_calc
widths(ws_x, [10, 22, 16, 14, 14, 14, 12, 12, 12])
ws_x.freeze_panes = "A2"

# urutan tab
order = ["Dashboard", "Pesanan", "Stok filamen", "Stok bahan", "Stok bagian jadi", "Mutasi stok", "Kas", "Laporan bulanan", "Rutinitas", "Resep", "Pengaturan", "Panduan", "Data dasbor"]
wb._sheets = [wb[n] for n in order]
wb.remove(wb["Sheet"]) if "Sheet" in wb.sheetnames else None
for ws in wb.worksheets:
    for row in ws.iter_rows():
        for c in row:
            if c.font is None or c.font.name != FONT:
                c.font = Font(name=FONT, size=c.font.size or 10, bold=c.font.bold, italic=c.font.italic, color=c.font.color)
wb["Dashboard"].sheet_properties.tabColor = "F2A33A"
wb["Pesanan"].sheet_properties.tabColor = "9C5730"
for n in ("Stok filamen", "Stok bahan", "Stok bagian jadi", "Mutasi stok"): wb[n].sheet_properties.tabColor = "3DB4DE"
wb["Kas"].sheet_properties.tabColor = "4F6B45"
wb["Data dasbor"].sheet_properties.tabColor = "8A7A68"
wb.save(OUT)
print("ok", OUT)
