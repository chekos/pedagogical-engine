"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCodeDisplay({ url, size = 200, className = "" }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    }).catch(console.error);
  }, [url, size]);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
