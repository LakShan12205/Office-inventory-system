export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

export type AssetType = {
  id: string;
  code: string;
  name: string;
};

export type WorkstationListItem = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  notes?: string | null;
  _count: {
    assets: number;
    repairs: number;
  };
  assets: Array<{
    id: string;
    assignmentType: string;
    asset: {
      id: string;
      assetCode: string;
      status: string;
      assetType: {
        name: string;
      };
    };
  }>;
};

export type AlertRecord = {
  id: string;
  alertType: string;
  message: string;
  alertDate: string;
  status: string;
  priority: string;
  workstation?: { id: string; code: string; name: string } | null;
  asset?: { id: string; assetCode: string; assetType?: { name: string } } | null;
};

export type RepairRecord = {
  id: string;
  status: string;
  reportedDate: string;
  sentDate?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  faultDescription: string;
  sentTo?: string | null;
  diagnosis?: string | null;
  repairAction?: string | null;
  partsChanged?: string | null;
  cost?: string | number | null;
  handledBy?: string | null;
  notes?: string | null;
  workstation: { id: string; code: string; name: string };
  asset: {
    id: string;
    assetCode: string;
    brand: string;
    model: string;
    assetType: { name: string };
  };
  replacementLog?: {
    id: string;
    status: string;
    replacementDate: string;
    replacementReturnDate?: string | null;
    originalAsset: { assetCode: string };
    replacementAsset: { id: string; assetCode: string };
  } | null;
};

export type AssetRecord = {
  id: string;
  assetCode: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  warrantyExpiryDate?: string | null;
  status: string;
  currentLocation?: string | null;
  currentLocationDisplay?: string | null;
  displayLocation?: string | null;
  notes?: string | null;
  assetScope?: string | null;
  flow?: string | null;
  side?: string | null;
  generalLocation?: string | null;
  specificLocationNotes?: string | null;
  workstationCode?: string | null;
  assetType: {
    id: string;
    name: string;
    code: string;
  };
  workstationAssignments: Array<{
    id: string;
    assignmentType: string;
    assignedDate: string;
    unassignedDate?: string | null;
    isActive: boolean;
    workstation: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  repairs?: RepairRecord[];
  alerts?: AlertRecord[];
};

export type WorkstationDetail = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  notes?: string | null;
  assets: Array<{
    id: string;
    assignmentType: string;
    assignedDate: string;
    notes?: string | null;
    asset: AssetRecord;
  }>;
  repairs: RepairRecord[];
  alerts: AlertRecord[];
};

export type ReplacementRecord = {
  id: string;
  flowCode?: string;
  workstationCode?: string;
  deviceType?: string;
  replacementType: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  status: string;
  inventoryType?: string;
  fromLocation?: string | null;
  toLocation?: string | null;
  assignedUser?: string | null;
  reason?: string | null;
  isReturned?: boolean;
  returnDate?: string | null;
  notes?: string | null;
  workstation: { id: string; code: string; name: string };
  originalAsset: {
    id: string;
    assetCode: string;
    serialNumber?: string;
    currentLocation?: string | null;
    status?: string;
  };
  replacementAsset: {
    id: string;
    assetCode: string;
    serialNumber?: string;
    currentLocation?: string | null;
    status?: string;
  };
  repair: { id: string; status: string; expectedReturnDate?: string | null; actualReturnDate?: string | null };
};

export type DashboardData = {
  stats: {
    totalWorkstations: number;
    totalAssets: number;
    machinesInRepair: number;
    activeTemporaryReplacements: number;
    returnedReplacements: number;
    overdueRepairs: number;
    followUpAlerts: number;
  };
  latestAlerts: AlertRecord[];
  recentRepairs: RepairRecord[];
};
