import { getClientWithRetry } from "./mongodb";
import {
  StateDeliveryFee,
  CreateStateDeliveryFeeRequest,
  UpdateStateDeliveryFeeRequest,
} from "@/models/state-delivery";
import { cacheService } from "./cache-service";
import { states } from "@/data/states";

export class StateDeliveryService {
  private static instance: StateDeliveryService;
  private collectionName = "stateDeliveryFees";

  private constructor() {}

  static getInstance(): StateDeliveryService {
    if (!StateDeliveryService.instance) {
      StateDeliveryService.instance = new StateDeliveryService();
    }
    return StateDeliveryService.instance;
  }

  /**
   * Get delivery fee for a specific state
   */
  async getDeliveryFee(state: string): Promise<number> {
    try {
      // Try cache first
      const cachedFee = await cacheService.getDeliveryFeeCache(state);

      if (cachedFee !== null) {
        return cachedFee as number;
      }

      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const stateDelivery = await collection.findOne({
        state: { $regex: new RegExp(`^${state}$`, "i") },
        isActive: true,
      });

      const deliveryFee = stateDelivery?.deliveryFee || 0;

      // Cache the result for 1 hour
      await cacheService.setDeliveryFeeCache(state, deliveryFee, 3600);

      return deliveryFee;
    } catch (error) {
      console.error("Error getting delivery fee for state:", state, error);
      throw new Error(
        `Failed to get delivery fee for state '${state}': ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get all state delivery fees
   */
  async getAllStateDeliveryFees(): Promise<StateDeliveryFee[]> {
    try {
      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const fees = await collection.find({}).sort({ state: 1 }).toArray();
      return fees as StateDeliveryFee[];
    } catch (error) {
      console.error("Error getting all state delivery fees:", error);
      return [];
    }
  }

  /**
   * Create or update state delivery fee
   */
  async upsertStateDeliveryFee(
    data: CreateStateDeliveryFeeRequest
  ): Promise<StateDeliveryFee | null> {
    try {
      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const now = new Date();
      const stateDeliveryFee: Partial<StateDeliveryFee> = {
        state: data.state,
        deliveryFee: data.deliveryFee,
        isActive: data.isActive ?? true,
        updatedAt: now,
      };

      const result = await collection.findOneAndUpdate(
        { state: { $regex: new RegExp(`^${data.state}$`, "i") } },
        {
          $set: stateDeliveryFee,
          $setOnInsert: { createdAt: now },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      // Clear cache for this state
      await cacheService.clearDeliveryFeeCache(data.state);

      return result as StateDeliveryFee;
    } catch (error) {
      console.error("Error upserting state delivery fee:", error);
      return null;
    }
  }

  /**
   * Update state delivery fee
   */
  async updateStateDeliveryFee(
    state: string,
    data: UpdateStateDeliveryFeeRequest
  ): Promise<StateDeliveryFee | null> {
    try {
      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const updateData: Partial<StateDeliveryFee> = {
        updatedAt: new Date(),
      };

      if (data.deliveryFee !== undefined) {
        updateData.deliveryFee = data.deliveryFee;
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      const result = await collection.findOneAndUpdate(
        { state: { $regex: new RegExp(`^${state}$`, "i") } },
        { $set: updateData },
        { returnDocument: "after" }
      );

      if (result) {
        // Clear cache for this state
        await cacheService.clearDeliveryFeeCache(state);
      }

      return result as StateDeliveryFee;
    } catch (error) {
      console.error("Error updating state delivery fee:", error);
      return null;
    }
  }

  /**
   * Delete state delivery fee
   */
  async deleteStateDeliveryFee(state: string): Promise<boolean> {
    try {
      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      const result = await collection.deleteOne({
        state: { $regex: new RegExp(`^${state}$`, "i") },
      });

      if (result.deletedCount > 0) {
        // Clear cache for this state
        await cacheService.clearDeliveryFeeCache(state);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting state delivery fee:", error);
      return false;
    }
  }

  /**
   * Initialize default delivery fees for all states
   */
  async initializeDefaultFees(): Promise<void> {
    try {
      const client = await getClientWithRetry();
      const db = client.db();
      const collection = db.collection(this.collectionName);

      // Get existing fees
      const existingFees = await collection.find({}).toArray();
      const existingStates = existingFees.map((fee) => fee.state.toLowerCase());

      // Add default fees for states that don't have them
      const defaultFee = 1000; // Default 1000 NGN
      const statesToAdd = states.filter(
        (state) => !existingStates.includes(state.toLowerCase())
      );

      if (statesToAdd.length > 0) {
        const now = new Date();
        const defaultFees = statesToAdd.map((state) => ({
          state,
          deliveryFee: defaultFee,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }));

        await collection.insertMany(defaultFees);
        console.log(
          `Initialized default delivery fees for ${statesToAdd.length} states`
        );
      }
    } catch (error) {
      console.error("Error initializing default delivery fees:", error);
    }
  }

  /**
   * Get delivery fee with validation
   */
  async getValidatedDeliveryFee(
    state: string
  ): Promise<{ fee: number; isValid: boolean }> {
    if (!state || typeof state !== "string") {
      return { fee: 0, isValid: false };
    }

    try {
      const fee = await this.getDeliveryFee(state);
      return { fee, isValid: true };
    } catch (error) {
      console.error(
        "Error getting validated delivery fee for state:",
        state,
        error
      );
      return { fee: 0, isValid: false };
    }
  }
}

export const stateDeliveryService = StateDeliveryService.getInstance();
