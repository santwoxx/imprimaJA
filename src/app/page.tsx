import fs from "fs";
import path from "path";
import PrintGallery from "@/components/PrintGallery";

export default function Home() {
  let images: string[] = [];
  
  try {
    const cartoesDir = path.join(process.cwd(), "public", "cartoes");
    
    // Garantir que a pasta existe no modo de desenvolvimento
    if (!fs.existsSync(cartoesDir)) {
      fs.mkdirSync(cartoesDir, { recursive: true });
    }

    const files = fs.readdirSync(cartoesDir);
    const extensoesPermitidas = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
    
    images = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensoesPermitidas.includes(ext);
    });
  } catch (error) {
    console.error("Erro ao ler pasta de cartões:", error);
  }

  return (
    <main className="p-5">
      <div className="nao-imprimir bg-white rounded-xl shadow-sm p-8 text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-blue-600 text-4xl font-bold mb-3">Meus Cartões</h1>
        <p className="text-gray-600 text-xl">
          Escolha um cartão abaixo e clique no botão verde para imprimir.
        </p>
      </div>

      <PrintGallery imagens={images} />
    </main>
  );
}
