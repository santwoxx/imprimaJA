"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import EditorModal from "./EditorModal";
import { uploadCartao, deleteCartao } from "../actions";

export default function PrintGallery({ imagens }: { imagens: string[] }) {
  const [imagemEdicao, setImagemEdicao] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Estado para imagens locais em memória (resolve erro no Vercel)
  const [imagensLocais, setImagensLocais] = useState<{id: string, url: string}[]>([]);

  // Limpa URLs locais da memória ao desmontar
  useEffect(() => {
    return () => {
      imagensLocais.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const abrirEditor = (caminho: string) => {
    setImagemEdicao(caminho);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostra instantaneamente criando uma URL local na memória do navegador
    const localUrl = URL.createObjectURL(file);
    const idLocal = Date.now().toString();
    setImagensLocais(prev => [{ id: idLocal, url: localUrl }, ...prev]);
    
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadCartao(formData);
      
      if (!res.error) {
        // Se salvou no servidor com sucesso, removemos da lista local 
        // para não duplicar, pois o revalidatePath vai trazer ela do servidor.
        setImagensLocais(prev => prev.filter(img => img.id !== idLocal));
      } else {
        console.warn("Upload no servidor bloqueado (típico do Vercel). Imagem mantida apenas na memória local para impressão.");
      }
    } catch (err) {
      console.warn("Erro ao enviar para o servidor, usando apenas memória local.", err);
    }
    
    setUploading(false);
    
    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteLocal = (id: string, url: string) => {
    if (confirm("Remover este cartão temporário?")) {
      setImagensLocais(prev => prev.filter(img => img.id !== id));
      URL.revokeObjectURL(url);
    }
  };

  const handleDeleteServidor = async (imagem: string) => {
    if (confirm("Tem certeza que deseja remover este cartão do servidor?")) {
      startTransition(async () => {
        const res = await deleteCartao(imagem);
        if (res.error) {
          alert("Aviso: O seu servidor de hospedagem atual não permite apagar arquivos originais. Você ainda pode importar novos cartões para imprimir usando a memória do navegador!");
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
          {uploading && <div className="text-sm font-semibold text-blue-600 mt-4 animate-pulse">Processando imagem...</div>}
        </div>

        {/* Renderiza as imagens temporárias da memória (Vercel bypass) */}
        {imagensLocais.map((local) => (
          <div 
            key={local.id} 
            className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5 shadow-lg flex flex-col items-center w-[350px] transition-transform hover:-translate-y-1 relative"
          >
            <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-xl shadow-sm z-10">
              Na Memória
            </div>
            <button
              onClick={() => handleDeleteLocal(local.id, local.url)}
              className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-full w-10 h-10 flex items-center justify-center transition-colors text-xl shadow-sm z-10"
              title="Remover cartão temporário"
            >
              🗑️
            </button>
            <img 
              src={local.url} 
              alt="Cartão Temporário" 
              className="max-w-full h-[200px] object-contain rounded-lg mb-5 border border-yellow-300 mt-3"
            />
            <button 
              onClick={() => abrirEditor(local.url)}
              className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white border-none rounded-full py-4 px-10 text-xl font-bold cursor-pointer w-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>✏️</span> EDITAR E IMPRIMIR
            </button>
          </div>
        ))}

        {/* Renderiza as imagens do servidor */}
        {imagens.map((imagem) => (
          <div 
            key={imagem} 
            className="bg-white rounded-2xl p-5 shadow-lg flex flex-col items-center w-[350px] transition-transform hover:-translate-y-1 relative"
          >
            <button
              onClick={() => handleDeleteServidor(imagem)}
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
