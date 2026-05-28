import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const technology = searchParams.get("technology");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (technology) where.technology = technology;

    // Get all measurements with operator info
    const measurements = await db.measurement.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true, code: true } },
      },
    });

    // Group by operator
    const operatorMap = new Map<string, {
      id: string;
      name: string;
      code: string;
      measurements: typeof measurements;
    }>();

    for (const m of measurements) {
      if (!m.operator) continue;
      const key = m.operatorId!;
      if (!operatorMap.has(key)) {
        operatorMap.set(key, {
          id: m.operatorId!,
          name: m.operator.name,
          code: m.operator.code,
          measurements: [],
        });
      }
      operatorMap.get(key)!.measurements.push(m);
    }

    // Compute aggregated data per operator
    const operatorComparison = Array.from(operatorMap.values()).map((op) => {
      const ms = op.measurements;

      // Voice metrics
      const voiceMeasurements = ms.filter((m) => m.callAttempted && m.callAttempted > 0);
      const totalCallAttempted = voiceMeasurements.reduce((s, m) => s + (m.callAttempted || 0), 0);
      const totalCallSuccess = voiceMeasurements.reduce((s, m) => s + (m.callSuccess || 0), 0);
      const totalCallDropped = voiceMeasurements.reduce((s, m) => s + (m.callDropped || 0), 0);
      const voiceSuccessRate = totalCallAttempted > 0 ? (totalCallSuccess / totalCallAttempted) * 100 : null;
      const callDropRate = totalCallAttempted > 0 ? (totalCallDropped / totalCallAttempted) * 100 : null;
      const avgCallSetupTime = voiceMeasurements.length > 0
        ? voiceMeasurements.reduce((s, m) => s + (m.callSetupTime || 0), 0) / voiceMeasurements.length
        : null;

      // SMS metrics
      const smsMeasurements = ms.filter((m) => m.smsSent && m.smsSent > 0);
      const totalSmsSent = smsMeasurements.reduce((s, m) => s + (m.smsSent || 0), 0);
      const totalSmsSuccess = smsMeasurements.reduce((s, m) => s + (m.smsSuccess || 0), 0);
      const smsSuccessRate = totalSmsSent > 0 ? (totalSmsSuccess / totalSmsSent) * 100 : null;
      const avgSmsDelay = smsMeasurements.length > 0
        ? smsMeasurements.reduce((s, m) => s + (m.smsDelay || 0), 0) / smsMeasurements.length
        : null;

      // Data metrics
      const dataMeasurements = ms.filter((m) => m.downloadSpeed !== null);
      const avgDownloadSpeed = dataMeasurements.length > 0
        ? dataMeasurements.reduce((s, m) => s + (m.downloadSpeed || 0), 0) / dataMeasurements.length
        : null;
      const avgUploadSpeed = dataMeasurements.length > 0
        ? dataMeasurements.reduce((s, m) => s + (m.uploadSpeed || 0), 0) / dataMeasurements.length
        : null;
      const avgLatency = dataMeasurements.length > 0
        ? dataMeasurements.reduce((s, m) => s + (m.latency || 0), 0) / dataMeasurements.length
        : null;
      const avgPacketLoss = dataMeasurements.length > 0
        ? dataMeasurements.reduce((s, m) => s + (m.packetLoss || 0), 0) / dataMeasurements.length
        : null;

      // QoE metrics
      const qoeMeasurements = ms.filter((m) => m.webPageLoadTime !== null);
      const avgWebPageLoadTime = qoeMeasurements.length > 0
        ? qoeMeasurements.reduce((s, m) => s + (m.webPageLoadTime || 0), 0) / qoeMeasurements.length
        : null;
      const avgVideoScore = qoeMeasurements.length > 0
        ? qoeMeasurements.reduce((s, m) => s + (m.videoStreamingScore || 0), 0) / qoeMeasurements.length
        : null;
      const avgDownloadSuccessRate = qoeMeasurements.length > 0
        ? qoeMeasurements.reduce((s, m) => s + (m.downloadSuccessRate || 0), 0) / qoeMeasurements.length
        : null;

      // Overall score (weighted average of key metrics, normalized to 0-100)
      const scores: number[] = [];
      if (voiceSuccessRate !== null) scores.push(voiceSuccessRate * 0.30);
      if (smsSuccessRate !== null) scores.push(smsSuccessRate * 0.15);
      if (avgDownloadSpeed !== null) scores.push(Math.min((avgDownloadSpeed / 30) * 100, 100) * 0.25);
      if (avgLatency !== null) scores.push(Math.max(0, 100 - avgLatency) * 0.15);
      if (avgDownloadSuccessRate !== null) scores.push(avgDownloadSuccessRate * 0.15);
      const overallScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) : null;

      // Conformity
      const conformCount = ms.filter((m) => m.isConform === true).length;
      const conformRate = ms.length > 0 ? (conformCount / ms.length) * 100 : null;

      return {
        operatorId: op.id,
        operatorName: op.name,
        operatorCode: op.code,
        totalMeasurements: ms.length,
        voice: {
          successRate: voiceSuccessRate !== null ? Math.round(voiceSuccessRate * 10) / 10 : null,
          dropRate: callDropRate !== null ? Math.round(callDropRate * 10) / 10 : null,
          avgSetupTime: avgCallSetupTime !== null ? Math.round(avgCallSetupTime * 10) / 10 : null,
        },
        sms: {
          successRate: smsSuccessRate !== null ? Math.round(smsSuccessRate * 10) / 10 : null,
          avgDelay: avgSmsDelay !== null ? Math.round(avgSmsDelay * 10) / 10 : null,
        },
        data: {
          avgDownload: avgDownloadSpeed !== null ? Math.round(avgDownloadSpeed * 10) / 10 : null,
          avgUpload: avgUploadSpeed !== null ? Math.round(avgUploadSpeed * 10) / 10 : null,
          avgLatency: avgLatency !== null ? Math.round(avgLatency * 10) / 10 : null,
          avgPacketLoss: avgPacketLoss !== null ? Math.round(avgPacketLoss * 10) / 10 : null,
        },
        qoe: {
          avgPageLoadTime: avgWebPageLoadTime !== null ? Math.round(avgWebPageLoadTime * 10) / 10 : null,
          avgVideoScore: avgVideoScore !== null ? Math.round(avgVideoScore * 10) / 10 : null,
          avgDownloadSuccessRate: avgDownloadSuccessRate !== null ? Math.round(avgDownloadSuccessRate * 10) / 10 : null,
        },
        overallScore: overallScore !== null ? Math.round(overallScore * 10) / 10 : null,
        conformRate: conformRate !== null ? Math.round(conformRate * 10) / 10 : null,
      };
    });

    // Sort by overall score descending and assign rank
    operatorComparison.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    const ranked = operatorComparison.map((op, index) => ({
      ...op,
      rank: index + 1,
    }));

    // Per-region breakdown
    const regionMap = new Map<string, Map<string, typeof measurements[0][]>>();
    for (const m of measurements) {
      const region = m.region || "Non spécifié";
      if (!regionMap.has(region)) regionMap.set(region, new Map());
      const opId = m.operatorId || "unknown";
      if (!regionMap.get(region)!.has(opId)) regionMap.get(region)!.set(opId, []);
      regionMap.get(region)!.get(opId)!.push(m);
    }

    const regionBreakdown = Array.from(regionMap.entries()).map(([region, opMap]) => {
      const operators = Array.from(opMap.entries()).map(([opId, ms]) => {
        const op = ms[0]?.operator;
        const voiceMs = ms.filter((m) => m.callAttempted && m.callAttempted > 0);
        const totalAttempted = voiceMs.reduce((s, m) => s + (m.callAttempted || 0), 0);
        const totalSuccess = voiceMs.reduce((s, m) => s + (m.callSuccess || 0), 0);
        const dataMs = ms.filter((m) => m.downloadSpeed !== null);
        const avgDown = dataMs.length > 0
          ? dataMs.reduce((s, m) => s + (m.downloadSpeed || 0), 0) / dataMs.length
          : null;
        const avgLat = dataMs.length > 0
          ? dataMs.reduce((s, m) => s + (m.latency || 0), 0) / dataMs.length
          : null;
        const conformCount = ms.filter((m) => m.isConform === true).length;
        const conformRate = ms.length > 0 ? (conformCount / ms.length) * 100 : null;

        return {
          operatorId: opId,
          operatorName: op?.name || "Inconnu",
          operatorCode: op?.code || "UNK",
          measurements: ms.length,
          voiceSuccessRate: totalAttempted > 0 ? Math.round((totalSuccess / totalAttempted) * 1000) / 10 : null,
          avgDownload: avgDown !== null ? Math.round(avgDown * 10) / 10 : null,
          avgLatency: avgLat !== null ? Math.round(avgLat * 10) / 10 : null,
          conformRate: conformRate !== null ? Math.round(conformRate * 10) / 10 : null,
        };
      });

      // Sort operators by conformRate descending in each region
      operators.sort((a, b) => (b.conformRate || 0) - (a.conformRate || 0));

      return { region, operators };
    });

    // Technology breakdown
    const techMap = new Map<string, Map<string, typeof measurements[0][]>>();
    for (const m of measurements) {
      const tech = m.technology || "Non spécifié";
      if (!techMap.has(tech)) techMap.set(tech, new Map());
      const opId = m.operatorId || "unknown";
      if (!techMap.get(tech)!.has(opId)) techMap.get(tech)!.set(opId, []);
      techMap.get(tech)!.get(opId)!.push(m);
    }

    const technologyBreakdown = Array.from(techMap.entries()).map(([tech, opMap]) => {
      const operators = Array.from(opMap.entries()).map(([opId, ms]) => {
        const op = ms[0]?.operator;
        const dataMs = ms.filter((m) => m.downloadSpeed !== null);
        const avgDown = dataMs.length > 0
          ? dataMs.reduce((s, m) => s + (m.downloadSpeed || 0), 0) / dataMs.length
          : null;
        const conformCount = ms.filter((m) => m.isConform === true).length;
        const conformRate = ms.length > 0 ? (conformCount / ms.length) * 100 : null;

        return {
          operatorId: opId,
          operatorName: op?.name || "Inconnu",
          operatorCode: op?.code || "UNK",
          measurements: ms.length,
          avgDownload: avgDown !== null ? Math.round(avgDown * 10) / 10 : null,
          conformRate: conformRate !== null ? Math.round(conformRate * 10) / 10 : null,
        };
      });

      return { technology: tech, operators };
    });

    // Critical zones: regions with lowest conformity
    const criticalZones = regionBreakdown
      .map((r) => {
        const avgConform = r.operators.length > 0
          ? r.operators.reduce((s, o) => s + (o.conformRate || 0), 0) / r.operators.length
          : 0;
        return { region: r.region, avgConformRate: Math.round(avgConform * 10) / 10, operators: r.operators };
      })
      .sort((a, b) => a.avgConformRate - b.avgConformRate)
      .slice(0, 5);

    return NextResponse.json({
      operatorComparison: ranked,
      regionBreakdown,
      technologyBreakdown,
      criticalZones,
    });
  } catch (error) {
    console.error("Error fetching benchmark data:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données de benchmarking" },
      { status: 500 }
    );
  }
}
