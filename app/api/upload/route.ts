import { NextResponse } from "next/server";
import {handleUpload, HandleUploadBody} from "@vercel/blob/client";
import {auth} from "@clerk/nextjs/server";
import {MAX_FILE_SIZE} from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {

    try {
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body,
            request,
            onBeforeGenerateToken: async () => {
                const {userId} = await auth()

                // block anonymous uploads
                if (!userId) {
                    throw new Error('Unauthorized: User not authenticated')
                }

                return {
                    allowedContentTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                    addRandomSuffix: true,
                    maximumSizeInBytes: MAX_FILE_SIZE,
                    tokenPayload: JSON.stringify({userId})
                }
            },
            onUploadCompleted: async ({blob, tokenPayload}) => {
                console.log('File uploaded to blob: ', blob.url)

                const payLoad = tokenPayload ? JSON.parse(tokenPayload) : null;
                const userID = payLoad?.userId;

                // TODO: Posthog
            }
        });

        return NextResponse.json(jsonResponse);
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        const status = message.includes('Unauthorized') ? 401 : 500;
        return NextResponse.json({ error: message }, { status })
    }

}