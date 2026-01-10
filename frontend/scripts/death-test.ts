import { runStressTest } from './stress-test';
import { runSecurityTest } from './security-test';
import { runFailureTest } from './failure-test';
import { runFunctionalTest } from './functional-test';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';
    console.log(`Testing API URL: ${TEST_API_URL}`);
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           PROJECT EVE - DEATH TEST RUNNER                    ║
╚══════════════════════════════════════════════════════════════╝
`);

    const stressResults = await runStressTest();
    console.log('\n' + '─'.repeat(60));
    
    const securityResults = await runSecurityTest();
    console.log('\n' + '─'.repeat(60));
    
    const failureResults = await runFailureTest();
    console.log('\n' + '─'.repeat(60));
    
    const functionalResults = await runFunctionalTest();
    console.log('\n' + '─'.repeat(60));

    // Calculate Score
    let score = 0;
    if (stressResults.success) score += 25;
    if (securityResults.success) score += 25;
    if (failureResults.success) score += 25;
    if (functionalResults.success) score += 25;

    // Adjust score based on details
    if (stressResults.successRate < 100) score -= (100 - stressResults.successRate) / 4;
    
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    let status = '🔴 CRITICAL';
    if (finalScore >= 90) status = '✅ READY FOR PRODUCTION';
    else if (finalScore >= 70) status = '⚠️ CAUTION';
    else if (finalScore >= 50) status = '🟡 NOT READY';

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           PROJECT EVE - DEATH TEST RESULTS                   ║
╠══════════════════════════════════════════════════════════════╣
║ STRESS TEST                                                  ║
║   ${stressResults.success ? '✅' : '❌'} 100 concurrent requests: ${stressResults.successRate.toFixed(1)}% success rate               ║
║   ${stressResults.avgResponseTime < 2 ? '✅' : '⚠️'} Average response time: ${stressResults.avgResponseTime.toFixed(2)}s                             ║
║   ${stressResults.rateLimitingWorking ? '✅' : '⚠️'} Rate limiting: ${stressResults.rateLimitingWorking ? 'Working' : 'Not detected'}       ║
╠══════════════════════════════════════════════════════════════╣
║ SECURITY TEST                                                ║
║   ✅ Prompt injection: ${securityResults.promptInjectionScore} detected                        ║
║   ${securityResults.oversizedPayloadRejected ? '✅' : '❌'} Input validation: Oversized payloads rejected       ║
║   ${securityResults.securityHeadersPresent ? '✅' : '⚠️'} Security headers: ${securityResults.securityHeadersPresent ? 'Present' : 'Missing'}                           ║
╠══════════════════════════════════════════════════════════════╣
║ FAILURE TEST                                                 ║
║   ${failureResults.invalidApiKeyHandled ? '✅' : '❌'} Invalid API key: Graceful error returned                ║
║   ${failureResults.timeoutHandled ? '✅' : '❌'} Timeout handling: Working                               ║
╠══════════════════════════════════════════════════════════════╣
║ FUNCTIONAL TEST                                              ║
║   ${functionalResults.chatFlowWorking ? '✅' : '❌'} Chat flow: Working                                      ║
║   ${functionalResults.memoryPersistenceWorking ? '✅' : '❌'} Memory persistence: Working                             ║
║   ${functionalResults.sessionIdReceived ? '✅' : '❌'} Session management: Working                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║   CONSUMER READINESS SCORE: ${finalScore}/100                           ║
║   STATUS: ${status}                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

    const report = {
        timestamp: new Date().toISOString(),
        score: finalScore,
        status,
        details: {
            stress: stressResults,
            security: securityResults,
            failure: failureResults,
            functional: functionalResults
        }
    };

    fs.writeFileSync(
        path.join(__dirname, '../death-test-report.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log(`Results saved to scripts/death-test-report.json`);
}

main().catch(error => {
    console.error('Death Test Runner failed:', error);
    process.exit(1);
});
