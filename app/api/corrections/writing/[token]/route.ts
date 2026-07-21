import { NextRequest } from "next/server";
import { after } from "next/server";
import {
  getWritingCorrectionByToken,
  processWritingCorrectionJob,
} from "@/lib/ai/process-writing-correction-job";
import { prisma } from "@/lib/db/prisma";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    let data = await getWritingCorrectionByToken(token);

    if (!data) return notFoundResponse("Correction");

    if (data.status === "PENDING" || data.status === "FAILED") {
      const job = await prisma.writingCorrectionJob.findUnique({
        where: { accessToken: token },
      });

      if (job && job.status === "PENDING" && job.attempts === 0) {
        after(async () => {
          try {
            await processWritingCorrectionJob(job.id);
          } catch (err) {
            console.error("Writing correction retry failed:", err);
          }
        });
      }
    }

    data = (await getWritingCorrectionByToken(token)) ?? data;

    return successResponse({
      status: data.status,
      result: data.result,
      resultSource: data.resultSource,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
