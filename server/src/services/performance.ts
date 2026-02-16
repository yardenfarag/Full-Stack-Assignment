/**
 * Performance Service
 * 
 * Handles retrieval and aggregation of advertising performance data from insights.
 * Groups data by campaign or ad level, calculates KPIs (CPM, CTR, CPC, ROAS, etc.) from raw metrics,
 * and applies filtering, sorting, and pagination. Supports weighted averaging for campaign-level
 * aggregation to ensure high-spend ads have appropriate influence on final metrics.
 */

import { PrismaClient } from "@prisma/client";

 // Request parameters for performance data retrieval.
 // Defines grouping level (campaign or ad), filters, pagination, sorting, and requested columns.

interface PerformanceRequest {
  grouping: "campaign" | "ad";
  filters: {
    dateRange: {
      from: string;
      to: string;
    };
    status?: "active" | "inactive";
    campaignObjective: string;
    search?: string;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  sorting?: {
    field: string;
    direction: "asc" | "desc";
  };
  columns: string[];
}


 // Daily Key Performance Indicators calculated from raw metrics.
 // Contains all calculated KPIs (CPM, CTR, CPC, ROAS, etc.) for a single day.

interface DailyKPI {
  date: string;
  cpm: number;
  cpr: number;
  ctr: number;
  cpc: number;
  view_rate: number;
  cpv: number;
  cpl: number;
  lead_conv_rate: number;
  roas: number;
  cpa: number;
}

 // Calculates all KPIs for a single day from raw metrics.
 // Takes impressions, clicks, spend, conversions, etc. and computes derived metrics like CPM, CTR, CPC, ROAS.

function calculateDailyKPIs(
  impressions: number,
  clicks: number,
  spend: number,
  conversions: number,
  reach: number,
  video_views: number,
  leads: number,
  conversion_value: number
): DailyKPI {
  return {
    date: "",
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpr: reach > 0 ? (spend / reach) * 1000 : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    view_rate: impressions > 0 ? (video_views / impressions) * 100 : 0,
    cpv: video_views > 0 ? spend / video_views : 0,
    cpl: leads > 0 ? spend / leads : 0,
    lead_conv_rate: clicks > 0 ? (leads / clicks) * 100 : 0,
    roas: spend > 0 ? conversion_value / spend : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
  };
}

 // Averages multiple daily KPIs into a single aggregated KPI set.
 // Used for ad-level aggregation where we average KPIs across all days in the date range.

function averageDailyKPIs(kpis: DailyKPI[]): DailyKPI {
  if (kpis.length === 0) {
    return {
      date: "",
      cpm: 0,
      cpr: 0,
      ctr: 0,
      cpc: 0,
      view_rate: 0,
      cpv: 0,
      cpl: 0,
      lead_conv_rate: 0,
      roas: 0,
      cpa: 0,
    };
  }

  return {
    date: "",
    cpm: kpis.reduce((sum, k) => sum + k.cpm, 0) / kpis.length,
    cpr: kpis.reduce((sum, k) => sum + k.cpr, 0) / kpis.length,
    ctr: kpis.reduce((sum, k) => sum + k.ctr, 0) / kpis.length,
    cpc: kpis.reduce((sum, k) => sum + k.cpc, 0) / kpis.length,
    view_rate: kpis.reduce((sum, k) => sum + k.view_rate, 0) / kpis.length,
    cpv: kpis.reduce((sum, k) => sum + k.cpv, 0) / kpis.length,
    cpl: kpis.reduce((sum, k) => sum + k.cpl, 0) / kpis.length,
    lead_conv_rate:
      kpis.reduce((sum, k) => sum + k.lead_conv_rate, 0) / kpis.length,
    roas: kpis.reduce((sum, k) => sum + k.roas, 0) / kpis.length,
    cpa: kpis.reduce((sum, k) => sum + k.cpa, 0) / kpis.length,
  };
}

