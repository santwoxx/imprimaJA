"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const cartoesDir = path.join(process.cwd(), "public", "cartoes");

export async function uploadCartao(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || !(file instanceof File)) {
    return { error: "Nenhum arquivo enviado ou arquivo inválido." };
  }

  try {
    if (!fs.existsSync(cartoesDir)) {
      fs.mkdirSync(cartoesDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Limpar caracteres estranhos do nome
    const cleanName = file.name.replace(/[^a-zA-Z0-9.\-]/g, "_");
    const fileName = `${Date.now()}-${cleanName}`;
    const filePath = path.join(cartoesDir, fileName);
    
    fs.writeFileSync(filePath, buffer);
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return { error: "Erro ao salvar arquivo." };
  }
}

export async function deleteCartao(fileName: string) {
  try {
    const filePath = path.join(cartoesDir, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      revalidatePath("/");
      return { success: true };
    }
    return { error: "Arquivo não encontrado." };
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    return { error: "Erro ao deletar arquivo." };
  }
}
