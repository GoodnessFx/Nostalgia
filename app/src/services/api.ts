import { APP_CONFIG } from "../config/app";

export type ProcessResponse = {
  outputUrl: string;
  preset: "noir" | "storm" | "ghost";
};

export async function processMedia(
  file: { uri: string; type: string; name: string; file?: File },
  userId: string,
  userPlan: "free" | "pro",
  preset: "noir" | "storm" | "ghost"
) {
  const formData = new FormData();
  
  if (file.file) {
    formData.append("media", file.file);
  } else {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    formData.append("media", blob, file.name);
  }
  
  formData.append("preset", preset);

  const response = await fetch(`${APP_CONFIG.apiBaseUrl}/process`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
      "x-user-plan": userPlan,
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || "Request failed");
  }

  return json as ProcessResponse;
}