 // Calculates weighted average KPIs across multiple ads, weighted by each ad's total spend.
 // Used for campaign-level aggregation to ensure high-spend ads have more influence on the final KPIs.

function weightedAverageKPIs(
  adKPIs: Array<{ kpis: DailyKPI; spend: number }>
): DailyKPI {
  const totalSpend = adKPIs.reduce((sum, ad) => sum + ad.spend, 0);
  if (totalSpend === 0) {
    return {
      date: "",
      cpm: 0,
      cpr: 0,
      ctr: 0,
      cpc: 0,
      view_rate: 0,
      cpv: 0,
      cpl: 0,
      lead_conv_rate: 0,
      roas: 0,
      cpa: 0,
    };
  }

  return {
    date: "",
    cpm:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpm * ad.spend, 0) / totalSpend,
    cpr:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpr * ad.spend, 0) / totalSpend,
    ctr:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.ctr * ad.spend, 0) / totalSpend,
    cpc:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpc * ad.spend, 0) / totalSpend,
    view_rate:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.view_rate * ad.spend, 0) /
      totalSpend,
    cpv:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpv * ad.spend, 0) / totalSpend,
    cpl:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpl * ad.spend, 0) / totalSpend,
    lead_conv_rate:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.lead_conv_rate * ad.spend, 0) /
      totalSpend,
    roas:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.roas * ad.spend, 0) / totalSpend,
    cpa:
      adKPIs.reduce((sum, ad) => sum + ad.kpis.cpa * ad.spend, 0) / totalSpend,
  };
}

 // Service for retrieving and aggregating performance data.
 // Handles querying insights, grouping by campaign or ad, calculating KPIs, and applying filters, sorting, and pagination.

export class PerformanceService {
  constructor(private prisma: PrismaClient) {}

  async getPerformance(request: PerformanceRequest) {
    const { grouping, filters, pagination, sorting, columns } = request;

    // Build base query
    // When search is used, we need to restructure to ensure campaign_objective is always applied
    const queryFilters: any = {
      date: {
        gte: filters.dateRange.from,
        lte: filters.dateRange.to,
      },
    };

    // Handle search - can match campaign name or ad name
    // Must include campaign_objective in each OR branch to ensure it's always applied
    if (filters.search) {
      queryFilters.OR = [
        {
          campaign: {
            campaign_objective: filters.campaignObjective,
            campaign_name: {
              contains: filters.search,
              mode: "insensitive",
            },
            ...(filters.status && grouping === "campaign" && { status: filters.status }),
          },
        },
        {
          campaign: {
            campaign_objective: filters.campaignObjective,
            ...(filters.status && grouping === "campaign" && { status: filters.status }),
          },
          ad: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
            ...(filters.status && grouping === "ad" && { status: filters.status }),
          },
        },
      ];
    } else {
      // No search - use simpler structure
      queryFilters.campaign = {
        campaign_objective: filters.campaignObjective,
        ...(filters.status && grouping === "campaign" && { status: filters.status }),
      };

      // Handle ad-level status filter when not searching
      if (filters.status && grouping === "ad") {
        queryFilters.ad = {
          status: filters.status,
        };
      }
    }

    let query = this.prisma.insight.findMany({
      where: queryFilters,
      include: {
        ad: {
          include: {
            campaign: true,
            creative: true,
          },
        },
        campaign: true,
      },
    });

    const insights = await query;

    // Group and aggregate
    const grouped = new Map<string, any>();

