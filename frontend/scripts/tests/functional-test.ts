const TEST_API_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/chat';
const TEST_TENANT_ID = 'functional-test-tenant-' + Date.now();

async function runFunctionalTest() {
    console.log('✅ Starting Functional Test...');
    
    let chatFlowWorking = false;
    let memoryPersistenceWorking = false;
    let sessionId: string | null = null;

    // 1. Test Chat Flow & Session Management
    try {
        const response = await fetch(TEST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello, I am testing the system. My favorite color is blue.' }],
                tenant_id: TEST_TENANT_ID
            })
        });

        if (response.ok) {
            chatFlowWorking = true;
            sessionId = response.headers.get('X-Session-Id');
            await response.text(); 
        } else {
            let errorDetails = '';
            try {
                errorDetails = JSON.stringify(await response.json());
            } catch (e) {
                errorDetails = await response.text();
            }
            console.error(`Chat flow failed with status ${response.status}: ${errorDetails}`);
        }
    } catch (e) {
        console.error('Chat flow failed:', e);
    }

    // 2. Test Memory Persistence
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const response = await fetch(TEST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'What is my favorite color?' }
                ],
                tenant_id: TEST_TENANT_ID,
                session_id: sessionId
            })
        });

        if (response.ok) {
            const rawText = await response.text();
            
            // Parse AI SDK stream format
            const lines = rawText.split('\n');
            let fullContent = '';
            for (const line of lines) {
                if (line.startsWith('0:')) {
                    try {
                        const content = JSON.parse(line.substring(2));
                        fullContent += content;
                    } catch (e) {
                        fullContent += line.substring(2);
                    }
                }
            }
            
            if (!fullContent && rawText) fullContent = rawText;

            console.log(`Eve said: "${fullContent}"`);
            if (fullContent.toLowerCase().includes('blue')) {
                memoryPersistenceWorking = true;
            }
        }
    } catch (e) {
        console.error('Memory persistence failed:', e);
    }

    console.log(`\nFUNCTIONAL TEST RESULTS:`);
    console.log(`- Chat Flow: ${chatFlowWorking}`);
    console.log(`- Session ID Received: ${!!sessionId}`);
    console.log(`- Memory Persistence: ${memoryPersistenceWorking}`);

    return {
        name: 'FUNCTIONAL TEST',
        chatFlowWorking,
        sessionIdReceived: !!sessionId,
        memoryPersistenceWorking,
        success: chatFlowWorking && memoryPersistenceWorking
    };
}

if (process.argv[1] && process.argv[1].endsWith('functional-test.ts')) {
    runFunctionalTest().catch(console.error);
}

export { runFunctionalTest };
