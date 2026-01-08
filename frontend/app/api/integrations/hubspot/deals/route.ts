import { NextRequest, NextResponse } from 'next/server';
import { Nango } from '@nangohq/node';

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const connectionId = tenantId;

    // Check if HubSpot is connected
    try {
      await nango.getConnection('hubspot', connectionId);
    } catch (error) {
      return NextResponse.json({ 
        error: 'HubSpot not connected',
        message: 'Please connect HubSpot at /dashboard/integrations'
      }, { status: 404 });
    }

    // Fetch deals from HubSpot
    const dealsResponse = await nango.proxy({
      providerConfigKey: 'hubspot',
      connectionId: connectionId,
      method: 'GET',
      endpoint: '/crm/v3/objects/deals',
      params: {
        limit: '50',
        properties: 'dealname,amount,dealstage,closedate,pipeline,hubspot_owner_id'
      }
    });

    const deals = dealsResponse.data.results || [];

    // Transform and analyze deals
    const formattedDeals = deals.map((deal: any) => ({
      id: deal.id,
      name: deal.properties.dealname,
      amount: parseFloat(deal.properties.amount) || 0,
      stage: deal.properties.dealstage,
      closeDate: deal.properties.closedate,
      pipeline: deal.properties.pipeline
    }));

    // Calculate pipeline metrics
    const totalValue = formattedDeals.reduce((sum: number, d: any) => sum + d.amount, 0);
    const stageBreakdown = formattedDeals.reduce((acc: any, d: any) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      deals: formattedDeals,
      analysis: {
        totalDeals: formattedDeals.length,
        totalPipelineValue: totalValue,
        stageBreakdown: stageBreakdown,
        averageDealSize: formattedDeals.length > 0 ? totalValue / formattedDeals.length : 0
      }
    });

  } catch (error: any) {
    console.error('[HubSpot Deals] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch HubSpot deals',
      details: error.message 
    }, { status: 500 });
  }
}
