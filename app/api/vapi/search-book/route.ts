import { NextResponse } from 'next/server';

import { searchBookSegments } from '@/lib/actions/book.actions';

// Helper function to process book search logic
async function processBookSearch(bookId: unknown, query: unknown) {
    // Validate inputs before conversion to prevent null/undefined becoming "null"/"undefined" strings
    if (bookId == null || query == null || query === '') {
        return { result: 'Missing bookId or query' };
    }

    // Convert bookId to string
    const bookIdStr = String(bookId);
    const queryStr = String(query).trim();

    // Additional validation after conversion
    if (!bookIdStr || bookIdStr === 'null' || bookIdStr === 'undefined' || !queryStr) {
        return { result: 'Missing bookId or query' };
    }

    // Execute search
    console.log(`Executing search for bookId: ${bookIdStr}, queryLength: ${queryStr.length}`);
    const searchResult = await searchBookSegments(bookIdStr, queryStr, 3);

    // Return results
    if (!searchResult.success) {
        console.error('searchBookSegments failed:', searchResult.error);
        return { result: 'Error searching the book content.' };
    }

    if (!searchResult.data?.length) {
        console.log('No segments found for query');
        return { result: 'no information found about this topic' };
    }

    console.log(`Found ${searchResult.data.length} segments`);

    const combinedText = searchResult.data
        .map((segment) => (segment as { content: string }).content)
        .join('\n\n');

    return { result: combinedText };
}

export async function GET() {
    return NextResponse.json({ status: 'ok' });
}

// Parse tool arguments that may arrive as a JSON string or an object
function parseArgs(args: unknown): Record<string, unknown> {
    if (!args) return {};
    if (typeof args === 'string') {
        try { return JSON.parse(args); } catch { return {}; }
    }
    return args as Record<string, unknown>;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Log request metadata only
        console.log('Vapi search-book request metadata:', {
            type: body?.message?.type,
            role: body?.message?.role,
            toolCallCount: (body?.message?.toolCallList || body?.message?.toolCalls || []).length,
            functionCall: body?.message?.functionCall?.name
        });

        // Support multiple Vapi formats
        const functionCall = body?.message?.functionCall;
        const toolCallList = body?.message?.toolCallList || body?.message?.toolCalls;

        // Log specific part of the body to see what Vapi is sending
        if (body?.message?.type === 'tool-calls') {
            console.log('Vapi tool-calls metadata:', {
                count: (body.message.toolCallList || body.message.toolCalls || []).length
            });
        }

        // Handle single functionCall format
        if (functionCall) {
            const { name, parameters } = functionCall;
            const parsed = parseArgs(parameters);

            if (name === 'searchBook') {
                const result = await processBookSearch(parsed.bookId, parsed.query);
                // Even for single function call, Vapi often expects a results array if it's a tool-call-result message
                return NextResponse.json({
                    results: [result]
                });
            }

            return NextResponse.json({
                results: [{ result: `Unknown function: ${name}` }]
            });
        }

        // Handle toolCallList format (array of calls)
        if (!toolCallList || toolCallList.length === 0) {
            return NextResponse.json({
                results: [{ result: 'No tool calls found' }],
            });
        }

        const results = [];

        for (const toolCall of toolCallList) {
            const { id, function: func } = toolCall;
            const name = func?.name;
            const args = parseArgs(func?.arguments);

            if (name === 'searchBook') {
                const searchResult = await processBookSearch(args.bookId, args.query);
                results.push({ toolCallId: id, ...searchResult });
            } else {
                results.push({ toolCallId: id, result: `Unknown function: ${name}` });
            }
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Vapi search-book error:', error);
        return NextResponse.json({
            results: [{ result: 'Error processing request' }],
        });
    }
}