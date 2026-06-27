import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

export function createdResponse<T>(
  data: T,
  message = "Ressource créée avec succès"
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, 201);
}

export function errorResponse(
  error: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Non autorisé", 401);
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorResponse("Accès refusé", 403);
}

export function notFoundResponse(resource = "Ressource"): NextResponse<ApiResponse> {
  return errorResponse(`${resource} introuvable`, 404);
}

export function serverErrorResponse(error?: unknown): NextResponse<ApiResponse> {
  console.error("Server error:", error);
  return errorResponse("Une erreur interne est survenue", 500);
}

export function validationErrorResponse(errors: Record<string, string[]>): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: "Données invalides",
      validationErrors: errors,
    },
    { status: 422 }
  );
}
