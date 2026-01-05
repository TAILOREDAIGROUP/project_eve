const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';

async function runFailureTest() {
    console.log('📉 Starting Failure Scenario Test...');
    
    let invalidApiKeyHandled = false;
    let timeoutHandled = false;
    let supabaseUnreachableHandled = false;

    // 1. Invalid API Key Scenario
    try {
        const response = await fetch(TEST_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer invalid-key'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'test' }],
                tenant_id: 'non-existent-tenant'
            })
        });
        if (response.status === 401) {
            invalidApiKeyHandled = true;
        }
    } catch (e) {
        // Fetch error also counts as handled if it was intended
    }

    // 2. Timeout Scenario
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1000); // 1s timeout
    try {
        await fetch(TEST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'slow request' }],
                tenant_id: 'test-tenant'
            }),
            signal: controller.signal
        });
    } catch (e: any) {
        if (e.name === 'AbortError' || e.message?.includes('aborted')) {
            timeoutHandled = true;
        }
    } finally {
        clearTimeout(timeout);
    }

    console.log(`\nFAILURE TEST RESULTS:`);
    console.log(`- Invalid API Key Handled: ${invalidApiKeyHandled}`);
    console.log(`- Timeout Handling: ${timeoutHandled}`);

    return {
        name: 'FAILURE TEST',
        invalidApiKeyHandled,
        timeoutHandled,
        success: invalidApiKeyHandled && timeoutHandled
    };
}

if (process.argv[1] && process.argv[1].endsWith('failure-test.ts')) {
    runFailureTest().catch(console.error);
}

export { runFailureTest };
