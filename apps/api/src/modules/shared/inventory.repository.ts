import { env } from "../../config/env";
import * as dbService from "./inventory.service";
import * as mockService from "./mock-inventory.service";

export const inventoryRepository = env.USE_MOCK_DATA ? mockService : dbService;
