import { Router, type Request, type Response } from "express";
import createError from "http-errors";
import multer, { MulterError } from "multer";
import { requireAdmin } from "../../middleware/auth.js";
import {
  uploadInvoiceToSupabase,
  type UploadedInvoiceMetadata
} from "../../lib/invoice-storage.js";
import { assetPayloadSchema, assetQuerySchema } from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const assetsRouter = Router();

type CreateAssetPayload = Parameters<typeof inventoryService.createAsset>[0];
type UpdateAssetPayload = Parameters<typeof inventoryService.updateAsset>[1];
type AssetInput = ReturnType<typeof assetPayloadSchema.parse>;

const MAX_INVOICE_FILE_SIZE = 10 * 1024 * 1024;

const invoiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_INVOICE_FILE_SIZE
  },
  fileFilter(_req, file, callback) {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      callback(createError(400, "Attached invoice must be a PDF file."));
      return;
    }

    callback(null, true);
  }
});

function getFallbackAssignment(input: AssetInput) {
  return input.currentLocation && /^WS-\d{2}$/i.test(input.currentLocation)
    ? {
        workstationCode: input.currentLocation,
        status: "ACTIVE" as const
      }
    : undefined;
}

function applyInvoiceMetadata(
  input: AssetInput,
  uploadedInvoice?: UploadedInvoiceMetadata
) {
  if (!uploadedInvoice) {
    return {
      invoiceFileName: input.invoiceFileName,
      invoiceFileUrl: input.invoiceFileUrl,
      invoiceFileType: input.invoiceFileType,
      invoiceFileSize: input.invoiceFileSize
    };
  }

  return uploadedInvoice;
}

function toCreateAssetPayload(
  input: AssetInput,
  uploadedInvoice?: UploadedInvoiceMetadata
): CreateAssetPayload {
  if (
    !input.assetCode ||
    !input.assetTypeId ||
    !input.brand ||
    !input.model ||
    !input.serialNumber ||
    !input.status
  ) {
    throw new Error("Missing required asset fields");
  }

  const invoiceMetadata = applyInvoiceMetadata(input, uploadedInvoice);

  return {
    assetCode: input.assetCode,
    assetTypeId: input.assetTypeId,
    brand: input.brand,
    model: input.model,
    serialNumber: input.serialNumber,
    specification: input.specification,
    purchaseDate: input.purchaseDate,
    warrantyExpiryDate: input.warrantyExpiryDate,
    status: input.status,
    assetScope: input.assetScope,
    currentLocation: input.currentLocation,
    invoiceFileName: invoiceMetadata.invoiceFileName,
    invoiceFileUrl: invoiceMetadata.invoiceFileUrl,
    invoiceFileType: invoiceMetadata.invoiceFileType,
    invoiceFileSize: invoiceMetadata.invoiceFileSize,
    assignment: input.assignment ?? getFallbackAssignment(input),
    notes: input.notes
  };
}

function toUpdateAssetPayload(
  input: AssetInput,
  uploadedInvoice?: UploadedInvoiceMetadata
): UpdateAssetPayload {
  const invoiceMetadata = applyInvoiceMetadata(input, uploadedInvoice);

  return {
    assetCode: input.assetCode,
    assetTypeId: input.assetTypeId,
    brand: input.brand,
    model: input.model,
    serialNumber: input.serialNumber,
    specification: input.specification,
    purchaseDate: input.purchaseDate,
    warrantyExpiryDate: input.warrantyExpiryDate,
    status: input.status,
    assetScope: input.assetScope,
    currentLocation: input.currentLocation,
    invoiceFileName: invoiceMetadata.invoiceFileName,
    invoiceFileUrl: invoiceMetadata.invoiceFileUrl,
    invoiceFileType: invoiceMetadata.invoiceFileType,
    invoiceFileSize: invoiceMetadata.invoiceFileSize,
    assignment: input.assignment ?? getFallbackAssignment(input),
    notes: input.notes
  } as UpdateAssetPayload;
}

function runInvoiceUpload(req: Request, res: Response) {
  return new Promise<void>((resolve, reject) => {
    invoiceUpload.single("invoice")(req, res, (error) => {
      if (!error) {
        resolve();
        return;
      }

      if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
        reject(createError(400, "Attached invoice must be 10MB or smaller."));
        return;
      }

      reject(error);
    });
  });
}

function parseAssetRequestPayload(req: Request) {
  const rawPayload =
    req.is("multipart/form-data") && typeof req.body?.payload === "string"
      ? req.body.payload
      : req.body;

  try {
    const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
    return assetPayloadSchema.parse(payload);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createError(400, "Please correct the highlighted form details.");
    }

    throw error;
  }
}

