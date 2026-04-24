import React, { useState, useRef } from "react";
import { FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/src/lib/auth";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";

interface MappingConfig {
  [key: string]: string;
}

interface BulkImportButtonProps {
  endpoint: string;
  onSuccess: () => void;
  mapping: MappingConfig;
  label?: string;
}

export default function BulkImportButton({ endpoint, onSuccess, mapping, label = "Import Excel" }: BulkImportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) {
        throw new Error("The uploaded file is empty.");
      }

      // Map columns and filter out empty rows
      const mappedData = jsonData.reduce((acc: any[], row: any) => {
        const newRow: any = {};
        let hasData = false;

        Object.entries(mapping).forEach(([excelKey, backendKey]) => {
          // Find the key in the JSON row even if it's slightly different (case-insensitive, trim, or contains)
          const actualKey = Object.keys(row).find(k => {
            const normalizedK = k.toLowerCase().trim();
            const normalizedExcelKey = excelKey.toLowerCase().trim();
            return normalizedK === normalizedExcelKey || 
                   normalizedK.includes(normalizedExcelKey) || 
                   normalizedExcelKey.includes(normalizedK);
          });

          if (actualKey !== undefined && row[actualKey] !== null && row[actualKey] !== "") {
            newRow[backendKey] = row[actualKey];
            hasData = true;
          }
        });

        // Only add if the row has some data
        if (hasData) {
          acc.push(newRow);
        }
        return acc;
      }, []);

      if (mappedData.length === 0) {
        throw new Error("No valid data found mapping to the expected columns.");
      }

      // Send to backend
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(mappedData)
      });

      if (res.ok) {
        setStatus("success");
        setTimeout(() => {
          setStatus("idle");
          onSuccess();
        }, 2000);
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed to import data.");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        disabled={loading}
      />
      
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="rounded-xl border-border bg-card font-bold relative overflow-hidden"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <FileUp className="w-4 h-4 mr-2" />
        )}
        {label}
        
        {loading && (
          <motion.div 
            layoutId="loading-bar"
            className="absolute bottom-0 left-0 h-1 bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, ease: "linear" }}
          />
        )}
      </Button>

      <AnimatePresence>
        {status === "success" && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 p-3 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4" />
            Import successful!
          </motion.div>
        )}

        {status === "error" && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 p-3 bg-red-500 text-white rounded-xl shadow-lg flex flex-col gap-1 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Import failed
            </div>
            <p className="font-normal opacity-90 truncate">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
