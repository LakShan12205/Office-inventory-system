import createError from "http-errors";
import { env } from "../config/env.js";

const INVOICE_BUCKET = "asset-invoices";

export type UploadedInvoiceMetadata = {
  invoiceFileName: string;
  invoiceFileUrl: string;
  invoiceFileType: string;
  invoiceFileSize: number;
};

function ensureSupabaseStorageConfigured() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw createError(500, "Supabase storage is not configured.");
  }
}

function sanitizeInvoiceName(fileName: string) {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "invoice";
}

function ensurePdfFileName(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

function buildPublicInvoiceUrl(path: string) {
  return `${env.SUPABASE_URL}/storage/v1/object/public/${INVOICE_BUCKET}/${path}`;
}

export async function uploadInvoiceToSupabase(file: Express.Multer.File) {
  ensureSupabaseStorageConfigured();
  const supabaseUrl = env.SUPABASE_URL as string;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY as string;

  const normalizedFileName = ensurePdfFileName(file.originalname);
  const uploadPath = `${Date.now()}-${sanitizeInvoiceName(normalizedFileName)}.pdf`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${INVOICE_BUCKET}/${uploadPath}`;

  console.log("Supabase bucket name:", INVOICE_BUCKET);
  console.log("upload path:", uploadPath);
  const fileBytes = new Uint8Array(file.buffer);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": file.mimetype || "application/pdf",
      "x-upsert": "false"
    },
    body: new Blob([fileBytes], { type: file.mimetype || "application/pdf" })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Supabase upload error message:", errorText);
    throw createError(500, "Invoice upload failed. Please try again.");
  }

  const publicUrl = buildPublicInvoiceUrl(uploadPath);
  console.log("Supabase public URL:", publicUrl);

  return {
    invoiceFileName: normalizedFileName,
    invoiceFileUrl: publicUrl,
    invoiceFileType: file.mimetype || "application/pdf",
    invoiceFileSize: file.size
  } satisfies UploadedInvoiceMetadata;
}
