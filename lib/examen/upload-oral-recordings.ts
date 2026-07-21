export async function uploadOralRecordingFile(params: {
  file: Blob;
  seriesId: string;
  questionId: string;
  filename?: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append(
    "file",
    new File([params.file], params.filename ?? "recording.webm", {
      type: params.file.type || "audio/webm",
    })
  );
  formData.append("seriesId", params.seriesId);
  formData.append("questionId", params.questionId);

  const response = await fetch("/api/examen/enregistrements", {
    method: "POST",
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error ?? "Échec de l'upload audio");
  }

  return json.data.url as string;
}
