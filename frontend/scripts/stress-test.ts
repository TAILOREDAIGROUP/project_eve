import { performance } from 'perf_hooks';

const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';
const TEST_TENANT_ID = process.env.TEST_TENANT_ID || 'test-tenant';

async function runStressTest() {
    console.log('🚀 Starting Stress Test...');
    
    const concurrentRequests = 100;
    const results: number[] = [];
    let successCount = 0;
    let failureCount = 0;
    let rateLimitedCount = 0;

    const startTime = performance.now();

    const sendRequest = async (id: number) => {
        const start = performance.now();
        try {
            const response = await fetch(TEST_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: `Stress test request ${id}` }],
                    tenant_id: TEST_TENANT_ID
                })
            });

            const end = performance.now();
            results.push(end - start);

            if (response.ok) {
                successCount++;
            } else {
                let errorDetails = '';
                try {
                    const errorJson = await response.json();
                    errorDetails = JSON.stringify(errorJson);
                } catch (e) {
                    errorDetails = await response.text();
                }
                console.error(`Request ${id} failed with status ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
                if (response.status === 429) {
                    rateLimitedCount++;
                } else {
                    failureCount++;
                }
            }
        } catch (error) {
            failureCount++;
        }
    };

    // Send 100 concurrent requests
    await Promise.all(Array.from({ length: concurrentRequests }, (_, i) => sendRequest(i)));

    const endTime = performance.now();
    const totalDuration = (endTime - startTime) / 1000;

    results.sort((a, b) => a - b);
    const p50 = results[Math.floor(results.length * 0.5)];
    const p95 = results[Math.floor(results.length * 0.95)];
    const p99 = results[Math.floor(results.length * 0.99)];
    const avg = results.reduce((a, b) => a + b, 0) / results.length;

    console.log(`\nSTRESS TEST RESULTS:`);
    console.log(`- Total Requests: ${concurrentRequests}`);
    console.log(`- Success Rate: ${((successCount / concurrentRequests) * 100).toFixed(2)}%`);
    console.log(`- Avg Response Time: ${(avg / 1000).toFixed(2)}s`);
    console.log(`- p50: ${(p50 / 1000).toFixed(2)}s`);
    console.log(`- p95: ${(p95 / 1000).toFixed(2)}s`);
    console.log(`- p99: ${(p99 / 1000).toFixed(2)}s`);
    console.log(`- Rate Limited: ${rateLimitedCount}`);
    console.log(`- Failures: ${failureCount}`);

    return {
        name: 'STRESS TEST',
        successRate: (successCount / concurrentRequests) * 100,
        avgResponseTime: avg / 1000,
        rateLimitingWorking: rateLimitedCount > 0 || (successCount < 100 && failureCount === 0), // Simple check
        p50, p95, p99,
        success: (successCount / concurrentRequests) >= 0.9
    };
}

if (process.argv[1] && process.argv[1].endsWith('stress-test.ts')) {
    runStressTest().catch(console.error);
}

export { runStressTest };
