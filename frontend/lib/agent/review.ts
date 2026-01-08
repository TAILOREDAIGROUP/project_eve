import { supabase } from '@/lib/supabase';

// ============================================================================
// AI-REVIEWS-AI LAYER
// ============================================================================
// This service implements automated quality checks before output reaches user

export interface ReviewResult {
    passed: boolean;
    status: 'approved' | 'needs_revision' | 'rejected';
    issues: ReviewIssue[];
    revisedContent?: string;
}

export interface ReviewIssue {
    type: 'accuracy' | 'tone' | 'completeness' | 'safety' | 'relevance';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    suggestion?: string;
    location?: { start: number; end: number };
}

export interface ReviewRequest {
    content: string;
    context: {
        userQuery: string;
        conversationHistory?: Array<{ role: string; content: string }>;
        userProfile?: Record<string, any>;
    };
    reviewTypes: ReviewIssue['type'][];
}

// ============================================================================
// REVIEW SERVICE
// ============================================================================

export class ReviewService {
    private userId: string;
    private tenantId: string;
    private backendUrl: string;

    constructor(userId: string, tenantId: string = 'default-tenant') {
        this.userId = userId;
        this.tenantId = tenantId;
        this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    }

    /**
     * Perform a quick pre-flight check on AI response
     * This runs BEFORE sending to user
     */
    async quickCheck(content: string, userQuery: string): Promise<ReviewResult> {
        const issues: ReviewIssue[] = [];

        // Safety Check: Look for obvious issues
        const safetyIssues = this.checkSafety(content);
        issues.push(...safetyIssues);

        // Relevance Check: Does response address the question?
        const relevanceIssues = this.checkRelevance(content, userQuery);
        issues.push(...relevanceIssues);

        // Tone Check: Is the response professionally appropriate?
        const toneIssues = this.checkTone(content);
        issues.push(...toneIssues);

        // Completeness Check: Does response seem truncated?
        const completenessIssues = this.checkCompleteness(content);
        issues.push(...completenessIssues);

        // Determine overall status
        const hasCritical = issues.some(i => i.severity === 'critical');
        const hasHigh = issues.some(i => i.severity === 'high');

        return {
            passed: !hasCritical && !hasHigh,
            status: hasCritical ? 'rejected' : hasHigh ? 'needs_revision' : 'approved',
            issues,
        };
    }

    /**
     * Safety check for harmful content
     */
    private checkSafety(content: string): ReviewIssue[] {
        const issues: ReviewIssue[] = [];
        const lowerContent = content.toLowerCase();

        // Check for potentially harmful patterns
        const harmfulPatterns = [
            { pattern: /\b(password|api[_\s]?key|secret[_\s]?key|private[_\s]?key)\s*[:=]/i, issue: 'Potential credential exposure' },
            { pattern: /\b(sudo|rm\s+-rf|format\s+c:|del\s+\/f)/i, issue: 'Potentially dangerous command' },
        ];

        for (const { pattern, issue } of harmfulPatterns) {
            if (pattern.test(content)) {
                issues.push({
                    type: 'safety',
                    severity: 'critical',
                    description: issue,
                    suggestion: 'Remove or redact sensitive information',
                });
            }
        }

        return issues;
    }

    /**
     * Relevance check - does response address the question?
     */
    private checkRelevance(content: string, userQuery: string): ReviewIssue[] {
        const issues: ReviewIssue[] = [];

        // Simple keyword overlap check
        const queryWords = new Set(
            userQuery.toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 3)
        );

        const contentWords = new Set(
            content.toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 3)
        );

        const overlap = [...queryWords].filter(w => contentWords.has(w)).length;
        const overlapRatio = queryWords.size > 0 ? overlap / queryWords.size : 0;

        if (overlapRatio < 0.1 && queryWords.size > 2) {
            issues.push({
                type: 'relevance',
                severity: 'medium',
                description: 'Response may not directly address the question',
                suggestion: 'Consider referencing key terms from the user query',
            });
        }

        return issues;
    }

    /**
     * Tone check - is the response professionally appropriate?
     */
    private checkTone(content: string): ReviewIssue[] {
        const issues: ReviewIssue[] = [];

        // Check for overly casual or unprofessional language
        const casualPatterns = [
            { pattern: /\b(lol|lmao|wtf|omg)\b/i, issue: 'Overly casual language' },
            { pattern: /!!{2,}/, issue: 'Excessive exclamation marks' },
            { pattern: /\?\?{2,}/, issue: 'Excessive question marks' },
        ];

        for (const { pattern, issue } of casualPatterns) {
            if (pattern.test(content)) {
                issues.push({
                    type: 'tone',
                    severity: 'low',
                    description: issue,
                    suggestion: 'Maintain professional tone',
                });
            }
        }

        return issues;
    }

    /**
     * Completeness check - does response seem truncated?
     */
    private checkCompleteness(content: string): ReviewIssue[] {
        const issues: ReviewIssue[] = [];

        // Check if response seems cut off
        const incompletePatterns = [
            { pattern: /\.\.\.$/, issue: 'Response appears truncated' },
            { pattern: /\b(However|But|Although|Therefore),?\s*$/, issue: 'Response ends mid-thought' },
            { pattern: /:\s*$/, issue: 'Response ends with incomplete list' },
        ];

        for (const { pattern, issue } of incompletePatterns) {
            if (pattern.test(content.trim())) {
                issues.push({
                    type: 'completeness',
                    severity: 'medium',
                    description: issue,
                    suggestion: 'Ensure response is complete',
                });
            }
        }

        // Check minimum length for substantive queries
        if (content.length < 50) {
            issues.push({
                type: 'completeness',
                severity: 'low',
                description: 'Response is very short',
                suggestion: 'Consider providing more detail if appropriate',
            });
        }

        return issues;
    }

    /**
     * Full AI-powered review (calls backend LLM)
     * Use for high-stakes responses or when quick check fails
     */
    async fullReview(request: ReviewRequest): Promise<ReviewResult> {
        try {
            const response = await fetch(`${this.backendUrl}/api/v1/review/full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    content: request.content,
                    context: request.context,
                    review_types: request.reviewTypes,
                }),
            });

            if (!response.ok) {
                // Fall back to quick check if backend is unavailable
                return this.quickCheck(request.content, request.context.userQuery);
            }

            const data = await response.json();
            return data.review || this.quickCheck(request.content, request.context.userQuery);
        } catch (error) {
            console.error('Full review failed:', error);
            // Fall back to quick check
            return this.quickCheck(request.content, request.context.userQuery);
        }
    }

    /**
     * Log review result to the database queue
     */
    async logReview(
        sessionId: string,
        originalContent: string,
        result: ReviewResult,
        metadata: Record<string, any> = {}
    ): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('review_queue')
                .insert({
                    tenant_id: this.tenantId,
                    session_id: sessionId,
                    original_content: originalContent,
                    reviewed_content: result.revisedContent || originalContent,
                    review_status: result.status,
                    quality_score: result.passed ? 1.0 : 0.5,
                    review_notes: result.issues.map(i => `${i.type}: ${i.description}`).join('; '),
                    metadata: {
                        ...metadata,
                        issues: result.issues,
                    },
                })
                .select('id')
                .single();

            if (error) throw error;
            return data.id;
        } catch (error) {
            console.error('Error logging review:', error);
            return null;
        }
    }
}
