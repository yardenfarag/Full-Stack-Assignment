/**
 * Data Sync Service
 * 
 * Fetches advertising data (campaigns, creatives, ads, insights) from the external data server
 * and stores it in the local database. Handles pagination, retries, progress tracking, and
 * provides real-time sync status updates via callbacks for SSE streaming.
 */

import { PrismaClient } from "@prisma/client";
import { DATA_SERVER_BASE_URL } from "../config.js";

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

interface SyncProgress {
  campaigns: { fetched: number; total: number };
  ads: { fetched: number; total: number };
  creatives: { fetched: number; total: number };
  insights: { fetched: number; total: number };
  status: "idle" | "syncing" | "completed" | "error";
  error?: string;
}

class DataSyncService {
  private progress: SyncProgress = {
    campaigns: { fetched: 0, total: 0 },
    ads: { fetched: 0, total: 0 },
    creatives: { fetched: 0, total: 0 },
    insights: { fetched: 0, total: 0 },
    status: "idle",
  };

  private progressCallbacks: Set<(progress: SyncProgress) => void> = new Set();

  constructor(private prisma: PrismaClient) {}

  subscribe(callback: (progress: SyncProgress) => void) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private updateProgress(updates: Partial<SyncProgress>) {
    this.progress = { ...this.progress, ...updates };
    this.progressCallbacks.forEach((cb) => cb(this.progress));
  }

  getProgress(): SyncProgress {
    return { ...this.progress };
  }

  private async fetchWithRetry<T>(
    url: string,
    maxRetries = 5,
    retryDelay = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url);

        if (response.status === 429) {
          const body = await response.json();
          const retryAfter = body.retryAfterMs || retryDelay;
          await new Promise((resolve) => setTimeout(resolve, retryAfter));
          continue;
        }

        if (response.status === 500) {
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            continue;
          }
          throw new Error("Internal Server Error after retries");
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
    throw new Error("Max retries exceeded");
  }

  private async fetchAllPages<T>(
    endpoint: string,
    entityType: "campaigns" | "ads" | "creatives" | "insights",
    queryParams?: Record<string, string>,
    maxConcurrent = 20
  ): Promise<T[]> {
    // First, fetch page 1 to get totalPages
    const firstPageParams = new URLSearchParams({
      page: "1",
      ...queryParams,
    });
    const firstUrl = `${DATA_SERVER_BASE_URL}/${endpoint}?${firstPageParams}`;
    const firstResponse = await this.fetchWithRetry<PaginatedResponse<T>>(firstUrl);
    
    const allData: T[] = [...firstResponse.data];
    const totalPages = firstResponse.pagination.totalPages;
    const pageSize = firstResponse.pagination.pageSize;

    this.updateProgress({
      [entityType]: {
        fetched: allData.length,
        total: totalPages * pageSize,
      },
    });

    // If only one page, we're done
    if (totalPages === 1) {
      return allData;
    }

    // Fetch remaining pages in parallel batches
    const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    
    // Process in batches to avoid overwhelming the server
    let batchIndex = 0;
    for (let i = 0; i < remainingPages.length; i += maxConcurrent) {
      const batch = remainingPages.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (pageNum) => {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          ...queryParams,
        });
        const url = `${DATA_SERVER_BASE_URL}/${endpoint}?${params}`;
        return this.fetchWithRetry<PaginatedResponse<T>>(url);
      });

      const batchResults = await Promise.all(batchPromises);
      
      for (const response of batchResults) {
        allData.push(...response.data);
      }

      // Update progress after each batch (throttled to reduce overhead - update every 2 batches or on last batch)
      batchIndex++;
      if (batchIndex % 2 === 0 || i + maxConcurrent >= remainingPages.length) {
        this.updateProgress({
          [entityType]: {
            fetched: allData.length,
            total: totalPages * pageSize,
          },
        });
      }
    }

    return allData;
  }

  async syncAll(): Promise<void> {
    this.updateProgress({ status: "syncing", error: undefined });

    try {
      // Clear existing data (re-sync behavior: replace all data)
      // Use TRUNCATE for much faster deletion (PostgreSQL-specific optimization)
      // Note: TRUNCATE is faster than DELETE but requires disabling foreign key checks temporarily
      await this.prisma.$executeRawUnsafe(`
        TRUNCATE TABLE "Insight", "Ad", "Campaign", "Creative" RESTART IDENTITY CASCADE;
      `);

      // Fetch campaigns, creatives, and ads in parallel (they don't depend on each other)
      this.updateProgress({ 
        campaigns: { fetched: 0, total: 0 },
        creatives: { fetched: 0, total: 0 },
        ads: { fetched: 0, total: 0 },
      });

      const [campaigns, creatives, ads] = await Promise.all([
        this.fetchAllPages<{
          campaign_id: string;
          campaign_name: string;
          status: string;
          campaign_objective: string;
        }>("campaigns", "campaigns"),
        
        this.fetchAllPages<{
          creative_id: string;
          creative_type: string;
          thumbnail_url: string;
        }>("creatives", "creatives"),
        
        this.fetchAllPages<{
          ad_id: string;
          campaign_id: string;
          creative_id: string;
          date_start: string;
          date_end: string;
          name: string;
          description: string;
          status: string;
        }>("ads", "ads"),
      ]);

      // Store campaigns, creatives, and ads in parallel
      // Use transactions for better performance with large datasets
      await Promise.all([
        this.prisma.campaign.createMany({ 
          data: campaigns,
          skipDuplicates: true 
        }),
        this.prisma.creative.createMany({ 
          data: creatives,
          skipDuplicates: true 
        }),
        this.prisma.ad.createMany({ 
          data: ads,
          skipDuplicates: true 
        }),
      ]);

      // Fetch and store insights (depends on ads being created)
      this.updateProgress({ insights: { fetched: 0, total: 0 } });
      const insights = await this.fetchAllPages<{
        insight_id: string;
        date: string;
        ad_id: string;
        campaign_id: string;
        impressions: number;
        clicks: number;
        spend: number;
        conversions: number;
        reach: number;
        video_views: number;
        leads: number;
        conversion_value: number;
      }>("insights", "insights", undefined, 30); // Higher concurrency for insights since there are usually more

      // Batch insights into chunks for better performance with very large datasets
      // PostgreSQL can handle large inserts, but chunking helps with memory and progress tracking
      const chunkSize = 5000;
      for (let i = 0; i < insights.length; i += chunkSize) {
        const chunk = insights.slice(i, i + chunkSize);
        await this.prisma.insight.createMany({
          data: chunk,
          skipDuplicates: true,
        });
        
        // Update progress periodically during inserts
        if (i % (chunkSize * 3) === 0 || i + chunkSize >= insights.length) {
          this.updateProgress({
            insights: {
              fetched: insights.length,
              total: insights.length,
            },
          });
        }
      }

      this.updateProgress({ status: "completed" });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.updateProgress({ status: "error", error: errorMessage });
      throw error;
    }
  }
}

export { DataSyncService, SyncProgress };

