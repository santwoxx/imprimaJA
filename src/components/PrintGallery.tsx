"use client";

import { useState } from "react";
import EditorModal from "./EditorModal";

export default function PrintGallery({ imagens }: { imagens: string[] }) {
  const [imagemEdicao, setImagemEdicao] = useState<string | null>(null);

  const abrirEditor = (caminho: string) => {
    setImagemEdicao(caminho);
  };

  return (
    <>
      <div className="nao-imprimir max-w-6xl mx-auto flex flex-wrap gap-8 justify-center mt-10">
        {imagens.length > 0 ? (
          imagens.map((imagem) => (
            <div 
              key={imagem} 
              className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center w-[350px] transition-transform hover:-translate-y-1"
            >
              <img 
                src={`/cartoes/${imagem}`} 
                alt={imagem} 
                className="max-w-full h-[200px] object-contain rounded-lg mb-5 border border-gray-100"
              />
              <button 
                onClick={() => abrirEditor(`/cartoes/${imagem}`)}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border-none rounded-full py-4 px-10 text-xl font-bold cursor-pointer w-full transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>✏️</span> EDITAR E IMPRIMIR
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 mt-12 text-xl">
            <p>Nenhum cartão encontrado.</p>
            <p className="text-base mt-2">Coloque suas imagens na pasta \"public/cartoes\".</p>
          </div>
        )}
      </div>

      {imagemEdicao && (
        <EditorModal 
          imagem={imagemEdicao} 
          onClose={() => setImagemEdicao(null)} 
        />
      )}
    </>
  );
}
