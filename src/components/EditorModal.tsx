"use client";

import { useState, useRef, useEffect } from "react";

type ElementType = "text" | "image";

type EditorElement = {
  id: string;
  type: ElementType;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  // text specific
  text?: string;
  fontSize?: number; // percentage relative to canvas width
  color?: string;
  fontWeight?: string;
  // image specific
  src?: string;
  width?: number; // percentage
  height?: number; // percentage
};

type PrintSize = "cartao" | "a5" | "a4" | "a4-landscape";

export default function EditorModal({
  imagem,
  onClose,
}: {
  imagem: string;
  onClose: () => void;
}) {
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [printSize, setPrintSize] = useState<PrintSize>("a4");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize with the main image
  useEffect(() => {
    if (elements.length === 0) {
      setElements([{
        id: "main-image",
        type: "image",
        src: imagem,
        x: 50,
        y: 50,
        width: printSize === 'a4' || printSize === 'a4-landscape' ? 40 : 80, // Default relative size
        height: printSize === 'a4' || printSize === 'a4-landscape' ? 20 : 40,
      }]);
    }
  }, []); // Run once

  const addText = (defaultText = "Novo Texto", size = 5) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setElements([
      ...elements,
      {
        id: newId,
        type: "text",
        text: defaultText,
        x: 50,
        y: 50,
        fontSize: size,
        color: "#000000",
        fontWeight: "bold",
      },
    ]);
    setSelectedId(newId);
  };

  const addPrice = () => {
    addText("R$ 0,00", 12);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newId = Math.random().toString(36).substr(2, 9);
    setElements([...elements, { ...el, id: newId, x: el.x + 5, y: el.y + 5 }]);
    setSelectedId(newId);
  };

  const preencherFolha = () => {
    // Acha a imagem principal para usar como base
    const baseImg = elements.find(e => e.type === "image");
    if (!baseImg) return;

    // Se for A4 retrato, vamos fazer 2 colunas e 5 linhas
    const newElements: EditorElement[] = [];
    
    // Configurações para A4 Retrato (2x5 = 10 cartões)
    let cols = 2;
    let rows = 5;
    let imgWidth = 45; // 45% width (2 cols = 90%)
    let imgHeight = 18; // 18% height (5 rows = 90%)
    
    if (printSize === 'a4-landscape') {
      cols = 3;
      rows = 3;
      imgWidth = 30;
      imgHeight = 30;
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Ignora a posição (0,0) que será a original (ou podemos recriar todas e limpar)
        newElements.push({
          ...baseImg,
          id: Math.random().toString(36).substr(2, 9),
          x: 25 + (col * 50), // Coluna 1: 25%, Coluna 2: 75%
          y: 10 + (row * 20), // Distribuição de cima para baixo
          width: imgWidth,
          height: imgHeight,
        });
      }
    }

    // Remove as imagens antigas e adiciona o grid
    setElements([...elements.filter(e => e.type !== "image"), ...newElements]);
    setSelectedId(null);
  };

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    setSelectedId(null);
  };

  // Drag and Drop Logic
  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const el = elements.find((e) => e.id === id);
    if (!el) return;

    const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    const mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    isDragging.current = true;
    dragOffset.current = {
      x: mouseX - el.x,
      y: mouseY - el.y,
    };
    setSelectedId(id);
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !selectedId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    let newX = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.current.x;
    let newY = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.current.y;

    const snapThreshold = 1.5; // 1.5% de "força magnética"
    let snappedX: number | null = null;
    let snappedY: number | null = null;

    // Linhas magnéticas centrais e bordas
    const verticalLines = [0, 50, 100];
    const horizontalLines = [0, 50, 100];

    // Linhas magnéticas de outros elementos (centros)
    elements.forEach(el => {
      if (el.id !== selectedId) {
        verticalLines.push(el.x);
        horizontalLines.push(el.y);
      }
    });

    for (let line of verticalLines) {
      if (Math.abs(newX - line) < snapThreshold) {
        newX = line;
        snappedX = line;
        break;
      }
    }

    for (let line of horizontalLines) {
      if (Math.abs(newY - line) < snapThreshold) {
        newY = line;
        snappedY = line;
        break;
      }
    }

    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setSnapLines({ x: snappedX, y: snappedY });
    updateElement(selectedId, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    setSnapLines({ x: null, y: null });
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const imprimir = () => {
    setIsPrinting(true);
    setSelectedId(null);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  return (
    <>
      <div className={`fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col md:flex-row nao-imprimir ${isPrinting ? 'hidden' : ''}`}>
        
        {/* Barra Lateral */}
        <div className="bg-white w-full md:w-80 p-5 flex flex-col gap-5 overflow-y-auto shadow-2xl z-10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl font-bold text-gray-800">Editor</h2>
            <button onClick={onClose} className="text-red-500 font-bold text-xl hover:bg-red-50 p-2 rounded">✕</button>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl flex flex-col gap-3 border border-blue-100">
            <h3 className="font-semibold text-blue-900">1. Adicionar Itens</h3>
            <div className="flex gap-2">
              <button onClick={() => addText()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                + Texto
              </button>
              <button onClick={() => addPrice()} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                + Preço
              </button>
            </div>
            {(printSize === 'a4' || printSize === 'a4-landscape') && (
              <button onClick={preencherFolha} className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm text-sm">
                ⊞ Preencher Folha com Cartões
              </button>
            )}
            <p className="text-xs text-blue-700 mt-1">Dica: Clique em qualquer item na imagem para editar.</p>
          </div>

          {selectedId && (
            <div className="bg-gray-50 p-4 rounded-xl flex flex-col gap-3 border border-gray-200">
              <h3 className="font-semibold text-gray-800">2. Editar Selecionado</h3>
              {elements.filter(el => el.id === selectedId).map(el => (
                <div key={el.id} className="flex flex-col gap-3">
                  
                  {el.type === "text" && (
                    <>
                      <input
                        type="text"
                        value={el.text}
                        onChange={(e) => updateElement(el.id, { text: e.target.value })}
                        className="border p-2 rounded w-full border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Digite o texto..."
                      />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tamanho:</span>
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={el.fontSize}
                          onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) })}
                          className="w-2/3"
                        />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cor:</span>
                        <div className="flex gap-2">
                          <button onClick={() => updateElement(el.id, { color: '#000000' })} className="w-8 h-8 rounded-full bg-black border-2 border-gray-300"></button>
                          <button onClick={() => updateElement(el.id, { color: '#ffffff' })} className="w-8 h-8 rounded-full bg-white border-2 border-gray-300"></button>
                          <button onClick={() => updateElement(el.id, { color: '#e11d48' })} className="w-8 h-8 rounded-full bg-rose-600 border-2 border-gray-300"></button>
                        </div>
                      </div>
                    </>
                  )}

                  {el.type === "image" && (
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-gray-600">Escala:</span>
                       <input
                         type="range"
                         min="10"
                         max="100"
                         value={el.width}
                         onChange={(e) => updateElement(el.id, { width: Number(e.target.value), height: Number(e.target.value) * (5/9) /* Maintain approx ratio */ })}
                         className="w-2/3"
                       />
                     </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => duplicateElement(el.id)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 rounded font-medium text-sm">
                      Duplicar
                    </button>
                    <button onClick={() => removeElement(el.id)} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1 rounded font-medium text-sm">
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-auto pt-5 flex flex-col gap-4 border-t">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tamanho da Impressão:</label>
              <select 
                value={printSize} 
                onChange={(e) => setPrintSize(e.target.value as PrintSize)}
                className="w-full p-3 border rounded-lg bg-white border-gray-300 text-gray-800 font-medium text-sm"
              >
                <option value="a4">Cartaz (A4 Retrato - 21x29,7 cm)</option>
                <option value="a4-landscape">Cartaz (A4 Paisagem - 29,7x21 cm)</option>
                <option value="a5">Tamanho Médio (A5 Paisagem - 21x14,8 cm)</option>
                <option value="cartao">Cartão Pequeno (9x5 cm)</option>
              </select>
            </div>
            
            <button 
              onClick={imprimir}
              className="bg-green-600 hover:bg-green-700 active:scale-95 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition-all flex justify-center items-center gap-2"
            >
              <span>🖨️</span> IMPRIMIR
            </button>
          </div>
        </div>

        {/* Área do Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-10 overflow-hidden" onClick={() => setSelectedId(null)}>
          <div 
            ref={canvasRef}
            className="relative shadow-2xl bg-white border border-gray-300"
            style={{
              containerType: "inline-size",
              maxHeight: "100%",
              aspectRatio: printSize === 'a4' ? '1 / 1.414' : printSize === 'a4-landscape' || printSize === 'a5' ? '1.414 / 1' : '9 / 5', 
              width: printSize === 'a4' || printSize === 'a4-landscape' || printSize === 'a5' ? 'auto' : '100%',
              maxWidth: printSize === 'cartao' ? '600px' : 'auto',
              height: printSize === 'a4' || printSize === 'a4-landscape' || printSize === 'a5' ? '100%' : 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Linhas Guias Magnéticas */}
            {snapLines.x !== null && (
              <div 
                className="absolute top-0 bottom-0 border-l-2 border-pink-500 z-40 pointer-events-none" 
                style={{ left: `${snapLines.x}%` }} 
              />
            )}
            {snapLines.y !== null && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-pink-500 z-40 pointer-events-none" 
                style={{ top: `${snapLines.y}%` }} 
              />
            )}

            {elements.map((el) => {
              if (el.type === "image") {
                return (
                  <img
                    key={el.id}
                    src={el.src}
                    draggable={false}
                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`absolute cursor-move select-none touch-none transform -translate-x-1/2 -translate-y-1/2 ${selectedId === el.id ? 'ring-2 ring-blue-500' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `auto`, // Mantém a proporção da imagem original
                    }}
                    alt="Cartão"
                  />
                );
              }
              
              if (el.type === "text") {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`absolute cursor-move select-none touch-none transform -translate-x-1/2 -translate-y-1/2 ${selectedId === el.id ? 'ring-2 ring-blue-500 bg-black/5' : ''}`}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      color: el.color,
                      fontWeight: el.fontWeight,
                      fontSize: `${el.fontSize}cqw`,
                      lineHeight: 1,
                      textShadow: el.color === '#ffffff' ? '0px 2px 4px rgba(0,0,0,0.5)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {el.text}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESSÃO INVISÍVEL NO MODO NORMAL */}
      <div id="area-impressao-avancada" className={printSize} style={{ display: isPrinting ? 'block' : 'none' }}>
        <div className="print-canvas" style={{ backgroundColor: 'white' }}>
          {elements.map((el) => {
             if (el.type === "image") {
               return (
                  <img
                    key={`print-${el.id}`}
                    src={el.src}
                    style={{
                      position: 'absolute',
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      width: `${el.width}%`,
                      height: `auto`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    alt="Cartão"
                  />
               );
             }
             if (el.type === "text") {
               return (
                  <div
                    key={`print-${el.id}`}
                    className="print-text"
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      color: el.color,
                      fontWeight: el.fontWeight,
                      fontSize: `${el.fontSize}cqw`,
                      lineHeight: 1,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {el.text}
                  </div>
               );
             }
             return null;
          })}
        </div>
      </div>
    </>
  );
}