    for (const insight of insights) {
      const key =
        grouping === "campaign"
          ? insight.campaign_id
          : `${insight.ad_id}_${insight.campaign_id}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          campaign_id: insight.campaign_id,
          campaign_name: insight.campaign.campaign_name,
          campaign_objective: insight.campaign.campaign_objective,
          status:
            grouping === "campaign"
              ? insight.campaign.status
              : insight.ad.status,
          ...(grouping === "ad" && {
            ad_id: insight.ad_id,
            ad_name: insight.ad.name,
            creative_type: insight.ad.creative.creative_type,
            thumbnail_url: insight.ad.creative.thumbnail_url,
          }),
          dailyData: [] as Array<{
            date: string;
            ad_id: string;
            impressions: number;
            clicks: number;
            spend: number;
            conversions: number;
            reach: number;
            video_views: number;
            leads: number;
            conversion_value: number;
          }>,
        });
      }

      const group = grouped.get(key);
      group.dailyData.push({
        date: insight.date,
        ad_id: insight.ad_id,
        impressions: insight.impressions,
        clicks: insight.clicks,
        spend: insight.spend,
        conversions: insight.conversions,
        reach: insight.reach,
        video_views: insight.video_views,
        leads: insight.leads,
        conversion_value: insight.conversion_value,
      });
    }

    // Aggregate metrics and calculate KPIs
    const results = Array.from(grouped.values()).map((group) => {
      // Sum metrics
      const totals = group.dailyData.reduce(
        (acc: any, day: any) => ({
          impressions: acc.impressions + day.impressions,
          clicks: acc.clicks + day.clicks,
          spend: acc.spend + day.spend,
          conversions: acc.conversions + day.conversions,
          reach: acc.reach + day.reach,
          video_views: acc.video_views + day.video_views,
          leads: acc.leads + day.leads,
          conversion_value: acc.conversion_value + day.conversion_value,
        }),
        {
          impressions: 0,
          clicks: 0,
          spend: 0,
          conversions: 0,
          reach: 0,
          video_views: 0,
          leads: 0,
          conversion_value: 0,
        }
      );

      // Calculate daily KPIs
      const dailyKPIs = group.dailyData.map((day: any) =>
        calculateDailyKPIs(
          day.impressions,
          day.clicks,
          day.spend,
          day.conversions,
          day.reach,
          day.video_views,
          day.leads,
          day.conversion_value
        )
      );

      let kpis: DailyKPI;

      if (grouping === "ad") {
        // Ad level: average daily KPIs
        kpis = averageDailyKPIs(dailyKPIs);
      } else {
        // Campaign level: weighted average across ads
        // First, get per-ad KPIs
        const adGroups = new Map<string, any>();
        for (const day of group.dailyData) {
          const adKey = day.ad_id;
          if (!adGroups.has(adKey)) {
            adGroups.set(adKey, []);
          }
          adGroups.get(adKey).push(day);
        }

        const adKPIs = Array.from(adGroups.entries()).map(([adId, adDays]) => {
          // Calculate daily KPIs for this ad
          const adDailyKPIs = adDays.map((day: any) =>
            calculateDailyKPIs(
              day.impressions,
              day.clicks,
              day.spend,
              day.conversions,
              day.reach,
              day.video_views,
              day.leads,
              day.conversion_value
            )
          );

          // Average the daily KPIs for this ad
          const avgKPIs = averageDailyKPIs(adDailyKPIs);

          // Calculate total spend for weighting
          const totalSpend = adDays.reduce((sum: number, day: any) => sum + day.spend, 0);

          return {
            kpis: avgKPIs,
            spend: totalSpend,
          };
        });

        kpis = weightedAverageKPIs(adKPIs);
      }

      // Build result object with only requested columns
      const result: Record<string, any> = {};

      for (const col of columns) {
        if (col === "campaign_name") result[col] = group.campaign_name;
        else if (col === "campaign_objective")
          result[col] = group.campaign_objective;
        else if (col === "status") result[col] = group.status;
        else if (col === "ad_name" && grouping === "ad")
          result[col] = group.ad_name;
        else if (col === "creative_type" && grouping === "ad")
          result[col] = group.creative_type;
        else if (col === "thumbnail_url" && grouping === "ad")
          result[col] = group.thumbnail_url;
        else if (col === "impressions") result[col] = totals.impressions;
        else if (col === "clicks") result[col] = totals.clicks;
        else if (col === "spend") result[col] = totals.spend;
        else if (col === "conversions") result[col] = totals.conversions;
        else if (col === "reach") result[col] = totals.reach;
        else if (col === "video_views") result[col] = totals.video_views;
        else if (col === "leads") result[col] = totals.leads;
        else if (col === "conversion_value") result[col] = totals.conversion_value;
        else if (col === "cpm") result[col] = kpis.cpm;
        else if (col === "cpr") result[col] = kpis.cpr;
        else if (col === "ctr") result[col] = kpis.ctr;
        else if (col === "cpc") result[col] = kpis.cpc;
        else if (col === "view_rate") result[col] = kpis.view_rate;
        else if (col === "cpv") result[col] = kpis.cpv;
        else if (col === "cpl") result[col] = kpis.cpl;
        else if (col === "lead_conv_rate") result[col] = kpis.lead_conv_rate;
        else if (col === "roas") result[col] = kpis.roas;
        else if (col === "cpa") result[col] = kpis.cpa;
      }

      return result;
    });

    // Apply sorting
    if (sorting) {
      results.sort((a, b) => {
        const aVal = a[sorting.field] ?? 0;
        const bVal = b[sorting.field] ?? 0;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sorting.direction === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;

        return sorting.direction === "asc" ? numA - numB : numB - numA;
      });
    }

    // Apply pagination
    const totalRows = results.length;
    const totalPages = Math.ceil(totalRows / pagination.pageSize);
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    const paginatedResults = results.slice(start, end);

    return {
      data: paginatedResults,
      meta: {
        totalRows,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
      },
    };
  }
}

