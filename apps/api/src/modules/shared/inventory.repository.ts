import { env } from "../../config/env.js";
import * as dbService from "./inventory.service.js";
import * as mockService from "./mock-inventory.service.js";

export const inventoryRepository = env.USE_MOCK_DATA ? mockService : dbService;
