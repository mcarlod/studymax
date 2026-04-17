import { NextResponse } from "next/server";
import {handleUpload, HandleUploadBody} from "@vercel/blob/client";
import {auth} from "@clerk/nextjs/server";
import {MAX_FILE_SIZE, MAX_IMAGE_SIZE, ACCEPTED_IMAGE_TYPES} from "@/lib/constants";

export async function POST(request: Request): Promise<NextResponse> {

    try {
        const body = (await request.json()) as HandleUploadBody;

        const jsonResponse = await handleUpload({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            body,
            request,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                const {userId} = await auth()

                // block anonymous uploads
                if (!userId) {
                    throw new Error('Unauthorized: User not authenticated')
                }

                // Logic to derive maximumSizeInBytes from the requested content type
                // clientPayload should contain the contentType when passed from the client
                const contentType = clientPayload ? JSON.parse(clientPayload).contentType : null;
                const isImage = contentType && ACCEPTED_IMAGE_TYPES.includes(contentType);

                return {
                    allowedContentTypes: ['application/pdf', ...ACCEPTED_IMAGE_TYPES],
                    addRandomSuffix: true,
                    maximumSizeInBytes: isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE,
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