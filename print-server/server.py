import asyncio
import base64
import io
import os
import socket
import struct
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Lancet Print Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PrintTicketRequest(BaseModel):
    id: str
    name: str
    department: str
    service: str
    checkInTime: str
    estimatedWaitMinutes: int
    qrDataUrl: str | None = None


def escpos_ticket(req: PrintTicketRequest) -> bytes:
    ESC = b"\x1b"
    GS = b"\x1d"
    NUL = b"\x00"
    CR = b"\x0d"
    LF = b"\x0a"

    C = lambda: ESC + b"\x61" + b"\x01"
    L = lambda: ESC + b"\x61" + b"\x00"
    B = lambda: ESC + b"\x45" + b"\x01"
    b_ = lambda: ESC + b"\x45" + b"\x00"
    D = lambda: ESC + b"\x21" + b"\x30"
    d_ = lambda: ESC + b"\x21" + b"\x00"

    e = lambda s: s.encode("cp437", errors="replace")

    parts = []

    def a(text, prefix=b""):
        parts.append(prefix + e(text) + CR + LF)

    a("LANCET GENERAL", C() + D())
    a("HOSPITAL", C() + D())
    a("\u2605 \u2605 \u2605 TICKET \u2605 \u2605 \u2605", C() + B())
    parts.append(LF)
    a("#" + req.id, C() + B())
    parts.append(LF)

    a(f"Patient:  {req.name}", L() + B())
    a(f"Dept:     {req.department}", L())
    a(f"Service:  {req.service}", L())
    parts.append(LF)
    a(f"Check-in: {req.checkInTime}", L())
    a(f"Est wait: {req.estimatedWaitMinutes} min", L() + B())
    parts.append(LF)

    barcode_data = req.id.replace("P-", "").replace("p-", "")
    if barcode_data.isdigit():
        parts.append(GS + b"\x6b" + b"\x02" + barcode_data.encode() + NUL)
        parts.append(LF)

    a("Please keep this ticket with you.", C())
    parts.append(LF + LF)

    parts.append(GS + b"\x56" + b"\x01")

    return b"".join(parts)


@app.get("/health")
async def health():
    import win32print
    printers = [p[2] for p in win32print.EnumPrinters(2)]
    return {"status": "ok", "printers": printers, "default": win32print.GetDefaultPrinter()}


@app.post("/print-ticket")
async def print_ticket(req: PrintTicketRequest):
    import win32print

    try:
        raw = escpos_ticket(req)
        printer_name = win32print.GetDefaultPrinter()
        hprinter = win32print.OpenPrinter(printer_name)
        try:
            win32print.StartDocPrinter(hprinter, 1, ("ticket", None, "RAW"))
            win32print.StartPagePrinter(hprinter)
            win32print.WritePrinter(hprinter, raw)
            win32print.EndPagePrinter(hprinter)
            win32print.EndDocPrinter(hprinter)
        finally:
            win32print.ClosePrinter(hprinter)
        return {"status": "ok", "printer": printer_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class HealthRequest(BaseModel):
    pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PRINT_PORT", "8766"))
    print(f"Starting print server on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