function ensurePdfFileName(fileName?: string | null) {
  if (!fileName) return "invoice.pdf";
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

async function sendInvoiceFile(
  assetId: string,
  res: Response,
  disposition: "attachment" | "inline"
) {
  const asset = await inventoryService.getAssetById(assetId);

  if (!asset.invoiceFileUrl) {
    throw createError(404, "No uploaded invoice is available for this asset.");
  }

  console.log("invoiceFileUrl being fetched:", asset.invoiceFileUrl);
  if (asset.invoiceFileUrl.includes("res.cloudinary.com")) {
    throw createError(410, "Legacy Cloudinary invoice link unavailable. Please re-upload invoice.");
  }

  const invoiceResponse = await fetch(asset.invoiceFileUrl);
  console.log("invoice fetch status:", invoiceResponse.status);
  console.log("invoice response content-type:", invoiceResponse.headers.get("content-type"));

  if (invoiceResponse.status === 401) {
    throw createError(502, "Supabase invoice file is not publicly accessible.");
  }

  if (!invoiceResponse.ok) {
    throw createError(502, "Unable to download the invoice file.");
  }

  const fileBuffer = Buffer.from(await invoiceResponse.arrayBuffer());
  const fileName = ensurePdfFileName(asset.invoiceFileName);

  res.setHeader("Content-Type", asset.invoiceFileType ?? "application/pdf");
  res.setHeader("Content-Length", String(fileBuffer.byteLength));
  res.setHeader("Content-Disposition", `${disposition}; filename="${fileName.replace(/"/g, "")}"`);
  res.status(200).send(fileBuffer);
}

assetsRouter.get("/", async (req, res, next) => {
  try {
    const filters = assetQuerySchema.parse(req.query);
    const assets = await inventoryService.listAssets(filters);
    res.json(assets);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/types/all", async (_req, res, next) => {
  try {
    const assetTypes = await inventoryService.listAssetTypes();
    res.json(assetTypes);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const asset = await inventoryService.getAssetById(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:id/invoice/download", async (req, res, next) => {
  try {
    await sendInvoiceFile(req.params.id, res, "attachment");
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:id/invoice/view", async (req, res, next) => {
  try {
    await sendInvoiceFile(req.params.id, res, "inline");
  } catch (error) {
    next(error);
  }
});

assetsRouter.post("/", async (req, res, next) => {
  try {
    await runInvoiceUpload(req, res);
    console.log("file:", req.file);
    console.log("body:", req.body);
    const parsed = parseAssetRequestPayload(req);
    const uploadedInvoice = req.file ? await uploadInvoiceToSupabase(req.file) : undefined;
    const payload = toCreateAssetPayload(parsed, uploadedInvoice);
    console.log("final asset create payload invoice fields:", {
      invoiceFileName: payload.invoiceFileName,
      invoiceFileUrl: payload.invoiceFileUrl,
      invoiceFileType: payload.invoiceFileType,
      invoiceFileSize: payload.invoiceFileSize
    });
    const asset = await inventoryService.createAsset(payload);
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.put("/:id", async (req, res, next) => {
  try {
    await runInvoiceUpload(req, res);
    console.log("file:", req.file);
    console.log("body:", req.body);
    const parsed = parseAssetRequestPayload(req);
    const uploadedInvoice = req.file ? await uploadInvoiceToSupabase(req.file) : undefined;
    const payload = toUpdateAssetPayload(parsed, uploadedInvoice);
    console.log("final asset create payload invoice fields:", {
      invoiceFileName: payload.invoiceFileName,
      invoiceFileUrl: payload.invoiceFileUrl,
      invoiceFileType: payload.invoiceFileType,
      invoiceFileSize: payload.invoiceFileSize
    });
    const asset = await inventoryService.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.patch("/:id", async (req, res, next) => {
  try {
    await runInvoiceUpload(req, res);
    console.log("file:", req.file);
    console.log("body:", req.body);
    const parsed = parseAssetRequestPayload(req);
    const uploadedInvoice = req.file ? await uploadInvoiceToSupabase(req.file) : undefined;
    const payload = toUpdateAssetPayload(parsed, uploadedInvoice);
    console.log("final asset create payload invoice fields:", {
      invoiceFileName: payload.invoiceFileName,
      invoiceFileUrl: payload.invoiceFileUrl,
      invoiceFileType: payload.invoiceFileType,
      invoiceFileSize: payload.invoiceFileSize
    });
    const asset = await inventoryService.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.post("/:id/archive", async (req, res, next) => {
  try {
    const asset = await inventoryService.archiveAsset(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await inventoryService.deleteAsset(String(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

assetsRouter.delete("/", requireAdmin, async (_req, res, next) => {
  try {
    const result = await inventoryService.deleteAllRemovableAssets();
    res.json(result);
  } catch (error) {
    next(error);
  }
});
