"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import QrScanner from "qr-scanner";
import { QrCode, ArrowLeft, CheckCircle, XCircle, Camera, Clock, Play, Square } from "lucide-react";
import { format } from "date-fns";

export default function EventScanningPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualTicketCode, setManualTicketCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [scannerError, setScannerError] = useState<string>("");
  const [lastScannedCode, setLastScannedCode] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const stats = useQuery(api.scanning.queries.getEventScanStats, { eventId: eventId as any });
  const recentScans = useQuery(api.scanning.queries.getRecentScans, {
    eventId: eventId as any,
    limit: 10,
  });
  const scanTicket = useMutation(api.scanning.mutations.scanTicket);

  const processTicket = async (ticketCode: string) => {
    // Prevent scanning the same code multiple times in a row
    if (ticketCode === lastScannedCode) return;

    setLastScannedCode(ticketCode);
    setIsProcessing(true);

    try {
      const result = await scanTicket({
        ticketCode: ticketCode.trim(),
        eventId: eventId as any,
      });

      setLastScanResult(result);

      // Auto-clear after 3 seconds, then ready for next scan
      setTimeout(() => {
        setLastScanResult(null);
        setLastScannedCode(""); // Allow re-scanning after flash clears
      }, 3000);
    } catch (error) {
      console.error("Scan error:", error);
      setLastScanResult({
        success: false,
        error: "SCAN_ERROR",
        message: "Failed to process ticket. Please try again.",
      });
      setTimeout(() => {
        setLastScanResult(null);
        setLastScannedCode("");
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanner = async () => {
    if (!videoRef.current || scannerRef.current) return;

    setIsStarting(true);
    setScannerError("");

    try {
      // Set worker path for Next.js
      QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js";

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();

      if (!hasCamera) {
        throw new Error("No camera detected on this device");
      }

      // List available cameras
      const cameras = await QrScanner.listCameras(true);

      // Set video element attributes before initializing scanner
      if (videoRef.current) {
        videoRef.current.setAttribute("autoplay", "");
        videoRef.current.setAttribute("muted", "");
        videoRef.current.setAttribute("playsinline", "");
      }

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {

          // Extract ticket code from URL or use directly
          let ticketCode = result.data;
          if (result.data.includes("/ticket/")) {
            const parts = result.data.split("/ticket/");
            ticketCode = parts[1];
          }

          // Scanner keeps running for continuous scanning
          processTicket(ticketCode);
        },
        {
          onDecodeError: (error) => {
            // Don't log every frame decode error, too noisy
            // console.log("Decode error:", error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: "environment",
          maxScansPerSecond: 5,
        }
      );


      await scanner.start();


      scannerRef.current = scanner;

      // Expose scanner to window for debugging
      if (typeof window !== "undefined") {
        (window as any).scanner = scanner;
      }

      setIsScanning(true);
      setIsStarting(false);
    } catch (error: any) {
      console.error("❌ Scanner error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Full error:", error);

      let errorMessage = "Failed to start camera.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another app.";
      } else {
        errorMessage = error?.message || errorMessage;
      }

      setScannerError(errorMessage);
      setIsScanning(false);
      setIsStarting(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const handleManualScan = async () => {
    if (!manualTicketCode.trim()) return;
    await processTicket(manualTicketCode);
    setManualTicketCode("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  if (stats === undefined) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/scan")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Event Scanner</h1>
              <p className="text-white/60 text-sm">Scan tickets to check in attendees</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-black/30 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.scanned}</div>
              <div className="text-xs text-white/60">Scanned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.remaining}</div>
              <div className="text-xs text-white/60">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-white/60">Total</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-black/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${stats.percentageScanned}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Live QR Scanner */}
          <div className="bg-primary rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <QrCode className="w-7 h-7" />
              Live QR Scanner
            </h2>

            {/* Video Preview - Simplified like demo */}
            <div className="relative bg-black rounded-xl mb-4" style={{ minHeight: "300px" }}>
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-20 h-20 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 text-sm">Camera not active</p>
                  </div>
                </div>
              )}

              <div style={{ lineHeight: 0 }}>
                <video
                  ref={videoRef}
                  id="qr-video"
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                    borderRadius: "0.75rem",
                  }}
                />
              </div>
            </div>

            {/* Scanner Controls */}
            <div className="space-y-3">
              {!isScanning ? (
                <button
                  onClick={startScanner}
                  disabled={isStarting}
                  className="w-full px-6 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-accent transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStarting ? (
                    <>
                      <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Starting Camera...
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      Start Scanner
                    </>
                  )}
                </button>
              ) : (
                <>
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
                    <p className="text-white text-sm text-center font-semibold">
                      ✓ Scanner Active - Point at QR codes to scan
                    </p>
                  </div>
                  <button
                    onClick={stopScanner}
                    className="w-full px-6 py-4 bg-red-500 text-white rounded-xl font-bold text-lg hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Square className="w-6 h-6" />
                    Stop Scanner
                  </button>
                </>
              )}

              {scannerError && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                  <p className="text-white text-sm text-center font-semibold mb-2">
                    {scannerError}
                  </p>
                  <p className="text-white/80 text-xs text-center">
                    Make sure you're using HTTPS and have granted camera permissions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-primary rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Or Enter Code Manually
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={manualTicketCode}
                onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleManualScan()}
                placeholder="TKT-XXXXXXXX"
                className="w-full px-4 py-3 text-center text-xl font-mono font-bold bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-white/50 uppercase"
                disabled={isProcessing}
              />
              <button
                onClick={handleManualScan}
                disabled={!manualTicketCode.trim() || isProcessing}
                className="w-full px-6 py-3 bg-white text-primary rounded-lg font-bold hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Checking..." : "Check In"}
              </button>
            </div>
          </div>

          {/* Full-Screen Scan Result Flash */}
          {lastScanResult && (
            <div
              className={`fixed inset-0 z-50 flex items-center justify-center animate-in fade-in ${
                lastScanResult.success ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <div className="text-center px-6 max-w-md">
                {lastScanResult.success ? (
                  <CheckCircle className="w-32 h-32 text-white mx-auto mb-6 animate-in zoom-in" />
                ) : (
                  <XCircle className="w-32 h-32 text-white mx-auto mb-6 animate-in zoom-in" />
                )}
                <h3 className="text-4xl font-bold text-white mb-4">
                  {lastScanResult.success ? "✓ Valid Ticket!" : "✗ Invalid"}
                </h3>
                <p className="text-white text-xl mb-6">{lastScanResult.message}</p>
                {lastScanResult.ticket && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white space-y-2">
                    {lastScanResult.ticket.attendeeName && (
                      <p className="text-2xl font-bold">{lastScanResult.ticket.attendeeName}</p>
                    )}
                    {lastScanResult.ticket.tierName && (
                      <p className="text-lg">{lastScanResult.ticket.tierName}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Scans */}
          {recentScans && recentScans.length > 0 && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Scans
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentScans.map((scan, index) => (
                  <div key={index} className="bg-black/50 rounded p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-medium">{scan.attendeeName}</div>
                      <div className="text-white/60 text-xs">
                        {scan.scannedAt && format(scan.scannedAt, "h:mm a")}
                      </div>
                    </div>
                    <div className="text-white/40 text-xs mt-1">{scan.tierName}</div>
                    {scan.soldByStaffName && (
                      <div className="text-primary/80 text-xs mt-1 flex items-center gap-1">
                        <span>👤</span>
                        Sold by: {scan.soldByStaffName}
                        {scan.paymentMethod && scan.paymentMethod !== "ONLINE" && (
                          <span className="ml-2 px-2 py-0.5 bg-primary/20 rounded text-xs">
                            {scan.paymentMethod}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
