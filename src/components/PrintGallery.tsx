"use client";

import { useState, useRef, useTransition } from "react";
import EditorModal from "./EditorModal";
import { uploadCartao, deleteCartao } from "../actions";

export default function PrintGallery({ imagens }: { imagens: string[] }) {
  const [imagemEdicao, setImagemEdicao] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const abrirEditor = (caminho: string) => {
    setImagemEdicao(caminho);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadCartao(formData);
    setUploading(false);
    
    if (res.error) {
      alert(res.error);
    }
    
    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imagem: string) => {
    if (confirm("Tem certeza que deseja remover este cartão?")) {
      startTransition(async () => {
        const res = await deleteCartao(imagem);
        if (res.error) {
          alert(res.error);
        }
      });
    }
  };

  return (
    <>
      <div className="nao-imprimir max-w-6xl mx-auto flex flex-wrap gap-8 justify-center mt-10">
        
        {/* Card de Upload */}
        <div 
          className="bg-white border-2 border-dashed border-blue-300 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center w-[350px] min-h-[330px] hover:bg-blue-50 transition-colors cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="text-5xl mb-4 text-blue-500">📥</div>
          <div className="text-xl font-bold text-gray-700">Importar Imagem</div>
          <p className="text-gray-500 text-center mt-2 px-4">Clique aqui para enviar um novo cartão para impressão</p>
          {uploading && <div className="text-sm font-semibold text-blue-600 mt-4 animate-pulse">Enviando imagem...</div>}
        </div>

        {imagens.map((imagem) => (
          <div 
            key={imagem} 
            className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center w-[350px] transition-transform hover:-translate-y-1 relative"
          >
            <button
              onClick={() => handleDelete(imagem)}
              disabled={isPending}
              className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-colors text-xl shadow-sm"
              title="Remover cartão"
            >
              🗑️
            </button>
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
        ))}
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
